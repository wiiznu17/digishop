import { Router } from 'express'
import { createUser, deleteUser, findaddressUser, finduserDetail , createAddress, updateUserName, updateAddress, deleteAddress } from '../controllers/userControllers'
import { authenticate, requireApprovedUser } from '../middlewares/middleware'

const router = Router()

router.post('/register', createUser)
router.post('/delete/:id', deleteUser)

//get user
router.post('/address',authenticate,requireApprovedUser(), createAddress)
router.get('/address/:id',authenticate,requireApprovedUser(), findaddressUser)
router.get('/detail/:id',authenticate,requireApprovedUser(),finduserDetail)
router.patch('/address/:id',authenticate,requireApprovedUser(), updateAddress)
router.patch('/name/:id',authenticate,requireApprovedUser(), updateUserName)
router.delete('/address/:id',authenticate,requireApprovedUser(), deleteAddress)



export default router
