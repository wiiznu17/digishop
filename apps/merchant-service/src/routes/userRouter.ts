import { Router } from 'express'
import { getAllUsers, createStoreForUser, deleteUser } from '../controllers/userController'

const router = Router()

router.get('/', getAllUsers)
router.post('/register', createStoreForUser)
router.delete('/:id', deleteUser)

export default router
