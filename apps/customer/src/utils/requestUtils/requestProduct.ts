import axios from '@/lib/axios'
export const searchProduct = async (query: string, page?: number) => {
  const abort = new AbortController()
  return await new Promise((resolve, reject) => {
    axios
      .get(
        `${page ? `/api/customer/product/search?query=${query}&page=${page}` : `/api/customer/product/search?query=${query}`}`,
        { signal: abort.signal }
      )
      .then((res) => {
        resolve(res.data)
      })
      .catch((err) => {
        reject(err)
      })
  })
}
export const seachEngine = async (query: string) => {
  return await new Promise((resolve, reject) => {
    axios
      .get(`/api/customer/search?query=${query}`)
      .then((res) => {
        resolve(res.data)
      })
      .catch((err) => {
        reject(err)
      })
  })
}
export const getProduct = async (id: string) => {
  return await new Promise((resolve, reject) => {
    axios
      .get(`/api/customer/product/${id}`)
      .then((res) => {
        resolve(res.data)
      })
      .catch((err) => {
        reject(err)
      })
  })
}
export const getStoreProduct = async (id: string) => {
  return await new Promise((resolve, reject) => {
    axios
      .get(`/api/customer/product/store/${id}`)
      .then((res) => {
        resolve(res.data)
      })
      .catch((err) => {
        reject(err)
      })
  })
}
