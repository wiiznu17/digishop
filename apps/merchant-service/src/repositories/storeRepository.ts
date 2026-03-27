import { Store } from '@digishop/db'

export class StoreRepository {
  async findOwnedStoreByUserId(userId: number) {
    return Store.findOne({
      where: { userId },
      attributes: ['id', 'status']
    })
  }

  async findStoreStatusById(storeId: number) {
    return Store.findByPk(storeId, {
      attributes: ['id', 'status']
    })
  }
}

export const storeRepository = new StoreRepository()
