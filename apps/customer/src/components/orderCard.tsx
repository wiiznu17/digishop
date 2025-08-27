import { Orders } from "@/types/props/orderProp"
import Link from "next/link"

interface OrderCard {
    item: Orders
}
export default function OrderCard({item}: OrderCard){
    return (
        <div className="p-4 m-4 border">
            <div>{item.product.name}</div>
            <div className="flex justify-end items-end">
                {
                    item.order.status === 'PENDING' && 
                    <div>
                        {/* <Link href={item.urlPayment} className='p-4 bg-green-800 text-white'>go to pay</Link> */}
                        <div className="p-4 bg-green-600">
                            {/* {item.status} */}
                            url link
                        </div>
                    </div>
                }
                {
                    item.order.status !== 'PENDING' && 
                    <div className="p-4 bg-amber-600">
                        {item.order.status}
                    </div>
                }
            </div>
        </div>
    )
}