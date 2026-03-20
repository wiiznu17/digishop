import {
  Product,
  ProductConfiguration,
  ProductReqStatus,
  ProductStatus,
  ProductItem,
  VariationOption,
  sequelize,
} from "@digishop/db";
import { ProductAttributes, ProductCreationAttributes } from "@digishop/db/src/models/Product";
import { type Transaction } from "sequelize";
import { azureBlobService } from "../helpers/azureBlobService";
import { productRepository } from "../repositories/productRepository";
import {
  ApplyDesiredStateInput,
  DS_Payload,
  ProductListQuery,
  ReviewFootprint,
} from "../types/product.types";

class ProductServiceError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
    this.name = "ProductServiceError";
  }
}

const canon = (x: unknown) => JSON.stringify(x);

const pickUploadBlobByKey = (
  files: Express.Multer.File[] | undefined,
  uploadKey?: string | null,
) => {
  if (!files?.length || !uploadKey) return undefined;
  return files.find((file) => String(file.originalname || "").startsWith(`${uploadKey}__`));
};

const coerceStatus = (status?: string): ProductStatus => {
  const value = (status ?? "").toUpperCase();
  return (Object.values(ProductStatus) as string[]).includes(value)
    ? (value as ProductStatus)
    : ProductStatus.INACTIVE;
};

const makeComboKeyFromItem = (
  item: ProductItem & {
    configurations?: (ProductConfiguration & { variationOption?: VariationOption })[];
  },
  varIndexById: Map<number, number>,
) => {
  const pairs = (item.configurations ?? [])
    .map((config) => ({
      variationId: config.variationOption?.variationId,
      optionUuid: config.variationOption?.uuid,
    }))
    .filter((pair): pair is { variationId: number; optionUuid: string } => !!pair.variationId && !!pair.optionUuid);

  const sorted = pairs.sort(
    (a, b) => (varIndexById.get(a.variationId) ?? 0) - (varIndexById.get(b.variationId) ?? 0),
  );

  return sorted.map((pair) => pair.optionUuid).join("|");
};

export class ProductService {
  private async rollbackIfNeeded(transaction: Transaction) {
    const tx = transaction as Transaction & { finished?: string };
    if (tx.finished) return;
    await transaction.rollback();
  }

  private ensureProductStatus(status: string): ProductStatus {
    if (!Object.values(ProductStatus).includes(status as ProductStatus)) {
      throw new ProductServiceError(400, "Invalid status value");
    }

    return status as ProductStatus;
  }

  private async ensureMainImage(productId: number, transaction: Transaction) {
    const hasMain = await productRepository.countMainProductImages(productId, transaction);
    if (hasMain) return;

    const firstImage = await productRepository.findFirstProductImage(productId, transaction);
    if (firstImage) {
      await productRepository.setProductImageMainById(firstImage.id, transaction);
    }
  }

  private async buildFootprintFromDB(productId: number, transaction: Transaction): Promise<ReviewFootprint> {
    const [product, images, variations, items] = await Promise.all([
      productRepository.findProductByPk(productId, transaction),
      productRepository.findProductImagesByProductId(productId, transaction),
      productRepository.findVariationsByProductId(productId, transaction),
      productRepository.findProductItemsByProductId(productId, transaction),
    ]);

    if (!product) {
      throw new ProductServiceError(404, "Product not found");
    }

    const varIndexById = new Map<number, number>();
    variations.forEach((variation, index) => varIndexById.set(variation.id, index));

    const mainImage = images.find((img) => img.isMain) ?? null;

    return {
      name: product.name.trim(),
      description: (product.description ?? null)?.toString().trim() || null,
      categoryId: product.categoryId ?? null,
      images: {
        uuids: images.map((img) => img.uuid).sort(),
        mainUuid: mainImage?.uuid ?? null,
      },
      variations: variations
        .map((variation) => ({
          name: variation.name.trim(),
          options: (variation.options ?? []).map((opt) => opt.value.trim()).sort(),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      items: items
        .map((item) => ({
          sku: (item.sku ?? "").trim(),
          comboKey: makeComboKeyFromItem(item, varIndexById),
        }))
        .sort((a, b) => (a.sku + a.comboKey).localeCompare(b.sku + b.comboKey)),
    };
  }

  private buildFootprintFromDesired(desired: DS_Payload, resolvedCategoryId: number | null): ReviewFootprint {
    const desiredImgUuids = desired.images.product
      .map((img) => img.uuid)
      .filter((uuid): uuid is string => !!uuid)
      .sort();

    const desiredMainUuid = desired.images.product.find((img) => img.isMain && img.uuid)?.uuid ?? null;
    const hasNewUploads = desired.images.product.some((img) => !!img.uploadKey);

    const variations = (desired.variations ?? [])
      .map((variation) => ({
        name: (variation.name ?? "").trim(),
        options: (variation.options ?? []).map((opt) => (opt.value ?? "").trim()).sort(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const items = (desired.items ?? [])
      .map((item) => ({
        sku: (item.sku ?? "").trim(),
        comboKey: [...(item.optionRefs ?? [])].sort().join("|"),
      }))
      .sort((a, b) => (a.sku + a.comboKey).localeCompare(b.sku + b.comboKey));

    return {
      name: (desired.product.name ?? "").trim(),
      description: (desired.product.description ?? null)?.toString().trim() || null,
      categoryId: resolvedCategoryId,
      images: {
        uuids: hasNewUploads ? ["__NEW__"] : desiredImgUuids,
        mainUuid: desiredMainUuid,
      },
      variations,
      items,
    };
  }

  async suggestProducts(storeId: number, q: string | undefined) {
    const raw = String(q ?? "").trim();
    if (raw.length < 1) {
      return { products: [], skus: [] };
    }

    const safeQ = raw.replace(/[%_]/g, "\\$&");
    const like = `%${safeQ}%`;

    const [productRows, skuRows] = await Promise.all([
      productRepository.findProductsForSuggestion(storeId, like),
      productRepository.findSkuRowsForSuggestion(storeId, like),
    ]);

    const productIds = Array.from(
      new Set<number>([
        ...productRows.map((product) => product.id),
        ...skuRows
          .map((skuRow) => (skuRow as ProductItem & { product?: Product }).product?.id)
          .filter((id): id is number => typeof id === "number"),
      ]),
    );

    let imageMap = new Map<number, string>();
    if (productIds.length > 0) {
      const mainImages = await productRepository.findMainImagesByProductIds(productIds);
      imageMap = new Map(mainImages.map((img) => [img.productId, img.url]));
    }

    const products = productRows.map((product) => ({
      uuid: product.uuid,
      name: product.name,
      imageUrl: imageMap.get(product.id) ?? null,
      categoryName: (product as Product & { category?: { name?: string } }).category?.name ?? null,
    }));

    const skus = skuRows.map((item) => {
      const product = (item as ProductItem & { product?: Product }).product;
      const productId = product?.id;

      return {
        sku: item.sku,
        productUuid: product?.uuid ?? null,
        productName: product?.name ?? null,
        imageUrl: productId ? imageMap.get(productId) ?? null : null,
      };
    });

    return { products, skus };
  }

  async getProductList(storeId: number, rawQuery: Record<string, string | undefined>) {
    const page = Math.max(parseInt(String(rawQuery.page ?? "1"), 10) || 1, 1);
    const pageSizeRaw = Math.max(parseInt(String(rawQuery.pageSize ?? "20"), 10) || 20, 1);
    const pageSize = Math.min(pageSizeRaw, 100);

    const query: ProductListQuery = {
      q: rawQuery.q,
      categoryUuid: rawQuery.categoryUuid,
      status: rawQuery.status,
      reqStatus: rawQuery.reqStatus,
      sortBy: rawQuery.sortBy ?? "createdAt",
      sortDir: rawQuery.sortDir ?? "desc",
      inStock: rawQuery.inStock,
      page,
      pageSize,
    };

    const result = await productRepository.findProductsList(storeId, query);

    return {
      data: result.rows,
      meta: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  async getProductDetail(storeId: number, productUuid: string) {
    const product = await productRepository.findProductDetailByUuidAndStore(productUuid, storeId);
    if (!product) {
      throw new ProductServiceError(404, "Product not found");
    }

    return product;
  }

  async listCategories(flatRaw: string | undefined) {
    const flat = flatRaw ?? "true";
    const rows = await productRepository.findAllCategories();

    if (flat === "true") {
      return rows.map((row) => ({
        uuid: row.uuid,
        name: row.name,
        parentUuid: (row as CategoryWithParent).parent?.uuid ?? null,
      }));
    }

    const nodes = rows.map((row) => ({
      uuid: row.uuid,
      name: row.name,
      parentUuid: (row as CategoryWithParent).parent?.uuid ?? null,
      children: [] as Array<{ uuid: string; name: string; parentUuid: string | null; children: unknown[] }>,
    }));

    const byUuid = new Map(nodes.map((node) => [node.uuid, node]));
    const roots: typeof nodes = [];

    for (const node of nodes) {
      if (node.parentUuid && byUuid.get(node.parentUuid)) {
        byUuid.get(node.parentUuid)?.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async applyDesiredState(input: ApplyDesiredStateInput) {
    const { storeId, mode, productUuid } = input;
    const filesP = input.files.productImages;
    const filesI = input.files.itemImages;

    const transaction = await sequelize.transaction();
    const uploadedBlobNames: string[] = [];

    try {
      if (!input.desiredRaw) {
        throw new ProductServiceError(400, "desired payload required");
      }

      const desired = JSON.parse(input.desiredRaw) as DS_Payload;

      let product: Product | null = null;

      if (mode === "create") {
        const categoryId = await productRepository.mapCategoryUuid(desired.product.categoryUuid ?? null, transaction);
        if (!categoryId) {
          throw new ProductServiceError(400, "categoryUuid is required or invalid");
        }

        const createPayload: ProductCreationAttributes = {
          storeId,
          name: desired.product.name,
          description: desired.product.description ?? null,
          status: coerceStatus(desired.product.status),
          categoryId,
          reqStatus: ProductReqStatus.PENDING,
          rejectReason: undefined,
        };

        product = await productRepository.createProduct(createPayload, transaction);
      } else {
        if (!productUuid) {
          throw new ProductServiceError(400, "productUuid is required");
        }

        product = await productRepository.findProductForUpdate(productUuid, storeId, transaction);
        if (!product) {
          throw new ProductServiceError(404, "Product not found");
        }

        if (desired.ifMatchUpdatedAt) {
          const currentUpdatedAt = new Date(product.updatedAt).toISOString();
          if (currentUpdatedAt !== new Date(desired.ifMatchUpdatedAt).toISOString()) {
            throw new ProductServiceError(409, "Conflict: product has been modified");
          }
        }

        const categoryId = await productRepository.mapCategoryUuid(desired.product.categoryUuid ?? null, transaction);

        const beforeFootprint = await this.buildFootprintFromDB(product.id, transaction);
        const afterFootprint = this.buildFootprintFromDesired(
          desired,
          categoryId ?? beforeFootprint.categoryId,
        );

        const needsReapproval = canon(beforeFootprint) !== canon(afterFootprint);

        const updatePayload: Partial<ProductAttributes> = {
          name: desired.product.name,
          description: desired.product.description ?? null,
          status: coerceStatus(desired.product.status),
          ...(categoryId != null ? { categoryId } : {}),
        };

        if (needsReapproval) {
          updatePayload.reqStatus = ProductReqStatus.PENDING;
          updatePayload.rejectReason = undefined;
        }

        await productRepository.updateProduct(product, updatePayload, transaction);
      }

      const productId = product.id;

      const currentImages = await productRepository.findProductImagesByProductId(productId, transaction, true);
      const keepUuidSet = new Set(
        desired.images.product
          .map((img) => img.uuid)
          .filter((uuid): uuid is string => !!uuid),
      );

      for (const image of currentImages) {
        if (!keepUuidSet.has(image.uuid)) {
          await azureBlobService.deleteImage(image.blobName);
          await productRepository.deleteProductImageById(image.id, transaction);
        }
      }

      const createdImageByKey = new Map<string, Awaited<ReturnType<typeof productRepository.createProductImage>>>();

      for (const desiredImage of desired.images.product) {
        if (!desiredImage.uploadKey) continue;

        const file = pickUploadBlobByKey(filesP, desiredImage.uploadKey);
        if (!file) continue;

        const { url, blobName } = await azureBlobService.uploadImage(file, `products/${product.uuid}`);
        uploadedBlobNames.push(blobName);

        const created = await productRepository.createProductImage(
          {
            productId,
            url,
            blobName,
            fileName: file.originalname.split("__").slice(1).join("__") || file.originalname,
            isMain: !!desiredImage.isMain,
            sortOrder: desiredImage.sortOrder ?? 0,
          },
          transaction,
        );

        createdImageByKey.set(desiredImage.uploadKey, created);
      }

      const recordsToOrder: Array<{ imageUuid: string; sortOrder: number; isMain?: boolean }> = [];
      let desiredMainUuid: string | undefined;

      for (const desiredImage of desired.images.product) {
        if (desiredImage.uuid) {
          recordsToOrder.push({
            imageUuid: desiredImage.uuid,
            sortOrder: desiredImage.sortOrder,
            isMain: desiredImage.isMain,
          });
          if (desiredImage.isMain) desiredMainUuid = desiredImage.uuid;
          continue;
        }

        if (!desiredImage.uploadKey) continue;

        const created = createdImageByKey.get(desiredImage.uploadKey);
        if (!created) continue;

        recordsToOrder.push({
          imageUuid: created.uuid,
          sortOrder: desiredImage.sortOrder,
          isMain: desiredImage.isMain,
        });
        if (desiredImage.isMain) desiredMainUuid = created.uuid;
      }

      for (const orderedImage of recordsToOrder) {
        await productRepository.updateProductImageByUuid(
          productId,
          orderedImage.imageUuid,
          { sortOrder: orderedImage.sortOrder },
          transaction,
        );
      }

      if (desiredMainUuid) {
        await productRepository.clearMainProductImagesExcept(productId, desiredMainUuid, transaction);
        await productRepository.setMainProductImage(productId, desiredMainUuid, transaction);
      }

      await this.ensureMainImage(productId, transaction);

      const currentVariations = await productRepository.findVariationsByProductId(productId, transaction, true);

      const desiredVariationUuidSet = new Set(
        desired.variations.map((variation) => variation.uuid).filter((uuid): uuid is string => !!uuid),
      );

      for (const currentVariation of currentVariations) {
        if (currentVariation.uuid && !desiredVariationUuidSet.has(currentVariation.uuid)) {
          await productRepository.deleteVariationById(currentVariation.id, transaction);
        }
      }

      const optionUuidByClientId = new Map<string, string>();

      for (const desiredVariation of desired.variations) {
        let variationRecord = null;

        if (desiredVariation.uuid) {
          variationRecord = await productRepository.findVariationByUuidForProduct(
            desiredVariation.uuid,
            productId,
            transaction,
          );

          if (!variationRecord) continue;

          if (variationRecord.name !== desiredVariation.name) {
            await productRepository.updateVariationNameById(
              variationRecord.id,
              desiredVariation.name,
              transaction,
            );
          }
        } else {
          variationRecord = await productRepository.createVariation(productId, desiredVariation.name, transaction);
        }

        const currentOptions = await productRepository.findVariationOptionsByVariationId(
          variationRecord.id,
          transaction,
          true,
        );

        const desiredOptionUuidSet = new Set(
          desiredVariation.options
            .map((option) => option.uuid)
            .filter((uuid): uuid is string => !!uuid),
        );

        for (const currentOption of currentOptions) {
          if (currentOption.uuid && !desiredOptionUuidSet.has(currentOption.uuid)) {
            await productRepository.deleteVariationOptionById(currentOption.id, transaction);
          }
        }

        for (const desiredOption of desiredVariation.options) {
          if (desiredOption.uuid) {
            const existingOption = await productRepository.findVariationOptionByUuidForVariation(
              desiredOption.uuid,
              variationRecord.id,
              transaction,
            );

            if (!existingOption) continue;

            const updatePayload: { value?: string; sortOrder?: number } = {};
            if (existingOption.value !== desiredOption.value) {
              updatePayload.value = desiredOption.value;
            }
            if ((existingOption.sortOrder ?? 0) !== (desiredOption.sortOrder ?? 0)) {
              updatePayload.sortOrder = desiredOption.sortOrder ?? 0;
            }

            if (Object.keys(updatePayload).length > 0) {
              await productRepository.updateVariationOptionById(existingOption.id, updatePayload, transaction);
            }

            if (desiredOption.clientId) {
              optionUuidByClientId.set(desiredOption.clientId, existingOption.uuid);
            }

            continue;
          }

          const createdOption = await productRepository.createVariationOption(
            variationRecord.id,
            {
              value: desiredOption.value,
              sortOrder: desiredOption.sortOrder ?? 0,
            },
            transaction,
          );

          if (desiredOption.clientId) {
            optionUuidByClientId.set(desiredOption.clientId, createdOption.uuid);
          }
        }
      }

      const finalVariations = await productRepository.findFinalVariationsForCombo(productId, transaction);

      const varIndexById = new Map<number, number>();
      {
        const variationByName = new Map(finalVariations.map((variation) => [variation.name, variation]));

        desired.variations.forEach((desiredVariation, index) => {
          const matched =
            (desiredVariation.uuid && finalVariations.find((variation) => variation.uuid === desiredVariation.uuid)) ||
            variationByName.get(desiredVariation.name);

          if (matched) {
            varIndexById.set(matched.id, index);
          }
        });

        let cursor = desired.variations.length;
        for (const variation of finalVariations) {
          if (!varIndexById.has(variation.id)) {
            varIndexById.set(variation.id, cursor++);
          }
        }
      }

      const cartesian = <T>(arr: T[][]): T[][] =>
        arr.reduce<T[][]>((acc, current) => acc.flatMap((a) => current.map((c) => [...a, c])), [[]]);

      const optionUuidMatrix = finalVariations
        .sort((a, b) => (varIndexById.get(a.id) ?? 0) - (varIndexById.get(b.id) ?? 0))
        .map((variation) =>
          (variation.options ?? [])
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((option) => option.uuid),
        );

      const allowedComboKeys = new Set<string>(
        optionUuidMatrix.length === 0 || optionUuidMatrix.some((row) => row.length === 0)
          ? []
          : cartesian(optionUuidMatrix).map((row) => row.join("|")),
      );

      const currentItems = await productRepository.findProductItemsByProductId(productId, transaction, true);

      for (const currentItem of currentItems) {
        const comboKey = makeComboKeyFromItem(currentItem, varIndexById);

        if (!allowedComboKeys.has(comboKey)) {
          const oldImage = currentItem.productItemImage;
          if (oldImage) {
            await azureBlobService.deleteImage(oldImage.blobName);
            await productRepository.deleteProductItemImageById(oldImage.id, transaction);
          }

          await productRepository.deleteProductConfigurationsByItemId(currentItem.id, transaction);
          await productRepository.deleteProductItemById(currentItem.id, transaction);
        }
      }

      if ((desired.variations?.length ?? 0) < 1) {
        throw new ProductServiceError(400, "At least one variation is required");
      }

      for (const variation of desired.variations) {
        if ((variation.options?.length ?? 0) < 1) {
          throw new ProductServiceError(400, `Variation "${variation.name}" must have at least 1 option`);
        }
      }

      for (const desiredItem of desired.items) {
        const sku = (desiredItem.sku ?? "").trim();

        if (!desiredItem.uuid && !sku) {
          throw new ProductServiceError(400, `SKU is required (clientKey=${desiredItem.clientKey ?? "-"})`);
        }

        if (desiredItem.uuid && sku.length === 0) {
          throw new ProductServiceError(400, `SKU is required for item uuid=${desiredItem.uuid}`);
        }

        const optionUuids: string[] = [];
        for (const ref of desiredItem.optionRefs) {
          if (!ref) continue;
          if (ref.length === 36 || ref.length === 32) optionUuids.push(ref);
          else if (optionUuidByClientId.has(ref)) optionUuids.push(optionUuidByClientId.get(ref)!);
        }

        let itemRecord = null;

        if (desiredItem.uuid) {
          itemRecord = await productRepository.findProductItemByUuidForProduct(
            desiredItem.uuid,
            productId,
            transaction,
          );

          if (!itemRecord) continue;

          const updatePayload: {
            sku?: string;
            priceMinor?: number;
            stockQuantity?: number;
            isEnable?: boolean;
          } = {};

          if ((itemRecord.sku || "") !== sku) updatePayload.sku = sku;
          if (itemRecord.priceMinor !== desiredItem.priceMinor) updatePayload.priceMinor = desiredItem.priceMinor;
          if (itemRecord.stockQuantity !== desiredItem.stockQuantity) updatePayload.stockQuantity = desiredItem.stockQuantity;
          if (itemRecord.isEnable !== desiredItem.isEnable) updatePayload.isEnable = desiredItem.isEnable;

          if (Object.keys(updatePayload).length > 0) {
            await productRepository.updateProductItemById(itemRecord.id, updatePayload, transaction);
          }
        } else {
          itemRecord = await productRepository.createProductItem(
            {
              productId,
              sku,
              priceMinor: desiredItem.priceMinor,
              stockQuantity: desiredItem.stockQuantity,
              imageUrl: null,
              isEnable: desiredItem.isEnable,
            },
            transaction,
          );
        }

        if (desiredItem.image) {
          const existing = await productRepository.findProductItemImageByProductItemId(itemRecord.id, transaction);

          if (desiredItem.image.remove === true) {
            if (existing) {
              await azureBlobService.deleteImage(existing.blobName);
              await productRepository.deleteProductItemImageById(existing.id, transaction);
            }
          } else if (desiredItem.image.uploadKey) {
            const file = pickUploadBlobByKey(filesI, desiredItem.image.uploadKey);
            if (file) {
              if (existing) {
                await azureBlobService.deleteImage(existing.blobName);
                await productRepository.deleteProductItemImageById(existing.id, transaction);
              }

              const { url, blobName } = await azureBlobService.uploadImage(
                file,
                `products/${product.uuid}/items/${itemRecord.uuid}`,
              );
              uploadedBlobNames.push(blobName);

              await productRepository.createProductItemImage(
                {
                  productItemId: itemRecord.id,
                  url,
                  blobName,
                  fileName: file.originalname.split("__").slice(1).join("__") || file.originalname,
                },
                transaction,
              );
            }
          }
        }

        if (optionUuids.length) {
          const options = await productRepository.findVariationOptionsByUuidsForProduct(optionUuids, productId, transaction);
          const allowedIds = new Set(options.map((opt) => opt.id));

          const existingConfigs = await productRepository.findProductConfigurationsByItemId(itemRecord.id, transaction);
          const existingIds = new Set(existingConfigs.map((config) => config.variationOptionId));

          const targetIds = new Set<number>(options.map((opt) => opt.id));
          const toAdd = [...targetIds].filter((id) => !existingIds.has(id));
          const toDelete = [...existingIds].filter((id) => !targetIds.has(id));

          for (const addId of toAdd) {
            if (allowedIds.has(addId)) {
              await productRepository.createProductConfiguration(itemRecord.id, addId, transaction);
            }
          }

          if (toDelete.length) {
            await productRepository.deleteProductConfigurationsByOptionIds(itemRecord.id, toDelete, transaction);
          }
        }
      }

      await transaction.commit();

      const detail = await productRepository.findProductDetailByUuid(product.uuid);
      return {
        statusCode: mode === "create" ? 201 : 200,
        data: detail,
      };
    } catch (error) {
      await this.rollbackIfNeeded(transaction);

      if (uploadedBlobNames.length) {
        try {
          await azureBlobService.deleteMultipleImages(uploadedBlobNames);
        } catch (cleanupError) {
          console.error("applyDesiredState cleanup error:", cleanupError);
        }
      }

      if (error instanceof ProductServiceError) {
        throw error;
      }

      console.error("applyDesiredState error:", error);
      throw new ProductServiceError(500, "Internal server error");
    }
  }

  async deleteProduct(storeId: number, productUuid: string) {
    const transaction = await sequelize.transaction();

    try {
      const product = await productRepository.findProductForDelete(productUuid, storeId, transaction);
      if (!product) {
        throw new ProductServiceError(404, "Product not found");
      }

      const productBlobNames = (product.images ?? []).map((img) => img.blobName);
      const itemBlobNames = (product.items ?? [])
        .map((item) => item.productItemImage?.blobName)
        .filter((blobName): blobName is string => !!blobName);

      const allBlobNames = [...productBlobNames, ...itemBlobNames];
      if (allBlobNames.length) {
        await azureBlobService.deleteMultipleImages(allBlobNames);
      }

      await productRepository.destroyProduct(product, transaction);
      await transaction.commit();
    } catch (error) {
      await this.rollbackIfNeeded(transaction);

      if (error instanceof ProductServiceError) {
        throw error;
      }

      console.error("deleteProduct error:", error);
      throw new ProductServiceError(500, "Internal server error");
    }
  }

  async bulkUpdateProductStatus(storeId: number, productUuids: string[], status: string) {
    if (!Array.isArray(productUuids) || productUuids.length === 0) {
      throw new ProductServiceError(400, "productUuids required");
    }

    const coercedStatus = this.ensureProductStatus(status);
    const [updated] = await productRepository.bulkUpdateProductStatus(productUuids, coercedStatus, storeId);

    return { updated };
  }

  async bulkDeleteProducts(storeId: number, productUuids: string[]) {
    const transaction = await sequelize.transaction();

    try {
      if (!Array.isArray(productUuids) || productUuids.length === 0) {
        throw new ProductServiceError(400, "productUuids required");
      }

      const products = await productRepository.findProductsForBulkDelete(productUuids, storeId, transaction);
      const blobs = products.flatMap((product) => (product.images ?? []).map((image) => image.blobName));

      if (blobs.length > 0) {
        await azureBlobService.deleteMultipleImages(blobs);
      }

      await productRepository.destroyProductsForBulkDelete(productUuids, storeId, transaction);
      await transaction.commit();
    } catch (error) {
      await this.rollbackIfNeeded(transaction);

      if (error instanceof ProductServiceError) {
        throw error;
      }

      console.error("bulkDeleteProducts error:", error);
      throw new ProductServiceError(500, "Internal server error");
    }
  }

  async duplicateProduct(storeId: number, productUuid: string) {
    const transaction = await sequelize.transaction();

    try {
      const source = await productRepository.findProductWithRelationsByUuidForStore(
        productUuid,
        storeId,
        transaction,
      );

      if (!source) {
        throw new ProductServiceError(404, "Product not found");
      }

      const destination = await productRepository.createProduct(
        {
          storeId,
          categoryId: source.categoryId,
          name: `${source.name} (Copy)`,
          description: source.description ?? null,
          status: source.status,
          reqStatus: ProductReqStatus.PENDING,
          rejectReason: undefined,
        },
        transaction,
      );

      if (source.images?.length) {
        for (const [index, image] of source.images.entries()) {
          await productRepository.createProductImage(
            {
              productId: destination.id,
              url: image.url,
              blobName: image.blobName,
              fileName: image.fileName,
              isMain: image.isMain,
              sortOrder: index,
            },
            transaction,
          );
        }

        const hasMain = source.images.some((image) => !!image.isMain);
        if (!hasMain && source.images.length > 0) {
          await this.ensureMainImage(destination.id, transaction);
        }
      }

      const optionIdMap = new Map<number, number>();
      if (source.variations?.length) {
        for (const variation of source.variations) {
          const newVariation = await productRepository.createVariation(destination.id, variation.name, transaction);

          for (const option of variation.options ?? []) {
            const newOption = await productRepository.createVariationOption(
              newVariation.id,
              { value: option.value, sortOrder: option.sortOrder ?? 0 },
              transaction,
            );
            optionIdMap.set(option.id, newOption.id);
          }
        }
      }

      if (source.items?.length) {
        for (const item of source.items) {
          const newItem = await productRepository.createProductItem(
            {
              productId: destination.id,
              sku: item.sku,
              stockQuantity: item.stockQuantity,
              priceMinor: item.priceMinor,
              imageUrl: item.imageUrl ?? null,
              isEnable: item.isEnable ?? true,
            },
            transaction,
          );

          for (const config of item.configurations ?? []) {
            const newOptionId = optionIdMap.get(config.variationOptionId);
            if (newOptionId) {
              await productRepository.createProductConfiguration(newItem.id, newOptionId, transaction);
            }
          }
        }
      }

      await transaction.commit();

      return {
        uuid: destination.uuid,
        name: destination.name,
      };
    } catch (error) {
      await this.rollbackIfNeeded(transaction);

      if (error instanceof ProductServiceError) {
        throw error;
      }

      console.error("duplicateProduct error:", error);
      throw new ProductServiceError(500, "Internal server error");
    }
  }

  async updateProductItem(
    storeId: number,
    productUuid: string,
    itemUuid: string,
    payload: {
      sku?: string;
      stockQuantity?: number;
      priceMinor?: number;
      imageUrl?: string | null;
      isEnable?: boolean;
    },
  ) {
    const product = await productRepository.findProductByUuidForStore(productUuid, storeId);
    if (!product) {
      throw new ProductServiceError(404, "Product not found");
    }

    const item = await productRepository.findItemByUuidForProduct(itemUuid, product.id);
    if (!item) {
      throw new ProductServiceError(404, "Item not found");
    }

    await productRepository.updateProductItemById(
      item.id,
      {
        sku: payload.sku,
        stockQuantity: payload.stockQuantity,
        priceMinor: payload.priceMinor,
        imageUrl: payload.imageUrl,
        isEnable: payload.isEnable,
      },
    );

    const refreshed = await productRepository.findItemByUuidForProduct(itemUuid, product.id);
    if (!refreshed) {
      throw new ProductServiceError(404, "Item not found");
    }

    return {
      uuid: refreshed.uuid,
      sku: refreshed.sku,
      stockQuantity: refreshed.stockQuantity,
      priceMinor: refreshed.priceMinor,
      imageUrl: refreshed.imageUrl,
      isEnable: refreshed.isEnable,
    };
  }
}

type CategoryWithParent = {
  parent?: {
    uuid?: string;
  };
};

export const productService = new ProductService();
export { ProductServiceError };
