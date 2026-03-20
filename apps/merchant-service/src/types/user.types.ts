import { AddressType, StoreStatus, UserRole } from "@digishop/db";

export type GetMerchantProfileInput = {
  userSub?: number | string;
};

export type UpdateMerchantProfileAddressPayload = {
  id?: number | string;
  ownerName?: string | null;
  phone?: string | null;
  address_number?: string | null;
  street?: string | null;
  building?: string | null;
  subStreet?: string | null;
  subdistrict?: string | null;
  district?: string | null;
  province?: string | null;
  postalCode?: string | null;
  addressType?: string | AddressType | null;
  country?: string | null;
  isDefault?: boolean;
};

export type UpdateMerchantProfileStorePayload = {
  id: number;
  storeName?: string | null;
  email?: string | null;
  phone?: string | null;
  businessType?: string | null;
  website?: string | null;
  description?: string | null;
  status?: StoreStatus | string | null;
  addresses?: UpdateMerchantProfileAddressPayload[];
};

export type UpdateMerchantProfilePayload = {
  id: number;
  store: UpdateMerchantProfileStorePayload;
};

export type UpdateMerchantProfileInput = {
  profileDataString?: string;
  files?: Express.Multer.File[];
};

export type UpdateMerchantAddressInput = {
  userSub?: number | string;
  addressId: string;
  payload: UpdateMerchantProfileAddressPayload;
};

export type CreateStoreForUserPayload = {
  userId: number;
  storeName: string;
  description?: string | null;
  ownerName: string;
  email: string;
  phone: string;
  businessType: string;
  addressType?: AddressType | string | null;
  addressNumber: string;
  addressBuilding?: string | null;
  addressSubStreet?: string | null;
  addressStreet: string;
  addressSubdistrict: string;
  addressDistrict: string;
  addressProvince: string;
  addressZip: string;
  logoUrl?: string | null;
};

export type CreateStoreForUserResult = {
  store: unknown;
  user: unknown;
};

export type DeleteUserInput = {
  id: string;
};

export type MerchantProfileMetrics = {
  memberSince: string | null;
  totalProducts: number;
  totalOrders: number;
  rating: number | null;
};

export type CreateStorePatch = {
  userId: number;
  storeName: string;
  email: string;
  phone: string;
  businessType: string;
  description?: string | null;
  logoUrl?: string | null;
  status: StoreStatus;
};

export type CreateMerchantAddressPatch = {
  storeId: number;
  ownerName?: string | null;
  phone?: string | null;
  address_number?: string | null;
  building?: string | null;
  subStreet?: string | null;
  street?: string | null;
  subdistrict?: string | null;
  district?: string | null;
  province?: string | null;
  postalCode?: string | null;
  addressType: AddressType | string;
  isDefault: boolean;
  country: string;
};

export type UpdateStorePatch = {
  storeName?: string | null;
  email?: string | null;
  phone?: string | null;
  businessType?: string | null;
  website?: string | null;
  description?: string | null;
  status?: StoreStatus | string | null;
};

export type MerchantAddressPatch = {
  ownerName?: string | null;
  phone?: string | null;
  address_number?: string | null;
  street?: string | null;
  building?: string | null;
  subStreet?: string | null;
  subdistrict?: string | null;
  district?: string | null;
  province?: string | null;
  postalCode?: string | null;
  addressType?: AddressType | string | null;
  country?: string | null;
  isDefault?: boolean;
};

export type UpdateUserRoleInput = {
  role: UserRole;
};
