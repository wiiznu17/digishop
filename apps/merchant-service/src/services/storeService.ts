import { StoreStatus } from "@digishop/db";
import { storeRepository } from "../repositories/storeRepository";
import { GetStoreStatusInput, StoreStatusResponse } from "../types/store.types";

export class StoreServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly body: Record<string, unknown>,
  ) {
    super(String(body.error ?? body.message ?? "Store service error"));
    this.name = "StoreServiceError";
  }
}

export class StoreService {
  async getStoreStatus(input: GetStoreStatusInput): Promise<StoreStatusResponse> {
    const ownerUserId = Number(input.userSub);
    if (!ownerUserId) {
      throw new StoreServiceError(400, { error: "Missing user Id in cookie" });
    }

    const owned = await storeRepository.findOwnedStoreByUserId(ownerUserId);
    if (!owned) {
      throw new StoreServiceError(404, { error: "Store not found" });
    }

    const store = await storeRepository.findStoreStatusById(owned.id);
    if (!store) {
      throw new StoreServiceError(404, { status: null });
    }

    return { status: store.status as StoreStatus };
  }
}

export const storeService = new StoreService();
