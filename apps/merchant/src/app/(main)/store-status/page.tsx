export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

import StoreStatusClient from "./StoreStatusClient"

export default function Page() {
  return <StoreStatusClient />
}
