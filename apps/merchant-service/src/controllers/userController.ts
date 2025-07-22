import { User } from '@digishop/db/src/models/User'
import { Request, Response } from 'express'

export const getAllUsers = async (req: Request, res: Response) => {
  console.log('hiiiiiiiiiiiiiiiiiiiiiiiiii')
  const users = await User.findAll()
  console.log('users: ', users)
  res.json(users)
}

export const createUser = async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, middleName, role } = req.body
  try {
    const user = await User.create({ email, password, firstName, lastName, middleName, role })
    console.log('user controller')
    res.status(201).json(user)
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
