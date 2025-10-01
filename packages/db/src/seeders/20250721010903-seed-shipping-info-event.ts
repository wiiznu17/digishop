import { QueryInterface, QueryTypes } from "sequelize";

const now = new Date();

// mapping จาก OrderStatus (to_status) -> ShippingStatus (event.to_status)
const mapOrderToShipping = (to: string): string | null => {
  switch (to) {
    case "READY_TO_SHIP": return "READY_TO_SHIP";
    case "HANDED_OVER":   return "IN_TRANSIT";
    case "SHIPPED":       return "IN_TRANSIT";
    case "DELIVERED":     return "DELIVERED";
    case "TRANSIT_LACK":  return "TRANSIT_ISSUE";
    case "RE_TRANSIT":    return "RE_TRANSIT";

    // เคสคืนหลังส่ง: ให้บันทึกบน SHIPPING_EVENTS ด้วย ตาม requirement
    case "AWAITING_RETURN": return "RETURN_TO_SENDER_IN_TRANSIT";
    case "RECEIVE_RETURN":  return "RETURNED_TO_SENDER";
    case "RETURN_FAIL":     return "DELIVERY_FAILED";

    default: return null;
  }
};

export default {
  up: async (queryInterface: QueryInterface) => {
    const sequelize = queryInterface.sequelize;

    // ดึง history ทั้งหมดของออเดอร์ตามที่ seed ไว้
    const histories = await sequelize.query<{
      order_id: number;
      from_status: string | null;
      to_status: string;
      created_at: Date;
    }>(
      `
      SELECT order_id, from_status, to_status, created_at
      FROM ORDER_STATUS_HISTORY
      WHERE order_id BETWEEN 6001 AND 6022
      ORDER BY order_id, created_at, id
      `,
      { type: QueryTypes.SELECT }
    );

    // ดึง ShippingInfo (เพื่อได้ shipping_info_id)
    const shipInfos = await sequelize.query<{ id: number; order_id: number }>(
      `
      SELECT id, order_id
      FROM SHIPPING_INFO
      WHERE order_id BETWEEN 6001 AND 6022
      `,
      { type: QueryTypes.SELECT }
    );
    const shipInfoByOrder = new Map(shipInfos.map(x => [x.order_id, x.id]));

    const rows: any[] = [];
    for (const h of histories) {
      const shippingInfoId = shipInfoByOrder.get(h.order_id);
      if (!shippingInfoId) continue;

      const mappedTo = mapOrderToShipping(h.to_status);
      if (!mappedTo) continue;

      const mappedFrom = h.from_status ? mapOrderToShipping(h.from_status) : null;
      // หมายเหตุ: from อาจ map ไม่ได้ (เช่น PENDING) ให้เก็บเป็น null

      rows.push({
        shipping_info_id: shippingInfoId,
        from_status: mappedFrom,
        to_status: mappedTo,
        description: `Auto from order status: ${h.to_status}`,
        location: null,
        raw_payload: JSON.stringify({ order_to: h.to_status, order_from: h.from_status }),
        occurred_at: h.created_at ?? now,
        created_at: now,
        updated_at: now,
      });
    }

    if (rows.length) {
      await queryInterface.bulkInsert("SHIPPING_EVENTS", rows);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    // ลบเฉพาะของกลุ่มออเดอร์ 6001–6022
    // (ล้างด้วย subquery หา shipping_info_id ที่ตรงกลุ่ม)
    await queryInterface.sequelize.query(
      `
      DELETE se FROM SHIPPING_EVENTS se
      JOIN SHIPPING_INFO si ON si.id = se.shipping_info_id
      WHERE si.order_id BETWEEN 6001 AND 6022
      `
    );
  },
};
