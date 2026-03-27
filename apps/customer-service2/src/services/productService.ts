import { NotFoundError } from '../errors/AppError'
import { productRepository } from '../repositories/productRepository'

export class ProductService {
  async searchProduct(query: string, page?: number) {
    const productCount = await productRepository.countProductsByName(
      query as string
    )

    let searchProduct
    if (page) {
      searchProduct = await productRepository.searchProductsWithPage(
        query as string,
        Number(page)
      )
    } else {
      searchProduct = await productRepository.searchProductNames(
        query as string
      )
    }

    const searchStore = await productRepository.searchStoresByName(
      query as string
    )

    if (!searchProduct) throw new NotFoundError(`${query} not found`)

    return { product: searchProduct, productCount, store: searchStore }
  }

  async getProduct(uuid: string) {
    const [productDetail, optionProduct] = await Promise.all([
      productRepository.findProductByUuid(uuid),
      productRepository.findProductVariationsByUuid(uuid)
    ])

    if (!productDetail) throw new NotFoundError(`${uuid} not found`)

    return { data: productDetail, choices: optionProduct }
  }

  async getAllProducts() {
    const products = await productRepository.findAllProducts()
    if (!products) throw new NotFoundError('Not found')
    return { data: products }
  }

  async getStoreProduct(uuid: string) {
    const productData = await productRepository.findStoreByUuid(uuid)
    return { data: productData }
  }
}

export const productService = new ProductService()
