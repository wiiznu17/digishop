// apps/backend/src/controllers/user.controller.ts
import { Request, Response } from 'express'
import db from '@digishop/db'

export const getAllUsers = async (req: Request, res: Response) => {
  const users = await db.User.findAll()
  res.json(users)
}

export const createUser = async (req: Request, res: Response) => {
  const { name, email } = req.body
  try {
    const user = await db.User.create({ name, email })
    console.log('user controller')
    res.status(201).json(user)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params
  const deleted = await db.User.destroy({ where: { id } })
  if (deleted) {
    res.status(204).send()
  } else {
    res.status(404).json({ error: 'User not found' })
  }
}
