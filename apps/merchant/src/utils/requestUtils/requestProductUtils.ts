import axios from "@/lib/axios"
import { Product } from "@/types/props/productProp"

export async function fetchProductsRequester(): Promise<Product[] | null> {
  try {
    const res = await axios.get("/api/merchant/products", {
      withCredentials: true
    })
    console.log("Fetched products:", res.data.products)
    return res.data.products
  } catch (error) {
    console.error("Error fetching products:", error)
    return null
  }
}

export async function createProductRequester(
  productData: Product
): Promise<Product | null> {
  console.log("Creating product in req:", productData)
  try {
    const res = await axios.post("/api/merchant/products", productData, {
      withCredentials: true
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
  productData: Partial<Product>
): Promise<Product | null> {
  try {
    const res = await axios.put(
      `/api/merchant/products/${productId}`,
      productData,
      {
        withCredentials: true
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
