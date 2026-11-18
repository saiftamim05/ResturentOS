
// ==========================================
// RestaurantOS - MySQL Connected JavaScript
// ==========================================

// 1. Backend API
const API_URL = "http://localhost:5000/api/orders";

// ==========================================
// 2. Demo Data
// ==========================================

const defaultOrders = [];

const defaultMenu = [
    { id: 1, name: "Classic Burger", category: "Fast Food", price: 350, emoji: "🍔", available: true },
    { id: 2, name: "Chicken Pizza", category: "Pizza", price: 850, emoji: "🍕", available: true },
    { id: 3, name: "French Fries", category: "Snacks", price: 180, emoji: "🍟", available: true },
    { id: 4, name: "Chicken Pasta", category: "Italian", price: 450, emoji: "🍝", available: true },
    { id: 5, name: "Cold Coffee", category: "Drinks", price: 150, emoji: "☕", available: true },
    { id: 6, name: "Chocolate Cake", category: "Dessert", price: 250, emoji: "🍰", available: false }
];

// ==========================================
// 3. Table Data
// ==========================================

const restaurantTables = Array.from({ length: 20 }, (_, index) => ({
    id: index + 1,
    status: "Available"
}));

// MySQL is the main source for orders.
let orders = [];

let menuItems = JSON.parse(
    localStorage.getItem("restaurantMenu")
) || [...defaultMenu];

const savedTableStatuses = JSON.parse(
    localStorage.getItem("restaurantTableStatuses") || "{}"
);

restaurantTables.forEach(table => {
    const savedStatus = savedTableStatuses[table.id];

    if (["Available", "Occupied", "Reserved"].includes(savedStatus)) {
        table.status = savedStatus;
    }
});

let salesChart = null;
let ordersChart = null;

let isLoadingOrders = false;

const money = amount =>
    "৳ " + Number(amount || 0).toLocaleString("en-BD");

// ==========================================
// 4. API Helper
// ==========================================

async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...options.headers
            }
        });

        const result = await response.json();

        if (!response.ok || result.success === false) {
            throw new Error(
                result.message || "Backend request failed"
            );
        }

        return result;

    } catch (error) {
        console.error("API Error:", error);

        if (error.name === "TypeError") {
            throw new Error(
                "Backend connection failed. Make sure Node.js server is running."
            );
        }

        throw error;
    }
}

// ==========================================
// 5. Convert Database Orders
// ==========================================

function formatDatabaseOrder(row) {
    return {
        id: row.order_number,
        customer: row.customer_name,
        items: row.items || "",
        amount: Number(row.total_amount),
        date: row.created_at
            ? String(row.created_at).slice(0, 10)
            : "",
        status: row.status || "Pending",
        tableId: row.table_id ? Number(row.table_id) : null
    };
}

// ==========================================
// 6. Load Orders From MySQL
// ==========================================

async function loadOrders() {
    try {
        isLoadingOrders = true;

        const result = await apiRequest(API_URL);

        orders = (result.data || []).map(formatDatabaseOrder);

        syncTablesWithOrders();

        return true;

    } catch (error) {
        alert(error.message);
        return false;

    } finally {
        isLoadingOrders = false;
    }
}

// ==========================================
// 7. Save Local Data
// Orders are NOT saved in localStorage.
// ==========================================

function saveTableStatuses() {
    const statuses = {};

    restaurantTables.forEach(table => {
        statuses[table.id] = table.status;
    });

    localStorage.setItem(
        "restaurantTableStatuses",
        JSON.stringify(statuses)
    );
}

function saveData() {
    localStorage.setItem(
        "restaurantMenu",
        JSON.stringify(menuItems)
    );

    saveTableStatuses();
}

// ==========================================
// 8. Escape HTML
// ==========================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// ==========================================
// 9. Synchronize Tables With Orders
// ==========================================

function syncTablesWithOrders() {
    restaurantTables.forEach(table => {
        const activeOrder = orders.some(order =>
            Number(order.tableId) === table.id &&
            ["Pending", "Preparing"].includes(order.status)
        );

        if (activeOrder) {
            table.status = "Occupied";
        } else if (table.status === "Occupied") {
            table.status = "Available";
        }
    });

    saveTableStatuses();
}

// ==========================================
// 10. Page Information
// ==========================================

const pageInfo = {
    dashboard: ["Dashboard", "Welcome back! Here's what's happening today."],
    orders: ["Orders", "Manage and track restaurant orders."],
    menu: ["Food Menu", "Manage your restaurant food items."],
    reservations: ["Reservations", "Manage table bookings."],
    tables: ["Tables", "Monitor restaurant tables."],
    customers: ["Customers", "Manage customer information."],
    employees: ["Employees", "Manage restaurant employees."],
    inventory: ["Inventory", "Manage restaurant stock."],
    suppliers: ["Suppliers", "Manage restaurant suppliers."],
    expenses: ["Expenses", "Track restaurant expenses."],
    reports: ["Reports", "Restaurant business analytics."],
    settings: ["Settings", "Configure your restaurant system."]
};

// ==========================================
// 11. Page Navigation
// ==========================================

function showPage(page) {
    if (!pageInfo[page]) return;

    document.querySelectorAll(".page-section").forEach(section => {
        section.classList.remove("active");
    });

    const target = document.getElementById(page);

    if (target) {
        target.classList.add("active");
    }

    document.querySelectorAll(".sidebar-nav .nav-link").forEach(link => {
        link.classList.toggle(
            "active",
            link.dataset.page === page
        );
    });

    document.getElementById("pageTitle").textContent =
        pageInfo[page][0];

    document.getElementById("pageSubtitle").textContent =
        pageInfo[page][1];

    document.getElementById("sidebar").classList.remove("open");

    if (page === "dashboard") renderDashboard();
    if (page === "orders") renderOrders();
    if (page === "menu") renderMenu();
    if (page === "tables") renderTables();
    if (page === "customers") renderCustomers();
    if (page === "employees") renderEmployees();
    if (page === "inventory") renderInventory();
    if (page === "suppliers") renderSuppliers();
    if (page === "expenses") renderExpenses();
    if (page === "reports") renderReports();
    if (page === "settings") renderSettings();
}

document.querySelectorAll(".sidebar-nav .nav-link").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();
        showPage(link.dataset.page);
    });
});

// ==========================================
// 12. Mobile Sidebar
// ==========================================

document.getElementById("menuToggle").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
});

// ==========================================
// 13. Date
// ==========================================

function updateDate() {
    document.getElementById("currentDate").textContent =
        new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
}

// ==========================================
// 14. Dashboard
// ==========================================

function renderDashboard() {
    const revenue = orders
        .filter(order => order.status === "Completed")
        .reduce((sum, order) => sum + Number(order.amount), 0);

    const availableCount = restaurantTables.filter(
        table => table.status === "Available"
    ).length;

    document.getElementById("totalRevenue").textContent =
        money(revenue);

    document.getElementById("totalOrders").textContent =
        orders.length;

    document.getElementById("totalCustomers").textContent =
        new Set(orders.map(order => order.customer)).size + 181;

    document.getElementById("availableTables").textContent =
        `${availableCount}/20`;

    renderRecentOrders();
    renderPopularItems();
    renderSalesChart();
}

// ==========================================
// 15. Recent Orders
// ==========================================

function renderRecentOrders() {
    const body = document.getElementById("recentOrdersBody");
    if (!body) return;

    body.innerHTML = orders.slice(0, 5).map(order => `
        <tr>
            <td><strong>${escapeHTML(order.id)}</strong></td>
            <td>${escapeHTML(order.customer)}</td>
            <td>${escapeHTML(order.items)}</td>
            <td><strong>${money(order.amount)}</strong></td>
            <td>${statusBadge(order.status)}</td>
        </tr>
    `).join("");
}

// ==========================================
// 16. Popular Items
// ==========================================

function renderPopularItems() {
    const popular = document.getElementById("popularItems");
    if (!popular) return;

    popular.innerHTML = menuItems.slice(0, 5).map(item => `
        <div class="popular-item">
            <div class="food-image">${escapeHTML(item.emoji)}</div>

            <div class="food-info">
                <strong>${escapeHTML(item.name)}</strong>
                <small>${escapeHTML(item.category)}</small>
            </div>

            <div class="food-price">${money(item.price)}</div>
        </div>
    `).join("");
}

// ==========================================
// 17. Status Badge
// ==========================================

function statusBadge(status) {
    const className = String(status).toLowerCase();

    return `
        <span class="status ${escapeHTML(className)}">
            ${escapeHTML(status)}
        </span>
    `;
}

// ==========================================
// 18. Sales Chart
// ==========================================

function renderSalesChart() {
    const canvas = document.getElementById("salesChart");

    if (!canvas || typeof Chart === "undefined") return;

    if (salesChart) {
        salesChart.destroy();
    }

    salesChart = new Chart(canvas.getContext("2d"), {
        type: "line",

        data: {
            labels: ["01", "05", "10", "15", "20", "25", "30"],

            datasets: [{
                label: "Revenue",
                data: [2500, 4200, 3500, 6500, 5200, 7800, 9200],
                borderColor: "#2563eb",
                backgroundColor: "rgba(37,99,235,0.10)",
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: "#2563eb"
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                }
            },

            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: "#f1f5f9"
                    }
                },

                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// ==========================================
// 19. Orders Management
// ==========================================

function renderOrders() {
    const body = document.getElementById("ordersTableBody");
    if (!body) return;

    const searchInput = document.getElementById("orderSearch");

    const search = searchInput
        ? searchInput.value.toLowerCase()
        : "";

    const filtered = orders.filter(order =>
        String(order.id).toLowerCase().includes(search) ||
        String(order.customer).toLowerCase().includes(search)
    );

    if (filtered.length === 0) {
        body.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    No orders found.
                </td>
            </tr>
        `;
    } else {
        body.innerHTML = filtered.map(order => `
            <tr>
                <td><strong>${escapeHTML(order.id)}</strong></td>

                <td>${escapeHTML(order.customer)}</td>

                <td>${escapeHTML(order.items)}</td>

                <td><strong>${money(order.amount)}</strong></td>

                <td>${escapeHTML(order.date)}</td>

                <td>
                    <select
                        class="form-select form-select-sm"
                        onchange="updateOrderStatus('${escapeHTML(order.id)}', this.value)">

                        ${["Pending", "Preparing", "Completed", "Cancelled"].map(status => `
                            <option value="${status}"
                                ${order.status === status ? "selected" : ""}>
                                ${status}
                            </option>
                        `).join("")}

                    </select>
                </td>

                <td>
                    ${order.tableId
                        ? `Table ${String(order.tableId).padStart(2, "0")}<br>`
                        : ""
                    }

                    <button
                        class="action-btn delete"
                        onclick="deleteOrder('${escapeHTML(order.id)}')">

                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join("");
    }

    document.getElementById("orderCount").textContent =
        orders.length;

    document.getElementById("pendingCount").textContent =
        orders.filter(order => order.status === "Pending").length;

    document.getElementById("completedCount").textContent =
        orders.filter(order => order.status === "Completed").length;

    document.getElementById("cancelledCount").textContent =
        orders.filter(order => order.status === "Cancelled").length;

    renderOrdersChart();
}

// ==========================================
// 20. Update Order Status - MySQL
// ==========================================

async function updateOrderStatus(id, status) {
    const order = orders.find(item => item.id === id);
    if (!order) return;

    const allowedStatuses = [
        "Pending",
        "Preparing",
        "Completed",
        "Cancelled"
    ];

    if (!allowedStatuses.includes(status)) return;

    const activeStatuses = ["Pending", "Preparing"];

    if (activeStatuses.includes(status) && order.tableId) {
        const table = restaurantTables.find(
            item => item.id === Number(order.tableId)
        );

        const anotherActiveOrder = orders.some(item =>
            item.id !== id &&
            Number(item.tableId) === Number(order.tableId) &&
            activeStatuses.includes(item.status)
        );

        if (!table || anotherActiveOrder ||
            (table.status !== "Available" &&
             table.status !== "Occupied")) {

            alert("This table is not available for this order.");
            renderOrders();
            return;
        }
    }

    try {
        await apiRequest(
            `${API_URL}/${encodeURIComponent(id)}`,
            {
                method: "PATCH",
                body: JSON.stringify({ status })
            }
        );

        await loadOrders();

        renderOrders();
        renderDashboard();
        renderTables();

    } catch (error) {
        alert(error.message);
        renderOrders();
    }
}

// ==========================================
// 21. Delete Order - MySQL
// ==========================================

async function deleteOrder(id) {
    if (!confirm("Are you sure you want to delete this order?")) {
        return;
    }

    try {
        await apiRequest(
            `${API_URL}/${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        await loadOrders();

        renderOrders();
        renderDashboard();
        renderTables();

        alert("Order deleted successfully!");

    } catch (error) {
        alert(error.message);
    }
}

document.getElementById("orderSearch").addEventListener(
    "input",
    renderOrders
);

// ==========================================
// 22. Orders Chart
// ==========================================

function renderOrdersChart() {
    const canvas = document.getElementById("ordersChart");

    if (!canvas || typeof Chart === "undefined") return;

    if (ordersChart) {
        ordersChart.destroy();
    }

    const statuses = [
        "Completed",
        "Pending",
        "Preparing",
        "Cancelled"
    ];

    const counts = statuses.map(status =>
        orders.filter(order => order.status === status).length
    );

    ordersChart = new Chart(canvas, {
        type: "bar",

        data: {
            labels: statuses,

            datasets: [{
                label: "Orders",
                data: counts,
                backgroundColor: [
                    "#16a34a",
                    "#f59e0b",
                    "#2563eb",
                    "#dc2626"
                ],
                borderRadius: 7
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                }
            },

            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// ==========================================
// 23. Add Order - MySQL
// ==========================================

document.getElementById("addOrderBtn").addEventListener("click", () => {

    const availableTables = restaurantTables.filter(
        table => table.status === "Available"
    );

    if (!availableTables.length) {
        alert("Sorry! There are no available tables.");
        return;
    }

    openModal("Create New Order", `
        <div class="mb-3">
            <label class="form-label">Customer Name</label>

            <input
                class="form-control"
                id="newOrderCustomer"
                placeholder="Customer name">
        </div>

        <div class="mb-3">
            <label class="form-label">Food Items</label>

            <input
                class="form-control"
                id="newOrderItems"
                placeholder="Burger, Pizza">
        </div>

        <div class="mb-3">
            <label class="form-label">Total Amount (৳)</label>

            <input
                type="number"
                min="1"
                class="form-control"
                id="newOrderAmount"
                placeholder="500">
        </div>

        <div class="mb-3">
            <label class="form-label">Select Available Table</label>

            <select class="form-select" id="newOrderTable" required>
                <option value="">Choose a table</option>

                ${availableTables.map(table => `
                    <option value="${table.id}">
                        Table ${String(table.id).padStart(2, "0")}
                    </option>
                `).join("")}
            </select>
        </div>
    `, async () => {

        const customer = document.getElementById(
            "newOrderCustomer"
        ).value.trim();

        const items = document.getElementById(
            "newOrderItems"
        ).value.trim();

        const amount = Number(
            document.getElementById("newOrderAmount").value
        );

        const tableId = Number(
            document.getElementById("newOrderTable").value
        );

        if (
            !customer ||
            !items ||
            !Number.isFinite(amount) ||
            amount <= 0 ||
            !tableId
        ) {
            alert("Please complete all fields and select a table.");
            return false;
        }

        const selectedTable = restaurantTables.find(
            table => table.id === tableId
        );

        if (!selectedTable || selectedTable.status !== "Available") {
            alert("This table is no longer available.");
            return false;
        }

        const newOrder = {
            order_number: "ORD-" + Date.now().toString().slice(-6),
            customer_name: customer,
            items: items,
            total_amount: amount,
            status: "Pending",
            table_id: tableId
        };

        try {
            await apiRequest(API_URL, {
                method: "POST",
                body: JSON.stringify(newOrder)
            });

            await loadOrders();

            renderOrders();
            renderDashboard();
            renderTables();

            alert("New order saved successfully!");

            return true;

        } catch (error) {
            alert(error.message);
            return false;
        }
    });
});

// ==========================================
// 24. Food Menu
// ==========================================

function renderMenu() {
    const grid = document.getElementById("menuGrid");
    if (!grid) return;

    const searchInput = document.getElementById("menuSearch");

    const search = searchInput
        ? searchInput.value.toLowerCase()
        : "";

    const filtered = menuItems.filter(item =>
        item.name.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search)
    );

    if (!filtered.length) {
        grid.innerHTML = `
            <div class="empty-state">
                No food items found.
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(item => `
        <div class="menu-card">

            <div class="menu-card-image">
                ${escapeHTML(item.emoji)}
            </div>

            <div class="menu-card-body">

                <h6>${escapeHTML(item.name)}</h6>

                <p>
                    ${escapeHTML(item.category)}
                    ·
                    ${item.available ? "Available" : "Unavailable"}
                </p>

                <div class="menu-card-footer">

                    <strong>${money(item.price)}</strong>

                    <div>

                        <button
                            class="action-btn"
                            onclick="toggleFood(${item.id})"
                            title="Toggle availability">

                            <i class="bi bi-toggle-${item.available ? "on" : "off"}"></i>
                        </button>

                        <button
                            class="action-btn delete"
                            onclick="deleteFood(${item.id})"
                            title="Delete">

                            <i class="bi bi-trash"></i>
                        </button>

                    </div>
                </div>
            </div>
        </div>
    `).join("");
}

document.getElementById("menuSearch").addEventListener(
    "input",
    renderMenu
);

function toggleFood(id) {
    const item = menuItems.find(food => food.id === id);
    if (!item) return;

    item.available = !item.available;

    saveData();
    renderMenu();
}

function deleteFood(id) {
    if (!confirm("Delete this food item?")) return;

    menuItems = menuItems.filter(food => food.id !== id);

    saveData();
    renderMenu();
    renderPopularItems();
}

document.getElementById("addFoodBtn").addEventListener("click", () => {

    openModal("Add New Food", `
        <div class="mb-3">
            <label class="form-label">Food Name</label>
            <input class="form-control" id="foodName" placeholder="Chicken Burger">
        </div>

        <div class="mb-3">
            <label class="form-label">Category</label>
            <input class="form-control" id="foodCategory" placeholder="Fast Food">
        </div>

        <div class="mb-3">
            <label class="form-label">Price (৳)</label>
            <input type="number" min="1" class="form-control" id="foodPrice" placeholder="350">
        </div>

        <div class="mb-3">
            <label class="form-label">Emoji</label>
            <input class="form-control" id="foodEmoji" value="🍔">
        </div>
    `, () => {

        const name = document.getElementById("foodName").value.trim();
        const category = document.getElementById("foodCategory").value.trim();
        const price = Number(document.getElementById("foodPrice").value);
        const emoji = document.getElementById("foodEmoji").value.trim() || "🍽️";

        if (!name || !category || !Number.isFinite(price) || price <= 0) {
            alert("Please fill all fields correctly.");
            return false;
        }

        menuItems.push({
            id: Date.now(),
            name,
            category,
            price,
            emoji,
            available: true
        });

        saveData();
        renderMenu();
        renderPopularItems();

        return true;
    });
});

// ==========================================
// 25. Modal Helper
// ==========================================

const modalElement = document.getElementById("appModal");
const appModal = new bootstrap.Modal(modalElement);

function openModal(title, content, saveCallback) {

    document.getElementById("modalTitle").textContent = title;

    document.getElementById("modalBody").innerHTML = content;

    const saveButton = document.getElementById("modalSaveBtn");

    saveButton.onclick = async () => {

        saveButton.disabled = true;

        try {
            const result = await saveCallback();

            if (result !== false) {
                appModal.hide();
            }

        } catch (error) {
            alert(error.message);

        } finally {
            saveButton.disabled = false;
        }
    };

    appModal.show();
}

// ==========================================
// 26. Tables Management
// ==========================================

function renderTables() {
    const container = document.getElementById("tablesContent");
    if (!container) return;

    const available = restaurantTables.filter(
        table => table.status === "Available"
    ).length;

    const occupied = restaurantTables.filter(
        table => table.status === "Occupied"
    ).length;

    const reserved = restaurantTables.filter(
        table => table.status === "Reserved"
    ).length;

    container.innerHTML = `
        <div class="table-manager">

            <div class="table-manager-summary">

                <div class="table-manager-stat">
                    <span>Available</span>
                    <h3>${available}</h3>
                </div>

                <div class="table-manager-stat">
                    <span>Occupied</span>
                    <h3>${occupied}</h3>
                </div>

                <div class="table-manager-stat">
                    <span>Reserved</span>
                    <h3>${reserved}</h3>
                </div>

                <div class="table-manager-stat">
                    <span>Total Tables</span>
                    <h3>${restaurantTables.length}</h3>
                </div>

            </div>

            <div class="table-manager-grid">

                ${restaurantTables.map(table => `
                    <div class="managed-table ${table.status.toLowerCase()}">

                        <div class="managed-table-icon">
                            <i class="bi bi-grid-3x3"></i>
                        </div>

                        <h5>
                            Table ${String(table.id).padStart(2, "0")}
                        </h5>

                        <span class="managed-table-status">
                            ${table.status}
                        </span>

                        <select
                            class="form-select table-status-select"
                            data-table-id="${table.id}"
                            aria-label="Change status for table ${table.id}">

                            <option value="Available"
                                ${table.status === "Available" ? "selected" : ""}>
                                Available
                            </option>

                            <option value="Occupied"
                                ${table.status === "Occupied" ? "selected" : ""}>
                                Occupied
                            </option>

                            <option value="Reserved"
                                ${table.status === "Reserved" ? "selected" : ""}>
                                Reserved
                            </option>

                        </select>

                    </div>
                `).join("")}

            </div>
        </div>
    `;
}

// ==========================================
// 27. Change Table Status
// ==========================================

document.addEventListener("change", event => {

    if (!event.target.matches(".table-status-select")) return;

    const tableId = Number(event.target.dataset.tableId);
    const newStatus = event.target.value;

    const table = restaurantTables.find(
        item => item.id === tableId
    );

    if (!table) return;

    const hasActiveOrder = orders.some(order =>
        Number(order.tableId) === tableId &&
        ["Pending", "Preparing"].includes(order.status)
    );

    if (newStatus === "Available" && hasActiveOrder) {
        alert(
            "This table has an active order. Complete or cancel that order first."
        );

        renderTables();
        return;
    }

    table.status = newStatus;

    saveTableStatuses();

    renderTables();
    renderDashboard();
});

// ==========================================
// 28. Customers
// ==========================================

function renderCustomers() {

    const customers = [...new Set(
        orders.map(order => order.customer)
    )];

    document.getElementById("customersContent").innerHTML = `
        <div class="table-responsive">

            <table class="table">

                <thead>
                    <tr>
                        <th>Customer Name</th>
                        <th>Total Orders</th>
                        <th>Total Spent</th>
                    </tr>
                </thead>

                <tbody>

                    ${customers.map(customer => {

                        const customerOrders = orders.filter(
                            order => order.customer === customer
                        );

                        const spent = customerOrders.reduce(
                            (sum, order) => sum + Number(order.amount),
                            0
                        );

                        return `
                            <tr>
                                <td>${escapeHTML(customer)}</td>
                                <td>${customerOrders.length}</td>
                                <td>${money(spent)}</td>
                            </tr>
                        `;

                    }).join("")}

                </tbody>
            </table>
        </div>
    `;
}

// ==========================================
// 29. Employees
// ==========================================

const employees = [
    ["Rahim Ahmed", "Manager", "Active"],
    ["Karim Hasan", "Chef", "Active"],
    ["Sadia Islam", "Cashier", "Active"],
    ["Tanvir Hossain", "Waiter", "Active"],
    ["Nusrat Jahan", "Waiter", "Active"]
];

function renderEmployees() {

    document.getElementById("employeesContent").innerHTML = `
        <div class="table-responsive">

            <table class="table">

                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Position</th>
                        <th>Status</th>
                    </tr>
                </thead>

                <tbody>

                    ${employees.map(employee => `
                        <tr>
                            <td>${escapeHTML(employee[0])}</td>
                            <td>${escapeHTML(employee[1])}</td>
                            <td>${statusBadge(employee[2])}</td>
                        </tr>
                    `).join("")}

                </tbody>
            </table>
        </div>
    `;
}

// ==========================================
// 30. Inventory
// ==========================================

const inventory = [
    ["Chicken", "Meat", "25 kg", "Available"],
    ["Rice", "Grains", "50 kg", "Available"],
    ["Cooking Oil", "Grocery", "10 L", "Available"],
    ["Cheese", "Dairy", "2 kg", "Low Stock"],
    ["Potato", "Vegetables", "30 kg", "Available"]
];

function renderInventory() {

    document.getElementById("inventoryContent").innerHTML = `
        <div class="table-responsive">

            <table class="table">

                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Stock</th>
                        <th>Status</th>
                    </tr>
                </thead>

                <tbody>

                    ${inventory.map(item => `
                        <tr>
                            <td>${escapeHTML(item[0])}</td>
                            <td>${escapeHTML(item[1])}</td>
                            <td>${escapeHTML(item[2])}</td>
                            <td>${escapeHTML(item[3])}</td>
                        </tr>
                    `).join("")}

                </tbody>
            </table>
        </div>
    `;
}

// ==========================================
// 31. Suppliers
// ==========================================

const suppliers = [
    ["Fresh Foods BD", "Food Supplier", "01700000001"],
    ["Daily Grocery", "Grocery Supplier", "01700000002"],
    ["City Beverage", "Drinks Supplier", "01700000003"]
];

function renderSuppliers() {

    document.getElementById("suppliersContent").innerHTML = `
        <div class="table-responsive">

            <table class="table">

                <thead>
                    <tr>
                        <th>Supplier</th>
                        <th>Category</th>
                        <th>Phone</th>
                    </tr>
                </thead>

                <tbody>

                    ${suppliers.map(supplier => `
                        <tr>
                            <td>${escapeHTML(supplier[0])}</td>
                            <td>${escapeHTML(supplier[1])}</td>
                            <td>${escapeHTML(supplier[2])}</td>
                        </tr>
                    `).join("")}

                </tbody>
            </table>
        </div>
    `;
}

// ==========================================
// 32. Expenses
// ==========================================

const expenses = [
    ["Shop Rent", 15000],
    ["Electricity", 3500],
    ["Staff Salary", 25000],
    ["Food Purchase", 12000],
    ["Other Expenses", 2500]
];

function renderExpenses() {

    const total = expenses.reduce(
        (sum, expense) => sum + expense[1],
        0
    );

    document.getElementById("expensesContent").innerHTML = `
        <h4 class="mb-4">
            Total Expenses: ${money(total)}
        </h4>

        <div class="table-responsive">

            <table class="table">

                <thead>
                    <tr>
                        <th>Expense Name</th>
                        <th>Amount</th>
                    </tr>
                </thead>

                <tbody>

                    ${expenses.map(expense => `
                        <tr>
                            <td>${escapeHTML(expense[0])}</td>
                            <td>${money(expense[1])}</td>
                        </tr>
                    `).join("")}

                </tbody>
            </table>
        </div>
    `;
}

// ==========================================
// 33. Reports
// ==========================================

function renderReports() {

    const revenue = orders
        .filter(order => order.status === "Completed")
        .reduce((sum, order) => sum + Number(order.amount), 0);

    document.getElementById("reportsContent").innerHTML = `
        <div class="stats-grid">

            <div class="stat-card">
                <span>Total Orders</span>
                <h3>${orders.length}</h3>
            </div>

            <div class="stat-card">
                <span>Total Revenue</span>
                <h3>${money(revenue)}</h3>
            </div>

            <div class="stat-card">
                <span>Menu Items</span>
                <h3>${menuItems.length}</h3>
            </div>

            <div class="stat-card">
                <span>Completed Orders</span>
                <h3>${orders.filter(order =>
                    order.status === "Completed"
                ).length}</h3>
            </div>

        </div>

        <p class="text-muted mt-3">
            Order reports are loaded from the MySQL database.
            Menu data is stored in this browser.
        </p>
    `;
}

// ==========================================
// 34. Settings
// ==========================================

function renderSettings() {

    const savedName =
        localStorage.getItem("restaurantName") ||
        "RestaurantOS Demo";

    document.getElementById("settingsContent").innerHTML = `
        <div class="mb-4">

            <label class="form-label">
                Restaurant Name
            </label>

            <input
                class="form-control"
                id="restaurantName"
                value="${escapeHTML(savedName)}">

        </div>

        <div class="mb-4">

            <label class="form-label">
                Currency
            </label>

            <select class="form-select" id="restaurantCurrency">
                <option value="BDT">
                    Bangladeshi Taka (৳)
                </option>
            </select>

        </div>

        <button
            class="btn btn-primary"
            onclick="saveSettings()">

            Save Settings
        </button>

        <button
            class="btn btn-outline-danger ms-2"
            onclick="resetDemoData()">

            Reset Local Demo Data
        </button>
    `;
}

function saveSettings() {

    const name = document.getElementById(
        "restaurantName"
    ).value.trim();

    if (!name) {
        alert("Enter a restaurant name.");
        return;
    }

    localStorage.setItem("restaurantName", name);

    alert("Settings saved successfully!");
}

// Reset only local demo data.
// MySQL orders are not deleted.
function resetDemoData() {

    if (!confirm(
        "Reset menu items and table statuses? MySQL orders will NOT be deleted."
    )) {
        return;
    }

    localStorage.removeItem("restaurantMenu");
    localStorage.removeItem("restaurantTableStatuses");

    menuItems = [...defaultMenu];

    restaurantTables.forEach(table => {
        table.status = "Available";
    });

    syncTablesWithOrders();

    saveData();

    renderDashboard();

    alert(
        "Local demo data reset. Database orders have been preserved."
    );
}

// ==========================================
// 35. Notifications
// ==========================================

document.getElementById("notificationBtn").addEventListener("click", () => {
    alert("You are all caught up! No new notifications.");
});

// ==========================================
// 36. Sales Period
// ==========================================

document.getElementById("salesPeriod").addEventListener("change", () => {
    renderSalesChart();
});

// ==========================================
// 37. Initialize Application
// ==========================================

async function initializeRestaurantOS() {

    updateDate();

    // Load real orders from MySQL first.
    const loaded = await loadOrders();

    if (loaded) {
        renderDashboard();
    } else {
        orders = [];
        renderDashboard();
    }

    renderTables();
}

// ==========================================
// 38. Start Application
// ==========================================

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeRestaurantOS
    );

} else {

    initializeRestaurantOS();

}

// ==========================================
// END - RestaurantOS MySQL Connected JS
// ==========================================
