import { QueryInterface } from "sequelize";

export default {
    up: async (queryInterface: QueryInterface) => {
        const now = new Date();
        const rows = [
            [1,1,'DGS2025082801'],
            [2,1,'DGS2025082802'],
            [3,1,'DGS2025082803'],
            [4,1,'DGS2025082804'],
            [5,1,'DGS2025082805'],
            [6,1,'DGS2025082806'],
            [7,1,'DGS2025082807'],
            [8,1,'DGS2025082808'],
            [9,1,'DGS2025082809'],
            [10,1,'DGS20250828010'],
            [11,1,'DGS20250828011'],
            [12,1,'DGS20250828012'],
            [13,1,'DGS20250828013'],
            [14,1,'DGS20250828014'],
            [15,1,'DGS20250828015'],
            [16,1,'DGS20250828016'],
            [17,1,'DGS20250828017'],
            [18,1,'DGS20250828018'],
            [19,1,'DGS20250828019'],
            [20,1,'DGS20250828020'],
            [21,1,'DGS20250828021'],
            [22,1,'DGS20250828022']
        ];
        
        await queryInterface.bulkInsert("CHECKOUT",
            rows.map(([id,customer,orderCode]) => {
                return {
                    id,
                    customer_id: customer,
                    order_code: orderCode
                }
            })
            
        )
    },
    down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete("CHECKOUT", {
      id: [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
        11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
      ],
    });
  },
}