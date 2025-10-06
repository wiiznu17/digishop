import { Request, Response } from "express"
import crypto from "crypto"
import { Transaction, Op } from "sequelize"

import { Order } from "@digishop/db/src/models/Order"
import { OrderStatusHistory } from "@digishop/db/src/models/OrderStatusHistory"
import { ShippingInfo } from "@digishop/db/src/models/ShippingInfo"
import { ShipmentEvent } from "@digishop/db/src/models/ShipmentEvent"
import { ShippingStatus, OrderStatus } from "@digishop/db/src/types/enum"
import sequelize from "@digishop/db"

export async function carrierWebhook(req: Request, res: Response) {
  try {
    const carrier = String(req.params.carrier || "").toUpperCase()
    const raw = req.body ?? {}
    const rawStr = JSON.stringify(raw)

    // 1) Verify signature
    const secret = process.env.CARRIER_WEBHOOK_SECRET || ""
    const sigHeader = (req.headers["x-signature"] as string) || ""
    if (secret) {
      const mac = crypto.createHmac("sha256", secret).update(rawStr).digest("hex")
      if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(sigHeader || "", "hex"))) {
        return res.status(401).json({ error: "Bad signature" })
      }
    }

    // 2) Extract tracking & normalize status
    const tracking = raw.trackingNo || raw.tracking_no || raw.trackingNumber || raw.tracking || ""
    if (!tracking) return res.status(400).json({ error: "Missing tracking number" })

    const occurredAt = new Date(raw.occurredAt || raw.occurred_at || raw.scanTime || raw.timestamp || Date.now())
    const toShipStatus = normalizeCarrierStatus(raw)

    // 3) Find shipping info
    const ship = await ShippingInfo.findOne({ where: { trackingNumber: tracking } })
    if (!ship) return res.status(202).json({ ok: true })

    // 4) Transaction
    await sequelize.transaction(async (t: Transaction) => {
      // 4.1) Upsert ShipmentEvent
      const lastEvent = await ShipmentEvent.findOne({
        where: { shippingInfoId: ship.id },
        order: [["occurredAt", "DESC"], ["id", "DESC"]],
        transaction: t
      })
      const fromStatus = (lastEvent?.get("toStatus") as ShippingStatus) ?? ship.shippingStatus ?? null

      if (lastEvent && lastEvent.get("toStatus") === toShipStatus) {
        const dt = Math.abs(new Date(lastEvent.get("occurredAt") as any).getTime() - occurredAt.getTime())
        if (dt < 60_000) return // ignore duplicate
      }

      await ShipmentEvent.create(
        {
          shippingInfoId: ship.id,
          fromStatus,
          toStatus: toShipStatus,
          description: raw.description || raw.status_text || raw.message || null,
          location: raw.location || raw.facility || null,
          rawPayload: raw,
          occurredAt
        } as any,
        { transaction: t }
      )

      // 4.2) Update ShippingInfo
      const patch: any = { shippingStatus: toShipStatus }
      if (toShipStatus === ShippingStatus.DELIVERED && !ship.deliveredAt) patch.deliveredAt = occurredAt
      if (toShipStatus === ShippingStatus.RETURNED_TO_SENDER && !ship.returnedToSenderAt)
        patch.returnedToSenderAt = occurredAt
      await ship.update(patch, { transaction: t })

      // 4.3) Update Order
      const order = await Order.findByPk(ship.orderId, { transaction: t })
      if (!order) return

      const cur = order.status as OrderStatus

      switch (toShipStatus) {
        case ShippingStatus.READY_TO_SHIP:
          if (cur === OrderStatus.PROCESSING) {
            await slide(order, cur, OrderStatus.READY_TO_SHIP, t, "SYSTEM", `Package ready to ship by ${carrier}`)
          }
          break

        case ShippingStatus.RECEIVE_PARCEL:
          if (cur === OrderStatus.READY_TO_SHIP) {
            await slide(order, cur, OrderStatus.HANDED_OVER, t, "SYSTEM", `Carrier received parcel (${carrier})`)
          }
          break

        case ShippingStatus.OUT_FOR_DELIVERY:
          if (cur === OrderStatus.HANDED_OVER) {
            await slide(order, cur, OrderStatus.SHIPPED, t, "SYSTEM", `Out for delivery (${carrier})`)
          }
          break

        case ShippingStatus.DELIVERED:
          if ([OrderStatus.SHIPPED, OrderStatus.RE_TRANSIT].includes(cur)) {
            await slide(order, cur, OrderStatus.DELIVERED, t, "SYSTEM", `Delivered successfully by ${carrier}`)
          }
          break

        case ShippingStatus.DELIVERY_FAILED:
          if (cur === OrderStatus.SHIPPED) {
            await slide(order, cur, OrderStatus.AWAITING_RETURN, t, "SYSTEM", `Delivery failed, awaiting return`)
          }
          break

        case ShippingStatus.RETURN_TO_SENDER_IN_TRANSIT:
          if (cur === OrderStatus.AWAITING_RETURN) {
            await slide(order, cur, OrderStatus.RECEIVE_RETURN, t, "SYSTEM", `Return parcel on the way to sender`)
          }
          break

        case ShippingStatus.RETURNED_TO_SENDER:
          if (cur === OrderStatus.AWAITING_RETURN) {
            await slide(order, cur, OrderStatus.RECEIVE_RETURN, t, "SYSTEM", `Return parcel received by sender`)
          }
          break

        case ShippingStatus.TRANSIT_ISSUE:
          if (cur === OrderStatus.SHIPPED) {
            await slide(order, cur, OrderStatus.TRANSIT_LACK, t, "SYSTEM", `Transit issue detected`)
          }
          break

        case ShippingStatus.RE_TRANSIT:
          if (cur === OrderStatus.TRANSIT_LACK) {
            await slide(order, cur, OrderStatus.RE_TRANSIT, t, "SYSTEM", `Reshipping parcel`)
          }
          break
      }
    })

    return res.json({ ok: true })
  } catch (err) {
    console.error("carrierWebhook error:", err)
    return res.status(500).json({ error: "Webhook processing failed" })
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
async function slide(
  order: any,
  from: OrderStatus,
  to: OrderStatus,
  t: Transaction,
  by: "SYSTEM" | "MERCHANT" | "CUSTOMER",
  reason?: string
) {
  await order.update({ status: to } as any, { transaction: t })
  await OrderStatusHistory.create(
    {
      orderId: order.id,
      fromStatus: from,
      toStatus: to,
      changedByType: by,
      changedById: 0,
      reason: reason ?? null,
      source: "SYSTEM",
      correlationId: null,
      metadata: {}
    } as any,
    { transaction: t }
  )
}

// แปลงสถานะจากขนส่งเป็น ShippingStatus
function normalizeCarrierStatus(raw: any): ShippingStatus {
  const status = (raw.status || raw.code || raw.description || "").toUpperCase().trim()
  switch (status) {
    case "PENDING":
      return ShippingStatus.PENDING
    case "READY_TO_SHIP":
      return ShippingStatus.READY_TO_SHIP
    case "RECEIVE_PARCEL":
      return ShippingStatus.RECEIVE_PARCEL
    case "ARRIVED_SORTING_CENTER":
      return ShippingStatus.ARRIVED_SORTING_CENTER
    case "OUT_SORTING_CENTER":
      return ShippingStatus.OUT_SORTING_CENTER
    case "ARRIVED_DESTINATION_STATION":
      return ShippingStatus.ARRIVED_DESTINATION_STATION
    case "OUT_FOR_DELIVERY":
      return ShippingStatus.OUT_FOR_DELIVERY
    case "DELIVERED":
      return ShippingStatus.DELIVERED
    case "DELIVERY_FAILED":
      return ShippingStatus.DELIVERY_FAILED
    case "RETURN_TO_SENDER_IN_TRANSIT":
      return ShippingStatus.RETURN_TO_SENDER_IN_TRANSIT
    case "RETURNED_TO_SENDER":
      return ShippingStatus.RETURNED_TO_SENDER
    case "TRANSIT_ISSUE":
      return ShippingStatus.TRANSIT_ISSUE
    case "RE_TRANSIT":
      return ShippingStatus.RE_TRANSIT
    default:
      return ShippingStatus.PENDING
  }
}
