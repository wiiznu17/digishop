import {
  AddressType,
  MerchantAddress,
  sequelize,
  StoreStatus,
  UserRole,
} from "@digishop/db";
import { Transaction } from "sequelize";
import { azureBlobService } from "../helpers/azureBlobService";
import { AppError } from "../errors/AppError";
import { userRepository } from "../repositories/userRepository";
import {
  CreateStoreForUserPayload,
  DeleteUserInput,
  GetMerchantProfileInput,
  MerchantAddressPatch,
  UpdateMerchantAddressInput,
  UpdateMerchantProfileAddressPayload,
  UpdateMerchantProfileInput,
  UpdateMerchantProfilePayload,
  UpdateStorePatch,
} from "../types/user.types";

type ProfileJson = Record<string, unknown> & {
  store?: Record<string, unknown> & {
    id?: number | string;
    createdAt?: string | Date | null;
    phone?: string | null;
    addresses?: unknown[];
    metrics?: unknown;
  };
};

export class UserServiceError extends AppError {
  public readonly body: Record<string, unknown>;

  constructor(
    statusCode: number,
    body: Record<string, unknown>,
  ) {
    super(String(body.error ?? body.message ?? "User service error"), statusCode, true, body);
    this.name = "UserServiceError";
    this.body = body;
  }
}

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error ?? "Unknown error");

const toNumberOrNull = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export class UserService {
  private async rollbackIfNeeded(transaction: Transaction) {
    const tx = transaction as Transaction & { finished?: string };
    if (tx.finished) return;
    await transaction.rollback();
  }

  async getMerchantProfile(input: GetMerchantProfileInput) {
    const userId = Number(input.userSub);
    if (!userId) {
      throw new UserServiceError(401, { error: "Unauthorized token" });
    }

    const merchantProfile = await userRepository.findMerchantProfileByUserId(userId);
    if (!merchantProfile) {
      throw new UserServiceError(404, { error: "Merchant not found" });
    }

    const profileJson = merchantProfile.toJSON() as unknown as ProfileJson;
    const storeId = toNumberOrNull(profileJson.store?.id);

    if (storeId) {
      const [totalProducts, totalOrders, ratingRow] = await Promise.all([
        userRepository.countProductsByStoreId(storeId),
        userRepository.countOrdersByStoreId(storeId),
        userRepository.findAvgRatingByStoreId(storeId),
      ]);

      const avgRatingRaw =
        ratingRow && typeof ratingRow.avgRating !== "undefined"
          ? Number(ratingRow.avgRating)
          : null;

      const rating =
        avgRatingRaw != null && !Number.isNaN(avgRatingRaw)
          ? Number(avgRatingRaw.toFixed(1))
          : null;

      const memberSince = (profileJson.store?.createdAt as string | Date | null | undefined) ?? null;

      if (profileJson.store) {
        profileJson.store.metrics = {
          memberSince,
          totalProducts,
          totalOrders,
          rating,
        };
      }
    }

    return { user: profileJson };
  }

  async updateMerchantProfile(input: UpdateMerchantProfileInput) {
    const transaction = await sequelize.transaction();

    try {
      if (!input.profileDataString) {
        throw new UserServiceError(400, { message: "profileData is required" });
      }

      const profileData = JSON.parse(input.profileDataString) as UpdateMerchantProfilePayload;
      const files = input.files ?? [];

      const user = await userRepository.findUserByPk(Number(profileData.id), transaction);
      if (!user) {
        throw new UserServiceError(404, { message: "User not found" });
      }

      const storeId = Number(profileData.store?.id);
      const storeRecord = await userRepository.findStoreByPk(storeId, transaction);
      if (!storeRecord) {
        throw new UserServiceError(404, { message: "Store not found" });
      }

      const storePatch: UpdateStorePatch = {
        storeName: profileData.store.storeName,
        email: profileData.store.email,
        phone: profileData.store.phone,
        businessType: profileData.store.businessType,
        website: profileData.store.website,
        description: profileData.store.description,
        status: profileData.store.status,
      };

      await userRepository.updateStore(storeRecord, storePatch, transaction);

      const existingImages = await userRepository.findProfileImagesByStoreId(storeRecord.id, transaction);

      const deleteExistingImages = async () => {
        if (existingImages.length === 0) return;

        for (const image of existingImages) {
          const blobName = image.blobName;
          if (blobName) {
            try {
              await azureBlobService.deleteImage(blobName);
            } catch (error) {
              console.error(`Failed to delete blob ${blobName}:`, error);
            }
          }
        }

        await userRepository.destroyProfileImagesByStoreId(storeRecord.id, transaction);
      };

      if (files.length > 0) {
        await deleteExistingImages();

        const file = files[0];
        const { url, blobName } = await azureBlobService.uploadImage(file, `stores/${storeRecord.id}`);

        await userRepository.createProfileMerchantImage(
          {
            storeId: storeRecord.id,
            url,
            blobName,
            fileName: file.originalname,
          },
          transaction,
        );
      } else {
        await deleteExistingImages();
      }

      const addresses = profileData.store.addresses;
      if (Array.isArray(addresses)) {
        await this.syncMerchantAddresses(
          storeRecord.id,
          addresses as UpdateMerchantProfileAddressPayload[],
          profileData.store.phone ?? null,
          transaction,
        );
      }

      await transaction.commit();
      return { message: "Merchant profile updated successfully" };
    } catch (error) {
      await this.rollbackIfNeeded(transaction);
      if (error instanceof UserServiceError) {
        throw error;
      }
      throw new UserServiceError(500, { message: "Internal Server Error" });
    }
  }

  private async syncMerchantAddresses(
    storeId: number,
    addresses: UpdateMerchantProfileAddressPayload[],
    fallbackPhone: string | null,
    transaction: Transaction,
  ) {
    const existingRows = await userRepository.findMerchantAddressesByStoreId(storeId, transaction);
    const existingIds = new Set<number>(existingRows.map((row) => row.id));
    const payloadIds = new Set<number>(
      addresses
        .map((address) => Number(address.id))
        .filter((id) => Number.isFinite(id)),
    );

    const idsToDelete = [...existingIds].filter((id) => !payloadIds.has(id));
    if (idsToDelete.length > 0) {
      await userRepository.destroyMerchantAddressesByIds(storeId, idsToDelete, transaction);
    }

    let defaultAssigned = false;

    for (const address of addresses) {
      const patch: MerchantAddressPatch = {
        ownerName: address.ownerName ?? null,
        address_number: address.address_number ?? null,
        street: address.street ?? null,
        building: address.building ?? null,
        subStreet: address.subStreet ?? null,
        subdistrict: address.subdistrict ?? null,
        district: address.district ?? null,
        province: address.province ?? null,
        postalCode: address.postalCode ?? null,
        addressType: address.addressType ?? "Business",
        phone: address.phone ?? fallbackPhone ?? null,
        country: address.country ?? "Thailand",
        isDefault: Boolean(address.isDefault) && !defaultAssigned,
      };

      if (patch.isDefault) defaultAssigned = true;

      const addressId = Number(address.id);
      if (Number.isFinite(addressId)) {
        await userRepository.updateMerchantAddressById(storeId, addressId, patch, transaction);
      } else {
        await userRepository.createMerchantAddress(
          {
            storeId,
            ...patch,
            addressType: patch.addressType ?? "Business",
            isDefault: patch.isDefault ?? false,
            country: patch.country ?? "Thailand",
          },
          transaction,
        );
      }
    }

    if (!defaultAssigned) {
      const firstAddress = await userRepository.findFirstMerchantAddressByStoreId(storeId, transaction);
      if (firstAddress) {
        await userRepository.setMerchantAddressDefaultById(storeId, firstAddress.id, transaction);
      }
    }
  }

  async updateMerchantAddress(input: UpdateMerchantAddressInput) {
    const transaction = await sequelize.transaction();

    try {
      const userId = Number(input.userSub);
      if (!userId) {
        throw new UserServiceError(401, { error: "Unauthorized token" });
      }

      const addressId = Number(input.addressId);
      const body = input.payload;

      const store = await userRepository.findStoreByUserId(userId, transaction);
      if (!store) {
        throw new UserServiceError(404, { message: "Store not found" });
      }

      const address = await userRepository.findMerchantAddressByIdAndStore(addressId, store.id, transaction);
      if (!address) {
        throw new UserServiceError(404, { message: "Address not found" });
      }

      if (body.isDefault === true) {
        await userRepository.clearDefaultMerchantAddressesExcept(store.id, addressId, transaction);
      }

      await address.update(
        {
          ownerName: body.ownerName ?? address.ownerName,
          phone: body.phone ?? address.phone,
          address_number: body.address_number ?? address.address_number,
          street: body.street ?? address.street,
          building: body.building ?? address.building,
          subStreet: body.subStreet ?? address.subStreet,
          subdistrict: body.subdistrict ?? address.subdistrict,
          district: body.district ?? address.district,
          province: body.province ?? address.province,
          postalCode: body.postalCode ?? address.postalCode,
          addressType: (body.addressType ?? address.addressType) as AddressType,
          isDefault: typeof body.isDefault === "boolean" ? body.isDefault : address.isDefault,
        },
        { transaction },
      );

      await transaction.commit();
      return { message: "Address updated" };
    } catch (error) {
      await this.rollbackIfNeeded(transaction);
      if (error instanceof UserServiceError) {
        throw error;
      }
      throw new UserServiceError(500, { message: "Internal Server Error" });
    }
  }

  async createStoreForUser(payload: CreateStoreForUserPayload) {
    try {
      const user = await userRepository.findUserByPk(Number(payload.userId));
      if (!user) {
        throw new UserServiceError(404, { error: "User not found" });
      }

      const store = await userRepository.createStore({
        userId: payload.userId,
        storeName: payload.storeName,
        email: payload.email,
        phone: payload.phone,
        businessType: payload.businessType,
        description: payload.description ?? null,
        logoUrl: payload.logoUrl ?? null,
        status: StoreStatus.PENDING,
      });

      await userRepository.createMerchantAddress({
        storeId: store.id,
        ownerName: payload.ownerName,
        phone: payload.phone,
        address_number: payload.addressNumber,
        building: payload.addressBuilding ?? null,
        subStreet: payload.addressSubStreet ?? null,
        street: payload.addressStreet,
        subdistrict: payload.addressSubdistrict,
        district: payload.addressDistrict,
        province: payload.addressProvince,
        postalCode: payload.addressZip,
        addressType: payload.addressType ?? AddressType.HOME,
        isDefault: true,
        country: "Thailand",
      });

      await userRepository.saveUser(user, { role: UserRole.MERCHANT });

      return { store, user };
    } catch (error) {
      if (error instanceof UserServiceError) {
        throw error;
      }
      throw new UserServiceError(400, { error: toErrorMessage(error) });
    }
  }

  async deleteUser(input: DeleteUserInput) {
    return userRepository.deleteUserById(input.id);
  }
}

export const userService = new UserService();
