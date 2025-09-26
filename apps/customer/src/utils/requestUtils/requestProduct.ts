import axios from "@/lib/axios"
export const searchProduct = async (query: string, page: number) => {
    return await new Promise((resolve,reject) => {
        axios
            .get(`/api/product/search?query=${query}&page=${page}`)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
    
} 
export const getProduct = async ( id: string ) => {
    return await new Promise((resolve, reject) => {
        axios
            .get(`/api/product/${id}`)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}
export const getStoreProduct = async(id: string) => {
    console.log('id in util', id)
    return await new Promise((resolve, reject) => {
        axios
            .get(`/api/product/store/${id}`)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}