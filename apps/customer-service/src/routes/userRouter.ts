import { Router } from 'express'
import { createUser, deleteUser, findaddressUser, finduserDetail , createAddress } from '../controllers/userControllers'

const router = Router()

router.post('/register', createUser)
router.post('/delete/:id', deleteUser)
router.post('/address', createAddress)
router.get('/address/:id', findaddressUser)
router.get('/detail/:id', finduserDetail)



export default router
