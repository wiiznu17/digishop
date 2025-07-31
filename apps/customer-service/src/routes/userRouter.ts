import { Router } from 'express'
import { createUser } from '../controllers/userControllers'

const router = Router()

// router.get('/', getAllUsers)
router.post('/register', createUser)

export default router
