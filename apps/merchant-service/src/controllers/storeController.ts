import { Response } from "express"
import { AuthenticatedRequest } from "../middlewares/middleware"
import { Store } from "@digishop/db";

export async function getStoreStatus(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" })
    const ownerUserId = Number(req.user.sub);
    if (!ownerUserId) return res.status(400).json({ error: "Missing user Id in cookie" });

    const owned = await Store.findOne({ where: { userId: ownerUserId }, attributes: ["id", "status"] });
    if (!owned) return res.status(404).json({ error: "Store not found" });

    const storeId = owned.id;
    console.log("store id: ", storeId)
    let store = null

    store = await Store.findByPk(storeId, { attributes: ["id", "status"] })

    if (!store) {
      return res.status(404).json({ status: null })
    }

    return res.json({ status: store.status })
  } catch (err) {
    console.error("[getMyStoreStatus] error:", err)
    return res.status(500).json({ message: "Internal server error" })
  }
}
