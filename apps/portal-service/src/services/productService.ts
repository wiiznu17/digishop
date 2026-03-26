import { ProductReqStatus, Category, Store, ProductImage, ProductItem, sequelize } from "@digishop/db";
import { Op, col, fn, where as sqWhere, Order, OrderItem as SeqOrderItem } from "sequelize";
import { AppError, BadRequestError, NotFoundError } from "../errors/AppError";
import { productRepository } from "../repositories/productRepository";

const asInt = (v: any, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : d;
};

const LIKE = (raw: string) => `%${raw.replace(/[%_]/g, "\\$&")}%`;

function toReqStatus(v: unknown): ProductReqStatus | null {
  if (v === "APPROVED") return ProductReqStatus.APPROVED;
  if (v === "REJECT") return ProductReqStatus.REJECT;
  return null;
}

export class ProductService {
  async listProducts(params: Record<string, string | undefined>) {
    const {
      q,
      categoryUuid,
      reqStatus,
      status,
      sortBy = "createdAt",
      sortDir = "desc",
      inStock: inStockParam
    } = params;

    const page = Math.max(asInt(params.page, 1), 1);
    const pageSize = Math.min(Math.max(asInt(params.pageSize, 20), 1), 100);
    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    const whereProduct: any = {};
    if (status) whereProduct.status = status;
    if (reqStatus) whereProduct.reqStatus = reqStatus;

    const include: any[] = [];
    include.push({
      model: Store,
      as: "store",
      attributes: ["id", "uuid", ["store_name", "storeName"], "email", "status"],
      required: false,
    });
    include.push({
      model: Category,
      as: "category",
      attributes: ["id", "uuid", "name"],
      required: false,
    });
    include.push({
      model: ProductImage,
      as: "images",
      separate: true,
      attributes: ["uuid", "url", "fileName", "isMain", "sortOrder", "createdAt"],
      where: { isMain: true },
      required: false,
      limit: 1,
      order: [
        ["sortOrder", "ASC"],
        ["createdAt", "ASC"],
      ],
    });
    include.push({
      model: ProductItem,
      as: "items",
      attributes: [],
      required: false,
      where: { isEnable: true },
    });

    if (q && q.trim()) {
      const like = LIKE(q.trim());
      whereProduct[Op.and] = [
        sqWhere(col("store.store_name"), { [Op.like]: like }),
      ];
    }

    const sumStockExpr = fn("COALESCE", fn("SUM", col("items.stock_quantity")), 0);
    const minPriceExpr = fn("MIN", col("items.price_minor"));

    if (categoryUuid) {
      const ids = await productRepository.collectCategoryDescendantIds(categoryUuid);
      if (ids.length === 0) {
        return {
          data: [],
          meta: { page, pageSize, total: 0, totalPages: 0 }
        };
      }
      whereProduct.categoryId = { [Op.in]: ids };
    }

    let having: any | undefined;
    if (inStockParam === "true")  having = sqWhere(sumStockExpr, { [Op.gt]: 0 });
    if (inStockParam === "false") having = sqWhere(sumStockExpr, { [Op.eq]: 0 });

    const sortable = new Set(["createdAt", "updatedAt", "name", "price"]);
    const orderCol = sortable.has(sortBy) ? (sortBy as string) : "createdAt";
    const orderDir: "ASC" | "DESC" = String(sortDir).toUpperCase() === "ASC" ? "ASC" : "DESC";
    const defaultOrder: SeqOrderItem = [orderCol, orderDir];
    const priceOrder: SeqOrderItem = [col("minPriceMinor") as unknown as string, orderDir];
    const order: Order = [orderCol === "price" ? priceOrder : defaultOrder];

    const group = [
      col("Product.id"),
      col("category.id"),
      col("category.uuid"),
      col("category.name"),
      col("store.id"),
      col("store.uuid"),
      col("store.store_name"),
      col("store.email"),
      col("store.status"),
    ];

    const { rows, count } = await productRepository.findAndCountProducts(
      whereProduct, include, having, order, group, offset, limit, minPriceExpr, sumStockExpr
    );

    const total = Array.isArray(count) ? count.length : (count as number);
    return {
      data: rows,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async suggestProducts(q: string) {
    const raw = String(q ?? "").trim();
    if (raw.length < 1) return { products: [] };

    const like = LIKE(raw);
    const stores = await productRepository.suggestProducts(like);

    const products = stores.map((s: any) => ({
      uuid: s.uuid,
      name: s.get("storeName") as string,
      imageUrl: null,
      categoryName: null,
      storeName: s.get("storeName") as string,
    }));

    return { products };
  }

  async getProductDetail(uuid: string) {
    const product = await productRepository.getProductDetail(uuid);
    if (!product) throw new NotFoundError("Product not found");
    return product;
  }

  async moderateProduct(uuid: string, rawReqStatus: any, rejectReason: string | null | undefined) {
    const t = await sequelize.transaction();
    try {
      const reqStatusEnum = toReqStatus(rawReqStatus);
      if (!reqStatusEnum) {
        throw new BadRequestError("Invalid reqStatus");
      }

      const trimmedReason = String(rejectReason ?? "").trim();
      if (reqStatusEnum === ProductReqStatus.REJECT && !trimmedReason) {
        throw new BadRequestError("rejectReason is required when REJECT");
      }

      const p: any = await productRepository.findProductForUpdate(uuid, t);
      if (!p) {
        throw new NotFoundError("Product not found");
      }
      
      if (p.reqStatus !== ProductReqStatus.PENDING) {
        throw new BadRequestError("Only PENDING can be moderated");
      }

      p.set({
        reqStatus: reqStatusEnum,
        rejectReason: reqStatusEnum === ProductReqStatus.REJECT ? trimmedReason : null,
      });
      await p.save({ transaction: t });

      await t.commit();
      return { ok: true };
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  async bulkModerateProducts(productUuids: string[], rawReqStatus: any, rejectReason: string | null | undefined) {
    const t = await sequelize.transaction();
    try {
      if (!Array.isArray(productUuids) || productUuids.length === 0) {
        throw new BadRequestError("productUuids required");
      }

      const reqStatusEnum = toReqStatus(rawReqStatus);
      if (!reqStatusEnum) {
        throw new BadRequestError("Invalid reqStatus");
      }

      const trimmedReason = String(rejectReason ?? "").trim();
      if (reqStatusEnum === ProductReqStatus.REJECT && !trimmedReason) {
        throw new BadRequestError("rejectReason is required when REJECT");
      }

      const payload = {
        reqStatus: reqStatusEnum,
        rejectReason: reqStatusEnum === ProductReqStatus.REJECT ? trimmedReason : null,
      };

      const [affected] = await productRepository.bulkModerateProducts(productUuids, payload, t);

      await t.commit();
      return { ok: true, updated: affected };
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  async listCategories(mode: "flat" | "tree") {
    const rows = await productRepository.listCategories();

    if (mode === "flat") {
      const data = rows.map((r: any) => ({
        uuid: r.uuid,
        name: r.name,
        parentUuid: r.parent?.uuid ?? null,
      }));
      return { data, meta: { total: data.length } };
    }

    const nodes = rows.map((r: any) => ({
      uuid: r.uuid,
      name: r.name,
      parentUuid: r.parent?.uuid ?? null,
      children: [] as any[],
    }));
    const byUuid = new Map(nodes.map((n) => [n.uuid, n]));
    const roots: any[] = [];
    for (const n of nodes) {
      if (n.parentUuid && byUuid.get(n.parentUuid)) {
        byUuid.get(n.parentUuid)!.children.push(n);
      } else roots.push(n);
    }
    return { data: roots };
  }
}

export const productService = new ProductService();
