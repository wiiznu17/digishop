"use client";

import { JSX, SetStateAction, useEffect, useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import InputField from "@/components/inputField";
import { Home } from "lucide-react";
import { Address } from "@/types/props/addressProp";
import { Noto_Sans_Thai_Looped, Rubik } from "next/font/google";
import Button from "./button";
import { Orders } from "@/types/props/orderProp";
interface CancelOrderProps {
    isShowCancel: boolean
    order: Orders
    reason: string|undefined
    setReason: React.Dispatch<SetStateAction<string|undefined>>
    detail: string
    setDetail: React.Dispatch<SetStateAction<string>>
    setIsShowCancel: React.Dispatch<SetStateAction<boolean>>;
    handleOnCancel: () => void
}
const notoSanLoop = Noto_Sans_Thai_Looped({
  weight:'400'
})
export const CancelOrder = ({
 isShowCancel,
 order,
 setIsShowCancel,
 reason,
 setReason,
 detail,
 setDetail,
 handleOnCancel
} : CancelOrderProps) => {
    const [cancelData, setCancelData] = useState()
    const handleOnConfirm = () => {
        
    }

    const handleSelectReson = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setReason(e.target.value)
    }
    const handleInputDetail = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDetail(e.target.value)
    }
  return (
    <div>
      <Dialog
        open={isShowCancel}
        onClose={() => setIsShowCancel(false)}
        className="relative z-100"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
        />

        <div className={`fixed inset-0 z-100 w-screen overflow-y-auto ${notoSanLoop.className} text-black`}>
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-gray-300 text-left shadow-xl outline -outline-offset-1 outline-white/10 transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95 p-3"
            >
              <div className="">
                <div className="mb-4 p-4 rounded-md bg-white">
                    <div>{order.id}</div>
                </div>
              </div>
                <div className="mb-3 p-4 rounded-md bg-white">
                    <div>reason</div>
                        <select
                        name="reason"
                        value={reason}
                        onChange={handleSelectReson}
                        className="border border-gray-500 p-3 mt-2 rounded-2xl "
                        >
                        <option
                            id="1"
                            value="HOME"
                            className="text-xl border border-gray-300"
                        >
                            HOME
                        </option>
                        <option id="2" value="OFFICE" className="text-xl">
                            OFFICE
                        </option>
                        </select> 
              
            
                    <div className="mb-3 p-4 rounded-md bg-white">
                        <div>detail</div>
                        <div className="">
                            <InputField 
                                label="detail"
                                name='detail' 
                                value={detail} 
                                onChange={handleInputDetail} 
                            />
                        </div>
                    </div> 
                </div>
              

              <div className="flex justify-end px-6">
                <Button
                size='sm'
                  onClick={handleOnCancel}
                  className=" bg-white/10 text-white"
                >
                  Cancel
                </Button>
                <Button
                  size='sm'
                  onClick={handleOnConfirm}
                  color="bg-green-300"
                >
                  Confirm
                </Button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  )
}