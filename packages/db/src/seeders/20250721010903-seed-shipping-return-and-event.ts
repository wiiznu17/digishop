import { QueryInterface, QueryTypes } from 'sequelize'

const now = new Date()

// map order status -> return shipment status (events + final)
const mapOrderToReturn = (to: string): string | null => {
  switch (to) {
    case 'AWAITING_RETURN':
      return 'RETURN_IN_TRANSIT'
    case 'RECEIVE_RETURN':
      return 'DELIVERED_BACK'
    case 'RETURN_VERIFIED':
      return 'DELIVERED_BACK'
    case 'RETURN_FAIL':
      return 'RETURN_TIME_OUT'
    default:
      return null
  }
}

export default {
  up: async (queryInterface: QueryInterface) => {
    const sequelize = queryInterface.sequelize

    // เลือกเฉพาะออเดอร์ที่เกี่ยวข้องกับ flow คืนหลังส่ง (6014-6017)
    const targetOrderIds = [6014, 6015, 6016, 6017]

    const histories = await sequelize.query<{
      order_id: number
      from_status: string | null
      to_status: string
      created_at: Date
    }>(
      `
      SELECT order_id, from_status, to_status, created_at
      FROM ORDER_STATUS_HISTORY
      WHERE order_id IN (:ids)
      ORDER BY order_id, created_at, id
      `,
      { type: QueryTypes.SELECT, replacements: { ids: targetOrderIds } }
    )

    // ผึก payment/refund ถ้าต้องการ (ตอนนี้ไม่จำเป็น → ตั้งค่า refund_order_id = null)
    // สร้าง RETURN_SHIPMENTS
    const returnShipRows: any[] = []
    const eventsRows: any[] = []

    // group by order
    const byOrder = new Map<number, typeof histories>()
    for (const h of histories) {
      if (!byOrder.has(h.order_id)) byOrder.set(h.order_id, [] as any)
      ;(byOrder.get(h.order_id) as any).push(h)
    }

    for (const orderId of targetOrderIds) {
      const list = (byOrder.get(orderId) || []) as typeof histories
      if (!list.length) continue

      // หา status RETURN สุดท้าย เพื่อตั้ง state ปัจจุบันของ RETURN_SHIPMENTS
      let finalReturnStatus: string | null = null
      let deliveredBackAt: Date | null = null

      for (const h of list) {
        const to = mapOrderToReturn(h.to_status)
        if (!to) continue
        finalReturnStatus = to

        if (to === 'DELIVERED_BACK') deliveredBackAt = h.created_at ?? now

        // บันทึก event
        const from = h.from_status ? mapOrderToReturn(h.from_status) : null
        eventsRows.push({
          // return_shipment_id ใส่ทีหลังหลัง insert RETURN_SHIPMENTS (ใช้ temp mapping)
          __order_id: orderId, // temp key
          from_status: from,
          to_status: to,
          description: `Auto from order status: ${h.to_status}`,
          location: null,
          raw_payload: JSON.stringify({
            order_to: h.to_status,
            order_from: h.from_status
          }),
          occurred_at: h.created_at ?? now,
          created_at: now,
          updated_at: now
        })
      }

      if (!finalReturnStatus) {
        // ไม่มีสถานะคืน = ข้าม
        continue
      }
      const deadlineAt = new Date()
      deadlineAt.setDate(deadlineAt.getDate() + 7)

      const carrier = 'ReturnCarrier' // mock
      const tracking = `RTRK${orderId}`
      const shippedAt =
        list.find((x) => x.to_status === 'AWAITING_RETURN')?.created_at ?? now

      returnShipRows.push({
        order_id: orderId,
        refund_order_id: null, // ถ้าต้องการเชื่อมกับ REFUND_ORDERS ให้ query มาแล้วใส่
        carrier,
        tracking_number: tracking,
        status: finalReturnStatus,
        deadline_dropoff_at: deadlineAt,
        shipped_at: shippedAt,
        delivered_back_at: deliveredBackAt,
        from_address_snapshot: null,
        to_address_snapshot: null,
        metadata: JSON.stringify({ seed: true }),
        created_at: now,
        updated_at: now,
        deleted_at: null
      })
    }

    // insert RETURN_SHIPMENTS และ map id กลับไปใส่ใน events
    if (returnShipRows.length) {
      await queryInterface.bulkInsert('RETURN_SHIPMENTS', returnShipRows)

      // ดึง id ที่เพิ่งสร้างมาเพื่อ map (อิง order_id)
      const inserted = await queryInterface.sequelize.query<{
        id: number
        order_id: number
      }>(`SELECT id, order_id FROM RETURN_SHIPMENTS WHERE order_id IN (:ids)`, {
        type: QueryTypes.SELECT,
        replacements: { ids: targetOrderIds }
      })
      const idByOrder = new Map(inserted.map((x) => [x.order_id, x.id]))

      const finalEvents = eventsRows
        .map((e) => ({
          return_shipment_id: idByOrder.get((e as any).__order_id),
          from_status: e.from_status,
          to_status: e.to_status,
          description: e.description,
          location: e.location,
          raw_payload: e.raw_payload,
          occurred_at: e.occurred_at,
          created_at: e.created_at,
          updated_at: e.updated_at
        }))
        .filter((e) => !!e.return_shipment_id)

      if (finalEvents.length) {
        await queryInterface.bulkInsert('RETURN_SHIPMENT_EVENTS', finalEvents)
      }
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const ids = [6014, 6015, 6016, 6017]
    // ลบ events ก่อน
    await queryInterface.sequelize.query(
      `
      DELETE rse FROM RETURN_SHIPMENT_EVENTS rse
      JOIN RETURN_SHIPMENTS rs ON rs.id = rse.return_shipment_id
      WHERE rs.order_id IN (:ids)
      `,
      { replacements: { ids } }
    )
    // ลบ shipments
    await queryInterface.bulkDelete('RETURN_SHIPMENTS', { order_id: ids })
  }
}
