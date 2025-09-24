import axios from "@/lib/axios"
import {
  MerchantAddressForm,
  MerchantProfileFormValues
} from "@/types/props/userProp"

export async function fetchMerchantProfileRequester(): Promise<MerchantProfileFormValues | null> {
  try {
    const res = await axios.get("/api/merchant/profile", {
      withCredentials: true
    })
    return res.data.user
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

export async function updateMerchantProfileRequester(
  profileData: MerchantProfileFormValues,
  images: File[] = []
): Promise<MerchantProfileFormValues | null> {
  try {
    const formData = new FormData()
    formData.append("profileData", JSON.stringify(profileData))

    if (images && images.length > 0) {
      // โปรไฟล์มีรูปเดียว → ส่งรูปเดียว
      formData.append("images", images[0])
    }

    const res = await axios.put("/api/merchant/profile", formData, {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data"
      }
    })
    return res.data
  } catch (error) {
    console.error("Error updating user profile:", error)
    return null
  }
}

// 🔹 แก้ไขที่อยู่เฉพาะรายการ
export async function updateMerchantAddressRequester(
  addressId: number,
  payload: Partial<MerchantAddressForm>
) {
  try {
    const res = await axios.put(
      `/api/merchant/profile/address/${addressId}`,
      payload,
      {
        withCredentials: true
      }
    )
    return res.data
  } catch (error) {
    console.error("Error updating merchant address:", error)
    throw error
  }
}
