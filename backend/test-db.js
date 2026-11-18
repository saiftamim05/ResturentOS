
const db = require("./db");

async function testConnection() {
    try {
        const connection = await db.getConnection();

        console.log("SUCCESS: MySQL Connected!");
        console.log("RestaurantOS Database is Ready!");

        connection.release();
        await db.end();

    } catch (error) {
        console.log("Database Connection Failed!");
        console.log(error.message);
    }
}

testConnection();
