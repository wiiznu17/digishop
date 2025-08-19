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
  profileData: MerchantProfileFormValues,
  images: File[] = []
): Promise<MerchantProfileFormValues | null> {
  try {
    // profileData มี image อยู่
    console.log("profile data update from frontend", profileData)
    console.log("image profile", images)

    const formData = new FormData()

    // เพิ่มข้อมูลสินค้า
    formData.append("profileData", JSON.stringify(profileData))
    console.log("form data: ", formData)
    // เพิ่มรูปภาพใหม่ (ถ้ามี)
    if (images && images.length > 0) {
      images.forEach((file, index) => {
        formData.append("images", file)
        console.log(`Adding new image ${index}:`, file.name, file.size)
      })
    }
    const res = await axios.put("/api/merchant/profile", formData, {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data"
      }
    })
    console.log("Updated user profile return to requester:", res.data.message)
    return res.data
  } catch (error) {
    console.error("Error updating user profile:", error)
    return null
  }
}
