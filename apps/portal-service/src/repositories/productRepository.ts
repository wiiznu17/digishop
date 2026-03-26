import { Category, Product, ProductConfiguration, ProductImage, ProductItem, ProductItemImage, ProductReqStatus, Store, Variation, VariationOption } from "@digishop/db";
import { Op, col, fn, where as sqWhere, WhereOptions, Order, OrderItem as SeqOrderItem } from "sequelize";

export class ProductRepository {
  async collectCategoryDescendantIds(rootUuid: string): Promise<number[]> {
    const cats = await Category.findAll({
      attributes: ["id", "uuid", "parentId"],
      order: [["name", "ASC"]]
    });
    const byUuid = new Map(cats.map(c => [c.uuid, c]));
    const byParent = new Map<number | null, number[]>();
    for (const c of cats) {
      const arr = byParent.get(c.parentId ?? null) ?? [];
      arr.push(c.id);
      byParent.set(c.parentId ?? null, arr);
    }
  
    const root = byUuid.get(rootUuid);
    if (!root) return [];
  
    const result: number[] = [];
    const q: number[] = [root.id];
    while (q.length) {
      const cur = q.shift()!;
      result.push(cur);
      const children = byParent.get(cur) ?? [];
      q.push(...children);
    }
    return result;
  }

  async findAndCountProducts(
    whereProduct: WhereOptions,
    include: any[],
    having: any | undefined,
    order: Order,
    group: any[],
    offset: number,
    limit: number,
    minPriceExpr: any,
    sumStockExpr: any
  ) {
    return Product.findAndCountAll({
      where: whereProduct,
      include,
      attributes: [
        "uuid",
        "name",
        "description",
        "status",
        "reqStatus",
        "rejectReason",
        "createdAt",
        "updatedAt",
        [minPriceExpr, "minPriceMinor"],
        [sumStockExpr, "totalStock"],
      ],
      group,
      having,
      order,
      offset,
      limit,
      distinct: true,
      subQuery: false,
    });
  }

  async suggestProducts(like: string) {
    return Store.findAll({
      where: sqWhere(col("store_name"), { [Op.like]: like }),
      attributes: ["uuid", ["store_name", "storeName"]],
      order: [["store_name", "ASC"]],
      limit: 8,
    });
  }

  async getProductDetail(uuid: string) {
    return Product.findOne({
      where: { uuid },
      attributes: ["uuid", "name", "description", "status", "reqStatus", "rejectReason", "createdAt", "updatedAt"],
      include: [
        { model: Store, as: "store", attributes: ["uuid", ["store_name","storeName"], "email", "status"], required: false },
        { model: Category, as: "category", attributes: ["uuid", "name"], required: false },
        {
          model: ProductImage,
          as: "images",
          separate: true,
          attributes: ["uuid","url","fileName","isMain","sortOrder","createdAt"],
          order: [["sortOrder","ASC"],["createdAt","ASC"]],
        },
        {
          model: Variation,
          as: "variations",
          attributes: ["id","uuid","name","createdAt","updatedAt"],
          include: [
            { model: VariationOption, as: "options", attributes: ["id","uuid","value","sortOrder","createdAt","updatedAt"] }
          ]
        },
        {
          model: ProductItem,
          as: "items",
          attributes: ["id","uuid","sku","stockQuantity","priceMinor","isEnable","createdAt","updatedAt"],
          include: [
            { model: ProductItemImage, as: "productItemImage", attributes: ["uuid","url","fileName"], required: false },
            {
              model: ProductConfiguration,
              as: "configurations",
              attributes: ["id","uuid"],
              include: [
                {
                  model: VariationOption,
                  as: "variationOption",
                  attributes: ["id","uuid","value","sortOrder","variationId"],
                  include: [{ model: Variation, as: "variation", attributes: ["id","uuid","name"] }]
                }
              ]
            }
          ]
        }
      ]
    });
  }

  async findProductForUpdate(uuid: string, t: any) {
    return Product.findOne({ where: { uuid }, transaction: t, lock: t.LOCK.UPDATE });
  }

  async bulkModerateProducts(productUuids: string[], payload: any, t: any) {
    return Product.update(
      payload,
      { where: { uuid: { [Op.in]: productUuids } }, transaction: t }
    );
  }

  async listCategories() {
    return Category.findAll({
      attributes: ["id", "uuid", "name", "parentId"],
      include: [{ model: Category, as: "parent", attributes: ["uuid"], required: false }],
      order: [["name", "ASC"]],
    });
  }
}

export const productRepository = new ProductRepository();
