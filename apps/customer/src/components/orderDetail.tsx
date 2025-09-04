import { Address } from "@/types/props/addressProp";
import { OrderDetail } from "@/types/props/orderProp";

interface orderDetailInterface {
  order: OrderDetail | undefined;
}
export default function OrderDetailPage({ order }: orderDetailInterface) {
  console.log(order);
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
  if (order == undefined) return;
  return (
    <div className="mb-2">
      <div className=" bg-amber-50 rounded-2xl m-2 p-4">
        <div>order id : {order.order_code}</div>
        <div className="">address line</div>
        <div className="ml-5">{formatAddress(order.shippingInfo.address)}</div>
        <div>status: {order.status}</div>
      </div>
      <div className="bg-amber-50 rounded-2xl m-2 p-4">
        <div className="">
          {order.items.map((items, index) => (
            <div key={index}>
              <div className="flex gap-4 ">
              <div className="grid grid-cols-2 gap-4 mb-6 relative">
                <div className="w-[400px] h-[425px] bg-pink-200 text-center ">
                  picture
                </div>
                <div>
                  <div className="flex-1">
                    <div>{items.product.name}</div>
                    <div className="absolute bottom-10 right-0 text-xs text-gray-500 ">
                      quantity: {String(items.quantity)}
                    </div>
                    <div className="absolute bottom-0 right-0 text-xs text-gray-500 ">
                      price: {String(items.unit_price_minor/100)}
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </div>
          ))}
          <div className="flex p-6 rounded-2xl w-2xl bg-gray-200">
            <div className="h-[100px] w-[100px] rounded-[50px] bg-amber-800 "></div>
            <div className="px-4">
              <h1 className="text-2xl font-extrabold">
                {order.store.storeName}
              </h1>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-amber-50 rounded-2xl m-2 p-4">
          <div>Payment</div>
          <div>{order.payment.payment_method}</div>
          <div>transaction : {order.payment.updated_at.slice(0,10)}</div>
      </div>
    </div>
  );
}
