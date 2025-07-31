import { Router } from 'express'
import { createStoreForUser, deleteUser, getMerchantProfile } from '../controllers/userController'
import { authenticate } from '../middlewares/middleware'

const router = Router()

router.get('/profile', authenticate, getMerchantProfile)
router.post('/register', createStoreForUser)
router.delete('/:id', deleteUser)

export default router
