import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/middleware";
import { Op, sequelize } from "@digishop/db/src/db";
import { col, fn, literal, Op as SQ, where as sqWhere, type Order, type OrderItem } from "sequelize";
import { azureBlobService } from "../helpers/azureBlobService";

import { Product, ProductAttributes, ProductCreationAttributes } from "@digishop/db/src/models/Product";
import { ProductImage } from "@digishop/db/src/models/ProductImage";
import { Store } from "@digishop/db/src/models/Store";
import { Category } from "@digishop/db/src/models/Category";
import { Variation } from "@digishop/db/src/models/Variation";
import { VariationOption } from "@digishop/db/src/models/VariationOption";
import { ProductItem } from "@digishop/db/src/models/ProductItem";
import { ProductConfiguration } from "@digishop/db/src/models/ProductConfiguration";
import { ProductStatus } from "@digishop/db/src/types/enum";
import { ProductItemImage } from "@digishop/db/src/models/ProductItemImage";

/** Helpers */
// ===== helper types for desired state =====
type DS_ImageInput = {
  uuid?: string;                    // ของเดิมบนเซิร์ฟเวอร์
  uploadKey?: string;               // ไฟล์ใหม่: ใช้แมพกับชื่อไฟล์ "uploadKey__xxx.jpg"
  fileName?: string;                // ไว้ส่งกลับ/ดีบัก
  isMain?: boolean;
  sortOrder: number;
};

type DS_VariationOption = {
  uuid?: string;                    // เดิม
  clientId?: string;                // ฝั่ง FE ใช้ชั่วคราว
  value: string;
  sortOrder: number;
};

type DS_Variation = {
  uuid?: string;
  clientId?: string;
  name: string;
  options: DS_VariationOption[];
};

type DS_ItemImage = {
  uuid?: string;                    // ถ้าจะคงรูปเดิม
  uploadKey?: string;               // ถ้าเปลี่ยน/ใส่รูปใหม่
  remove?: boolean;                 // ถ้าต้องการลบรูปเดิม
};

type DS_Item = {
  uuid?: string;                    // ถ้าเป็นของเดิม
  clientKey?: string;               // ไว้ดีบัก/แมพฝั่ง FE (ไม่จำเป็นต้อง uniq ฝั่ง BE)
  sku?: string;
  priceMinor: number;
  stockQuantity: number;
  isEnable: boolean;
  optionRefs: string[];             // เรียงตามลำดับ variation; ใส่ได้ทั้ง option.uuid หรือ option.clientId
  image?: DS_ItemImage | null;      // null = ไม่แตะ, {remove:true}=ลบ, {uploadKey}=อัปใหม่, {uuid}=คงเดิม
};

type DS_Payload = {
  ifMatchUpdatedAt?: string | null; // concurrency (เฉพาะ PUT)
  product: {
    name: string;
    description?: string | null;
    status: string;
    categoryUuid?: string | null;
  };
  images: { product: DS_ImageInput[] };
  variations: DS_Variation[];
  items: DS_Item[];
};

// ===== internal helpers =====

const findProductByUuidForStore = async (uuid: string, storeId: number) => {
  return Product.findOne({ where: { uuid, storeId } });
};

const findItemByUuidForProduct = async (itemUuid: string, productId: number) => {
  return ProductItem.findOne({ where: { uuid: itemUuid, productId } });
};

const pickUploadBlobByKey = (
  files: Express.Multer.File[] | undefined,
  uploadKey?: string | null
) => {
  if (!files?.length || !uploadKey) return undefined;
  // ตั้งชื่อไฟล์จาก FE เป็น `${uploadKey}__original.ext`
  return files.find((f) => String(f.originalname || "").startsWith(`${uploadKey}__`));
};

const ensureMainImage = async (productId: number, t: any) => {
  const hasMain = await ProductImage.count({ where: { productId, isMain: true }, transaction: t });
  if (!hasMain) {
    const first = await ProductImage.findOne({
      where: { productId },
      order: [
        ["sortOrder", "ASC"],
        ["createdAt", "ASC"],
      ],
      transaction: t,
      lock: t.LOCK.UPDATE
    });
    if (first) await first.update({ isMain: true }, { transaction: t });
  }
};

const mapCategoryUuid = async (uuid?: string | null) => {
  if (!uuid) return null;
  const cat = await Category.findOne({ where: { uuid } });
  return cat ? cat.id : null;
};

/** แปลง string ที่มาจาก FE ให้เป็น ProductStatus; ถ้าไม่ตรง enum ให้ fallback */
const coerceStatus = (s?: string): ProductStatus => {
  const val = (s ?? "").toUpperCase();
  return (Object.values(ProductStatus) as string[]).includes(val)
    ? (val as ProductStatus)
    : ProductStatus.SUSPENDED; // หรือจะใช้ ACTIVE ก็ได้ตามที่ตกลง
};

// Create/Update main helper
async function applyDesiredState(opts: {
  req: AuthenticatedRequest;
  res: Response;
  mode: "create" | "update";
  productUuid?: string;
}) {
  const { req, res, mode, productUuid } = opts;
  const filesP = (req.files as any)?.productImages as Express.Multer.File[] | undefined;
  const filesI = (req.files as any)?.itemImages as Express.Multer.File[] | undefined;
  console.log("Poduct images: ", filesP)
  console.log("Poduct item images: ", filesI)
  
  const t = await sequelize.transaction();
  const uploadedBlobNames: string[] = []; // compensation on error

  try {
    const store = await ensureStore(req);
    if (!store) {
      await t.rollback();
      return res.status(404).json({ error: "No store found" });
    }

    const desiredRaw = (req.body?.desired ?? req.body?.payload ?? req.body?.productData) as string;
    if (!desiredRaw) {
      await t.rollback();
      return res.status(400).json({ error: "desired payload required" });
    }
    const desired = JSON.parse(desiredRaw) as DS_Payload;

    // ---------- 1) upsert product ----------
    let product: Product | null = null;

    if (mode === "create") {
      const categoryId = await mapCategoryUuid(desired.product.categoryUuid ?? null);
      if (!categoryId) {
        await t.rollback();
        return res.status(400).json({ error: "categoryUuid is required or invalid" });
      }
      const createPayload: ProductCreationAttributes = {
        storeId: store.id,
        name: desired.product.name,
        description: desired.product.description ?? null,
        status: coerceStatus(desired.product.status), // << แปลงให้เป็น enum
        categoryId: categoryId,
      };

      product = await Product.create(createPayload, { transaction: t });
    } else {
      product = await Product.findOne({
        where: { uuid: productUuid!, storeId: store.id },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!product) {
        await t.rollback();
        return res.status(404).json({ error: "Product not found" });
      }

      // concurrency
      if (desired.ifMatchUpdatedAt) {
        const cur = new Date(product.updatedAt).toISOString();
        if (cur !== new Date(desired.ifMatchUpdatedAt).toISOString()) {
          await t.rollback();
          return res.status(409).json({ error: "Conflict: product has been modified" });
        }
      }

      const categoryId = await mapCategoryUuid(desired.product.categoryUuid ?? null);

      const updatePayload: Partial<ProductAttributes> = {
        name: desired.product.name,
        description: desired.product.description ?? null,
        status: coerceStatus(desired.product.status), // << enum
        ...(categoryId != null ? { categoryId } : {}), // << ไม่ส่ง null
      };

      await product.update(updatePayload, { transaction: t });
    }

    // reload basic info id
    const productId = product!.id;

    // ---------- 2) product images (diff) ----------
    const currentImgs = await ProductImage.findAll({
      where: { productId },
      transaction: t,
      lock: t.LOCK.UPDATE
    });
    const keepUuidSet = new Set(
      desired.images.product
        .map((x) => x.uuid)
        .filter((x): x is string => !!x)
    );

    // 2.1 delete removed
    for (const img of currentImgs) {
      if (!keepUuidSet.has(img.uuid)) {
        await azureBlobService.deleteImage(img.blobName);
        await img.destroy({ transaction: t });
      }
    }
    
    console.log("filesP:", filesP?.map(f => f.originalname));
    console.log("desired product imgs:", desired.images.product);

    const missing = desired.images.product
      .filter(p => p.uploadKey && !pickUploadBlobByKey(filesP, p.uploadKey))
      .map(p => p.uploadKey);
    if (filesP?.length && missing.length) {
      console.warn("[product-images] files uploaded but uploadKey mismatch:", missing);
    }

    // 2.2 add new
    const createdImgByKey = new Map<string, ProductImage>();
    for (const p of desired.images.product) {
      if (p.uploadKey) {
        const f = pickUploadBlobByKey(filesP, p.uploadKey);
        if (!f) continue;
        const { url, blobName } = await azureBlobService.uploadImage(f, `products/${product!.uuid}`);
        uploadedBlobNames.push(blobName);
        const created = await ProductImage.create(
          {
            productId,
            url,
            blobName,
            fileName: f.originalname.split("__").slice(1).join("__") || f.originalname,
            isMain: !!p.isMain, // เดี๋ยว normalize อีกที
            sortOrder: p.sortOrder ?? 0,
          },
          { transaction: t }
        );
        createdImgByKey.set(p.uploadKey, created);
      }
    }

    // 2.3 reorder + main
    // แปลง desired -> records ที่เรามี uuid แน่ ๆ
    const recordsToOrder: Array<{ imageUuid: string; sortOrder: number; isMain?: boolean }> = [];
    let desiredMainUuid: string | undefined;

    for (const p of desired.images.product) {
      if (p.uuid) {
        recordsToOrder.push({ imageUuid: p.uuid, sortOrder: p.sortOrder, isMain: p.isMain });
        if (p.isMain) desiredMainUuid = p.uuid;
      } else if (p.uploadKey) {
        const rec = createdImgByKey.get(p.uploadKey);
        if (rec) {
          recordsToOrder.push({ imageUuid: rec.uuid, sortOrder: p.sortOrder, isMain: p.isMain });
          if (p.isMain) desiredMainUuid = rec.uuid;
        }
      }
    }

    for (const it of recordsToOrder) {
      await ProductImage.update(
        { sortOrder: it.sortOrder },
        { where: { uuid: it.imageUuid, productId }, transaction: t }
      );
    }

    if (desiredMainUuid) {
      await ProductImage.update(
        { isMain: false },
        { where: { productId, uuid: { [Op.ne]: desiredMainUuid } }, transaction: t }
      );
      await ProductImage.update(
        { isMain: true },
        { where: { productId, uuid: desiredMainUuid }, transaction: t }
      );
    }
    await ensureMainImage(productId, t);

    // ---------- 3) variations + options (diff) ----------
    const curVars = await Variation.findAll({
      where: { productId },
      include: [{ model: VariationOption, as: "options" }],
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    // ลบ variation ที่ไม่อยู่ใน desired
    const desiredVarUuidSet = new Set(
      desired.variations.map((v) => v.uuid).filter((x): x is string => !!x)
    );
    for (const v of curVars) {
      if (v.uuid && !desiredVarUuidSet.has(v.uuid)) {
        await Variation.destroy({ where: { id: v.id }, transaction: t });
      }
    }

    // สร้าง/อัปเดต variation & options + เก็บแมพ clientId->optionUuid
    const optionUuidByClientId = new Map<string, string>();

    for (const v of desired.variations) {
      let vRec: Variation | null = null;
      if (v.uuid) {
        vRec = await Variation.findOne({ where: { uuid: v.uuid, productId }, transaction: t });
        if (!vRec) continue;
        if (vRec.name !== v.name) await vRec.update({ name: v.name }, { transaction: t });
      } else {
        vRec = await Variation.create({ productId, name: v.name }, { transaction: t });
      }

      // options
      const curOpts = await VariationOption.findAll({
        where: { variationId: vRec.id },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      const desiredOptUuidSet = new Set(
        v.options.map((o) => o.uuid).filter((x): x is string => !!x)
      );
      for (const o of curOpts) {
        if (o.uuid && !desiredOptUuidSet.has(o.uuid)) {
          await o.destroy({ transaction: t });
        }
      }

      // upsert options + reorder
      for (const o of v.options) {
        if (o.uuid) {
          const rec = await VariationOption.findOne({
            where: { uuid: o.uuid, variationId: vRec.id },
            transaction: t
          });
          if (rec) {
            const willUpdate: any = {};
            if (rec.value !== o.value) willUpdate.value = o.value;
            if ((rec.sortOrder ?? 0) !== (o.sortOrder ?? 0)) willUpdate.sortOrder = o.sortOrder ?? 0;
            if (Object.keys(willUpdate).length) await rec.update(willUpdate, { transaction: t });
            if (o.clientId) optionUuidByClientId.set(o.clientId, rec.uuid);
          }
        } else {
          const created = await VariationOption.create(
            { variationId: vRec.id, value: o.value, sortOrder: o.sortOrder ?? 0 },
            { transaction: t }
          );
          if (o.clientId) optionUuidByClientId.set(o.clientId, created.uuid);
        }
      }
    }

    // หลังจาก upsert variations/options เสร็จแล้ว ให้โหลด variations+options "ตัวจริง" อีกรอบ
    const finalVars = await Variation.findAll({
      where: { productId },
      include: [{ model: VariationOption, as: "options", attributes: ["uuid", "variationId", "sortOrder"] }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    // ทำ map ลำดับ variation -> index (อ้างตาม order ของ desired.variations)
    const varIndexById = new Map<number, number>();
    {
      // จับคู่ตามชื่อ/uuid ที่เพิ่งอัปเดตมา โดยยึดลำดับของ desired.variations เป็นหลัก
      // ถ้าจับคู่ด้วย uuid ไม่ครบ ให้ fallback เป็นลำดับที่ query ได้
      const byName = new Map(finalVars.map(v => [v.name, v]));
      desired.variations.forEach((dv, idx) => {
        const match = (dv.uuid && finalVars.find(v => v.uuid === dv.uuid)) || byName.get(dv.name);
        if (match) varIndexById.set(match.id, idx);
      });
      // ใส่ที่ยังไม่มี index ต่อท้าย
      let cursor = desired.variations.length;
      for (const v of finalVars) {
        if (!varIndexById.has(v.id)) varIndexById.set(v.id, cursor++);
      }
    }

    // สร้างชุดคีย์คอมโบที่ "โครงสร้างใหม่" อนุญาต (cartesian product ของ option uuids)
    const cartesian = <T,>(arr: T[][]): T[][] =>
      arr.reduce<T[][]>((acc, cur) => acc.flatMap(a => cur.map(c => [...a, c])), [[]]);

    const optionUuidMatrix = finalVars
      .sort((a, b) => (varIndexById.get(a.id)! - varIndexById.get(b.id)!))
      .map(v => (v.options ?? [])
        .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((o: { uuid: any; }) => o.uuid));

    const allowedComboKeys = new Set<string>(
      (optionUuidMatrix.length === 0 || optionUuidMatrix.some(x => x.length === 0))
        ? [] // (จะไม่เกิดเพราะ validate ไปแล้ว)
        : cartesian(optionUuidMatrix).map(arr => arr.join("|"))
    );

    const itemComboKey = (it: ProductItem & { configurations?: (ProductConfiguration & { variationOption?: VariationOption })[] }) => {
      const pairs = (it.configurations ?? [])
        .map(c => ({
          variationId: c.variationOption?.variationId!,
          optionUuid: c.variationOption?.uuid!,
        }))
        .filter(p => !!p.variationId && !!p.optionUuid);

      const sorted = pairs.sort((a, b) => (varIndexById.get(a.variationId)! - varIndexById.get(b.variationId)!));
      return sorted.map(p => p.optionUuid).join("|");
    };

    // ---------- 4) items (diff) ----------
    const curItems = await ProductItem.findAll({
      where: { productId },
      include: [
        { model: ProductItemImage, as: "productItemImage" },
        {
          model: ProductConfiguration,
          as: "configurations",
          include: [{ model: VariationOption, as: "variationOption", attributes: ["uuid", "variationId"] }]
        }
      ],
      transaction: t,
      lock: t.LOCK.UPDATE
    });


    const desiredItemUuidSet = new Set(
      desired.items.map((it) => it.uuid).filter((x): x is string => !!x)
    );

    // 4.1 delete items that are gone (STRUCTURE-DRIVEN)
    for (const it of curItems) {
      const key = itemComboKey(it as any);
      if (!allowedComboKeys.has(key)) {
        // รูป (ถ้ามี)
        const oldImg = await ProductItemImage.findOne({ where: { productItemId: it.id }, transaction: t });
        if (oldImg) {
          await azureBlobService.deleteImage(oldImg.blobName);
          await oldImg.destroy({ transaction: t });
        }
        // configurations
        await ProductConfiguration.destroy({ where: { productItemId: it.id }, transaction: t });
        // item
        await it.destroy({ transaction: t });
      }
    }
    // NOTE: ถ้าโครงสร้างยังอนุญาต แต่ผู้ใช้ไม่ส่งแถว (omit) ⇒ **จะไม่ลบ**


    // 4.2 upsert items
    // variation >= 1
    if ((desired.variations?.length ?? 0) < 1) {
      await t.rollback();
      return res.status(400).json({ error: "At least one variation is required" });
    }
    // ทุก variation ต้องมี option อย่างน้อย 1
    for (const v of desired.variations) {
      if ((v.options?.length ?? 0) < 1) {
        await t.rollback();
        return res.status(400).json({ error: `Variation "${v.name}" must have at least 1 option` });
      }
    }
    // 4.2 upsert items
    for (const d of desired.items) {
      // --- SKU is REQUIRED when creating or updating ---
      const sku = (d.sku ?? "").trim();
      if (!d.uuid && !sku) {
        await t.rollback();
        return res.status(400).json({ error: `SKU is required (clientKey=${d.clientKey ?? "-"})` });
      }
      if (d.uuid && sku.length === 0) {
        // ถ้าอยากบังคับเสมอ ให้ error เช่นกัน
        await t.rollback();
        return res.status(400).json({ error: `SKU is required for item uuid=${d.uuid}` });
      }

      // resolve option uuids (เหมือนเดิม)
      const optionUuids: string[] = [];
      for (const ref of d.optionRefs) {
        if (!ref) continue;
        if (ref.length === 36 || ref.length === 32) optionUuids.push(ref);
        else if (optionUuidByClientId.has(ref)) optionUuids.push(optionUuidByClientId.get(ref)!);
      }

      let item: ProductItem | null = null;
      if (d.uuid) {
        item = await ProductItem.findOne({ where: { uuid: d.uuid, productId }, transaction: t });
        if (!item) continue;

        const willUpdate: any = {};
        // CHANGED: ไม่ใส่ || "" อีกต่อไป
        if ((item.sku || "") !== sku) willUpdate.sku = sku;
        if (item.priceMinor !== d.priceMinor) willUpdate.priceMinor = d.priceMinor;
        if (item.stockQuantity !== d.stockQuantity) willUpdate.stockQuantity = d.stockQuantity;
        if ((item as any).isEnable !== d.isEnable) willUpdate.isEnable = d.isEnable;
        if (Object.keys(willUpdate).length) await item.update(willUpdate, { transaction: t });
      } else {
        // CREATE: ต้องมี sku แล้ว (เช็คไว้ข้างบน)
        item = await ProductItem.create(
          {
            productId,
            sku, // ใช้ค่า FE เท่านั้น
            priceMinor: d.priceMinor,
            stockQuantity: d.stockQuantity,
            imageUrl: null,
            isEnable: d.isEnable
          },
          { transaction: t }
        );
      }

      // 4.2.1 image reconcile
      if (d.image) {
        const existing = await ProductItemImage.findOne({
          where: { productItemId: item.id },
          transaction: t
        });

        if (d.image.remove === true) {
          if (existing) {
            await azureBlobService.deleteImage(existing.blobName);
            await existing.destroy({ transaction: t });
          }
        } else if (d.image.uploadKey) {
          // replace with new file
          const f = pickUploadBlobByKey(filesI, d.image.uploadKey);
          if (f) {
            if (existing) {
              await azureBlobService.deleteImage(existing.blobName);
              await existing.destroy({ transaction: t });
            }
            const { url, blobName } = await azureBlobService.uploadImage(
              f,
              `products/${product!.uuid}/items/${item.uuid}`
            );
            uploadedBlobNames.push(blobName);
            await ProductItemImage.create(
              {
                productItemId: item.id,
                url,
                blobName,
                fileName: f.originalname.split("__").slice(1).join("__") || f.originalname
              },
              { transaction: t }
            );
          }
        }
        // d.image.uuid -> “คงเดิม” ไม่ต้องทำอะไร
      }

      // 4.2.2 configurations reconcile
      if (optionUuids.length) {
        const opts = await VariationOption.findAll({
          where: { uuid: optionUuids },
          include: [{ model: Variation, as: "variation", where: { productId } }],
          transaction: t
        });
        const allowedIds = new Set(opts.map((o) => o.id));

        const existing = await ProductConfiguration.findAll({
          where: { productItemId: item.id },
          transaction: t
        });
        const existIds = new Set(existing.map((c) => c.variationOptionId));

        const targetIds = new Set<number>(opts.map((o) => o.id));
        const toAdd = [...targetIds].filter((x) => !existIds.has(x));
        const toDel = [...existIds].filter((x) => !targetIds.has(x));

        for (const addId of toAdd) {
          if (allowedIds.has(addId)) {
            await ProductConfiguration.create(
              { productItemId: item.id, variationOptionId: addId },
              { transaction: t }
            );
          }
        }
        if (toDel.length) {
          await ProductConfiguration.destroy({
            where: { productItemId: item.id, variationOptionId: toDel },
            transaction: t
          });
        }
      }
    }

    await t.commit();

    // ---------- 5) return fresh detail ----------
    const detail = await Product.findOne({
      where: { uuid: product!.uuid },
      attributes: ["uuid", "name", "description", "status", "createdAt", "updatedAt"],
      include: [
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
          attributes: ["uuid","name","createdAt","updatedAt"],
          include: [
            { model: VariationOption, as: "options", attributes: ["uuid","value","sortOrder","createdAt","updatedAt"] }
          ]
        },
        {
          model: ProductItem,
          as: "items",
          attributes: ["uuid","sku","stockQuantity","priceMinor","isEnable","createdAt","updatedAt"],
          include: [
            { model: ProductItemImage, as: "productItemImage", attributes: ["uuid","url","fileName"], required: false },
            {
              model: ProductConfiguration,
              as: "configurations",
              attributes: ["uuid"],
              include: [{ model: VariationOption, as: "variationOption", attributes: ["uuid","value","sortOrder","variationId"] }]
            }
          ]
        }
      ]
    });

    return res.status(mode === "create" ? 201 : 200).json(detail);
  } catch (e) {
    // compensation: ลบไฟล์ที่อัปโหลดใหม่แล้ว fail
    if (uploadedBlobNames.length) {
      try { await azureBlobService.deleteMultipleImages(uploadedBlobNames); } catch {}
    }
    await t.rollback();
    console.error("applyDesiredState error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}
const ensureStore = async (req: AuthenticatedRequest) => {
  const store = await Store.findOne({ where: { userId: req.user?.sub } });
  return store;
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

    // 2) พารามิเตอร์
    const {
      q,
      categoryUuid,
      status,
      sortBy = "createdAt",
      sortDir = "desc",
    } = req.query as Record<string, string | undefined>;
    const inStockParam = req.query.inStock as string | undefined;

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
      orConds.push(sqWhere(col("items.sku"), { [Op.like]: like }));
    }
    if (orConds.length) whereProduct[Op.or] = orConds;
    if (status) whereProduct.status = status;

    // 4) include
    const include: any[] = [];

    // 4.1 category
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

    // 4.2 main image เท่านั้น (สำหรับแสดง thumbnail)
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

    // 4.3 items (ไว้สรุป stock/price และค้น SKU)
    include.push({
      model: ProductItem,
      as: "items",
      attributes: [],   // ไม่ดึงคอลัมน์ดิบ ลดซ้ำ
      required: false,
      where: { isEnable: true },
    });

    // 5) fields จาก items
    const sumStockExpr = fn("COALESCE", fn("SUM", col("items.stock_quantity")), 0);
    const minPriceExpr = fn("MIN", col("items.price_minor"));

    // 5.1 นับจำนวนรูปทั้งหมด (product + item)
    // NOTE: ใช้ subquery ตรง ๆ เพื่อลด join ซ้ำ
    const productImageCountExpr = literal(
      "(SELECT COUNT(*) FROM product_images pi WHERE pi.product_id = `Product`.`id`)"
    );
    const itemImageCountExpr = literal(
      "(SELECT COUNT(*) " +
        "FROM product_item_images pii " +
        "JOIN product_items pit ON pit.id = pii.product_item_id " +
        "WHERE pit.product_id = `Product`.`id`)"
    );
    const totalImageCountExpr = literal(
      "(" +
        "(SELECT COUNT(*) FROM product_images pi WHERE pi.product_id = `Product`.`id`)" +
        " + " +
        "(SELECT COUNT(*) FROM product_item_images pii JOIN product_items pit ON pit.id = pii.product_item_id WHERE pit.product_id = `Product`.`id`)" +
      ")"
    );

    // 6) HAVING (inStock)
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

    // 8) GROUP BY
    const group = [
      col("Product.id"),
      col("category.id"),
      col("category.uuid"),
      col("category.name"),
    ];

    // 9) Query
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
        [minPriceExpr, "minPriceMinor"],
        [sumStockExpr, "totalStock"],
        [productImageCountExpr, "productImageCount"],
        [itemImageCountExpr, "itemImageCount"],
        [totalImageCountExpr, "totalImageCount"],
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
          include: [{ model: VariationOption, as: "options", attributes: ["id", "uuid", "sortOrder", "value", "createdAt", "updatedAt"] }],
        },
        {
          model: ProductItem,
          as: "items",
          attributes: ["id","uuid","sku","stockQuantity","priceMinor","isEnable","createdAt","updatedAt"],
          include: [
            {
              model: ProductItemImage,
              as: "productItemImage",
              attributes: ["uuid","url","fileName"],
              required: false,
            },
            {
              model: ProductConfiguration,
              as: "configurations",
              attributes: ["id", "uuid"],
              include: [
                {
                  model: VariationOption,
                  as: "variationOption",
                  attributes: ["id", "uuid", "value", "sortOrder", "variationId"],
                  include: [
                    {
                      model: Variation,
                      as: "variation",
                      attributes: ["id", "uuid", "name"] }],
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
      // console.log("Flat data: ", data)
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

    const product = await Product.findOne({
      where: { uuid: productUuid, storeId: store.id },
      include: [
        { model: ProductImage, as: "images", attributes: ["blobName"] },
        {
          model: ProductItem,
          as: "items",
          attributes: ["id"],
          include: [
            {
              model: ProductItemImage,
              as: "productItemImage",
              attributes: ["blobName"],   // ต้องมี blobName เพื่อไปลบไฟล์
              required: false,
            },
          ],
        },
      ],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!product) {
      await t.rollback();
      return res.status(404).json({ error: "Product not found" });
    }

    // collect blob names (product-level + item-level)
    const productBlobNames = (product.images ?? []).map(img => img.blobName);
    const itemBlobNames = (product.items ?? [])
      .map(it => it.productItemImage?.blobName)
      .filter((x): x is string => !!x);

    const allBlobs = [...productBlobNames, ...itemBlobNames];
    if (allBlobs.length) {
      await azureBlobService.deleteMultipleImages(allBlobs);
    }

    // destroy product (paranoid + CASCADE จัดการลูก ๆ ให้)
    await product.destroy({ transaction: t });

    await t.commit();
    return res.status(204).send();
  } catch (error) {
    await t.rollback();
    console.error("deleteProduct error:", error);
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
    console.log("duplicate product: ", productUuid)

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
            sku: it.sku,
            stockQuantity: it.stockQuantity,
            priceMinor: it.priceMinor,
            imageUrl: it.imageUrl ?? null,
            isEnable: (it as any).isEnable ?? true,
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

    const { sku, stockQuantity, priceMinor, imageUrl, isEnable } = req.body as {
      sku?: string;
      stockQuantity?: number;
      priceMinor?: number;
      imageUrl?: string | null;
      isEnable?: boolean;
    };

    await item.update({ sku, stockQuantity, priceMinor, imageUrl, isEnable });

    return res.json({
      uuid: item.uuid,
      sku: item.sku,
      stockQuantity: item.stockQuantity,
      priceMinor: item.priceMinor,
      imageUrl: item.imageUrl,
      isEnable: item.isEnable,
    });
  } catch (e) {
    console.error("updateProductItem error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ===== public handlers =====
export const syncCreateDesiredProduct = async (req: AuthenticatedRequest, res: Response) =>
  applyDesiredState({ req, res, mode: "create" });

export const syncUpdateDesiredProduct = async (req: AuthenticatedRequest, res: Response) =>
  applyDesiredState({ req, res, mode: "update", productUuid: (req.params as any).productUuid });
