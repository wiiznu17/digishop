export interface CreateProductRequest {
  name: string
  categoryId: number
  price: string
  stockQuantity: number
  status: string
  description: string
}

export interface UpdateProductRequest {
  name?: string
  categoryId?: number
  price?: string
  stockQuantity?: number
  status?: string
  description?: string
}
