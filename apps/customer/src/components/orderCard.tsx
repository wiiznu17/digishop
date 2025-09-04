import { Orders } from "@/types/props/orderProp";
import Link from "next/link";

interface OrderCard {
  item: Orders;
}

const orderStatusConfig = {
  PENDING: {
    label: "wait to paid",
    color: "bg-amber-200",
    cancel: "cancel"
  },
  CUSTOMER_CANCELED: {
    label: "your cancel this order",
    color: "bg-red-200",
  },
  PAID: {
    label: "waiting merchant confirm",
    color: "bg-green-200",
    cancel: "cancel"
  },
  MERCHANT_CANCELED: {
    label: "merchant cancel this order",
    color: "bg-red-200",
  },
  PROCESSING: {
    label: "order is preparing",
    color: "bg-amber-200",
    cancel: "cancel"
  },
  READY_TO_SHIP: {
    label: "order ready to ship",
    color: "bg-green-200",
    cancel: "cancel"
  },
  HANDED_OVER: {
    label: "shipping company pickup",
    color: "bg-green-200",
  },
  SHIPPED: {
    label: "order is in transit",
    color: "bg-amber-200",
  },
  DELIVERED: {
    label: "order is delivered",
    color: "bg-amber-200",
    cancel: 'refund'
},
COMPLETE: {
    label: "order is complete",
  },
  TRANSIT_LACK: {
    label: "transit lack",
  },
  RE_TRANSIT: {
    label: "re-transport",
  },
  REFUND_REQUEST: {
    label: "you refund this order",
  },
  AWAITING_RETURN: {
    label: "waiting  ",
  },
  RECEIVE_RETURN: {
    label: "receive return",
  },
  RETURN_VERIFIED: {
    label: "return comfirm",
  },
  RETURN_FAIL: {
    label: "return fail",
  },
  REFUND_APPROVED: {
    label: "merchant approve refund",
  },
  REFUND_SUCCESS: {
    label: "refund success",
  },
  REFUND_FAIL: {
    label: "refund failed",
  },
};

export default function OrderCard({ item }: OrderCard) {
  return (
    <div className=" p-5 my-5 mb-3 border w-md rounded-2xl">
      <div className="relative flex justify-end ">{item.status}</div>
        <div>
          <div className="flex items-center mb-3">
            <div className="w-[50px] h-[50px] rounded-full bg-amber-300"></div>
            <div className="mx-5 ">{item.store.storeName}</div>
          </div>
          {item.items.map((items, index) => (
            <div key={index}>
              <div className="flex gap-4 relative mb-2">
                <div className="w-[100px] h-[100px] bg-amber-700"></div>
                <div>
                    <div className="flex-1">
                    <div>{items.product.name}</div>
                        <div className="absolute bottom-5 right-0 text-xs text-gray-500 ">quantity: {String(items.quantity)}</div>
                        <div className="absolute bottom-0 right-0 text-xs text-gray-500 ">price: {items.unit_price_minor/100}</div>
                    </div>
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-end">total price: {item.grand_total_minor/100}</div>
        </div>
      <div
        className={`${orderStatusConfig[item.status].color} p-1.5 my-2 rounded-xl`}
      >
        {orderStatusConfig[item.status].label}
      </div>
      <div className="flex">
          {
            orderStatusConfig[item.status].cancel == 'cancel' &&
            <>
                <button className="p-4 bg-red-300">Cancel</button>
            </> 
          }
          {
            orderStatusConfig[item.status].cancel == 'refund' &&
            <>
                <button className="p-4 bg-red-300">Cancel</button>
                <button className="p-4 mx-4 bg-green-300">Confirmed</button>
            </>
          }
      </div>
    </div>
  );
}
