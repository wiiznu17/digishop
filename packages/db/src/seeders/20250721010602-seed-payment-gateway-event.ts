// src/seeders/2025xxxx-seed-payment-gateway-events.ts
import { QueryInterface } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    const now = new Date();

    // Helper: THB -> minor (x100)
    const m = (baht: number) => baht * 100;

    await queryInterface.bulkInsert("PAYMENT_GATEWAY_EVENTS", [
      // ─────────────────────────────────────────────────────────
      // 6002: Payment FAILED
      {
        order_id: 6002,
        payment_id: 2,
        refund_order_id: null,
        type: "PAYMENT.AUTHORIZE",
        amount_minor: m(2000),
        provider: "PromptPayGateway",
        provider_ref: "pp-6002-auth",
        status: "FAILED",
        request_id: "req-6002-auth",
        req_json: JSON.stringify({ method: "PROMPTPAY" }),
        res_json: JSON.stringify({ code: "USER_CANCELED" }),
        created_at: now,
      },

      // ─────────────────────────────────────────────────────────
      // 6003: Payment SUCCESS (AUTH + CAPTURE)
      {
        order_id: 6003,
        payment_id: 3,
        refund_order_id: null,
        type: "PAYMENT.AUTHORIZE",
        amount_minor: m(3500),
        provider: "KBankGateway",
        provider_ref: "kb-6003-auth",
        status: "SUCCESS",
        request_id: "req-6003-auth",
        req_json: JSON.stringify({ card_brand: "VISA" }),
        res_json: JSON.stringify({ auth_code: "A12345" }),
        created_at: now,
      },
      {
        order_id: 6003,
        payment_id: 3,
        refund_order_id: null,
        type: "PAYMENT.CAPTURE",
        amount_minor: m(3500),
        provider: "KBankGateway",
        provider_ref: "kb-6003-capture",
        status: "SUCCESS",
        request_id: "req-6003-capture",
        req_json: JSON.stringify({ capture: true }),
        res_json: JSON.stringify({ capture_id: "C98765" }),
        created_at: now,
      },

      // ─────────────────────────────────────────────────────────
      // 6013: Refund requested (no PG action yet, just log request inbound)
      {
        order_id: 6013,
        payment_id: 13,
        refund_order_id: 1,
        type: "REFUND.REQUEST",
        amount_minor: m(4100),
        provider: "KBankGateway",
        provider_ref: null,
        status: "SUCCESS",
        request_id: "req-6013-refund",
        req_json: JSON.stringify({ reason: "change_of_mind" }),
        res_json: JSON.stringify({ accepted: true }),
        created_at: now,
      },

      // ─────────────────────────────────────────────────────────
      // 6019: Refund approved (PG create refund request)
      {
        order_id: 6019,
        payment_id: 19,
        refund_order_id: 7,
        type: "REFUND.CREATE",
        amount_minor: m(4300),
        provider: "PromptPayGateway",
        provider_ref: "pp-6019-ref",
        status: "SUCCESS",
        request_id: "req-6019-refund",
        req_json: JSON.stringify({ channel: "PROMPTPAY" }),
        res_json: JSON.stringify({ refund_token: "R6019" }),
        created_at: now,
      },

      // ─────────────────────────────────────────────────────────
      // 6020: Refund success
      {
        order_id: 6020,
        payment_id: 20,
        refund_order_id: 8,
        type: "REFUND.CREATE",
        amount_minor: m(5100),
        provider: "KBankGateway",
        provider_ref: "kb-6020-ref",
        status: "SUCCESS",
        request_id: "req-6020-refund",
        req_json: JSON.stringify({ channel: "CARD" }),
        res_json: JSON.stringify({ refund_token: "R6020" }),
        created_at: now,
      },
      {
        order_id: 6020,
        payment_id: 20,
        refund_order_id: 8,
        type: "REFUND.SUCCESS",
        amount_minor: m(5100),
        provider: "KBankGateway",
        provider_ref: "kb-6020-ref-ok",
        status: "SUCCESS",
        request_id: "req-6020-refund-ok",
        req_json: JSON.stringify({}),
        res_json: JSON.stringify({ settled: true }),
        created_at: now,
      },

      // ─────────────────────────────────────────────────────────
      // 6021: Refund fail by PGW
      {
        order_id: 6021,
        payment_id: 21,
        refund_order_id: 9,
        type: "REFUND.CREATE",
        amount_minor: m(4400),
        provider: "PromptPayGateway",
        provider_ref: "pp-6021-ref",
        status: "SUCCESS",
        request_id: "req-6021-refund",
        req_json: JSON.stringify({ channel: "QR" }),
        res_json: JSON.stringify({ refund_token: "R6021" }),
        created_at: now,
      },
      {
        order_id: 6021,
        payment_id: 21,
        refund_order_id: 9,
        type: "REFUND.FAIL",
        amount_minor: m(4400),
        provider: "PromptPayGateway",
        provider_ref: "pp-6021-ref-fail",
        status: "FAILED",
        request_id: "req-6021-refund-fail",
        req_json: JSON.stringify({}),
        res_json: JSON.stringify({ error: "TIMEOUT" }),
        created_at: now,
      },
    ]);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete("PAYMENT_GATEWAY_EVENTS", {
      order_id: [6002, 6003, 6013, 6019, 6020, 6021],
    });
  },
};
