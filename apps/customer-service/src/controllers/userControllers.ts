import { User } from '@digishop/db/src/models/User'
import { Address } from '@digishop/db/src/models/Address'
import { AddressType, UserRole } from '@digishop/db/src/types/enum'
import { Request, Response } from 'express'

export const createUser = async (req: Request, res: Response) => {
  const {
    firstName,
    middleName,
    lastName,
    email,
    password,
    recipientName,
    phone,
    address_number,
    building,
    subStreet,
    street,
    subdistrict,
    district,
    country,
    province,
    postalCode,
    isDefault,
    addressType
  } = req.body
  try {
    // หา user จาก userId
    const user = await User.findByPk(email)
    if (user) {
      return res.status(404).json({error : "This email already have an account" })
    }
    const newUser = 
    await User.create({
      firstName,
      middleName,
      lastName,
      email,
      password,
      role: UserRole.CUSTOMER
    })
    await Address.create({
        userId: newUser.id,
        recipientName,
        phone,
        addressNumber: address_number,
        building,
        subStreet,
        street,
        subdistrict,
        district,
        country,
        province,
        postalCode,
        isDefault: true,
        addressType
    })
    await newUser.save()
    res.json({data: newUser})
  } catch (err: any) {
    res.status(400).json({ error: err })
  }
}

export const createAddress = async (req: Request, res: Response) => {
  const {
    userId,
    recipientName,
    phone,
    address_number,
    building,
    subStreet,
    street,
    subdistrict,
    district,
    country,
    province,
    postalCode,
    addressType,
    isDefault,
    createdAt,
    updatedAt  
  } = req.body
  try {
    const address = 
      await Address.create({
        userId,
        recipientName,
        phone,
        addressNumber: address_number,
        building,
        subStreet,
        street,
        subdistrict,
        district,
        country, 
        province,
        postalCode ,
        addressType,
        isDefault: false,
        createdAt,
        updatedAt
      })
    await address.save()
    return res.status(200).json({data: address})
  }catch(err){
    res.status(500).json({err: err})
  }
}
export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params
  const deleted = await User.destroy({ where: { id } })
  if (deleted) {
    res.status(204).send()
  } else {
    res.status(404).json({ error: 'User not found' })
  }
}
export const findaddressUser = async (req: Request, res: Response) => {
  const { id } = req.params
  try {
    const addressData = await Address.findAll({
      where: { userId : id},
      attributes: ['id','recipientName','phone','province','postalCode','isDefault','addressType','address_number',
      'building','subStreet','street','subdistrict','district','country']
    })
    return res.status(200).json({data: addressData })
  } catch (error) {
    return res.json({err: error})
  }
}
export const finduserDetail = async(req: Request, res: Response) => {
  const { id } = req.params
  const userData = await User.findByPk(id)
  return res.status(200).json({data: userData})
}

