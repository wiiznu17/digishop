import axios from "@/lib/axios"

// export type AdminCategoryStatus = "ACTIVE" | "HIDDEN"
export type AdminCategoryItem = {
  uuid: string
  name: string
  // status: AdminCategoryStatus
  parentUuid: string | null
  productCountDirect: number
  productCountTotal: number
  createdAt?: string
  updatedAt?: string
}

export type ListCategoriesParams = {
  parentUuid?: string | null
  q?: string
  // status?: AdminCategoryStatus
  page?: number
  pageSize?: number
}

export async function listCategoriesRequester(params: ListCategoriesParams) {
  try {
    console.log("hi from list req")
    const res = await axios.get("/api/admin/categories/list", { params })
    return res.data as {
      data: AdminCategoryItem[]
      meta: { total: number; totalPages: number }
    }
  } catch (e) {
    console.error("listCategoriesRequester", e)
    return { data: [], meta: { total: 0, totalPages: 1 } }
  }
}

export async function listAllFlatCategoriesRequester() {
  try {
    console.log("hi from list flat req")
    const res = await axios.get("/api/admin/categories/list", {
      params: { mode: "flat" }
    })
    return (res.data?.data ?? []) as AdminCategoryItem[]
  } catch (e) {
    console.error("listAllFlatCategoriesRequester", e)
    return []
  }
}

export async function suggestCategoriesRequester(q: string) {
  try {
    const res = await axios.get("/api/admin/categories/suggest", {
      params: { q }
    })
    return (res.data ?? []) as { uuid: string; name: string }[]
  } catch (e) {
    console.error("suggestCategoriesRequester", e)
    return []
  }
}

export async function getCategoryDetailRequester(uuid: string) {
  try {
    const res = await axios.get(`/api/admin/categories/${uuid}`)
    return res.data as { uuid: string; name: string; parentUuid: string | null }
  } catch (e) {
    console.error("getCategoryDetailRequester", e)
    return null
  }
}

export async function createCategoryRequester(payload: {
  name: string
  // status: AdminCategoryStatus
  parentUuid: string | null
}) {
  await axios.post("/api/admin/categories", payload)
}

export async function updateCategoryRequester(
  uuid: string,
  payload: {
    name?: string
    // status?: AdminCategoryStatus
    parentUuid?: string | null
  }
) {
  await axios.patch(`/api/admin/categories/${uuid}`, payload)
}

export async function deleteCategoryRequester(uuid: string) {
  await axios.delete(`/api/admin/categories/${uuid}`)
}

export async function patchCategoryStatusRequester(
  uuid: string
  // status: AdminCategoryStatus
) {
  await axios.patch(`/api/admin/categories/${uuid}/status`, { status })
}

export async function moveProductsRequester(
  sourceCategoryUuid: string,
  targetCategoryUuid: string
) {
  await axios.post(
    `/api/admin/categories/${sourceCategoryUuid}/move-products`,
    {
      targetCategoryUuid
    }
  )
}
