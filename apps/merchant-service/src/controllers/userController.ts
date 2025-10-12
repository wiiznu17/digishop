import { Store } from '@digishop/db/src/models/Store'
import { User } from '@digishop/db/src/models/User'
import { MerchantAddress } from '@digishop/db/src/models/StoreAddress'
import { AddressType, StoreStatus, UserRole } from '@digishop/db/src/types/enum'
import { Request, Response } from 'express'
import { AuthenticatedRequest } from '../middlewares/middleware'
import { BankAccount } from '@digishop/db/src/models/bank/BankAccount'
import { azureBlobService } from '../helpers/azureBlobService'
import { ProfileMerchantImage } from '@digishop/db/src/models/ProfileImage'
import { sequelize } from '@digishop/db';
import { Product } from '@digishop/db/src/models/Product'
import { Order } from '@digishop/db/src/models/Order'
import { Review } from '@digishop/db/src/models/Review'
import { Op } from 'sequelize'

// get merchant detail with metrics
export const getMerchantProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.sub) {
      return res.status(401).json({ error: "Unauthorized token" });
    }

    const merchantProfile = await User.findOne({
      where: { id: req.user.sub },
      attributes: ["id", "role"],
      include: [
        {
          model: Store,
          as: "store",
          attributes: [
            "id",
            "userId",
            "storeName",
            "email",
            "phone",
            "businessType",
            "website",
            "logoUrl",
            "description",
            "status",
            "createdAt" // ← ใช้ทำ Member Since
          ],
          include: [
            {
              model: MerchantAddress,
              as: "addresses",
              attributes: [
                "id",
                "ownerName",
                "phone",
                "address_number",
                "subStreet",
                "street",
                "building",
                "subdistrict",
                "district",
                "province",
                "postalCode",
                "isDefault",
                "addressType"
              ]
            },
            {
              model: BankAccount,
              as: "bankAccounts",
              attributes: ["id", "bankName", "accountNumber", "accountHolderName"]
            },
            {
              model: ProfileMerchantImage,
              as: "profileImages",
              attributes: ["id", "url", "fileName", "createdAt"]
            }
          ]
        }
      ]
    });

    if (!merchantProfile) {
      return res.status(404).json({ error: "Merchant not found" });
    }

    const profileJson = merchantProfile.toJSON() as any;

    const storeId: number | undefined = profileJson.store?.id;
    if (storeId) {
      const [totalProducts, totalOrders, ratingRow] = await Promise.all([
        Product.count({ where: { storeId } }),
        Order.count({ where: { storeId } }),
        Review.findOne({
          attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']],
          include: [{ model: Order, as: 'order', attributes: [], where: { storeId } }],
          raw: true
        })
      ]);
      console.log(ratingRow)
      const avgRatingVal =
        ratingRow && typeof (ratingRow as unknown as { avgRating: number | string | null }).avgRating !== 'undefined'
          ? Number((ratingRow as unknown as { avgRating: number | string | null }).avgRating)
          : null;

      const memberSince: string | null = profileJson.store?.createdAt ?? null;

      profileJson.store.metrics = {
        memberSince,
        totalProducts,
        totalOrders,
        rating: avgRatingVal != null && !Number.isNaN(avgRatingVal)
          ? Number(avgRatingVal.toFixed(1))
          : null
      };
    }

    return res.json({ user: profileJson });
  } catch (error) {
    console.error("Error fetching merchant profile:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


export const updateMerchantProfile = async (req: AuthenticatedRequest, res: Response) => {
  const transaction = await sequelize.transaction();
  try {
    const profileDataString = req.body.profileData;
    if (!profileDataString) {
      await transaction.rollback()
      return res.status(400).json({ message: "profileData is required" });
    }
    const profileData = JSON.parse(profileDataString);
    const files = req.files as Express.Multer.File[];

    // 1. หา user + store
    const user = await User.findByPk(profileData.id, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: "User not found" });
    }
    const storeRecord = await Store.findByPk(profileData.store.id, { transaction });
    if (!storeRecord) {
      await transaction.rollback();
      return res.status(404).json({ message: "Store not found" });
    }

    // 2. อัปเดตข้อมูล store
    await storeRecord.update({
      storeName: profileData.store.storeName,
      email: profileData.store.email,
      phone: profileData.store.phone,
      businessType: profileData.store.businessType,
      website: profileData.store.website,
      description: profileData.store.description,
      status: profileData.store.status
    }, { transaction });

    // 3. รูปโปรไฟล์ (รูปเดียว) — ลบของเก่าก่อนแล้วค่อยสร้างใหม่
    if (files && files.length > 0) {
      const existing = await ProfileMerchantImage.findAll({
        where: { storeId: storeRecord.id },
        transaction
      })

      if (existing.length > 0) {
        for (const image of existing) {
          if ((image as any).blobName) {
            try {
              await azureBlobService.deleteImage((image as any).blobName);
            } catch (error) {
              console.error(`Failed to delete blob ${ (image as any).blobName}:`, error);
            }
          }
        }
        await ProfileMerchantImage.destroy({
          where: { storeId: storeRecord.id },
          transaction
        })
      }

      const file = files[0]
      const { url, blobName } = await azureBlobService.uploadImage(
        file,
        `stores/${storeRecord.id}`
      )

      await ProfileMerchantImage.create({
        storeId: storeRecord.id,
        url,
        blobName,
        fileName: file.originalname,
      }, { transaction })
    }

    // 4. ที่อยู่ — update/create และบังคับ default เดียว
    if (Array.isArray(profileData.store.addresses)) {
      // เคลียร์ default ทั้งหมดก่อน ถ้ามีรายการใด ๆ ส่งมาเป็น default
      const hasDefault = profileData.store.addresses.some((a: any) => !!a.isDefault)
      if (hasDefault) {
        await MerchantAddress.update(
          { isDefault: false },
          { where: { storeId: storeRecord.id }, transaction }
        )
      }

      for (const addr of profileData.store.addresses) {
        const payload = {
          ownerName: addr.ownerName,
          address_number: addr.address_number,
          street: addr.street,
          building: addr.building,
          subStreet: addr.subStreet,
          subdistrict: addr.subdistrict,
          district: addr.district,
          province: addr.province,
          postalCode: addr.postalCode,
          addressType: addr.addressType,
          isDefault: !!addr.isDefault
        }

        if (addr.id) {
          await MerchantAddress.update(
            payload,
            { where: { id: addr.id, storeId: storeRecord.id }, transaction }
          )
        } else {
          await MerchantAddress.create(
            { storeId: storeRecord.id, phone: profileData.store.phone, country: 'Thailand', ...payload },
            { transaction }
          )
        }
      }
    }

    await transaction.commit();
    return res.json({ message: "Merchant profile updated successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error("Update Merchant Profile Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateMerchantAddress = async (req: AuthenticatedRequest, res: Response) => {
  const transaction = await sequelize.transaction()
  try {
    if (!req.user?.sub) {
      await transaction.rollback()
      return res.status(401).json({ error: "Unauthorized token" });
    }
    const id = Number(req.params.id)
    const body = req.body as Partial<MerchantAddress>

    // หา store ของ user
    const store = await Store.findOne({ where: { userId: req.user.sub }, transaction })
    if (!store) {
      await transaction.rollback()
      return res.status(404).json({ message: "Store not found" })
    }

    const addr = await MerchantAddress.findOne({
      where: { id, storeId: store.id },
      transaction
    })
    if (!addr) {
      await transaction.rollback()
      return res.status(404).json({ message: "Address not found" })
    }

    // ถ้า set เป็น default → เคลียร์ที่เหลือก่อน
    if (body.isDefault === true) {
      await MerchantAddress.update(
        { isDefault: false },
        { where: { storeId: store.id, id: { [Op.ne]: id } }, transaction }
      )
    }

    await addr.update({
      ownerName: body.ownerName ?? addr.ownerName,
      phone: body.phone ?? addr.phone,
      address_number: body.address_number ?? addr.address_number,
      street: body.street ?? addr.street,
      building: body.building ?? addr.building,
      subStreet: body.subStreet ?? addr.subStreet,
      subdistrict: body.subdistrict ?? addr.subdistrict,
      district: body.district ?? addr.district,
      province: body.province ?? addr.province,
      postalCode: body.postalCode ?? addr.postalCode,
      addressType: body.addressType ?? addr.addressType,
      isDefault: typeof body.isDefault === 'boolean' ? body.isDefault : addr.isDefault,
    }, { transaction })

    await transaction.commit()
    return res.json({ message: "Address updated" })
  } catch (e) {
    await transaction.rollback()
    console.error(e)
    return res.status(500).json({ message: "Internal Server Error" })
  }
}

export const createStoreForUser = async (req: Request, res: Response) => {
  const {
    userId,
    storeName,
    description,
    ownerName,
    email,
    phone,
    businessType,
    addressType,
    addressNumber,
    addressBuilding,
    addressSubStreet,
    addressStreet,
    addressSubdistrict,
    addressDistrict,
    addressProvince,
    addressZip,
    logoUrl
  } = req.body
  try {
    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }
    const store = await Store.create({
      userId,
      storeName,
      email,
      phone,
      businessType,
      description,
      logoUrl: logoUrl || null,
      status: StoreStatus.PENDING
    })
    await MerchantAddress.create({
      storeId: store.id,
      ownerName,
      phone,
      address_number: addressNumber,
      building: addressBuilding,
      subStreet: addressSubStreet,
      street: addressStreet,
      subdistrict: addressSubdistrict,
      district: addressDistrict,
      province: addressProvince,
      postalCode: addressZip,
      addressType: addressType || AddressType.HOME,
      isDefault: true,
      country: 'Thailand'
    })
    user.role = UserRole.MERCHANT
    await user.save()

    res.status(201).json({ store, user })
  } catch (err: any) {
    console.error('Error creating store for user:', err)
    res.status(400).json({ error: err.message })
  }
}

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params
  const deleted = await User.destroy({ where: { id } })
  if (deleted) {
    res.status(204).send()
  } else {
    res.status(404).json({ error: 'User not found' })
  }
}
