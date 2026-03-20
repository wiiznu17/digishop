import {
  BankAccount,
  MerchantAddress,
  Order,
  Product,
  ProfileMerchantImage,
  Review,
  Store,
  User,
} from "@digishop/db";
import { col, CreationAttributes, fn, Op, Transaction } from "sequelize";
import {
  CreateMerchantAddressPatch,
  CreateStorePatch,
  MerchantAddressPatch,
  UpdateStorePatch,
  UpdateUserRoleInput,
} from "../types/user.types";

type AvgRatingRow = { avgRating: number | string | null } | null;

export class UserRepository {
  async findMerchantProfileByUserId(userId: number) {
    return User.findOne({
      where: { id: userId },
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
            "createdAt",
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
                "addressType",
              ],
            },
            {
              model: BankAccount,
              as: "bankAccounts",
              attributes: ["id", "bankName", "accountNumber", "accountHolderName"],
            },
            {
              model: ProfileMerchantImage,
              as: "profileImages",
              attributes: ["id", "url", "fileName", "createdAt"],
            },
          ],
        },
      ],
    });
  }

  async countProductsByStoreId(storeId: number) {
    return Product.count({ where: { storeId } });
  }

  async countOrdersByStoreId(storeId: number) {
    return Order.count({ where: { storeId } });
  }

  async findAvgRatingByStoreId(storeId: number) {
    return Review.findOne({
      attributes: [[fn("AVG", col("rating")), "avgRating"]],
      include: [{ model: Order, as: "order", attributes: [], where: { storeId } }],
      raw: true,
    }) as Promise<AvgRatingRow>;
  }

  async findUserByPk(userId: number, transaction?: Transaction) {
    return User.findByPk(userId, { transaction });
  }

  async saveUser(user: User, payload: UpdateUserRoleInput, transaction?: Transaction) {
    user.role = payload.role;
    return user.save({ transaction });
  }

  async findStoreByPk(storeId: number, transaction?: Transaction) {
    return Store.findByPk(storeId, { transaction });
  }

  async findStoreByUserId(userId: number, transaction?: Transaction) {
    return Store.findOne({ where: { userId }, transaction });
  }

  async createStore(payload: CreateStorePatch, transaction?: Transaction) {
    return Store.create(payload, { transaction });
  }

  async updateStore(store: Store, payload: UpdateStorePatch, transaction: Transaction) {
    return store.update(payload as Partial<CreationAttributes<Store>>, { transaction });
  }

  async findProfileImagesByStoreId(storeId: number, transaction?: Transaction) {
    return ProfileMerchantImage.findAll({ where: { storeId }, transaction });
  }

  async destroyProfileImagesByStoreId(storeId: number, transaction: Transaction) {
    return ProfileMerchantImage.destroy({ where: { storeId }, transaction });
  }

  async createProfileMerchantImage(
    payload: {
      storeId: number;
      url: string;
      blobName: string;
      fileName: string;
    },
    transaction: Transaction,
  ) {
    return ProfileMerchantImage.create(payload, { transaction });
  }

  async findMerchantAddressesByStoreId(storeId: number, transaction?: Transaction) {
    return MerchantAddress.findAll({
      where: { storeId },
      attributes: ["id"],
      transaction,
    });
  }

  async destroyMerchantAddressesByIds(storeId: number, ids: number[], transaction: Transaction) {
    return MerchantAddress.destroy({
      where: { storeId, id: ids },
      transaction,
    });
  }

  async updateMerchantAddressById(
    storeId: number,
    addressId: number,
    payload: MerchantAddressPatch,
    transaction: Transaction,
  ) {
    return MerchantAddress.update(payload as Partial<CreationAttributes<MerchantAddress>>, {
      where: { id: addressId, storeId },
      transaction,
    }) as unknown as Promise<[number]>;
  }

  async createMerchantAddress(payload: CreateMerchantAddressPatch, transaction?: Transaction) {
    return MerchantAddress.create(
      payload as unknown as CreationAttributes<MerchantAddress>,
      { transaction },
    );
  }

  async findFirstMerchantAddressByStoreId(storeId: number, transaction: Transaction) {
    return MerchantAddress.findOne({
      where: { storeId },
      order: [["id", "ASC"]],
      transaction,
    });
  }

  async setMerchantAddressDefaultById(storeId: number, addressId: number, transaction: Transaction) {
    return MerchantAddress.update(
      { isDefault: true },
      { where: { id: addressId, storeId }, transaction },
    );
  }

  async findMerchantAddressByIdAndStore(addressId: number, storeId: number, transaction?: Transaction) {
    return MerchantAddress.findOne({
      where: { id: addressId, storeId },
      transaction,
    });
  }

  async clearDefaultMerchantAddressesExcept(
    storeId: number,
    addressId: number,
    transaction: Transaction,
  ) {
    return MerchantAddress.update(
      { isDefault: false },
      {
        where: {
          storeId,
          id: { [Op.ne]: addressId },
        },
        transaction,
      },
    );
  }

  async deleteUserById(id: string) {
    return User.destroy({ where: { id } });
  }
}

export const userRepository = new UserRepository();
