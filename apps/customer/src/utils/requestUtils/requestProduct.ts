import axios from "@/lib/axios"

export const searchProduct = async (query: string) => {
    return await new Promise((resolve,reject) => {
        axios
            .get(`http://localhost:4002/api/product/search?query=${query}`)
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
            .get(`http://localhost:4002/api/product/${id}`)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}