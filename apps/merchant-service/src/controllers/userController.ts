import { Store } from '@digishop/db/src/models/Store'
import { User } from '@digishop/db/src/models/User'
import { MerchantAddress } from '@digishop/db/src/models/StoreAddress'
import { AddressType, StoreStatus, UserRole } from '@digishop/db/src/types/enum'
import { Request, Response } from 'express'
import { AuthenticatedRequest } from '../middlewares/middleware'
import { BankAccount } from '@digishop/db/src/models/bank/BankAccount'
import { azureBlobService } from '../helpers/azureBlobService'
import { ProfileMerchantImage } from '@digishop/db/src/models/ProfileImage'
import sequelize from '@digishop/db'

// get merchant detail with latest profile image
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
            "description",
            "logoUrl",
            "status"
          ],
          include: [
            {
              model: MerchantAddress,
              as: "addresses",
              attributes: [
                "ownerName",
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
              attributes: [
                "id",
                "bankName",
                "accountNumber",
                "accountHolderName"
              ]
            },
            {
              model: ProfileMerchantImage,
              as: "profileImages",
              attributes: ["id", "url", "fileName", "createdAt"],
              // limit: 1,
              // order: [['createdAt', 'DESC']] // ดึงเฉพาะรูปล่าสุด
            }
          ]
        }
      ]
    });

    if (!merchantProfile) {
      return res.status(404).json({ error: "Merchant not found" });
    }

    const profileJson = merchantProfile.toJSON() as any;

    console.log('from db: ', profileJson)
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
      return res.status(400).json({ message: "profileData is required" });
    }
    const profileData = JSON.parse(profileDataString);
    const files = req.files as Express.Multer.File[];

    console.log("Updating merchant profile with data:", profileData);
    console.log("Files received:", files?.length);

    // 1. หา user
    const user = await User.findByPk(profileData.id, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: "User not found" });
    }

    // 2. หา store
    const storeRecord = await Store.findByPk(profileData.store.id, { transaction });
    if (!storeRecord) {
      await transaction.rollback();
      return res.status(404).json({ message: "Store not found" });
    }

    // 3. อัปเดตข้อมูล store
    await storeRecord.update({
      storeName: profileData.store.storeName,
      email: profileData.store.email,
      phone: profileData.store.phone,
      businessType: profileData.store.businessType,
      website: profileData.store.website,
      description: profileData.store.description,
      status: profileData.store.status
    }, { transaction });

    // 4. จัดการรูปโปรไฟล์
    if (files && files.length > 0) {
      // หารูปเก่าที่ต้องลบ
      const existingImages = await ProfileMerchantImage.findAll({
        where: { storeId: storeRecord.id },
        transaction
      });

      // ลบรูปเก่าจาก Azure Blob และ database
      if (existingImages.length > 0) {
        for (const image of existingImages) {
          if (image.blobName) {
            try {
              await azureBlobService.deleteImage(image.blobName);
            } catch (error) {
              console.error(`Failed to delete blob ${image.blobName}:`, error);
            }
          }
        }
        
        // ลบ records จาก database
        await ProfileMerchantImage.destroy({
          where: { storeId: storeRecord.id },
          transaction
        });
      }

      // อัปโหลดรูปใหม่ (เอาแค่รูปแรก)
      const file = files[0];
      const { url, blobName } = await azureBlobService.uploadImage(
        file,
        `stores/${storeRecord.id}`
      );

      await ProfileMerchantImage.create({
        storeId: storeRecord.id,
        url,
        blobName,
        fileName: file.originalname,
      }, { transaction });
    }

    // 5. อัปเดต addresses (เหมือนเดิม)
    if (Array.isArray(profileData.store.addresses)) {
      for (const addr of profileData.store.addresses) {
        if (addr.id) {
          // update address
          await MerchantAddress.update(
            {
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
              isDefault: addr.isDefault
            },
            { where: { id: addr.id, userId: storeRecord.userId }, transaction }
          );
        } else {
          // create new address
          await MerchantAddress.create({
            userId: storeRecord.userId,
            ownerName: addr.ownerName,
            phone: profileData.store.phone,
            address_number: addr.address_number,
            subStreet: addr.subStreet,
            street: addr.street,
            building: addr.building,
            subdistrict: addr.subdistrict,
            district: addr.district,
            province: addr.province,
            postalCode: addr.postalCode,
            addressType: addr.addressType,
            isDefault: addr.isDefault,
            country: addr.country || 'Thailand'
          }, { transaction });
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

export const createStoreForUser = async (req: Request, res: Response) => {
  const {
    userId,
    businessName,
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
  console.log('body: ', req.body)
  try {
    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }
    console.log('user: ', user)
    console.log("Merchant is coming")
    const store = await Store.create({
      userId,
      storeName: businessName,
      email,
      phone,
      businessType,
      description,
      logoUrl: logoUrl || null,
      status: StoreStatus.PENDING
    })
    await MerchantAddress.create({
      userId: store.userId,
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
      addressType: addressType || 'HOME',
      isDefault: true,
      country: 'Thailand' // default
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