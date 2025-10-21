import { Address } from "@/types/props/addressProp";
import { DialogBackdrop, DialogPanel, Dialog } from "@headlessui/react";
import { SetStateAction, useState } from "react";
import InputField from "./inputField";
import Button from "./button";
import { Rubik } from "next/font/google";
import { updateAddress } from "@/utils/requestUtils/requestUserUtils";
import { useAuth } from "@/contexts/auth-context";
const rubik = Rubik({
  subsets: ["latin"],
  weight: "500"
})
interface editAddressProp {
  item: Address;
  setEditAddShow: React.Dispatch<SetStateAction<boolean>>;
  editAddShow: boolean;
}

export function EditAddress({
  item,
  editAddShow,
  setEditAddShow,
}: editAddressProp) {
  const {user} = useAuth()
  const [address, setAddress] = useState(item);
  const handleOnConfirm = async () => {
    // patch address
    if(!user) return
    const updateAdd = (await updateAddress(user.id,address)) as {data: string }
    if(updateAdd.data){
      setEditAddShow(false)
      window.location.reload()
    }
  };
  const handleIsDefault = () => {
    setAddress({ ...address, isDefault: true });
  }
  const handleInputChange = (e:React.ChangeEvent<HTMLInputElement>|React.ChangeEvent<HTMLSelectElement> ) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };
  const handleOnCancel = () => {
    setEditAddShow(false);
  };
  return (
    <div>
      <Dialog
        open={editAddShow}
        onClose={() => setEditAddShow(false)}
        className="relative z-100"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
        >
          <div className={`fixed inset-0 z-100 w-screen overflow-y-auto  ${rubik.className} bg-black/50`}>
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <DialogPanel 
              transition
              className="relative transform overflow-hidden rounded-lg bg-white/100 text-left shadow-xl outline -outline-offset-1 outline-white/10 transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
              >
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <form onSubmit={handleOnConfirm}>
                        <div className="space-y-6">
                          <div className="flex items-center gap-2 border-b border-black">
                            <h2 className="text-xl font-semibold text-gray-900 ">
                              Home Address
                            </h2>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField
                              label="Recipient Name"
                              name="recipientName"
                              value={address.recipientName}
                              onChange={handleInputChange}
                              // placeholder="Enter your last name"
                              type="text"
                              required
                            />
                            <InputField
                              label="Phone Number"
                              type="num"
                              name="phone"
                              value={address.phone}
                              onChange={handleInputChange}
                              // placeholder="Phone number"
                              maxLength={10}
                              minLength={10}
                              required
                            />
                          </div>
                          <h1 className="my-2 text-black">Address</h1>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField
                              label="Address Number"
                              name="address_number"
                              value={address.address_number}
                              onChange={handleInputChange}
                              // placeholder="address number"
                            />
                            <InputField
                              label="Building"
                              name="building"
                              value={address.building}
                              onChange={handleInputChange}
                              // placeholder="building"
                            />
                            <InputField
                              label="Street"
                              name="street"
                              value={address.street}
                              onChange={handleInputChange}
                              // placeholder="street"
                            />
                            <InputField
                              label="Sub Street"
                              name="subStreet"
                              value={address.subStreet}
                              onChange={handleInputChange}
                              // placeholder="subStreet"
                            />
                            <InputField
                              label="District"
                              name="district"
                              value={address.district}
                              onChange={handleInputChange}
                              // placeholder="district"
                            />
                            <InputField
                              label="Sub district"
                              name="subdistrict"
                              value={address.subdistrict}
                              onChange={handleInputChange}
                              // placeholder="sub district"
                            />
                            <InputField
                              label="Province"
                              name="province"
                              value={address.province}
                              onChange={handleInputChange}
                              // placeholder="Province"
                              type="text"
                              required
                            />
                            <InputField
                              label="Postal Code"
                              name="postalCode"
                              type="num"
                              value={address.postalCode}
                              onChange={handleInputChange}
                              // placeholder="Postal code"
                              maxLength={5}
                              minLength={5}
                              required
                            />
                            <InputField
                              label="Country"
                              name="country"
                              value={address.country}
                              onChange={handleInputChange}
                              // placeholder="Country"
                              type="text"
                              required
                            />
                          </div>

                          <div className="text-black">
                            <h1>select address type</h1>
                            <select
                              name="addressType"
                              value={address.addressType}
                              onChange={handleInputChange}
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
                          </div>
                          {
                            !item.isDefault && (
                            <div className="text-black">
                              <div className="pb-2">This address is default</div>
                              <input type="checkbox" name="isDefault" onChange={handleIsDefault}/>
                              <label htmlFor="isDefault" className="ml-4 ">Yes</label>
                            </div>
                            )
                          }
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
                  <div className=" px-4 py-4 sm:flex sm:flex-row-reverse sm:px-6">
                    <Button
                      size="sm"
                      onClick={handleOnConfirm}
                      className={`text-sm text-white bg-green-500 sm:ml-3 sm:w-auto`}
                    >
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleOnCancel}
                      className=" text-white bg-red-500"
                    >
                      Cancel
                    </Button>
                  </div>
              </DialogPanel>
            </div>
          </div>
        </DialogBackdrop>
      </Dialog>
    </div>
  );
}
