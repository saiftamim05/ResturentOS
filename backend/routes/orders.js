
const express = require("express");
const router = express.Router();
const db = require("../db");

// ======================================
// GET ALL ORDERS
// ======================================
router.get("/", async (req, res) => {
    try {
        const [orders] = await db.query(
            "SELECT * FROM orders ORDER BY id DESC"
        );

        res.json({
            success: true,
            data: orders
        });

    } catch (error) {
        console.error("GET Orders Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch orders"
        });
    }
});


// ======================================
// CREATE NEW ORDER
// ======================================
router.post("/", async (req, res) => {
    try {
        const {
            order_number,
            customer_name,
            items,
            total_amount,
            status,
            table_id
        } = req.body;

        if (!order_number || !customer_name) {
            return res.status(400).json({
                success: false,
                message: "Order number and customer name are required"
            });
        }

        const [result] = await db.query(
            `INSERT INTO orders
            (order_number, customer_name, items, total_amount, status, table_id)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                order_number,
                customer_name,
                items || "",
                Number(total_amount) || 0,
                status || "Pending",
                table_id || null
            ]
        );

        res.status(201).json({
            success: true,
            message: "Order created successfully",
            orderId: result.insertId
        });

    } catch (error) {
        console.error("POST Order Error:", error.message);

        res.status(500).json({
            success: false,
            message: error.code === "ER_DUP_ENTRY"
                ? "This order number already exists"
                : "Failed to create order"
        });
    }
});


// ======================================
// UPDATE ORDER STATUS
// ======================================
router.patch("/:orderNumber", async (req, res) => {
    try {
        const { orderNumber } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "Pending",
            "Preparing",
            "Completed",
            "Cancelled"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status"
            });
        }

        const [result] = await db.query(
            "UPDATE orders SET status = ? WHERE order_number = ?",
            [status, orderNumber]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        res.json({
            success: true,
            message: "Order status updated successfully"
        });

    } catch (error) {
        console.error("UPDATE Order Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to update order"
        });
    }
});


// ======================================
// DELETE ORDER
// ======================================
router.delete("/:orderNumber", async (req, res) => {
    try {
        const { orderNumber } = req.params;

        const [result] = await db.query(
            "DELETE FROM orders WHERE order_number = ?",
            [orderNumber]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        res.json({
            success: true,
            message: "Order deleted successfully"
        });

    } catch (error) {
        console.error("DELETE Order Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to delete order"
        });
    }
});


module.exports = router;
