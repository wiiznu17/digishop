import { Router } from 'express'
import { createUser, deleteUser, findaddressUser, finduserDetail , createAddress, updateUserName, updateAddress, deleteAddress, refreshTokenAuth, sendMailResetPassword, resetPassword, sendvaildateEmail } from '../controllers/userControllers'
import { authenticate, requireApprovedUser, authenticateToken } from '../middlewares/middleware'

const router = Router()

router.post('/verified-email', sendvaildateEmail ) // data
router.post('/register',createUser ) //get token
router.post('/delete/:id', deleteUser)

//get user
router.post('/address',authenticate,authenticateToken,requireApprovedUser(), createAddress)
router.get('/address/:id',authenticate,authenticateToken,requireApprovedUser(), findaddressUser)
router.get('/detail/:id',authenticate,authenticateToken,requireApprovedUser(),finduserDetail)
router.patch('/address/:id',authenticate,authenticateToken,requireApprovedUser(), updateAddress)
router.patch('/name/:id',authenticate,authenticateToken,requireApprovedUser(), updateUserName)
router.delete('/address/:id',authenticate,authenticateToken,requireApprovedUser(), deleteAddress)
router.post("/refresh-token", refreshTokenAuth)
router.patch("/reset-password", resetPassword)
router.post("/forgot-password", sendMailResetPassword)



export default router
