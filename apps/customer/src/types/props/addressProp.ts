
export interface Address {
    recipientName: string;
    phone: string;
    addressLine: string;
    province: string;
    postalCode: string;
    isDefault: boolean;
    addressType: string;
    createdAt?: Date
    updatedAt?: Date
}