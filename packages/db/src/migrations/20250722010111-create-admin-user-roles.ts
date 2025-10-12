import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(q: QueryInterface) {
    // 1) สร้างตาราง
    await q.createTable("ADMIN_USER_ROLES", {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      admin_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      role_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      start_at: { type: DataTypes.DATE, allowNull: true },
      end_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    });

    // // 2) FK (optional but recommended)
    // try {
    //   await q.addConstraint("ADMIN_USER_ROLES", {
    //     fields: ["admin_id"],
    //     type: "foreign key",
    //     name: "fk_admin_user_roles_admin",
    //     references: { table: "ADMIN_USERS", field: "id" },
    //     onUpdate: "CASCADE",
    //     onDelete: "CASCADE",
    //   });
    // } catch {}
    // try {
    //   await q.addConstraint("ADMIN_USER_ROLES", {
    //     fields: ["role_id"],
    //     type: "foreign key",
    //     name: "fk_admin_user_roles_role",
    //     references: { table: "ADMIN_ROLES", field: "id" },
    //     onUpdate: "CASCADE",
    //     onDelete: "RESTRICT",
    //   });
    // } catch {}

    // 3) index ช่วยค้น
    await q.addIndex("ADMIN_USER_ROLES", ["admin_id"]);
    await q.addIndex("ADMIN_USER_ROLES", ["role_id"]);
    await q.addIndex("ADMIN_USER_ROLES", ["start_at"]);
    await q.addIndex("ADMIN_USER_ROLES", ["end_at"]);

    // 4) คีย์บังคับ active ไม่ซ้อน:
    //    active = end_at IS NULL AND deleted_at IS NULL → active_uniq_key = "<admin_id>:<role_id>"
    //    not active → NULL (อนุญาตหลายแถวประวัติได้เพราะ NULL ไม่ติด unique)
    await q.sequelize.query(`
      ALTER TABLE ADMIN_USER_ROLES
      ADD COLUMN active_uniq_key VARCHAR(64)
      GENERATED ALWAYS AS (
        CASE
          WHEN end_at IS NULL AND deleted_at IS NULL
          THEN CONCAT(admin_id, ':', role_id)
          ELSE NULL
        END
      ) STORED;
    `);

    await q.sequelize.query(`
      CREATE UNIQUE INDEX uniq_admin_user_roles_active_key
      ON ADMIN_USER_ROLES (active_uniq_key);
    `);
  },

  async down(q: QueryInterface) {
    // ลบ unique + generated column ก่อน แล้วค่อย drop table
    await q.sequelize.query(`DROP INDEX uniq_admin_user_roles_active_key ON ADMIN_USER_ROLES;`).catch(() => {});
    await q.sequelize.query(`ALTER TABLE ADMIN_USER_ROLES DROP COLUMN active_uniq_key;`).catch(() => {});
    await q.dropTable("ADMIN_USER_ROLES");
  },
};
