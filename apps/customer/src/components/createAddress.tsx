"use client";

import { JSX, SetStateAction, useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
} from "@headlessui/react";
import InputField from '@/components/inputField';
import {  Home} from 'lucide-react';
import { Address } from "@/types/props/addressProp";
import { flushAllTraces } from "next/dist/trace";

interface CreateAddress {
    isShowAddress: boolean
    setIsShowAddress:React.Dispatch<SetStateAction<boolean>>
    handleOnCancel: () => void
    handleOnConfirm: (e: React.FormEvent) => Promise<void>
    address: Address
    setAddress: React.Dispatch<SetStateAction<Address>>
}
export const DialogAddress = ({
  isShowAddress,
  setIsShowAddress,
  handleOnCancel,
  handleOnConfirm,
  address,
    setAddress
}: CreateAddress): JSX.Element => {
        const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
            setAddress({
                ...address,
                [e.target.name]: e.target.value
            });
        };
        const validateForm = ():boolean => {
           const newErrors: {[key: string]: string} = {};
          
          if (!address.recipientName) {
            newErrors.recipientName = 'recipientName is required';
          } 
          if (!address.phone) {
            newErrors.phone = 'phone is required';
          } 
          if (!address.addressLine) {
            newErrors.addressLine = 'addressLine is required';
          }
          if (!address.province) {
            newErrors.province = 'province is required';
          }
          if (!address.postalCode) {
            newErrors.postalCode = 'postalCode is required';
          }
        
          return Object.keys(newErrors).length === 0; // true = valid form
        }
        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setAddress({
                ...address,
              [e.target.name]: e.target.value
            });
          };
        
    if (!isShowAddress) return <></>
  return (
    <div>
      <Dialog open={isShowAddress} onClose={() => setIsShowAddress(false)} className="relative z-100">
        <DialogBackdrop
          transition
          className="fixed inset-0 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
        />

        <div className="fixed inset-0 z-100 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-gray-800 text-left shadow-xl outline -outline-offset-1 outline-white/10 transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-red-500/10 sm:mx-0 sm:size-10"></div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <form onSubmit={handleOnConfirm}>
                      <div className="space-y-6">
                        <div className="flex items-center gap-2">
                          <Home className="w-5 h-5 text-blue-600" />
                          <h2 className="text-xl font-semibold text-gray-900">
                            Home Address
                          </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InputField
                            label="Recipient Name"
                            name="recipientName"
                            value={address.recipientName}
                            onChange={handleInputChange}
                            placeholder="Enter your last name"
                            type="text"
                            required
                          />
                          <InputField
                            label="Phone Number"
                            type="num"
                            name="phone"
                            value={address.phone}
                            onChange={handleInputChange}
                            placeholder="Phone number"
                            maxLength={10}
                            minLength={10}
                            required
                          />
                        </div>

                        <InputField
                          label="Address Line"
                          name="addressLine"
                          value={address.addressLine}
                          onChange={handleInputChange}
                          placeholder="Street address, apartment, suite, etc."
                          required
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InputField
                            label="Province"
                            name="province"
                            value={address.province}
                            onChange={handleInputChange}
                            placeholder="Province"
                            type="text"
                            required
                          />
                          <InputField
                            label="Postal Code"
                            name="postalCode"
                            type="num"
                            value={address.postalCode}
                            onChange={handleInputChange}
                            placeholder="Postal code"
                            maxLength={5}
                            minLength={5}
                            required
                          />
                        </div>
                        <div>
                          <h1 className="text-black">select address type</h1>
                          <select
                            name="addressType"
                            value={address.addressType}
                            onChange={handleChange}
                          >
                            <option id="1" value="HOME" className="text-xl">
                              HOME
                            </option>
                            <option id="2" value="OFFICE" className="text-xl">
                              OFFICE
                            </option>
                          </select>
                        </div>
                      </div>                      
                    </form>
                  </div>
                </div>
              </div>
              <div className="bg-gray-700/25 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={handleOnConfirm}
                  disabled={!validateForm()}
                  className={`${!validateForm() ? 'bg-gray-300':'bg-green-500 hover:bg-red-400'} inline-flex w-full justify-center rounded-md  px-3 py-2 text-sm font-semibold text-white sm:ml-3 sm:w-auto`}
                >
                  Confirm
                </button>
                <button
                  type="button"
                  data-autofocus
                  onClick={handleOnCancel}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white inset-ring inset-ring-white/5 hover:bg-white/20 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
