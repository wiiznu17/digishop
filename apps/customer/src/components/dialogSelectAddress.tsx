import { Address } from "@/types/props/addressProp";
import { SetStateAction, useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
} from "@headlessui/react";
import {AddressCardForOrder} from "./addressCard";
import { Noto_Sans_Thai_Looped } from "next/font/google";
import Button from "./button";
const notoSanLoop = Noto_Sans_Thai_Looped({
  weight:'400'
})
interface SelectAddress {
  isShown: boolean
  setIsShown: React.Dispatch<SetStateAction<boolean>>
  handleOnCancel: () => void
  addresses?: Address[]
  selectAddress: Address
  setSelectAddress: React.Dispatch<SetStateAction<Address| undefined>>
}
export const DialogSelectAddress = ({
    isShown,
    setIsShown,
    handleOnCancel,
    addresses,
    selectAddress,
    setSelectAddress,
}: SelectAddress ) => {
    const [select,setSelect] = useState<Address>(selectAddress)
    const handleOnConfirm = () => {
      setSelectAddress(select)
      setIsShown(false)
    }
    return (
            <div>
              <Dialog open={isShown} onClose={() => setIsShown(false)} className="relative z-100">
                <DialogBackdrop
                  transition
                  className="fixed inset-0 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
                />
        
                <div className={`fixed inset-0 z-100 w-screen overflow-y-auto ${notoSanLoop.className} text-black`}>
                  <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    <DialogPanel
                      transition
                      className="relative transform overflow-hidden rounded-lg bg-gray-800 text-left shadow-xl outline -outline-offset-1 outline-white/10 transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
                    >
                      <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                            <div className="mb-4">Select your shipping address</div>
                            {
                                addresses?.map((item, index) => (
                                    <button key={index} onClick={() => setSelect(item)}>
                                        <AddressCardForOrder item={item} select={select}/>
                                    </button>
                                ))
                            }
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-700/25 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                        <Button
                          size="sm"
                          onClick={handleOnConfirm}
                          className="bg-green-500 hover:bg-red-400 mx-2"
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleOnCancel}
                          className="justify-center bg-white "
                        >
                          Cancel
                        </Button>
                      </div>
                    </DialogPanel>
                  </div>
                </div>
              </Dialog>
            </div>
    )
}