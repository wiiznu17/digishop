import { StoreStatus } from '@digishop/db'
import { BadRequestError, NotFoundError } from '../errors/AppError'
import { storeRepository } from '../repositories/storeRepository'
import { GetStoreStatusInput, StoreStatusResponse } from '../types/store.types'

export class StoreService {
  async getStoreStatus(
    input: GetStoreStatusInput
  ): Promise<StoreStatusResponse> {
    const ownerUserId = Number(input.userSub)
    if (!ownerUserId) {
      throw new BadRequestError('Missing user Id in cookie')
    }

    const owned = await storeRepository.findOwnedStoreByUserId(ownerUserId)
    if (!owned) {
      throw new NotFoundError('Store not found')
    }

    const store = await storeRepository.findStoreStatusById(owned.id)
    if (!store) {
      throw new NotFoundError('Store not found')
    }

    return { status: store.status as StoreStatus }
  }
}

export const storeService = new StoreService()
