
export interface Address {
    id?: number
    recipientName: string;
    phone: string;
    address_number: string;
    building: string;
    street: string;
    subStreet: string;
    district: string;
    subdistrict: string;
    country: string;
    province: string;
    postalCode: string;
    isDefault: boolean;
    addressType: string;
    createdAt?: Date
    updatedAt?: Date
}