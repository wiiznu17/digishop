import { Address } from "@/types/props/addressProp";
import { OrderDetail } from "@/types/props/orderProp";
import { Configurations } from "@/types/props/productProp"

export const formatSku = (configs : Configurations[]) => {
const str = configs.map(config => `${config.variationOption.variation.name}: ${config.variationOption.value}`).join(',')
return str
}

export const formatAddress = (items: Address): string => {
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

export const sumprice = (data: OrderDetail|undefined) => {
    if(!data)return 0
    let sum = 0;
      for (let i = 0; i < data.items.length; i++) {
        sum += (data.items[i].lineTotalMinor)
        console.log(sum)
      }
      return sum
  }