import {
  Category,
  Product,
  ProductConfiguration,
  ProductImage,
  ProductItem,
  ProductItemImage,
  ProductStatus,
  Store,
  StoreStatus,
  Variation,
  VariationOption
} from '@digishop/db'
import { Op } from 'sequelize'

export class ProductRepository {
  async countProductsByName(query: string) {
    return Product.count({
      where: {
        [Op.and]: [
          { name: { [Op.like]: `%${query}%` } },
          { status: ProductStatus.ACTIVE }
        ]
      }
    })
  }

  async searchProductsWithPage(query: string, page: number) {
    return Product.findAll({
      where: {
        [Op.and]: [
          { name: { [Op.like]: `%${query}%` } },
          { status: ProductStatus.ACTIVE }
        ]
      },
      limit: 10,
      offset: 10 * (page - 1),
      attributes: ['id', 'uuid', 'name'],
      include: [
        { model: Category, as: 'category' },
        { model: ProductImage, as: 'images' },
        { model: ProductItem, as: 'items' },
        { model: Store, as: 'store' }
      ]
    })
  }

  async searchProductNames(query: string) {
    return Product.findAll({
      where: {
        [Op.and]: [
          { name: { [Op.like]: `%${query}%` } },
          { status: ProductStatus.ACTIVE }
        ]
      },
      limit: 10,
      attributes: ['name']
    })
  }

  async searchStoresByName(query: string) {
    return Store.findAll({
      where: { storeName: { [Op.like]: `%${query}%` } },
      limit: 5
    })
  }

  async findProductByUuid(uuid: string) {
    return Product.findOne({
      where: {
        [Op.and]: [{ uuid }, { status: ProductStatus.ACTIVE }]
      },
      include: [
        {
          model: ProductItem,
          as: 'items',
          include: [
            {
              model: ProductConfiguration,
              as: 'configurations',
              include: [
                {
                  model: VariationOption,
                  as: 'variationOption',
                  include: [{ model: Variation, as: 'variation' }]
                }
              ]
            },
            { model: ProductItemImage, as: 'productItemImage' }
          ]
        },
        { model: Store, as: 'store', where: { status: StoreStatus.APPROVED } },
        { model: Category, as: 'category' }
      ],
      attributes: ['id', 'name', 'description']
    })
  }

  async findProductVariationsByUuid(uuid: string) {
    return Product.findOne({
      where: {
        [Op.and]: [{ uuid }, { status: ProductStatus.ACTIVE }]
      },
      attributes: ['id'],
      include: [
        {
          model: Variation,
          as: 'variations',
          attributes: ['id', 'uuid', 'productId', 'name'],
          include: [
            {
              model: VariationOption,
              as: 'options',
              attributes: ['id', 'variationId', 'value', 'sortOrder']
            }
          ]
        }
      ]
    })
  }

  async findAllProducts() {
    return Product.findAll({
      include: [{ model: ProductItem, as: 'items' }]
    })
  }

  async findStoreByUuid(uuid: string) {
    return Store.findOne({
      where: { uuid },
      include: [
        {
          model: Product,
          as: 'products',
          include: [
            {
              model: ProductItem,
              as: 'items',
              include: [{ model: ProductItemImage, as: 'productItemImage' }]
            },
            { model: Category, as: 'category' },
            { model: ProductImage, as: 'images' }
          ]
        }
      ]
    })
  }
}

export const productRepository = new ProductRepository()
