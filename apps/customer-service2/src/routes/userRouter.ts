import { Router } from 'express'
import { createUser, deleteUser, findaddressUser, finduserDetail , createAddress, updateUserName, updateAddress, deleteAddress, refreshTokenAuth, sendMailResetPassword, resetPassword, sendvaildateEmail } from '../controllers/userControllers'
import { authenticate } from '../middlewares/middleware'

const router = Router()

router.post('/verified-email', sendvaildateEmail ) // data
router.post('/register',createUser ) //get token
router.post('/delete/:id', deleteUser)
//get user
router.post('/address',authenticate, createAddress)
router.get('/address/:id',authenticate, findaddressUser)
router.get('/detail/:id',authenticate,finduserDetail)
router.patch('/address/:id',authenticate, updateAddress)
router.patch('/name/:id',authenticate, updateUserName)
router.delete('/address/:id',authenticate, deleteAddress)
router.post("/refresh-token", refreshTokenAuth)
router.patch("/reset-password", resetPassword)
router.post("/forgot-password", sendMailResetPassword)



export default router
