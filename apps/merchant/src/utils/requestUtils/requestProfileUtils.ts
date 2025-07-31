import axios from "@/lib/axios"
import { MerchantProfileFormValues } from "@/types/props/userProp"

export async function fetchMerchantProfileRequester(): Promise<MerchantProfileFormValues | null> {
  try {
    const res = await axios.get("/api/merchant/profile", {
      withCredentials: true
    })
    console.log("Fetched user profile in request:", res.data.user)
    return res.data.user
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

export async function updateMerchantProfileRequester(
  profileData: MerchantProfileFormValues
): Promise<MerchantProfileFormValues | null> {
  try {
    const res = await axios.put("/api/merchant/profile", profileData, {
      withCredentials: true
    })
    console.log("Updated user profile:", res)
    return res.data.user
  } catch (error) {
    console.error("Error updating user profile:", error)
    return null
  }
}
