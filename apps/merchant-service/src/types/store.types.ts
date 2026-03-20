import { StoreStatus } from "@digishop/db";

export type GetStoreStatusInput = {
  userSub?: number | string;
};

export type StoreStatusResponse = {
  status: StoreStatus;
};
