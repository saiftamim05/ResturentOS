
const http = require("http");

const data = JSON.stringify({
    order_number: "ORD-1001",
    customer_name: "Tamim Al Saif",
    items: "Burger, Pizza, Coke",
    total_amount: 850,
    status: "Pending"
});

const options = {
    hostname: "localhost",
    port: 5000,
    path: "/api/orders",
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
    }
};

const req = http.request(options, (res) => {
    let response = "";

    res.on("data", (chunk) => {
        response += chunk;
    });

    res.on("end", () => {
        console.log("Status:", res.statusCode);
        console.log("Response:", response);
    });
});

req.on("error", (error) => {
    console.log("Error:", error.message);
});

req.write(data);
req.end();
