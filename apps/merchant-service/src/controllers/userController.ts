import { Store } from '@digishop/db/src/models/Store'
import { User } from '@digishop/db/src/models/User'
import { MerchantAddress } from '@digishop/db/src/models/StoreAddress'
import { AddressType, StoreStatus, UserRole } from '@digishop/db/src/types/enum'
import { Request, Response } from 'express'

export const getAllUsers = async (req: Request, res: Response) => {
  console.log('hiiiiiiiiiiiiiiiiiiiiiiiiii')
  const users = await User.findAll()
  console.log('users: ', users)
  res.json(users)
}

export const createStoreForUser = async (req: Request, res: Response) => {
  const {
    userId,
    businessName,
    description,
    ownerName,
    email,
    phone,
    businessType,
    addressType,
    addressNumber,
    addressBuilding,
    addressSubStreet,
    addressStreet,
    addressSubdistrict,
    addressDistrict,
    addressProvince,
    addressZip,
    logoUrl
  } = req.body
  console.log('body: ', req.body)
  try {
    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }
    console.log('user: ', user)
    console.log("Merchant is coming")
    const store = await Store.create({
      userId,
      storeName: businessName,
      email,
      phone,
      businessType,
      description,
      logoUrl: logoUrl || null,
      status: StoreStatus.PENDING
    })
    console.log("create address")
    // update role to merchant
    // Admin should approve before changing role
    console.log("store.userId:", store.userId);
    console.log("addressType enum allowed:", Object.values(AddressType));
    console.log("payload for MerchantAddress.create:", {
      userId: store.userId,
      ownerName,
      phone,
      number: addressNumber,
      building: addressBuilding,
      subStreet: addressSubStreet,
      street: addressStreet,
      subdistrict: addressSubdistrict,
      district: addressDistrict,
      province: addressProvince,
      postalCode: addressZip,
      addressType: addressType || 'HOME',
      isDefault: true
    });

    await MerchantAddress.create({
      userId: store.userId,
      ownerName,
      phone,
      address_number: addressNumber,
      building: addressBuilding,
      subStreet: addressSubStreet,
      street: addressStreet,
      subdistrict: addressSubdistrict,
      district: addressDistrict,
      province: addressProvince,
      postalCode: addressZip,
      addressType: addressType || 'HOME',
      isDefault: true
    })
    user.role = UserRole.MERCHANT
    await user.save()

    res.status(201).json({ store, user })
  } catch (err: any) {
    console.error('Error creating store for user:', err)
    res.status(400).json({ error: err.message })
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
