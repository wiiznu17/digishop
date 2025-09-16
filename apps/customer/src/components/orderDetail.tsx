import { Address } from "@/types/props/addressProp";
import { OrderDetail } from "@/types/props/orderProp";
import OrderStatusConfig from '../master/statusOrderDetail.json'
import PaymentMethodMaster from '../master/paymentMethod.json'
interface orderDetailInterface {
  order: OrderDetail | undefined;
}
export default function OrderDetailPage({ order }: orderDetailInterface) {
  console.log(order);
  const sumprice = (data: OrderDetail|undefined) => {
    if(!data)return 0
    let sum = 0;
      for (let i = 0; i < data.items.length; i++) {
        sum += (data.items[i].unit_price_minor * data.items[i].quantity)
      }
      return sum
  }
  const formatAddress = (items: Address): string => {
    return [
      items.address_number,
      items.building,
      items.street,
      items.subStreet,
      items.district,
      items.subdistrict,
      items.province,
      items.postalCode,
      items.country,
    ]
      .filter(Boolean)
      .join(" ");
  }; 
  
  const sumPriceProduct = sumprice(order)
  return order == undefined ? (
    <></>
  ) : (
    <div className=" bg-amber-300 rounded-2xl p-4">
      <div className=" bg-amber-50 rounded-2xl mb-2 p-4">
        <div className="font-bold flex justify-center">status : {OrderStatusConfig[order.status].label}</div>
      </div>
      <div className=" bg-amber-50 rounded-2xl w-fit mb-2 p-4">
        <div className="font-bold">{order.shippingInfo.address.recipientName}</div>
        <div className="ml-5">
          <p>{formatAddress(order.shippingInfo.address)}</p>
          <p>{order.shippingInfo.address.phone}</p>
        </div>
      </div>
      <div className="bg-amber-50 rounded-2xl mb-2 p-4">
          <div className="flex items-center mb-3 ">
            <div className="h-[50px] w-[50px] rounded-[50px] bg-amber-800 "></div>
            <div className="px-4">
              <h1 className="text-2xl font-extrabold">
                {order.store.storeName}
              </h1>
            </div>
          </div>
        <div className="">
          {order.items.map((items, index) => (
            <div key={index}>
              <div className="grid grid-cols-2 gap-3 mb-6 relative ">
                <div className="min-w h-[200px] bg-pink-200 text-center ">
                  picture
                </div>
                <div>
                  <div className="">
                    <div>{items.product.name}</div>
                    <div className="absolute bottom-8 right-0 text-xs text-gray-500 ">
                      x {String(items.quantity)}
                    </div>
                    <div className="absolute bottom-0 right-0 text-xs text-gray-500 ">
                      price: {String(items.unit_price_minor / 100)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
        <div className="bg-amber-50 rounded-2xl p-4 mb-2">
              <div className="border-b text-2xl mb-2 font-extrabold">
                Total
              </div>
              <div className="">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Product</span>
                  <span className="font-medium">
                    {
                      
                    }
                    {sumPriceProduct/100}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">
                    <div>{order.shippingInfo.shippingType.name}</div>
                    <div className="ml-3">
                      <div className="text-sm ">estimatedDays: {order.shippingInfo.shippingType.estimatedDays}</div>
                    </div>
                  </span>
                  <span className="font-medium">{order.shippingInfo.shippingType.price/100}</span>
                </div>
                <div className="border-t border-gray-400 pt-2 flex justify-end items-center">
                  <span className="text-lg font-semibold">{order.grand_total_minor/100}</span>
                </div>
              </div>
            </div>
      <div className="bg-amber-50 rounded-2xl p-4">
        <div className="border-b py-2 text-2xl font-bold mb-2">Payment</div>
        {
          order.payment.payment_method == "CREDIT_CARD" &&
          <div>paid by {PaymentMethodMaster["CERDIT_CARD"].label}</div>
        }
        {
          order.payment.payment_method == "QR" &&
          <div>{PaymentMethodMaster["QR"].label}</div>
        }
        <div className="my-2">transaction : {order.payment.updated_at.slice(0, 10)}</div>
      </div>
    </div>
  );
}
