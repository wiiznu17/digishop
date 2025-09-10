// seeders/XXXXXXXXXXXX-seed-variation-options.ts
import { QueryInterface } from "sequelize";
import { v4 as uuidv4 } from "uuid";

export default {
  async up(q: QueryInterface): Promise<void> {
    const now = new Date();

    const findVar = async (productId: number, name: string) => {
      const [rows]: any = await q.sequelize.query(
        "SELECT id FROM VARIATIONS WHERE product_id = :pid AND name = :name LIMIT 1",
        { replacements: { pid: productId, name } }
      );
      if (!rows?.length) throw new Error(`Variation not found: product_id=${productId}, name=${name}`);
      return rows[0].id as number;
    };

    const v1001Color   = await findVar(1001, "Color");
    const v1001Storage = await findVar(1001, "Storage");
    const v1002Color   = await findVar(1002, "Color");
    const v1003RAM     = await findVar(1003, "RAM");
    const v1003Storage = await findVar(1003, "Storage");
    const v1004Color   = await findVar(1004, "Color");
    const v1005Band    = await findVar(1005, "Band Size");

    await q.bulkInsert("VARIATION_OPTIONS", [
      // Smartphone X (1001)
      { uuid: uuidv4(), variation_id: v1001Color,   value: "Black",  sort_order: 1, created_at: now, updated_at: now, deleted_at: null },
      { uuid: uuidv4(), variation_id: v1001Color,   value: "Silver", sort_order: 2, created_at: now, updated_at: now, deleted_at: null },
      { uuid: uuidv4(), variation_id: v1001Storage, value: "128GB",  sort_order: 1, created_at: now, updated_at: now, deleted_at: null },
      { uuid: uuidv4(), variation_id: v1001Storage, value: "256GB",  sort_order: 2, created_at: now, updated_at: now, deleted_at: null },

      // Smartphone Y (1002)
      { uuid: uuidv4(), variation_id: v1002Color,   value: "Blue",   sort_order: 1, created_at: now, updated_at: now, deleted_at: null },
      { uuid: uuidv4(), variation_id: v1002Color,   value: "Black",  sort_order: 2, created_at: now, updated_at: now, deleted_at: null },

      // Laptop Pro 15 (1003)
      { uuid: uuidv4(), variation_id: v1003RAM,     value: "16GB",   sort_order: 1, created_at: now, updated_at: now, deleted_at: null },
      { uuid: uuidv4(), variation_id: v1003RAM,     value: "32GB",   sort_order: 2, created_at: now, updated_at: now, deleted_at: null },
      { uuid: uuidv4(), variation_id: v1003Storage, value: "512GB",  sort_order: 1, created_at: now, updated_at: now, deleted_at: null },
      { uuid: uuidv4(), variation_id: v1003Storage, value: "1TB",    sort_order: 2, created_at: now, updated_at: now, deleted_at: null },

      // Wireless Earbuds (1004)
      { uuid: uuidv4(), variation_id: v1004Color,   value: "White",  sort_order: 1, created_at: now, updated_at: now, deleted_at: null },

      // Smartwatch Z (1005)
      { uuid: uuidv4(), variation_id: v1005Band,    value: "S",      sort_order: 1, created_at: now, updated_at: now, deleted_at: null },
      { uuid: uuidv4(), variation_id: v1005Band,    value: "M",      sort_order: 2, created_at: now, updated_at: now, deleted_at: null },
      { uuid: uuidv4(), variation_id: v1005Band,    value: "L",      sort_order: 3, created_at: now, updated_at: now, deleted_at: null },
    ]);
  },

  async down(q: QueryInterface): Promise<void> {
    const findVar = async (productId: number, name: string) => {
      const [rows]: any = await q.sequelize.query(
        "SELECT id FROM VARIATIONS WHERE product_id = :pid AND name = :name LIMIT 1",
        { replacements: { pid: productId, name } }
      );
      return rows?.[0]?.id ?? null;
    };

    const ids = (await Promise.all([
      findVar(1001, "Color"),
      findVar(1001, "Storage"),
      findVar(1002, "Color"),
      findVar(1003, "RAM"),
      findVar(1003, "Storage"),
      findVar(1004, "Color"),
      findVar(1005, "Band Size"),
    ])).filter(Boolean) as number[];

    if (ids.length) {
      await q.bulkDelete("VARIATION_OPTIONS", { variation_id: ids }, {});
    }
  },
};
