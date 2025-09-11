import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/middleware";
import { Op, sequelize } from "@digishop/db/src/db";
import { col, fn, Op as SQ, where as sqWhere, type Order, type OrderItem } from "sequelize";
import { azureBlobService } from "../helpers/azureBlobService";

import { Product } from "@digishop/db/src/models/Product";
import { ProductImage } from "@digishop/db/src/models/ProductImage";
import { Store } from "@digishop/db/src/models/Store";
import { Category } from "@digishop/db/src/models/Category";
import { Variation } from "@digishop/db/src/models/Variation";
import { VariationOption } from "@digishop/db/src/models/VariationOption";
import { ProductItem } from "@digishop/db/src/models/ProductItem";
import { ProductConfiguration } from "@digishop/db/src/models/ProductConfiguration";
import { ProductStatus } from "@digishop/db/src/types/enum";

/** Helpers */
const ensureStore = async (req: AuthenticatedRequest) => {
  const store = await Store.findOne({ where: { userId: req.user?.sub } });
  return store;
};
const findProductByUuidForStore = async (uuid: string, storeId: number) => {
  return Product.findOne({ where: { uuid, storeId } });
};
const findVariationByUuidForProduct = async (variationUuid: string, productId: number) => {
  return Variation.findOne({ where: { uuid: variationUuid, productId } });
};
const findOptionByUuidForProduct = async (optionUuid: string, productId: number) => {
  return VariationOption.findOne({
    where: { uuid: optionUuid },
    include: [{ model: Variation, as: "variation", attributes: ["id", "productId"], where: { productId } }],
  });
};
const findItemByUuidForProduct = async (itemUuid: string, productId: number) => {
  return ProductItem.findOne({ where: { uuid: itemUuid, productId } });
};

// GET /merchant/products/suggest?q=...
export const suggestProducts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const store = await ensureStore(req);
    if (!store) return res.status(404).json({ error: "No store found" });

    const raw = String(req.query.q ?? "").trim();
    // 1) limit ความยาวขั้นต่ำ (ช่วยให้พิมพ์ลื่นขึ้น)
    if (raw.length < 1 ) {
      return res.json({ products: [], skus: [] });
    }

    // 2) กัน wildcard ทะลุ
    const safeQ = raw.replace(/[%_]/g, "\\$&");
    const like = `%${safeQ}%`;

    // ---------- A) Product name/description ----------
    const productRows = await Product.findAll({
      where: {
        storeId: store.id,
        [Op.or]: [
          { name: { [Op.like]: like } },
          { description: { [Op.like]: like } },
        ],
      },
      attributes: ["id", "uuid", "name"], // ต้องเอา id ไว้ไปดึงรูป batch
      include: [
        { model: Category, as: "category", attributes: ["name"], required: false },
      ],
      order: [["updatedAt", "DESC"]],
      limit: 8,
    });

    // ---------- B) SKU ----------
    const skuRows = await ProductItem.findAll({
      where: { sku: { [Op.like]: like } },
      attributes: ["id", "sku", "productId"],
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["id", "uuid", "name"],
          where: { storeId: store.id },
          required: true,
        },
      ],
      order: [["sku", "ASC"]],
      limit: 8,
    });

    // ---------- C) ดึง main images แบบ batch ----------
    const productIds = Array.from(new Set<number>([
      ...productRows.map(p => p.id),
      ...skuRows.map(r => (r as any).product?.id).filter((x: unknown): x is number => typeof x === "number"),
    ]));

    let imageMap = new Map<number, string>();
    if (productIds.length > 0) {
      const mainImages = await ProductImage.findAll({
        where: { productId: productIds, isMain: true },
        attributes: ["productId", "url", "sortOrder", "createdAt"],
        order: [
          ["sortOrder", "ASC"],
          ["createdAt", "ASC"],
        ],
      });
      imageMap = new Map(mainImages.map(img => [img.productId, img.url]));
    }

    // ---------- D) shape response ----------
    const productSuggestions = productRows.map(p => ({
      uuid: p.uuid,
      name: p.name,
      imageUrl: imageMap.get(p.id) ?? null,
      categoryName: (p as any).category?.name ?? null,
    }));

    const skuSuggestions = skuRows.map(it => {
      const prod = (it as any).product;
      const pid = prod?.id as number | undefined;
      return {
        sku: it.sku,
        productUuid: prod?.uuid ?? null,
        productName: prod?.name ?? null,
        imageUrl: pid ? imageMap.get(pid) ?? null : null,
      };
    });

    return res.json({ products: productSuggestions, skus: skuSuggestions });
  } catch (e) {
    console.error("suggestProducts error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/** GET /merchant/products/list */
export const getProductList = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // 1) ตรวจร้านของ merchant
    const store = await Store.findOne({ where: { userId: req.user?.sub } });
    if (!store) return res.status(404).json({ error: "No store found for this merchant" });

    // 2) รับพารามิเตอร์ (ไม่ตั้ง default เป็น true เพื่อให้ 'All' เป็นค่าเริ่มต้น)
    const {
      q,
      categoryUuid,
      status,
      sortBy = "createdAt",
      sortDir = "desc",
    } = req.query as Record<string, string | undefined>;
    const inStockParam = req.query.inStock as string | undefined; // "true" | "false" | undefined

    const page = Math.max(parseInt(String(req.query.page ?? "1"), 10) || 1, 1);
    const pageSizeRaw = Math.max(parseInt(String(req.query.pageSize ?? "20"), 10) || 20, 1);
    const pageSize = Math.min(pageSizeRaw, 100);
    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    // 3) WHERE(Product)
    const whereProduct: any = { storeId: store.id };
    const orConds: any[] = [];
    if (q && q.trim()) {
      const like = `%${q.trim()}%`;
      orConds.push({ name: { [Op.like]: like } });
      orConds.push({ description: { [Op.like]: like } });
      // ให้ค้น SKU ด้วย (ผ่าน include: items)
      orConds.push(sqWhere(col("items.sku"), { [Op.like]: like }));
    }
    if (orConds.length) whereProduct[Op.or] = orConds;
    if (status) whereProduct.status = status;

    // 4) include
    const include: any[] = [];

    // 4.1 category (optional filter)
    if (categoryUuid) {
      include.push({
        model: Category,
        as: "category",
        attributes: ["id", "uuid", "name"],
        where: { uuid: categoryUuid },
        required: true,
      });
    } else {
      include.push({
        model: Category,
        as: "category",
        attributes: ["id", "uuid", "name"],
        required: false,
      });
    }

    // 4.2 main image (1 รูปหลัก)
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

    // 4.3 items (เพื่อ aggregate และค้น SKU)
    include.push({
      model: ProductItem,
      as: "items",
      attributes: [],   // ไม่ดึงคอลัมน์ดิบ ลดซ้ำ
      required: false,  // left join
    });

    // 5) ฟิลด์คำนวณจาก ProductItems (ไม่ใช้ของ Product)
    const sumStockExpr = fn("COALESCE", fn("SUM", col("items.stock_quantity")), 0);
    const minPriceExpr = fn("MIN", col("items.price_minor"));

    // 6) HAVING filter เมื่อส่ง inStock มาเท่านั้น
    let having: any | undefined;
    if (inStockParam === "true")  having = sqWhere(sumStockExpr, { [Op.gt]: 0 });
    if (inStockParam === "false") having = sqWhere(sumStockExpr, { [Op.eq]: 0 });

    // 7) ORDER
    const sortable = new Set(["createdAt", "updatedAt", "name", "price"]);
    const orderCol = sortable.has(sortBy) ? (sortBy as string) : "createdAt";
    const orderDir: "ASC" | "DESC" = String(sortDir).toUpperCase() === "ASC" ? "ASC" : "DESC";
    const defaultOrder: OrderItem = [orderCol, orderDir];
    const priceOrder: OrderItem = [col("minPriceMinor"), orderDir];
    const order: Order = [orderCol === "price" ? priceOrder : defaultOrder];

    // 8) GROUP BY (กัน ONLY_FULL_GROUP_BY)
    const group = [
      col("Product.id"),
      col("category.id"),
      col("category.uuid"),
      col("category.name"),
    ];

    // 9) คิวรี
    const { rows, count } = await Product.findAndCountAll({
      where: whereProduct,
      include,
      attributes: [
        "uuid",
        "name",
        "description",
        "categoryId",
        "status",
        "createdAt",
        "updatedAt",
        [minPriceExpr, "minPriceMinor"], // ราคาต่ำสุดจาก items
        [sumStockExpr, "totalStock"],    // ยอดสต็อกรวมจาก items
        
      ],
      group,
      having,
      order,
      offset,
      limit,
      distinct: true,
      subQuery: false,
    });

    const total = Array.isArray(count) ? count.length : (count as number);

    return res.json({
      data: rows,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
};


/** GET /merchant/products/:productUuid */
export const getProductDetail = async (req: AuthenticatedRequest, res: Response) => {
  console.log("Welcome to product detail")
  try {
    const { productUuid } = req.params as { productUuid: string };
    const store = await ensureStore(req);
    if (!store) return res.status(404).json({ error: "No store found for this merchant" });

    const product = await Product.findOne({
      where: { uuid: productUuid, storeId: store.id },
      attributes: ["uuid", "name", "description", "status", "createdAt", "updatedAt"],
      include: [
        { model: Store, as: "store", attributes: ["uuid", "storeName", "email", "status"], required: false },
        { model: Category, as: "category", attributes: ["uuid", "name"], required: false },
        {
          model: ProductImage,
          as: "images",
          separate: true,
          attributes: ["uuid", "url", "fileName", "isMain", "sortOrder", "createdAt"],
          required: false,
          order: [
            ["sortOrder", "ASC"],
            ["createdAt", "ASC"],
          ],
        },
        {
          model: Variation,
          as: "variations",
          attributes: ["id", "uuid", "name", "createdAt", "updatedAt"],
          include: [{ model: VariationOption, as: "options", attributes: ["id", "uuid", "value", "createdAt", "updatedAt"] }],
        },
        {
          model: ProductItem,
          as: "items",
          attributes: ["id", "uuid", "sku", "stockQuantity", "priceMinor", "imageUrl", "createdAt", "updatedAt"],
          include: [
            {
              model: ProductConfiguration,
              as: "configurations",
              attributes: ["id", "uuid"],
              include: [
                {
                  model: VariationOption,
                  as: "variationOption",
                  attributes: ["id", "uuid", "value", "variationId"],
                  include: [{ model: Variation, as: "variation", attributes: ["id", "uuid", "name"] }],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!product) return res.status(404).json({ error: "Product not found" });
    return res.json(product);
  } catch (err) {
    console.error("getProductDetail error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
/** GET /merchant/products/categories?flat=true|false (default true) */
export const listCategories = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { flat = "true" } = (req.query ?? {}) as { flat?: string };

    const rows = await Category.findAll({
      attributes: ["id", "uuid", "name", "parentId"],
      include: [{ model: Category, as: "parent", attributes: ["uuid"], required: false }],
      order: [["name", "ASC"]],
    });
    // console.log("categories: ", rows)
    // flat list (ใช้งานง่ายกับ Select)
    if (flat === "true") {
      const data = rows.map((r) => ({
        uuid: r.uuid,
        name: r.name,
        parentUuid: (r as any).parent?.uuid ?? null,
      }));
      console.log("Flat data: ", data)
      return res.json(data);
    }

    // optional: tree
    const nodes = rows.map((r) => ({
      uuid: r.uuid,
      name: r.name,
      parentUuid: (r as any).parent?.uuid ?? null,
      children: [] as any[],
    }));
    const byUuid = new Map(nodes.map((n) => [n.uuid, n]));
    const roots: any[] = [];
    for (const n of nodes) {
      if (n.parentUuid && byUuid.get(n.parentUuid)) {
        byUuid.get(n.parentUuid)!.children.push(n);
      } else {
        roots.push(n);
      }
    }
    return res.json(roots);
  } catch (e) {
    console.error("listCategories error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/** POST /merchant/products */
export const createProduct = async (req: AuthenticatedRequest, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const productDataString = req.body.productData;
    console.log("Product data: ", productDataString)
    const files = req.files as Express.Multer.File[];
    if (!productDataString) {
      return res.status(400).json({ error: "Product data is required" });
    }

    const raw = JSON.parse(productDataString) as {
      name: string;
      description?: string | null;
      status?: string;
      categoryId?: number | null;
      categoryUuid?: string;
      // priceMinor?: number | null;
      // price?: number | null;
      // stockQuantity?: number | null;
      expectedSkuCount?: number; // validate sku
    };

    console.group("raw data: ", raw)
    const store = await ensureStore(req);
    if (!store) {
      await t.rollback();
      return res.status(404).json({ error: "Store not found for this merchant" });
    }
    // --- SKU validation: ต้องมีอย่างน้อย 1 SKU ---
    const expectedSkuCount = Number(raw.expectedSkuCount ?? 0);
    if (!Number.isFinite(expectedSkuCount) || expectedSkuCount < 1) {
      await t.rollback();
      return res.status(400).json({
        error: "At least one SKU is required. Please add at least 1 variation and 1 option to generate a SKU.",
      });
    }

    // --- map categoryUuid -> categoryId (ถ้ามี) ---
    let resolvedCategoryId: number | null = raw.categoryId ?? null;
    if (!resolvedCategoryId && raw.categoryUuid) {
      const cat = await Category.findOne({ where: { uuid: raw.categoryUuid } });
      if (!cat) {
        await t.rollback();
        return res.status(400).json({ error: "Invalid categoryUuid" });
      }
      resolvedCategoryId = cat.id;
    }

    // ตรวจค่า status ให้อยู่ใน enum (fallback เป็น Suspended) ---
    const statusSafe =
      Object.values(ProductStatus).includes((raw.status as ProductStatus) ?? ("" as ProductStatus))
        ? (raw.status as ProductStatus)
        : ProductStatus.SUSPENDED;

    // รองรับ input ได้ทั้ง priceMinor และ price (ถือว่าเป็น minor unit เหมือนกัน) ---
    // const priceMinor =
    //   typeof raw.priceMinor === "number"
    //     ? raw.priceMinor
    //     // : typeof raw.price === "number"
    //     // ? raw.price
    //     : null;

    // --- สร้าง payload โดยไม่ใส่ categoryId ถ้ายังเป็น null (แก้ TS error) ---
    const createPayload: any = {
      storeId: store.id,
      name: raw.name,
      description: raw.description ?? null,
      // priceMinor,                     // เก็บไว้ตามที่ต้องการ
      // stockQuantity: raw.stockQuantity ?? null,
      status: statusSafe,
    };
    console.log("created Payload: ", createPayload)
    if (resolvedCategoryId != null) {
      createPayload.categoryId = resolvedCategoryId; // ใส่เฉพาะตอนที่เป็น number
    }

    const newProduct = await Product.create(createPayload, { transaction: t });

    // --- อัปโหลดรูป (ถ้ามี) ---
    let createdImages: ProductImage[] = [];
    if (files && files.length > 0) {
      const tasks = files.map(async (file, index) => {
        const { url, blobName } = await azureBlobService.uploadImage(file, `products/${newProduct.uuid}`);
        return ProductImage.create(
          {
            productId: newProduct.id,
            url,
            blobName,
            fileName: file.originalname,
            isMain: index === 0,
            sortOrder: index,
          },
          { transaction: t }
        );
      });
      createdImages = await Promise.all(tasks);

      // ensure main
      const hasMainNow = createdImages.some((i) => i.isMain);
      if (!hasMainNow && createdImages[0]) {
        await createdImages[0].update({ isMain: true }, { transaction: t });
      }
    }

    await t.commit();

    // --- คืนค่าให้ FE: ใช้ priceMinor ให้ตรง schema ปัจจุบัน ---
    const complete = await Product.findOne({
      where: { uuid: newProduct.uuid },
      attributes: [
        "uuid",
        "name",
        "description",
        // "priceMinor",          // "price" มาเป็น "priceMinor"
        "categoryId",
        // "stockQuantity",
        "status",
        "createdAt",
        "updatedAt",
      ],
      include: [
        {
          model: ProductImage,
          as: "images",
          separate: true,
          attributes: ["uuid", "url", "fileName", "isMain", "sortOrder", "createdAt"],
          order: [
            ["sortOrder", "ASC"],
            ["createdAt", "ASC"],
          ],
        },
      ],
    });

    return res.status(201).json(complete);
  } catch (error) {
    await t.rollback();
    console.error("createProduct error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/** PUT /merchant/products/:productUuid */
export const updateProduct = async (req: AuthenticatedRequest, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const { productUuid } = req.params as { productUuid: string };
    const files = req.files as Express.Multer.File[];
    const productDataString = req.body.productData;
    if (!productDataString) return res.status(400).json({ error: "Product data is required" });
    const data = JSON.parse(productDataString);

    const store = await ensureStore(req);
    if (!store) {
      await t.rollback();
      return res.status(404).json({ error: "No store found" });
    }

    const product = await Product.findOne({ where: { uuid: productUuid, storeId: store.id }, include: [{ model: ProductImage, as: "images" }] });
    if (!product) {
      await t.rollback();
      return res.status(404).json({ error: "Product not found" });
    }

    await product.update(data, { transaction: t });

    if (files && files.length > 0) {
      const existing = product.images?.length ?? 0;
      const tasks = files.map(async (file, index) => {
        const { url, blobName } = await azureBlobService.uploadImage(file, `products/${product.uuid}`);
        return ProductImage.create(
          {
            productId: product.id,
            url,
            blobName,
            fileName: file.originalname,
            isMain: existing === 0 && index === 0,
            sortOrder: existing + index,
          },
          { transaction: t }
        );
      });
      const created = await Promise.all(tasks);

      // ถ้าไม่มีรูปไหนเป็น main หลังอัปโหลดรอบนี้ ให้ตั้งรูปแรกของรอบนี้เป็น main
      const hadMainBefore = (product.images ?? []).some(i => i.isMain);
      const hasMainNow = hadMainBefore || created.some(i => i.isMain);
      if (!hasMainNow && created[0]) {
        await created[0].update({ isMain: true }, { transaction: t });
      }
    }

    await t.commit();

    const updated = await Product.findOne({
      where: { uuid: productUuid },
      attributes: ["uuid", "name", "description", "price", "categoryId", "stockQuantity", "status", "createdAt", "updatedAt"],
      include: [
        {
          model: ProductImage,
          as: "images",
          separate: true,
          attributes: ["uuid", "url", "fileName", "isMain", "sortOrder", "createdAt"],
          order: [
            ["sortOrder", "ASC"],
            ["createdAt", "ASC"],
          ],
        },
      ],
    });

    return res.json(updated);
  } catch (error) {
    await t.rollback();
    console.error("updateProduct error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/** DELETE /merchant/products/:productUuid */
export const deleteProduct = async (req: AuthenticatedRequest, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const { productUuid } = req.params as { productUuid: string };
    const store = await ensureStore(req);
    if (!store) {
      await t.rollback();
      return res.status(404).json({ error: "No store found" });
    }
    const product = await Product.findOne({ where: { uuid: productUuid, storeId: store.id }, include: [{ model: ProductImage, as: "images" }] });
    if (!product) {
      await t.rollback();
      return res.status(404).json({ error: "Product not found" });
    }

    if (product.images?.length) {
      const blobNames = product.images.map((img) => img.blobName);
      await azureBlobService.deleteMultipleImages(blobNames);
    }
    await product.destroy({ transaction: t });
    await t.commit();
    return res.status(204).send();
  } catch (error) {
    await t.rollback();
    console.error("deleteProduct error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/** POST /merchant/products/:productUuid/images (upload more) */
export const addProductImages = async (req: AuthenticatedRequest, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const { productUuid } = req.params as { productUuid: string };
    const files = req.files as Express.Multer.File[];

    const store = await ensureStore(req);
    if (!store) {
      await t.rollback();
      return res.status(404).json({ error: "No store found" });
    }
    const product = await Product.findOne({ where: { uuid: productUuid, storeId: store.id }, include: [{ model: ProductImage, as: "images" }] });
    if (!product) {
      await t.rollback();
      return res.status(404).json({ error: "Product not found" });
    }

    const existingCount = product.images?.length ?? 0;
    const created = await Promise.all(
      (files || []).map(async (file, index) => {
        const { url, blobName } = await azureBlobService.uploadImage(file, `products/${product.uuid}`);
        return ProductImage.create(
          {
            productId: product.id,
            url,
            blobName,
            fileName: file.originalname,
            isMain: existingCount === 0 && index === 0,
            sortOrder: existingCount + index,
          },
          { transaction: t }
        );
      })
    );

    // ถ้าไม่มีรูปไหนเป็น main ทั้งก่อนหน้าและรอบนี้ => ตั้งรูปแรกของรอบนี้ให้เป็น main
    const hadMainBefore = (product.images ?? []).some(i => i.isMain);
    const hasMainNow = hadMainBefore || created.some(i => i.isMain);
    if (!hasMainNow && created[0]) {
      await created[0].update({ isMain: true }, { transaction: t });
    }

    await t.commit();
    return res.status(201).json(created);
  } catch (error) {
    await t.rollback();
    console.error("addProductImages error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/** DELETE /merchant/products/:productUuid/images/:imageUuid */
export const deleteProductImage = async (req: AuthenticatedRequest, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const { productUuid, imageUuid } = req.params as { productUuid: string; imageUuid: string };
    const store = await ensureStore(req);
    if (!store) {
      await t.rollback();
      return res.status(404).json({ error: "No store found" });
    }
    const product = await Product.findOne({ where: { uuid: productUuid, storeId: store.id } });
    if (!product) {
      await t.rollback();
      return res.status(404).json({ error: "Product not found" });
    }

    const productImage = await ProductImage.findOne({ where: { uuid: imageUuid, productId: product.id } });
    if (!productImage) {
      await t.rollback();
      return res.status(404).json({ error: "Product image not found" });
    }

    await azureBlobService.deleteImage(productImage.blobName);

    if (productImage.isMain) {
      const nextMain = await ProductImage.findOne({
        where: { productId: product.id, uuid: { [Op.ne]: imageUuid } },
        order: [
          ["sortOrder", "ASC"],
          ["createdAt", "ASC"],
        ],
      });
      if (nextMain) await nextMain.update({ isMain: true }, { transaction: t });
    }

    await productImage.destroy({ transaction: t });
    await t.commit();
    return res.status(204).send();
  } catch (error) {
    await t.rollback();
    console.error("deleteProductImage error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/** PATCH /merchant/products/:productUuid/images/:imageUuid */
export const updateProductImage = async (req: AuthenticatedRequest, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const { productUuid, imageUuid } = req.params as { productUuid: string; imageUuid: string };
    const { isMain, sortOrder } = req.body as { isMain?: boolean; sortOrder?: number };

    const store = await ensureStore(req);
    if (!store) {
      await t.rollback();
      return res.status(404).json({ error: "No store found" });
    }
    const product = await Product.findOne({ where: { uuid: productUuid, storeId: store.id } });
    if (!product) {
      await t.rollback();
      return res.status(404).json({ error: "Product not found" });
    }

    const productImage = await ProductImage.findOne({ where: { uuid: imageUuid, productId: product.id } });
    if (!productImage) {
      await t.rollback();
      return res.status(404).json({ error: "Product image not found" });
    }

    if (isMain === true) {
      await ProductImage.update({ isMain: false }, { where: { productId: product.id, uuid: { [Op.ne]: imageUuid } }, transaction: t });
    }

    await productImage.update({ isMain, sortOrder }, { transaction: t });
    await t.commit();

    return res.json({
      uuid: productImage.uuid,
      url: productImage.url,
      fileName: productImage.fileName,
      isMain: productImage.isMain,
      sortOrder: productImage.sortOrder,
    });
  } catch (error) {
    await t.rollback();
    console.error("updateProductImage error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/** PATCH /merchant/products/:productUuid/images/reorder */
export const reorderProductImages = async (req: AuthenticatedRequest, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const { productUuid } = req.params as { productUuid: string };
    const { orders } = req.body as { orders: Array<{ imageUuid: string; sortOrder: number }> };

    const store = await ensureStore(req);
    if (!store) {
      await t.rollback();
      return res.status(404).json({ error: "No store found" });
    }
    const product = await Product.findOne({ where: { uuid: productUuid, storeId: store.id } });
    if (!product) {
      await t.rollback();
      return res.status(404).json({ error: "Product not found" });
    }

    for (const it of orders || []) {
      await ProductImage.update({ sortOrder: it.sortOrder }, { where: { uuid: it.imageUuid, productId: product.id }, transaction: t });
    }
    await t.commit();
    return res.status(200).json({ updated: orders?.length || 0 });
  } catch (error) {
    await t.rollback();
    console.error("reorderProductImages error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/** PATCH /merchant/products/bulk/status */
export const bulkUpdateProductStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { productUuids, status } = req.body as { productUuids: string[]; status: string };
  if (!Array.isArray(productUuids) || !productUuids.length) return res.status(400).json({ error: "productUuids required" });
  const store = await ensureStore(req);
  if (!store) return res.status(404).json({ error: "No store found" });

  if (!Object.values(ProductStatus).includes(status as ProductStatus)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  const [affected] = await Product.update(
    { status: status as ProductStatus },
    { where: { uuid: { [Op.in]: productUuids }, storeId: store.id } } // ✅ Op.in
  );
  return res.json({ updated: affected });
};

/** DELETE /merchant/products/bulk */
export const bulkDeleteProducts = async (req: AuthenticatedRequest, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const { productUuids } = req.body as { productUuids: string[] };
    if (!Array.isArray(productUuids) || !productUuids.length) {
      await t.rollback();
      return res.status(400).json({ error: "productUuids required" });
    }
    const store = await ensureStore(req);
    if (!store) {
      await t.rollback();
      return res.status(404).json({ error: "No store found" });
    }

    const products = await Product.findAll({
      where: { uuid: { [Op.in]: productUuids }, storeId: store.id },
      include: [{ model: ProductImage, as: "images" }],
      transaction: t,
    });
    const blobs = products.flatMap((p) => (p.images ?? []).map((img) => img.blobName));
    if (blobs.length) await azureBlobService.deleteMultipleImages(blobs);
    await Product.destroy({ where: { uuid: { [Op.in]: productUuids }, storeId: store.id }, transaction: t }); // ✅ Op.in
    await t.commit();
    return res.status(204).send();
  } catch (e) {
    await t.rollback();
    console.error("bulkDeleteProducts error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/** POST /merchant/products/:productUuid/duplicate */
type ProductWithRelations = Product & {
  images?: ProductImage[];
  variations?: (Variation & { options?: VariationOption[] })[];
  items?: (ProductItem & { configurations?: ProductConfiguration[] })[];
};

export const duplicateProduct = async (req: AuthenticatedRequest, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const { productUuid } = req.params as { productUuid: string };

    const store = await ensureStore(req);
    if (!store) {
      await t.rollback();
      return res.status(404).json({ error: "No store found" });
    }

    const src = await Product.findOne({
      where: { uuid: productUuid, storeId: store.id },
      include: [
        { model: ProductImage, as: "images" },
        { model: Variation, as: "variations", include: [{ model: VariationOption, as: "options" }] },
        { model: ProductItem, as: "items", include: [{ model: ProductConfiguration, as: "configurations" }] },
      ],
      transaction: t,
      lock: true,
    });

    if (!src) {
      await t.rollback();
      return res.status(404).json({ error: "Product not found" });
    }

    const product = src as ProductWithRelations;

    // ใช้ฟิลด์อื่นเหมือนเดิม และ "ไม่ยุ่งกับ price_minor ของ Product" (price_minor อยู่ใน ProductItem)
    const dest = await Product.create(
      {
        storeId: store.id,
        categoryId: src.categoryId,
        name: `${src.name} (Copy)`,
        description: src.description ?? null,
        // priceMinor: (src as any).priceMinor ?? null,   // base price ถ้ามี (ไม่ยุ่งกับ price_minor)
        // stockQuantity: src.stockQuantity ?? null,
        status: src.status,
      },
      { transaction: t }
    );

    if (product.images?.length) {
      await ProductImage.bulkCreate(
        product.images.map((img, i) => ({
          productId: dest.id,
          url: img.url,
          blobName: img.blobName,
          fileName: img.fileName,
          isMain: img.isMain,
          sortOrder: i,
        })),
        { transaction: t }
      );

      const hasMain = (product.images ?? []).some((x) => !!x.isMain);
      if (!hasMain && (product.images?.length ?? 0) > 0) {
        const first = await ProductImage.findOne({
          where: { productId: dest.id },
          order: [
            ["sortOrder", "ASC"],
            ["createdAt", "ASC"],
          ],
          transaction: t,
          lock: true,
        });
        if (first) await first.update({ isMain: true }, { transaction: t });
      }
    }

    const optionIdMap = new Map<number, number>();
    if (product.variations?.length) {
      for (const v of product.variations) {
        const nv = await Variation.create({ productId: dest.id, name: v.name }, { transaction: t });
        for (const opt of v.options ?? []) {
          const no = await VariationOption.create(
            { variationId: nv.id, value: opt.value, sortOrder: (opt as any).sortOrder ?? 0 },
            { transaction: t }
          );
          optionIdMap.set(opt.id, no.id);
        }
      }
    }

    if (product.items?.length) {
      for (const it of product.items) {
        const ni = await ProductItem.create(
          {
            productId: dest.id,
            sku: it.sku ? `${it.sku}-COPY` : `SKU-${dest.id}-${Date.now().toString(36)}`,
            stockQuantity: it.stockQuantity,
            priceMinor: it.priceMinor, // ✅ ใช้ price_minor ถูกที่คือใน SKU
            imageUrl: it.imageUrl ?? null,
          },
          { transaction: t }
        );

        for (const conf of it.configurations ?? []) {
          const newOptionId = optionIdMap.get(conf.variationOptionId);
          if (newOptionId) {
            await ProductConfiguration.create(
              { productItemId: ni.id, variationOptionId: newOptionId },
              { transaction: t }
            );
          }
        }
      }
    }

    await t.commit();

    const result = await Product.findOne({
      where: { id: dest.id },
      attributes: ["uuid", "name"],
    });

    return res.status(201).json(result);
  } catch (e) {
    await t.rollback();
    console.error("duplicateProduct error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/** POST /merchant/products/:productUuid/variations */
export const createVariation = async (req: AuthenticatedRequest, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const { productUuid } = req.params as { productUuid: string };
    const { name } = req.body as { name: string };
    const store = await ensureStore(req);
    if (!store) return res.status(404).json({ error: "No store found" });

    const product = await findProductByUuidForStore(productUuid, store.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const v = await Variation.create({ productId: product.id, name }, { transaction: t });
    await t.commit();
    return res.status(201).json({ uuid: v.uuid, name: v.name });
  } catch (e) {
    await t.rollback();
    console.error("createVariation error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/** PUT /merchant/products/:productUuid/variations/:variationUuid */
export const updateVariation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productUuid, variationUuid } = req.params as { productUuid: string; variationUuid: string };
    const { name } = req.body as { name: string };
    const store = await ensureStore(req);
    if (!store) return res.status(404).json({ error: "No store found" });

    const product = await findProductByUuidForStore(productUuid, store.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const variation = await findVariationByUuidForProduct(variationUuid, product.id);
    if (!variation) return res.status(404).json({ error: "Variation not found" });

    await variation.update({ name });
    return res.json({ uuid: variation.uuid, name: variation.name });
  } catch (e) {
    console.error("updateVariation error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/** DELETE /merchant/products/:productUuid/variations/:variationUuid */
export const deleteVariation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productUuid, variationUuid } = req.params as { productUuid: string; variationUuid: string };
    const store = await ensureStore(req);
    if (!store) return res.status(404).json({ error: "No store found" });

    const product = await findProductByUuidForStore(productUuid, store.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const variation = await findVariationByUuidForProduct(variationUuid, product.id);
    if (!variation) return res.status(404).json({ error: "Variation not found" });

    await variation.destroy();
    return res.status(204).send();
  } catch (e) {
    console.error("deleteVariation error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/** POST /merchant/products/:productUuid/variations/:variationUuid/options */
export const createVariationOption = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productUuid, variationUuid } = req.params as { productUuid: string; variationUuid: string };
    const { value, sortOrder = 0 } = req.body as { value: string; sortOrder?: number };

    const store = await ensureStore(req);
    if (!store) return res.status(404).json({ error: "No store found" });
    const product = await findProductByUuidForStore(productUuid, store.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    const variation = await findVariationByUuidForProduct(variationUuid, product.id);
    if (!variation) return res.status(404).json({ error: "Variation not found" });

    const opt = await VariationOption.create({ variationId: variation.id, value, sortOrder });
    return res.status(201).json({ uuid: opt.uuid, value: opt.value, sortOrder: opt.sortOrder });
  } catch (e) {
    console.error("createVariationOption error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/** PUT /merchant/products/:productUuid/variations/:variationUuid/options/:optionUuid */
export const updateVariationOption = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productUuid, variationUuid, optionUuid } = req.params as {
      productUuid: string;
      variationUuid: string;
      optionUuid: string;
    };
    const { value, sortOrder } = req.body as { value?: string; sortOrder?: number };

    const store = await ensureStore(req);
    if (!store) return res.status(404).json({ error: "No store found" });
    const product = await findProductByUuidForStore(productUuid, store.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    const variation = await findVariationByUuidForProduct(variationUuid, product.id);
    if (!variation) return res.status(404).json({ error: "Variation not found" });

    const option = await VariationOption.findOne({ where: { uuid: optionUuid, variationId: variation.id } });
    if (!option) return res.status(404).json({ error: "Option not found" });

    await option.update({ value, sortOrder });
    return res.json({ uuid: option.uuid, value: option.value, sortOrder: option.sortOrder });
  } catch (e) {
    console.error("updateVariationOption error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/** DELETE /merchant/products/:productUuid/variations/:variationUuid/options/:optionUuid */
export const deleteVariationOption = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productUuid, variationUuid, optionUuid } = req.params as {
      productUuid: string;
      variationUuid: string;
      optionUuid: string;
    };

    const store = await ensureStore(req);
    if (!store) return res.status(404).json({ error: "No store found" });
    const product = await findProductByUuidForStore(productUuid, store.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    const variation = await findVariationByUuidForProduct(variationUuid, product.id);
    if (!variation) return res.status(404).json({ error: "Variation not found" });

    const option = await VariationOption.findOne({ where: { uuid: optionUuid, variationId: variation.id } });
    if (!option) return res.status(404).json({ error: "Option not found" });

    await option.destroy();
    return res.status(204).send();
  } catch (e) {
    console.error("deleteVariationOption error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/** PATCH /merchant/products/:productUuid/variations/:variationUuid/options/reorder */
export const reorderVariationOptions = async (req: AuthenticatedRequest, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const { productUuid, variationUuid } = req.params as { productUuid: string; variationUuid: string };
    const { orders } = req.body as { orders: Array<{ optionUuid: string; sortOrder: number }> };

    const store = await ensureStore(req);
    if (!store) {
      await t.rollback();
      return res.status(404).json({ error: "No store found" });
    }
    const product = await findProductByUuidForStore(productUuid, store.id);
    if (!product) {
      await t.rollback();
      return res.status(404).json({ error: "Product not found" });
    }
    const variation = await findVariationByUuidForProduct(variationUuid, product.id);
    if (!variation) {
      await t.rollback();
      return res.status(404).json({ error: "Variation not found" });
    }

    for (const it of orders || []) {
      await VariationOption.update({ sortOrder: it.sortOrder }, { where: { uuid: it.optionUuid, variationId: variation.id }, transaction: t });
    }
    await t.commit();
    return res.status(200).json({ updated: orders?.length || 0 });
  } catch (e) {
    await t.rollback();
    console.error("reorderVariationOptions error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/** POST /merchant/products/:productUuid/items */
export const createProductItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productUuid } = req.params as { productUuid: string };
    const { sku, stockQuantity = 0, priceMinor, imageUrl } = req.body as {
      sku?: string;
      stockQuantity?: number;
      priceMinor: number;
      imageUrl?: string | null;
    };

    const store = await ensureStore(req);
    if (!store) return res.status(404).json({ error: "No store found" });
    const product = await findProductByUuidForStore(productUuid, store.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const item = await ProductItem.create({ productId: product.id, sku: sku || "", stockQuantity, priceMinor, imageUrl: imageUrl ?? null });
    return res.status(201).json({
      uuid: item.uuid,
      sku: item.sku,
      stockQuantity: item.stockQuantity,
      priceMinor: item.priceMinor,
      imageUrl: item.imageUrl,
    });
  } catch (e) {
    console.error("createProductItem error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/** PUT /merchant/products/:productUuid/items/:itemUuid */
export const updateProductItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productUuid, itemUuid } = req.params as { productUuid: string; itemUuid: string };
    const store = await ensureStore(req);
    if (!store) return res.status(404).json({ error: "No store found" });
    const product = await findProductByUuidForStore(productUuid, store.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const item = await findItemByUuidForProduct(itemUuid, product.id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    const { sku, stockQuantity, priceMinor, imageUrl } = req.body as {
      sku?: string;
      stockQuantity?: number;
      priceMinor?: number;
      imageUrl?: string | null;
    };

    await item.update({ sku, stockQuantity, priceMinor, imageUrl });
    return res.json({
      uuid: item.uuid,
      sku: item.sku,
      stockQuantity: item.stockQuantity,
      priceMinor: item.priceMinor,
      imageUrl: item.imageUrl,
    });
  } catch (e) {
    console.error("updateProductItem error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/** DELETE /merchant/products/:productUuid/items/:itemUuid */
export const deleteProductItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productUuid, itemUuid } = req.params as { productUuid: string; itemUuid: string };
    const store = await ensureStore(req);
    if (!store) return res.status(404).json({ error: "No store found" });
    const product = await findProductByUuidForStore(productUuid, store.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const item = await findItemByUuidForProduct(itemUuid, product.id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    await item.destroy();
    return res.status(204).send();
  } catch (e) {
    console.error("deleteProductItem error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/** PUT /merchant/products/:productUuid/items/:itemUuid/configurations
 * body: { optionUuids: string[] }
 */
export const setItemConfigurations = async (req: AuthenticatedRequest, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const { productUuid, itemUuid } = req.params as { productUuid: string; itemUuid: string };
    const { optionUuids = [] } = req.body as { optionUuids: string[] };

    const store = await ensureStore(req);
    if (!store) {
      await t.rollback();
      return res.status(404).json({ error: "No store found" });
    }
    const product = await findProductByUuidForStore(productUuid, store.id);
    if (!product) {
      await t.rollback();
      return res.status(404).json({ error: "Product not found" });
    }
    const item = await findItemByUuidForProduct(itemUuid, product.id);
    if (!item) {
      await t.rollback();
      return res.status(404).json({ error: "Item not found" });
    }

    const opts = await VariationOption.findAll({
      where: { uuid: optionUuids },
      include: [{ model: Variation, as: "variation", where: { productId: product.id } }],
    });
    const allowedOptionIds = new Set(opts.map((o) => o.id));

    const existing = await ProductConfiguration.findAll({ where: { productItemId: item.id } });
    const existIds = new Set(existing.map((c) => c.variationOptionId));

    const targetIds = new Set<number>();
    for (const o of opts) targetIds.add(o.id);

    const toAdd = [...targetIds].filter((x) => !existIds.has(x));
    const toDel = [...existIds].filter((x) => !targetIds.has(x));

    for (const addId of toAdd) {
      if (allowedOptionIds.has(addId)) {
        await ProductConfiguration.create({ productItemId: item.id, variationOptionId: addId }, { transaction: t });
      }
    }
    if (toDel.length) {
      await ProductConfiguration.destroy({ where: { productItemId: item.id, variationOptionId: toDel }, transaction: t });
    }

    await t.commit();
    const configs = await ProductConfiguration.findAll({
      where: { productItemId: item.id },
      include: [{ model: VariationOption, as: "variationOption", attributes: ["uuid", "value"] }],
    });
    return res.json(configs);
  } catch (e) {
    await t.rollback();
    console.error("setItemConfigurations error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
};
