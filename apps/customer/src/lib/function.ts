import { Address } from "@/types/props/addressProp";
import { OrderDetail, ProductItemProps } from "@/types/props/orderProp";
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

export const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60 );
    // return Math.max(0, Math.floor((seconds) / 1000))
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
// use in order page
export const sumPrice = (
    items: [
      {
        quantity: number;
        unitPriceMinor: number;
        lineTotalMinor: number;
        productItem: ProductItemProps;
        productNameSnapshot: string;
      },
    ]
  ) => {
    let sum = 0;
    for (let i = 0; i < items.length; i++) {
      sum += items[i].quantity * items[i].productItem.priceMinor;
    }
    return sum / 100;
  };
  export const sumPriceTotal = (items: OrderDetail[]) => {
    let sum = 0;
    for (let i = 0; i < items.length; i++) {
      for (let j = 0; j < items[i].items.length; j++) {
        sum +=
          items[i].items[j].quantity * items[i].items[j].productItem.priceMinor;
      }
    }
    return sum / 100;
  };

  export const formatTimeZoneTH = (date: string) => {
    const newDate = new Date(date)
    return newDate.toLocaleString("en-US", {
      timeZone: "Asia/Bangkok"
    });
  }