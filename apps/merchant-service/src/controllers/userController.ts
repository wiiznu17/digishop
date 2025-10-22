import { Request, Response } from 'express'
import { AuthenticatedRequest } from '../middlewares/middleware'
import { Op } from 'sequelize'
import { AddressType, BankAccount, MerchantAddress, Order, Product, ProfileMerchantImage, Review, sequelize, Store, StoreStatus, User, UserRole } from '@digishop/db';
import { azureBlobService } from '../helpers/azureBlobService';

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
    console.log("Received profileData:", profileData);
    console.log("Received files:", files);

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

    // 3. รูปโปรไฟล์ (รูปเดียว) — ถ้าไม่มีไฟล์ใหม่ ให้ลบของเก่าทิ้ง
    // แต่ถ้ามีไฟล์ใหม่: ลบเก่าก่อนแล้วค่อยสร้างใหม่
    {
      const existing = await ProfileMerchantImage.findAll({
        where: { storeId: storeRecord.id },
        transaction,
      });

      const deleteExisting = async () => {
        if (existing.length === 0) return;

        for (const image of existing) {
          const blobName = (image as any).blobName;
          if (blobName) {
            try {
              await azureBlobService.deleteImage(blobName);
            } catch (error) {
              console.error(`Failed to delete blob ${blobName}:`, error);
            }
          }
        }
        await ProfileMerchantImage.destroy({
          where: { storeId: storeRecord.id },
          transaction,
        });
      };

      if (files && files.length > 0) {
        // มีไฟล์ใหม่ → ลบเก่าแล้วอัปโหลดใหม่
        console.log("Updating profile image with file:", files[0].originalname);
        await deleteExisting();

        const file = files[0];
        const { url, blobName } = await azureBlobService.uploadImage(
          file,
          `stores/${storeRecord.id}`
        );

        await ProfileMerchantImage.create(
          {
            storeId: storeRecord.id,
            url,
            blobName,
            fileName: file.originalname,
          },
          { transaction }
        );
      } else {
        // ไม่มีไฟล์ใหม่ → ลบของเก่าทิ้งเฉย ๆ
        console.log("No new profile image uploaded. Deleting existing images…");
        await deleteExisting();
      }
    }


    // 4) ที่อยู่ — ซิงก์ทั้งก้อน: ลบที่หายไปจาก payload, อัปเดตที่มี id, เพิ่มที่ไม่มี id และบังคับ default เดียว
    if (Array.isArray(profileData.store.addresses)) {
      const addresses = profileData.store.addresses as any[];

      // เตรียมให้มี default ได้แค่หนึ่ง
      const firstDefaultIdx = addresses.findIndex(a => !!a.isDefault);
      let defaultAssigned = false;

      // ดึง id เดิมใน DB
      const existingRows = await MerchantAddress.findAll({
        where: { storeId: storeRecord.id },
        attributes: ["id"],
        transaction
      });
      const existingIds = new Set<number>(existingRows.map(r => (r as any).id as number));

      // id ที่ส่งมาจาก frontend (เฉพาะที่เป็นเลข)
      const payloadIds = new Set<number>(
        addresses.map(a => Number(a.id)).filter(n => Number.isFinite(n))
      );

      // 4.1 ลบที่อยู่ที่ "ไม่มี" ใน payload (ถือว่า user ลบทิ้งจากหน้า แล้วกด Save)
      const idsToDelete = [...existingIds].filter(id => !payloadIds.has(id));
      if (idsToDelete.length > 0) {
        await MerchantAddress.destroy({
          where: { storeId: storeRecord.id, id: idsToDelete },
          transaction
        });
      }

      // 4.2 อัปเดต/เพิ่ม ที่เหลือใน payload
      for (let i = 0; i < addresses.length; i++) {
        const addr = addresses[i];

        const payload = {
          ownerName: addr.ownerName ?? null,
          address_number: addr.address_number ?? null,
          street: addr.street ?? null,
          building: addr.building ?? null,
          subStreet: addr.subStreet ?? null,
          subdistrict: addr.subdistrict ?? null,
          district: addr.district ?? null,
          province: addr.province ?? null,
          postalCode: addr.postalCode ?? null,
          addressType: addr.addressType ?? "Business",
          phone: addr.phone ?? profileData.store.phone ?? null,
          country: addr.country ?? "Thailand",
          // อนุญาต default ได้แค่อันแรกที่เป็น true
          isDefault: !!addr.isDefault && !defaultAssigned
        } as any;

        if (payload.isDefault) defaultAssigned = true;

        if (Number.isFinite(Number(addr.id))) {
          // update
          await MerchantAddress.update(payload, {
            where: { id: Number(addr.id), storeId: storeRecord.id },
            transaction
          });
        } else {
          // create
          await MerchantAddress.create(
            { storeId: storeRecord.id, ...payload },
            { transaction }
          );
        }
      }

      // 4.3 ถ้าไม่มีอันไหนเป็น default เลย ให้ set รายการแรก (ถ้ามี) เป็น default
      if (!defaultAssigned) {
        const anyRow = await MerchantAddress.findOne({
          where: { storeId: storeRecord.id },
          order: [["id", "ASC"]],
          transaction
        });
        if (anyRow) {
          await MerchantAddress.update(
            { isDefault: true },
            { where: { id: (anyRow as any).id, storeId: storeRecord.id }, transaction }
          );
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
