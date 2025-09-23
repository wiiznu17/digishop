import { Router } from 'express'
import { createUser, deleteUser, findaddressUser, finduserDetail , createAddress, updateUserName, updateAddress, deleteAddress } from '../controllers/userControllers'

const router = Router()

router.post('/register', createUser)
router.post('/delete/:id', deleteUser)
router.post('/address', createAddress)
router.get('/address/:id', findaddressUser)
router.get('/detail/:id', finduserDetail)
router.patch('/address/:id', updateAddress)
router.patch('/name/:id', updateUserName)
router.delete('/address/:id', deleteAddress)



export default router
