"use client";
import { Product, ProductImages } from "@/types/props/productProp";
import Image from "next/image";
import { useState } from "react";
import { minPrice } from "@/lib/function";

interface cardProp {
  data: Product;
}


const findMain = (images: ProductImages[]) =>
  images.filter((image) => image.isMain == true);
export const Card = ({ data }: cardProp) => {
  const [shownPic, setShownPic] = useState(findMain(data.images)[0]);
  return (
    <div>
      <button className="relative text-black bg-white cursor-pointer border hover:scale-105 duration-120 rounded-b-2xl">
        {/* <Image src={data.images[0].url} alt={data.images[0].blobName} width={100} height={100} /> */}
        <Image
          src={shownPic.url}
          alt={shownPic.fileName}
          className="object-contain h-80 w-96 "
        />
        <div className="flex">
          {data.images.map((image, index) => (
            <div key={index}>
              <Image
                src={image.url}
                alt={image.fileName}
                width="100"
                onMouseEnter={() => setShownPic(image)}
                className="h-20 w-20 object-fill rounded-2xl p-2 "
              />
            </div>
          ))}
        </div>
        <div className="px-5 text-start mb-3">
          <h3 className="text-[27px] mb-2">{data.name}</h3>
          <div className="flex justify-between gap-4 text-[21px] ">
            <p className="text-[18px]">{data.store.storeName}</p>
            <p className="absolute bottom-2 right-2 text-3xl font-bold">
              ฿ {minPrice(data.items)}
            </p>
          </div>
        </div>
      </button>
    </div>
  );
};
export const CardStore = ({ data }: cardProp) => {
  const [shownPic, setShownPic] = useState(findMain(data.images)[0]);
  return (
    <div>
      <button className="relative text-black bg-white cursor-pointer border hover:scale-105 duration-120 rounded-b-2xl">
        {/* <Image src={data.images[0].url} alt={data.images[0].blobName} width={100} height={100} /> */}
        <Image
          src={shownPic.url}
          alt={shownPic.fileName}
          className="object-contain h-80 w-96"
        />
        <div className="flex">
          {data.images.map((image, index) => (
            <div key={index}>
              <Image
                src={image.url}
                alt={image.fileName}
                onMouseEnter={() => setShownPic(image)}
                className="h-20 w-20 object-fill rounded-2xl p-2 "
              />
            </div>
          ))}
        </div>
        <div className="px-5 text-start mb-3">
          <h3 className="text-[27px] mb-2">{data.name}</h3>
          <p className="flex justify-end items-end text-3xl font-bold">
            ฿ {minPrice(data.items)}
          </p>
        </div>
      </button>
    </div>
  );
};
