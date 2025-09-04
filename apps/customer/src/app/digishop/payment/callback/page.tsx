'use client'
import { updateOrderStatus } from "@/utils/requestUtils/requestOrderUtils"
import { redirect, RedirectType, useSearchParams, useRouter  } from "next/navigation"
import { useEffect } from "react"
export default function PaymentRedirect() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const process_status = searchParams.get('process_status')
  const reference = searchParams.get('reference')
  const sign = searchParams.get('sign')
  const router = useRouter()
  console.log('ref',reference)
  console.log('status',process_status)
  useEffect(()=>{
    console.log('hi')
  },[])
  useEffect(()=>{
    if(process_status){
       const updateData = async() => {
      // await updateOrderStatus(reference,process_status)
    }
    updateData()
    router.refresh()
    }
    if(!process_status) return redirect('/digishop',RedirectType.replace)
    if(process_status == 'true'){
      redirect('/digishop/order/success',RedirectType.replace)
    }else if(process_status == 'false'){
      redirect('/digishop/order/status',RedirectType.replace)
    }
  },[reference,process_status])
  return null
}