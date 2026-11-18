
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

const ordersRoutes = require("./routes/orders");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "RestaurantOS Backend is Running!",
        version: "1.0.0"
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        server: "RestaurantOS"
    });
});

app.use("/api/orders", ordersRoutes);

app.listen(PORT, () => {
    console.log("RestaurantOS Server running on port " + PORT);
    console.log("Orders API: http://localhost:" + PORT + "/api/orders");
});
