import { User } from '@digishop/db/src/models/User'
import { UserRole } from '@digishop/db/src/types/enum'
import { Request, Response } from 'express'

export const createUser = async (req: Request, res: Response) => {
    const {
    userId,
    // businessName,
    // description,
    // addressNumber,
    // addressStreet,
    // addressSubdistrict,
    // addressDistrict,
    // addressProvince,
    // addressZip,
    // logoUrl
  } = req.body

  try {
    // หา user จาก userId
    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // สร้าง Store ใหม่
    // const store = await Store.create({
      // userId,
      // storeName: businessName,
      // description,
      // logoUrl: logoUrl || null,
      // status: StoreStatus.PENDING
    // })

    // อัปเดต role เป็น merchant
    user.role = UserRole.CUSTOMER
    await user.save()

    res.status(201).json({ user })
  } catch (err: any) {
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
