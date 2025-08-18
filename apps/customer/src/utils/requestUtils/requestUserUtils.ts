import axios from "@/lib/axios"
import { Address } from "@/types/props/addressProp"

export const getUserDetail = async(id:number) => {
    if( typeof(id) == undefined){
        return console.log('id is undefined')
    }
    return await new Promise((resolve, reject) => {
        axios
            .get(`http://localhost:4002/api/customer/detail/${id}`)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
} 

export const createAddress = async(data: Address) => {
    return await new Promise((resolve, reject) => {
        axios
            .post('http://localhost:4002/api/customer/address',data)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}
export const getAddress = async(id:number|undefined ) => {
    if( typeof(id) == undefined){
        return console.log('id is undefined')
    }
    return await new Promise((resolve, reject) => {
        axios
            .get(`http://localhost:4002/api/customer/address/${id}`)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}