import {
  Category,
  Product,
  ProductConfiguration,
  ProductImage,
  ProductItem,
  ProductItemImage,
  ProductStatus,
  Store,
  Variation,
  VariationOption
} from '@digishop/db'
import {
  ProductAttributes,
  ProductCreationAttributes
} from '@digishop/db/src/models/Product'
import {
  col,
  fn,
  literal,
  Op,
  type Order,
  type OrderItem,
  type Transaction,
  where as sqWhere
} from 'sequelize'
import { ProductListQuery, ProductWithRelations } from '../types/product.types'

export class ProductRepository {
  async findStoreByUserId(userId: number) {
    return Store.findOne({ where: { userId } })
  }

  async mapCategoryUuid(
    uuid?: string | null,
    transaction?: Transaction
  ): Promise<number | null> {
    if (!uuid) return null
    const category = await Category.findOne({ where: { uuid }, transaction })
    return category ? category.id : null
  }

  async findProductByPk(productId: number, transaction?: Transaction) {
    return Product.findByPk(productId, { transaction })
  }

  async createProduct(
    payload: ProductCreationAttributes,
    transaction: Transaction
  ) {
    return Product.create(payload, { transaction })
  }

  async findProductForUpdate(
    productUuid: string,
    storeId: number,
    transaction: Transaction
  ) {
    return Product.findOne({
      where: { uuid: productUuid, storeId },
      transaction,
      lock: transaction.LOCK.UPDATE
    })
  }

  async updateProduct(
    product: Product,
    payload: Partial<ProductAttributes>,
    transaction: Transaction
  ) {
    return product.update(payload, { transaction })
  }

  async findProductByUuidForStore(
    productUuid: string,
    storeId: number,
    transaction?: Transaction
  ) {
    return Product.findOne({
      where: { uuid: productUuid, storeId },
      transaction
    })
  }

  async findItemByUuidForProduct(
    itemUuid: string,
    productId: number,
    transaction?: Transaction
  ) {
    return ProductItem.findOne({
      where: { uuid: itemUuid, productId },
      transaction
    })
  }

  async findProductImagesByProductId(
    productId: number,
    transaction?: Transaction,
    lockForUpdate = false
  ) {
    return ProductImage.findAll({
      where: { productId },
      transaction,
      ...(lockForUpdate && transaction ? { lock: transaction.LOCK.UPDATE } : {})
    })
  }

  async deleteProductImageById(imageId: number, transaction: Transaction) {
    return ProductImage.destroy({ where: { id: imageId }, transaction })
  }

  async createProductImage(
    payload: {
      productId: number
      url: string
      blobName: string
      fileName: string
      isMain: boolean
      sortOrder: number
    },
    transaction: Transaction
  ) {
    return ProductImage.create(payload, { transaction })
  }

  async updateProductImageByUuid(
    productId: number,
    imageUuid: string,
    payload: { sortOrder: number },
    transaction: Transaction
  ) {
    return ProductImage.update(payload, {
      where: { uuid: imageUuid, productId },
      transaction
    })
  }

  async clearMainProductImagesExcept(
    productId: number,
    imageUuid: string,
    transaction: Transaction
  ) {
    return ProductImage.update(
      { isMain: false },
      { where: { productId, uuid: { [Op.ne]: imageUuid } }, transaction }
    )
  }

  async setMainProductImage(
    productId: number,
    imageUuid: string,
    transaction: Transaction
  ) {
    return ProductImage.update(
      { isMain: true },
      { where: { productId, uuid: imageUuid }, transaction }
    )
  }

  async countMainProductImages(productId: number, transaction: Transaction) {
    return ProductImage.count({
      where: { productId, isMain: true },
      transaction
    })
  }

  async findFirstProductImage(productId: number, transaction: Transaction) {
    return ProductImage.findOne({
      where: { productId },
      order: [
        ['sortOrder', 'ASC'],
        ['createdAt', 'ASC']
      ],
      transaction,
      lock: transaction.LOCK.UPDATE
    })
  }

  async setProductImageMainById(imageId: number, transaction: Transaction) {
    return ProductImage.update(
      { isMain: true },
      { where: { id: imageId }, transaction }
    )
  }

  async findVariationsByProductId(
    productId: number,
    transaction?: Transaction,
    lockForUpdate = false
  ) {
    return Variation.findAll({
      where: { productId },
      include: [{ model: VariationOption, as: 'options' }],
      transaction,
      ...(lockForUpdate && transaction ? { lock: transaction.LOCK.UPDATE } : {})
    })
  }

  async deleteVariationById(variationId: number, transaction: Transaction) {
    return Variation.destroy({ where: { id: variationId }, transaction })
  }

  async findVariationByUuidForProduct(
    variationUuid: string,
    productId: number,
    transaction: Transaction
  ) {
    return Variation.findOne({
      where: { uuid: variationUuid, productId },
      transaction
    })
  }

  async createVariation(
    productId: number,
    name: string,
    transaction: Transaction
  ) {
    return Variation.create({ productId, name }, { transaction })
  }

  async updateVariationNameById(
    variationId: number,
    name: string,
    transaction: Transaction
  ) {
    return Variation.update(
      { name },
      { where: { id: variationId }, transaction }
    )
  }

  async findVariationOptionsByVariationId(
    variationId: number,
    transaction?: Transaction,
    lockForUpdate = false
  ) {
    return VariationOption.findAll({
      where: { variationId },
      transaction,
      ...(lockForUpdate && transaction ? { lock: transaction.LOCK.UPDATE } : {})
    })
  }

  async deleteVariationOptionById(optionId: number, transaction: Transaction) {
    return VariationOption.destroy({ where: { id: optionId }, transaction })
  }

  async findVariationOptionByUuidForVariation(
    optionUuid: string,
    variationId: number,
    transaction: Transaction
  ) {
    return VariationOption.findOne({
      where: { uuid: optionUuid, variationId },
      transaction
    })
  }

  async updateVariationOptionById(
    optionId: number,
    payload: { value?: string; sortOrder?: number },
    transaction: Transaction
  ) {
    return VariationOption.update(payload, {
      where: { id: optionId },
      transaction
    })
  }

  async createVariationOption(
    variationId: number,
    payload: { value: string; sortOrder: number },
    transaction: Transaction
  ) {
    return VariationOption.create({ variationId, ...payload }, { transaction })
  }

  async findFinalVariationsForCombo(
    productId: number,
    transaction: Transaction
  ) {
    return Variation.findAll({
      where: { productId },
      include: [
        {
          model: VariationOption,
          as: 'options',
          attributes: ['uuid', 'variationId', 'sortOrder']
        }
      ],
      transaction,
      lock: transaction.LOCK.UPDATE
    })
  }

  async findProductItemsByProductId(
    productId: number,
    transaction?: Transaction,
    lockForUpdate = false
  ) {
    return ProductItem.findAll({
      where: { productId },
      include: [
        { model: ProductItemImage, as: 'productItemImage' },
        {
          model: ProductConfiguration,
          as: 'configurations',
          include: [
            {
              model: VariationOption,
              as: 'variationOption',
              attributes: ['uuid', 'variationId']
            }
          ]
        }
      ],
      transaction,
      ...(lockForUpdate && transaction ? { lock: transaction.LOCK.UPDATE } : {})
    })
  }

  async deleteProductConfigurationsByItemId(
    productItemId: number,
    transaction: Transaction
  ) {
    return ProductConfiguration.destroy({
      where: { productItemId },
      transaction
    })
  }

  async deleteProductItemById(productItemId: number, transaction: Transaction) {
    return ProductItem.destroy({ where: { id: productItemId }, transaction })
  }

  async findProductItemByUuidForProduct(
    itemUuid: string,
    productId: number,
    transaction?: Transaction,
    lockForUpdate = false
  ) {
    return ProductItem.findOne({
      where: { uuid: itemUuid, productId },
      transaction,
      ...(lockForUpdate && transaction ? { lock: transaction.LOCK.UPDATE } : {})
    })
  }

  async findProductItemByIdForUpdate(id: number, transaction: Transaction) {
    return ProductItem.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE
    })
  }

  async createProductItem(
    payload: {
      productId: number
      sku: string
      priceMinor: number
      stockQuantity: number
      imageUrl: string | null
      isEnable: boolean
    },
    transaction: Transaction
  ) {
    return ProductItem.create(payload, { transaction })
  }

  async updateProductItemById(
    productItemId: number,
    payload: Partial<{
      sku: string
      priceMinor: number
      stockQuantity: number
      isEnable: boolean
      imageUrl: string | null
    }>,
    transaction?: Transaction
  ) {
    return ProductItem.update(payload, {
      where: { id: productItemId },
      transaction
    })
  }

  async incrementStock(
    productItemId: number,
    delta: number,
    transaction: Transaction
  ) {
    const item = await ProductItem.findByPk(productItemId, { transaction })
    if (!item) return
    if (delta > 0) {
      return item.increment('stockQuantity', { by: delta, transaction })
    } else if (delta < 0) {
      return item.decrement('stockQuantity', { by: Math.abs(delta), transaction })
    }
  }

  async findProductItemImageByProductItemId(
    productItemId: number,
    transaction: Transaction
  ) {
    return ProductItemImage.findOne({ where: { productItemId }, transaction })
  }

  async deleteProductItemImageById(
    productItemImageId: number,
    transaction: Transaction
  ) {
    return ProductItemImage.destroy({
      where: { id: productItemImageId },
      transaction
    })
  }

  async createProductItemImage(
    payload: {
      productItemId: number
      url: string
      blobName: string
      fileName: string
    },
    transaction: Transaction
  ) {
    return ProductItemImage.create(payload, { transaction })
  }

  async findVariationOptionsByUuidsForProduct(
    optionUuids: string[],
    productId: number,
    transaction: Transaction
  ) {
    return VariationOption.findAll({
      where: { uuid: optionUuids },
      include: [{ model: Variation, as: 'variation', where: { productId } }],
      transaction
    })
  }

  async findProductConfigurationsByItemId(
    productItemId: number,
    transaction: Transaction
  ) {
    return ProductConfiguration.findAll({
      where: { productItemId },
      transaction
    })
  }

  async createProductConfiguration(
    productItemId: number,
    variationOptionId: number,
    transaction: Transaction
  ) {
    return ProductConfiguration.create(
      { productItemId, variationOptionId },
      { transaction }
    )
  }

  async deleteProductConfigurationsByOptionIds(
    productItemId: number,
    optionIds: number[],
    transaction: Transaction
  ) {
    return ProductConfiguration.destroy({
      where: { productItemId, variationOptionId: optionIds },
      transaction
    })
  }

  async findProductDetailByUuid(productUuid: string) {
    return Product.findOne({
      where: { uuid: productUuid },
      attributes: [
        'uuid',
        'name',
        'description',
        'status',
        'reqStatus',
        'rejectReason',
        'createdAt',
        'updatedAt'
      ],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['uuid', 'name'],
          required: false
        },
        {
          model: ProductImage,
          as: 'images',
          separate: true,
          attributes: [
            'uuid',
            'url',
            'fileName',
            'isMain',
            'sortOrder',
            'createdAt'
          ],
          order: [
            ['sortOrder', 'ASC'],
            ['createdAt', 'ASC']
          ]
        },
        {
          model: Variation,
          as: 'variations',
          attributes: ['uuid', 'name', 'createdAt', 'updatedAt'],
          include: [
            {
              model: VariationOption,
              as: 'options',
              attributes: [
                'uuid',
                'value',
                'sortOrder',
                'createdAt',
                'updatedAt'
              ]
            }
          ]
        },
        {
          model: ProductItem,
          as: 'items',
          attributes: [
            'uuid',
            'sku',
            'stockQuantity',
            'priceMinor',
            'isEnable',
            'createdAt',
            'updatedAt'
          ],
          include: [
            {
              model: ProductItemImage,
              as: 'productItemImage',
              attributes: ['uuid', 'url', 'fileName'],
              required: false
            },
            {
              model: ProductConfiguration,
              as: 'configurations',
              attributes: ['uuid'],
              include: [
                {
                  model: VariationOption,
                  as: 'variationOption',
                  attributes: ['uuid', 'value', 'sortOrder', 'variationId']
                }
              ]
            }
          ]
        }
      ]
    })
  }

  async findProductDetailByUuidAndStore(productUuid: string, storeId: number) {
    return Product.findOne({
      where: { uuid: productUuid, storeId },
      attributes: [
        'uuid',
        'name',
        'description',
        'status',
        'reqStatus',
        'rejectReason',
        'createdAt',
        'updatedAt'
      ],
      include: [
        {
          model: Store,
          as: 'store',
          attributes: ['uuid', 'storeName', 'email', 'status'],
          required: false
        },
        {
          model: Category,
          as: 'category',
          attributes: ['uuid', 'name'],
          required: false
        },
        {
          model: ProductImage,
          as: 'images',
          separate: true,
          attributes: [
            'uuid',
            'url',
            'fileName',
            'isMain',
            'sortOrder',
            'createdAt'
          ],
          required: false,
          order: [
            ['sortOrder', 'ASC'],
            ['createdAt', 'ASC']
          ]
        },
        {
          model: Variation,
          as: 'variations',
          attributes: ['id', 'uuid', 'name', 'createdAt', 'updatedAt'],
          include: [
            {
              model: VariationOption,
              as: 'options',
              attributes: [
                'id',
                'uuid',
                'sortOrder',
                'value',
                'createdAt',
                'updatedAt'
              ]
            }
          ]
        },
        {
          model: ProductItem,
          as: 'items',
          attributes: [
            'id',
            'uuid',
            'sku',
            'stockQuantity',
            'priceMinor',
            'isEnable',
            'createdAt',
            'updatedAt'
          ],
          include: [
            {
              model: ProductItemImage,
              as: 'productItemImage',
              attributes: ['uuid', 'url', 'fileName'],
              required: false
            },
            {
              model: ProductConfiguration,
              as: 'configurations',
              attributes: ['id', 'uuid'],
              include: [
                {
                  model: VariationOption,
                  as: 'variationOption',
                  attributes: [
                    'id',
                    'uuid',
                    'value',
                    'sortOrder',
                    'variationId'
                  ],
                  include: [
                    {
                      model: Variation,
                      as: 'variation',
                      attributes: ['id', 'uuid', 'name']
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    })
  }

  async findProductsForSuggestion(storeId: number, like: string) {
    return Product.findAll({
      where: {
        storeId,
        [Op.or]: [
          { name: { [Op.like]: like } },
          { description: { [Op.like]: like } }
        ]
      },
      attributes: ['id', 'uuid', 'name'],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['name'],
          required: false
        }
      ],
      order: [['updatedAt', 'DESC']],
      limit: 8
    })
  }

  async findSkuRowsForSuggestion(storeId: number, like: string) {
    return ProductItem.findAll({
      where: { sku: { [Op.like]: like } },
      attributes: ['id', 'sku', 'productId'],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'uuid', 'name'],
          where: { storeId },
          required: true
        }
      ],
      order: [['sku', 'ASC']],
      limit: 8
    })
  }

  async findMainImagesByProductIds(productIds: number[]) {
    return ProductImage.findAll({
      where: { productId: productIds, isMain: true },
      attributes: ['productId', 'url', 'sortOrder', 'createdAt'],
      order: [
        ['sortOrder', 'ASC'],
        ['createdAt', 'ASC']
      ]
    })
  }

  async findProductsList(storeId: number, params: ProductListQuery) {
    const {
      q,
      categoryUuid,
      status,
      reqStatus,
      sortBy = 'createdAt',
      sortDir = 'desc',
      inStock,
      page,
      pageSize
    } = params

    const offset = (page - 1) * pageSize
    const limit = pageSize

    const whereProduct: Record<string | symbol, unknown> = { storeId }
    const orConds: unknown[] = []

    if (q && q.trim()) {
      const like = `%${q.trim()}%`
      orConds.push({ name: { [Op.like]: like } })
      orConds.push({ description: { [Op.like]: like } })
      orConds.push(sqWhere(col('items.sku'), { [Op.like]: like }))
    }

    if (orConds.length) whereProduct[Op.or] = orConds
    if (status) whereProduct.status = status
    if (reqStatus) whereProduct.reqStatus = reqStatus

    const include: Array<Record<string, unknown>> = []

    if (categoryUuid) {
      include.push({
        model: Category,
        as: 'category',
        attributes: ['id', 'uuid', 'name'],
        where: { uuid: categoryUuid },
        required: true
      })
    } else {
      include.push({
        model: Category,
        as: 'category',
        attributes: ['id', 'uuid', 'name'],
        required: false
      })
    }

    include.push({
      model: ProductImage,
      as: 'images',
      separate: true,
      attributes: [
        'uuid',
        'url',
        'fileName',
        'isMain',
        'sortOrder',
        'createdAt'
      ],
      where: { isMain: true },
      required: false,
      limit: 1,
      order: [
        ['sortOrder', 'ASC'],
        ['createdAt', 'ASC']
      ]
    })

    include.push({
      model: ProductItem,
      as: 'items',
      attributes: [],
      required: false,
      where: { isEnable: true }
    })

    const sumStockExpr = fn(
      'COALESCE',
      fn('SUM', col('items.stock_quantity')),
      0
    )
    const minPriceExpr = fn('MIN', col('items.price_minor'))

    const productImageCountExpr = literal(
      '(SELECT COUNT(*) ' +
        'FROM PRODUCT_IMAGES pi ' +
        'WHERE pi.product_id = `Product`.`id` ' +
        'AND pi.deleted_at IS NULL)'
    )

    const itemImageCountExpr = literal(
      '(SELECT COUNT(*) ' +
        'FROM PRODUCT_ITEM_IMAGES pii ' +
        'JOIN PRODUCT_ITEMS pit ON pit.id = pii.product_item_id ' +
        'WHERE pit.product_id = `Product`.`id` ' +
        'AND pii.deleted_at IS NULL ' +
        'AND pit.deleted_at IS NULL)'
    )

    const totalImageCountExpr = literal(
      '(' +
        '(SELECT COUNT(*) FROM PRODUCT_IMAGES pi ' +
        'WHERE pi.product_id = `Product`.`id` ' +
        'AND pi.deleted_at IS NULL) ' +
        '+ ' +
        '(SELECT COUNT(*) FROM PRODUCT_ITEM_IMAGES pii ' +
        'JOIN PRODUCT_ITEMS pit ON pit.id = pii.product_item_id ' +
        'WHERE pit.product_id = `Product`.`id` ' +
        'AND pii.deleted_at IS NULL ' +
        'AND pit.deleted_at IS NULL)' +
        ')'
    )

    let having: unknown
    if (inStock === 'true') having = sqWhere(sumStockExpr, { [Op.gt]: 0 })
    if (inStock === 'false') having = sqWhere(sumStockExpr, { [Op.eq]: 0 })

    const sortable = new Set(['createdAt', 'updatedAt', 'name', 'price'])
    const orderCol = sortable.has(sortBy) ? sortBy : 'createdAt'
    const orderDir: 'ASC' | 'DESC' =
      String(sortDir).toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
    const defaultOrder: OrderItem = [orderCol, orderDir]
    const priceOrder: OrderItem = [col('minPriceMinor'), orderDir]
    const order: Order = [orderCol === 'price' ? priceOrder : defaultOrder]

    const group = [
      col('Product.id'),
      col('category.id'),
      col('category.uuid'),
      col('category.name')
    ]

    const { rows, count } = await Product.findAndCountAll({
      where: whereProduct,
      include: include as any,
      attributes: [
        'uuid',
        'name',
        'description',
        'categoryId',
        'status',
        'reqStatus',
        'rejectReason',
        'createdAt',
        'updatedAt',
        [minPriceExpr, 'minPriceMinor'],
        [sumStockExpr, 'totalStock'],
        [productImageCountExpr, 'productImageCount'],
        [itemImageCountExpr, 'itemImageCount'],
        [totalImageCountExpr, 'totalImageCount']
      ],
      group,
      having: having as any,
      order,
      offset,
      limit,
      distinct: true,
      subQuery: false
    })

    const total = Array.isArray(count) ? count.length : (count as number)

    return {
      rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }

  async findAllCategories() {
    return Category.findAll({
      attributes: ['id', 'uuid', 'name', 'parentId'],
      include: [
        { model: Category, as: 'parent', attributes: ['uuid'], required: false }
      ],
      order: [['name', 'ASC']]
    })
  }

  async findProductForDelete(
    productUuid: string,
    storeId: number,
    transaction: Transaction
  ) {
    return Product.findOne({
      where: { uuid: productUuid, storeId },
      include: [
        { model: ProductImage, as: 'images', attributes: ['blobName'] },
        {
          model: ProductItem,
          as: 'items',
          attributes: ['id'],
          include: [
            {
              model: ProductItemImage,
              as: 'productItemImage',
              attributes: ['blobName'],
              required: false
            }
          ]
        }
      ],
      transaction,
      lock: transaction.LOCK.UPDATE
    })
  }

  async destroyProduct(product: Product, transaction: Transaction) {
    return product.destroy({ transaction })
  }

  async bulkUpdateProductStatus(
    productUuids: string[],
    status: ProductStatus,
    storeId: number
  ) {
    return Product.update(
      { status },
      { where: { uuid: { [Op.in]: productUuids }, storeId } }
    )
  }

  async findProductsForBulkDelete(
    productUuids: string[],
    storeId: number,
    transaction: Transaction
  ) {
    return Product.findAll({
      where: { uuid: { [Op.in]: productUuids }, storeId },
      include: [{ model: ProductImage, as: 'images' }],
      transaction
    })
  }

  async destroyProductsForBulkDelete(
    productUuids: string[],
    storeId: number,
    transaction: Transaction
  ) {
    return Product.destroy({
      where: { uuid: { [Op.in]: productUuids }, storeId },
      transaction
    })
  }

  async findProductWithRelationsByUuidForStore(
    productUuid: string,
    storeId: number,
    transaction: Transaction
  ): Promise<ProductWithRelations | null> {
    const src = await Product.findOne({
      where: { uuid: productUuid, storeId },
      include: [
        { model: ProductImage, as: 'images' },
        {
          model: Variation,
          as: 'variations',
          include: [{ model: VariationOption, as: 'options' }]
        },
        {
          model: ProductItem,
          as: 'items',
          include: [{ model: ProductConfiguration, as: 'configurations' }]
        }
      ],
      transaction,
      lock: true
    })

    return src as ProductWithRelations | null
  }
}

export const productRepository = new ProductRepository()
