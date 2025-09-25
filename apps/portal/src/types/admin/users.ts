export type AdminUserLite = {
  id: number
  name: string
  email: string
  createdAt: string
  store?: {
    id: number
    uuid: string
    storeName: string
    status: string
  } | null
}

export type AdminUserDetail = AdminUserLite & {
  // for future: addresses, orders, etc.
}
