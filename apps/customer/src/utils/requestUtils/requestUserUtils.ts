import axios from "@/lib/axios"
import { Address } from "@/types/props/addressProp"
const endpoint = 'http://localhost:4003'
export const getUserDetail = async(id:number) => {
    if( typeof(id) == undefined){
        return console.log('id is undefined')
    }
    return await new Promise((resolve, reject) => {
        axios
            .get(`${endpoint}/api/customer/detail/${id}`)
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
            .post(`${endpoint}/api/customer/address`,data)
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
            .get(`${endpoint}/api/customer/address/${id}`)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}

export const updateAddress = async(userId: number | undefined, data: Address) => {
    return await new Promise((resolve, reject) => {
        axios
            .patch(`${endpoint}/api/customer/address/${userId}`,data)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })  
}

export const deleteAddress = async(id: number| undefined) => {
    return await new Promise((resolve, reject) => {
        axios
            .delete(`${endpoint}/api/customer/address/${id}`)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}