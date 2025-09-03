// controllers/bankAccountController.ts
import sequelize from '@digishop/db';
import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/middleware';
import { Store } from '@digishop/db/src/models/Store';
import { BankAccount } from '@digishop/db/src/models/bank/BankAccount';
import { setDefaultAccountForStore } from '../helpers/bankAccountService';
import { scheduleBankAccountApproval } from '../helpers/mocks api/bankAccountVerify';

export const getBankAccountList = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 1. ค้นหาร้านค้าของผู้ใช้
    const store = await Store.findOne({ where: { userId } });
    if (!store) {
      // เป็นไปได้ว่าผู้ใช้ยังไม่มีร้านค้า ส่ง array เปล่ากลับไป หรือ 404 ก็ได้
      return res.status(404).json({ error: "Store not found for this user." });
    }

    // 2. ค้นหาบัญชีทั้งหมดที่ผูกกับ storeId นี้
    const accounts = await BankAccount.findAll({
      where: {
        storeId: store.id
      },
      // 3. เรียงลำดับ: เอา isDefault=true ขึ้นก่อน แล้วตามด้วยบัญชีที่สร้างล่าสุด
      order: [
        ['isDefault', 'DESC'], // true (1) มาก่อน
        ['created_at', 'DESC']
      ]
    });

    res.status(200).json(accounts);

  } catch (err: any) {
    console.error('Error fetching bank account list:', err);
    res.status(500).json({ error: 'An internal server error occurred', details: err.message });
  }
};
export const addBankAccountToStore = async (req: AuthenticatedRequest, res: Response) => {
  const transaction = await sequelize.transaction();
  try {
    // แนะนำ: เพิ่มการ validate req.body ด้วย zod หรือ joi ที่นี่
    const { accountHolderName, accountNumber, bankName, isDefault } = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      // Middleware ควรจัดการเคสนี้ไปแล้ว แต่ใส่ไว้กันเหนียว
      return res.status(401).json({ error: "Unauthorized" });
    }

    const store = await Store.findOne({ where: { userId } });
    if (!store) {
      return res.status(404).json({ error: "Store not found for this user." });
    }

    const newBankAccount = await BankAccount.create({
      storeId: store.id,
      accountHolderName,
      accountNumber, // เปลี่ยนชื่อให้ตรงกับ Model
      bankName,      // เปลี่ยนชื่อให้ตรงกับ Model
      isDefault: isDefault || false, // ถ้า isDefault ไม่ได้ส่งมา ให้เป็น false
    }, { transaction });

    // ถ้า isDefault เป็น true, ให้เรียกใช้ service เพื่อจัดการ
    if (isDefault) {
      await setDefaultAccountForStore(store.id, newBankAccount.id, transaction);
      // รีเฟรชข้อมูลเพื่อให้ isDefault: true กลับไปใน response
      await newBankAccount.reload({ transaction });
    }

    await transaction.commit();
    await scheduleBankAccountApproval(newBankAccount.id);
    
    res.status(201).json(newBankAccount);

  } catch (err: any) {
    await transaction.rollback();
    console.error('Error adding bank account:', err);
    res.status(500).json({ error: 'An internal server error occurred', details: err.message });
  }
};

export const setDefaultBankAccount = async (req: AuthenticatedRequest, res: Response) => {
  console.log("hi 1")
  const transaction = await sequelize.transaction();
  console.log("hi 2")
  try {
    const { accountId } = req.params;
    console.log("id bank", accountId)
    const userId = req.user?.sub;
    console.log("userId: ", userId)
    if (!userId) {
      console.log("no user id")
      return res.status(401).json({ error: "Unauthorized" });
    }

    const store = await Store.findOne({ where: { userId } });
    if (!store) {
      console.log("no store")
      return res.status(404).json({ error: "Store not found." });
    }

    // ตรวจสอบให้แน่ใจว่า bank account นี้เป็นของ store นี้จริง
    const accountToSetDefault = await BankAccount.findOne({
      where: { id: accountId, storeId: store.id }
    });

    if (!accountToSetDefault) {
      console.log("wrong store")
      return res.status(404).json({ error: "Bank account not found in your store." });
    }

    // เรียกใช้ service กลางตัวเดียว จบ!
    await setDefaultAccountForStore(store.id, accountToSetDefault.id, transaction);

    await transaction.commit();
    
    // ดึงข้อมูลล่าสุดกลับไปให้ client
    const updatedAccount = await BankAccount.findByPk(accountToSetDefault.id);
    res.status(200).json({ message: "Default bank account updated successfully.", account: updatedAccount });

  } catch (err: any) {
    await transaction.rollback();
    console.error('Error setting default bank account:', err);
    res.status(500).json({ error: 'An internal server error occurred', details: err.message });
  }
};

export const deleteBankAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { bankAccountId } = req.params; // ID ของบัญชีที่จะลบ
    const userId = req.user?.sub; // ID ของผู้ใช้ที่ล็อกอิน

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 1. ค้นหาร้านค้าของ user เพื่อใช้ store.id ในการยืนยันความเป็นเจ้าของ
    const store = await Store.findOne({ where: { userId } });
    if (!store) {
      return res.status(404).json({ error: "Store not found for this user." });
    }

    // 2. ค้นหาบัญชีธนาคาร โดยต้องมั่นใจว่าเป็นของ store นี้จริงๆ (Authorization)
    const accountToDelete = await BankAccount.findOne({
      where: {
        id: bankAccountId,
        storeId: store.id // <-- เงื่อนไขสำคัญที่ใช้ยืนยันความเป็นเจ้าของ
      }
    });

    if (!accountToDelete) {
      // ถ้าไม่เจอ หมายความว่าไม่มี bankAccountId นี้ หรือไม่ได้เป็นของ user คนนี้
      return res.status(404).json({ error: "Bank account not found." });
    }

    // 3. [Edge Case] ป้องกันการลบบัญชีที่เป็น Default
    if (accountToDelete.isDefault) {
      console.log("Default account can not delete")
      return res.status(400).json({
        error: "Cannot delete the default bank account. Please set another account as default first."
      });
    }

    // 4. ทำการลบบัญชี
    await accountToDelete.destroy();

    // ส่ง status 204 No Content เป็นมาตรฐานสำหรับการลบข้อมูลสำเร็จ
    res.status(204).send();

  } catch (err: any) {
    console.error('Error deleting bank account:', err);
    res.status(500).json({ error: 'An internal server error occurred', details: err.message });
  }
};