import { redirect, RedirectType } from "next/navigation"

export default function PaymentRedirect({searchParams}) {
  const reference = searchParams.reference
  const process_status = searchParams.process_status
  if(process_status){
    // redirect('/digishop/order?status=success')
    redirect('/digishop/order/success',RedirectType.replace)
  }else if(!process_status){
    redirect('/digishop/order/status',RedirectType.replace)
  }else{
    redirect('/digishop',RedirectType.replace)
  }
//   return (
//     <div>
//     <div>
//       {reference}
//     </div>
//     <div>
//       {process_status}
//     </div>
// </div>
//   )
   
}