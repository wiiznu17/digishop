import { Shipping } from "@/types/props/orderProp";

interface ShippingCard {
    item : Shipping
    selected: number
}

export default function ShippingCardDetail({item,selected}:ShippingCard) {
    return (
    
        <div className={`m-4 p-4  rounded-2xl w-[500px] ${item.id == selected ? 'border-8 border-amber-500':'border-2 border-black'}`}>
            <div className="flex flex-col-1 md:flex-col-2 gap-[50px]">
                <div>
                    <div className="mb-3">{item.name}</div>
                    {
                        item.description &&
                        <div className="mb-3">{item.description}</div>
                    }
                    <div>estimatedDays: {item.estimatedDays}</div>
                </div>
                <div className="flex justify-center items-center text-3xl font-extrabold">
                    {item.price/100}
                </div>
            </div>
        </div>
     )
}