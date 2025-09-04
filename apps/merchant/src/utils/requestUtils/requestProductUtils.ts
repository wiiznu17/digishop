import axios from "@/lib/axios"
import { Product } from "@/types/props/productProp"
import {
  CreateProductRequest,
  UpdateProductRequest
} from "@/types/requests/productRequest"

export async function fetchProductsRequester(): Promise<Product[] | null> {
  try {
    const res = await axios.get("/api/merchant/products", {
      withCredentials: true
    })
    console.log("Fetched products:", res.data.products)
    return res.data.products.products
  } catch (error) {
    console.error("Error fetching products:", error)
    return null
  }
}

export async function createProductRequester(
  productData: CreateProductRequest,
  images: File[] = []
): Promise<Product | null> {
  console.log("Creating product in req:", productData)
  console.log("Images to upload:", images)

  try {
    const formData = new FormData()

    // เพิ่มข้อมูลสินค้า
    formData.append("productData", JSON.stringify(productData))

    // เพิ่มรูปภาพ
    images.forEach((file, index) => {
      formData.append("images", file)
      console.log(`Adding image ${index}:`, file.name, file.size)
    })

    const res = await axios.post("/api/merchant/products", formData, {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data"
      }
    })

    console.log("Created product:", res.data)
    return res.data
  } catch (error) {
    console.error("Error creating product:", error)
    return null
  }
}

export async function updateProductRequester(
  productId: string,
  productData: UpdateProductRequest,
  images: File[] = []
): Promise<Product | null> {
  console.log("Updating product in req:", productData)
  console.log("New images to upload:", images)

  try {
    const formData = new FormData()

    // เพิ่มข้อมูลสินค้า
    formData.append("productData", JSON.stringify(productData))

    // เพิ่มรูปภาพใหม่ (ถ้ามี)
    if (images && images.length > 0) {
      images.forEach((file, index) => {
        formData.append("images", file)
        console.log(`Adding new image ${index}:`, file.name, file.size)
      })
    }

    const res = await axios.put(
      `/api/merchant/products/${productId}`,
      formData,
      {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data"
        }
      }
    )

    console.log("Updated product:", res.data)
    return res.data
  } catch (error) {
    console.error("Error updating product:", error)
    return null
  }
}

export async function deleteProductRequester(productId: string): Promise<void> {
  try {
    await axios.delete(`/api/merchant/products/${productId}`, {
      withCredentials: true
    })
    console.log("Deleted product with ID:", productId)
  } catch (error) {
    console.error("Error deleting product:", error)
  }
}

// เพิ่มฟังก์ชันสำหรับลบรูปภาพเฉพาะรูป
export async function deleteProductImageRequester(
  productId: string,
  imageId: string
): Promise<void> {
  try {
    await axios.delete(
      `/api/merchant/products/${productId}/images/${imageId}`,
      {
        withCredentials: true
      }
    )
    console.log("Deleted product image:", imageId)
  } catch (error) {
    console.error("Error deleting product image:", error)
  }
}

// เพิ่มฟังก์ชันสำหรับอัพเดทลำดับรูปภาพหรือเซ็ตรูปหลัก
export async function updateProductImageRequester(
  productId: string,
  imageId: string,
  updateData: { isMain?: boolean; sortOrder?: number }
): Promise<void> {
  try {
    await axios.patch(
      `/api/merchant/products/${productId}/images/${imageId}`,
      updateData,
      {
        withCredentials: true
      }
    )
    console.log("Updated product image:", imageId, updateData)
  } catch (error) {
    console.error("Error updating product image:", error)
  }
}
