export type AdminStoreLite = {
  id: number
  uuid: string
  storeName: string
  email: string
  status: string
  ownerName: string
  ownerEmail: string
  productCount: number
  createdAt: string
}

export type AdminStoreDetail = AdminStoreLite & {
  // for future: shipping configs, bank accounts, etc.
}
