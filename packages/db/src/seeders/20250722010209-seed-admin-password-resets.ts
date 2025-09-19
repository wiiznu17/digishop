import { QueryInterface } from "sequelize";

export default {
  async up(q: QueryInterface) {
    // ไม่จำเป็นต้องมีค่าเริ่มต้นใน prod
  },
  async down() {},
};
