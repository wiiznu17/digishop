import { QueryInterface } from "sequelize";
import { v4 as uuidv4 } from "uuid";

export default {
  async up(q: QueryInterface): Promise<void> {
    const now = new Date();

    const getItemId = async (productId: number, sku: string) => {
      const [rows]: any = await q.sequelize.query(
        "SELECT id FROM PRODUCT_ITEMS WHERE product_id = :pid AND sku = :sku LIMIT 1",
        { replacements: { pid: productId, sku } }
      );
      if (!rows?.length) throw new Error(`Item not found: product_id=${productId}, sku=${sku}`);
      return rows[0].id as number;
    };

    const getVariationId = async (productId: number, name: string) => {
      const [rows]: any = await q.sequelize.query(
        "SELECT id FROM VARIATIONS WHERE product_id = :pid AND name = :name LIMIT 1",
        { replacements: { pid: productId, name } }
      );
      if (!rows?.length) throw new Error(`Variation not found: product_id=${productId}, name=${name}`);
      return rows[0].id as number;
    };

    const getOptionId = async (variationId: number, value: string) => {
      const [rows]: any = await q.sequelize.query(
        "SELECT id FROM VARIATION_OPTIONS WHERE variation_id = :vid AND value = :val LIMIT 1",
        { replacements: { vid: variationId, val: value } }
      );
      if (!rows?.length) throw new Error(`Option not found: variation_id=${variationId}, value=${value}`);
      return rows[0].id as number;
    };

    // ===== Product 1001: Smartphone X (Color + Storage) =====
    const itemXBlk128 = await getItemId(1001, "X-BLK-128");
    const itemXSlv256 = await getItemId(1001, "X-SLV-256");
    const itemXBlk256 = await getItemId(1001, "X-BLK-256"); // ใหม่
    const itemXSlv128 = await getItemId(1001, "X-SLV-128"); // ใหม่
    const varXColor   = await getVariationId(1001, "Color");
    const varXStorage = await getVariationId(1001, "Storage");
    const optXBlack   = await getOptionId(varXColor, "Black");
    const optXSilver  = await getOptionId(varXColor, "Silver");
    const optX128     = await getOptionId(varXStorage, "128GB");
    const optX256     = await getOptionId(varXStorage, "256GB");

    // ===== Product 1002: Smartphone Y (Color only) =====
    const itemYBlue   = await getItemId(1002, "Y-BLU");
    const itemYBlack  = await getItemId(1002, "Y-BLK");
    const varYColor   = await getVariationId(1002, "Color");
    const optYBlue    = await getOptionId(varYColor, "Blue");
    const optYBlack   = await getOptionId(varYColor, "Black");

    // ===== Product 1003: Laptop Pro 15 (RAM + Storage) =====
    const itemL1516512 = await getItemId(1003, "L15-16-512");
    const itemL15321TB = await getItemId(1003, "L15-32-1TB");
    const itemL15161TB = await getItemId(1003, "L15-16-1TB");
    const itemL1532512 = await getItemId(1003, "L15-32-512");
    const varLRAM     = await getVariationId(1003, "RAM");
    const varLStorage = await getVariationId(1003, "Storage");
    const optL16      = await getOptionId(varLRAM, "16GB");
    const optL32      = await getOptionId(varLRAM, "32GB");
    const optL512     = await getOptionId(varLStorage, "512GB");
    const optL1TB     = await getOptionId(varLStorage, "1TB");

    // ===== Product 1004: Earbuds (Color) =====
    const itemEBWht   = await getItemId(1004, "EB-WHT");
    const varEBColor  = await getVariationId(1004, "Color");
    const optEBWhite  = await getOptionId(varEBColor, "White");

    // ===== Product 1005: Smartwatch Z (Band Size) =====
    const itemSWS = await getItemId(1005, "SWZ-S");
    const itemSWM = await getItemId(1005, "SWZ-M");
    const itemSWL = await getItemId(1005, "SWZ-L");
    const varBand = await getVariationId(1005, "Band Size");
    const optBandS = await getOptionId(varBand, "S");
    const optBandM = await getOptionId(varBand, "M");
    const optBandL = await getOptionId(varBand, "L");

    await q.bulkInsert("PRODUCT_CONFIGURATIONS", [
      // Smartphone X
      // X-BLK-128 => Black + 128GB
      { uuid: uuidv4(), product_item_id: itemXBlk128, variation_option_id: optXBlack, created_at: now, updated_at: now, deleted_at: null },
      { uuid: uuidv4(), product_item_id: itemXBlk128, variation_option_id: optX128,  created_at: now, updated_at: now, deleted_at: null },
      // X-SLV-256 => Silver + 256GB
      { uuid: uuidv4(), product_item_id: itemXSlv256, variation_option_id: optXSilver, created_at: now, updated_at: now, deleted_at: null },
      { uuid: uuidv4(), product_item_id: itemXSlv256, variation_option_id: optX256,   created_at: now, updated_at: now, deleted_at: null },
      // X-BLK-256 => Black + 256GB
      { uuid: uuidv4(), product_item_id: itemXBlk256, variation_option_id: optXBlack, created_at: now, updated_at: now, deleted_at: null },
      { uuid: uuidv4(), product_item_id: itemXBlk256, variation_option_id: optX256,   created_at: now, updated_at: now, deleted_at: null },
      // X-SLV-128 => Silver + 128GB
      { uuid: uuidv4(), product_item_id: itemXSlv128, variation_option_id: optXSilver, created_at: now, updated_at: now, deleted_at: null },
      { uuid: uuidv4(), product_item_id: itemXSlv128, variation_option_id: optX128,   created_at: now, updated_at: now, deleted_at: null },

      // Smartphone Y
      // Y-BLU => Blue
      { uuid: uuidv4(), product_item_id: itemYBlue,  variation_option_id: optYBlue,  created_at: now, updated_at: now, deleted_at: null },
      // Y-BLK => Black
      { uuid: uuidv4(), product_item_id: itemYBlack, variation_option_id: optYBlack, created_at: now, updated_at: now, deleted_at: null },

      // Laptop Pro 15
      // L15-16-512 => 16GB + 512GB
      { uuid: uuidv4(), product_item_id: itemL1516512, variation_option_id: optL16,  created_at: now, updated_at: now, deleted_at: null },
      { uuid: uuidv4(), product_item_id: itemL1516512, variation_option_id: optL512, created_at: now, updated_at: now, deleted_at: null },
      // L15-32-1TB => 32GB + 1TB
      { uuid: uuidv4(), product_item_id: itemL15321TB, variation_option_id: optL32, created_at: now, updated_at: now, deleted_at: null },
      { uuid: uuidv4(), product_item_id: itemL15321TB, variation_option_id: optL1TB, created_at: now, updated_at: now, deleted_at: null },
      // L15-16-1TB => 16GB + 1TB
      { uuid: uuidv4(), product_item_id: itemL15161TB, variation_option_id: optL16, created_at: now, updated_at: now, deleted_at: null },
      { uuid: uuidv4(), product_item_id: itemL15161TB, variation_option_id: optL1TB, created_at: now, updated_at: now, deleted_at: null },
      // L15-32-512 => 32GB + 512GB
      { uuid: uuidv4(), product_item_id: itemL1532512, variation_option_id: optL32,  created_at: now, updated_at: now, deleted_at: null },
      { uuid: uuidv4(), product_item_id: itemL1532512, variation_option_id: optL512, created_at: now, updated_at: now, deleted_at: null },

      // Earbuds
      // EB-WHT => White
      { uuid: uuidv4(), product_item_id: itemEBWht, variation_option_id: optEBWhite, created_at: now, updated_at: now, deleted_at: null },

      // Smartwatch Z (Band Size)
      { uuid: uuidv4(), product_item_id: itemSWS, variation_option_id: optBandS, created_at: now, updated_at: now, deleted_at: null },
      { uuid: uuidv4(), product_item_id: itemSWM, variation_option_id: optBandM, created_at: now, updated_at: now, deleted_at: null },
      { uuid: uuidv4(), product_item_id: itemSWL, variation_option_id: optBandL, created_at: now, updated_at: now, deleted_at: null },
    ]);
  },

  async down(q: QueryInterface): Promise<void> {
    const getItemIds = async (productId: number, skus: string[]) => {
      const [rows]: any = await q.sequelize.query(
        `SELECT id FROM PRODUCT_ITEMS WHERE product_id = :pid AND sku IN (${skus.map((_, i) => ':s'+i).join(',')})`,
        { replacements: Object.assign({ pid: productId }, Object.fromEntries(skus.map((s, i) => ['s'+i, s]))) }
      );
      return rows.map((r: any) => r.id);
    };

    const ids = [
      // 1001
      ...(await getItemIds(1001, ["X-BLK-128", "X-SLV-256", "X-BLK-256", "X-SLV-128"])),
      // 1002
      ...(await getItemIds(1002, ["Y-BLU", "Y-BLK"])),
      // 1003
      ...(await getItemIds(1003, ["L15-16-512", "L15-32-1TB", "L15-16-1TB", "L15-32-512"])),
      // 1004
      ...(await getItemIds(1004, ["EB-WHT"])),
      // 1005
      ...(await getItemIds(1005, ["SWZ-S", "SWZ-M", "SWZ-L"])),
    ];

    if (ids.length) {
      await q.bulkDelete("PRODUCT_CONFIGURATIONS", { product_item_id: ids }, {});
    }
  },
};
