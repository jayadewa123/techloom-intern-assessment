# Techloom.ai Practical Assessment - Full Solution

[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-brightgreen)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue)](https://www.postgresql.org)
[![React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-61dafb)](https://reactjs.org)

## 📌 Submission Information

- **GitHub Repository**: https://github.com/jayadewa123/techloom-intern-assessment
- **Live Deployment Task 01 (POS System)**: https://techloom-intern-assessment-t6rp.vercel.app/
- **Live Deployment Task 02 (E-Commerce Storefront)**: https://techloom-intern-assessment-qks4.vercel.app/ 

---

## 📁 Repository Structuree

```
c:\Users\HP\Desktop\Techloom_Intern_Assessment
├── task-01/                                # Section 01: POS Order & Inventory System
│   ├── backend/                            # Express.js + PostgreSQL (Port 5000)
│   │   ├── schema.sql                      # DDL schema & sample POS products seed
│   │   ├── server.js                       # Entry point & 5-min auto-expiry worker
│   │   ├── src/
│   │   │   ├── config/ (db.js, initDb.js)  # PostgreSQL pool & auto-init
│   │   │   ├── services/                   # Product, Order, Payment & Worker logic
│   │   │   └── routes/                     # REST API endpoints
│   │   ├── .env.example
│   │   └── package.json
│   └── frontend/                           # React POS UI (Port 5173)
│       ├── src/
│       │   ├── components/                 # Catalog, Cart, PaymentModal, History
│       │   ├── api.js
│       │   ├── App.jsx
│       │   └── index.css
│       └── package.json
│
└── task-02/                                # Section 02: E-Commerce Checkout & Payment System
    ├── backend/                            # Express.js + PostgreSQL (Port 5001)
    │   ├── schema.sql                      # DDL schema & E-commerce products seed
    │   ├── server.js                       # Entry point & stock reservation worker
    │   ├── src/
    │   │   ├── config/ (db.js, initDb.js)  # PostgreSQL pool & auto-init
    │   │   ├── services/                   # Product discovery, Orders, Refunds, Payments
    │   │   └── routes/                     # REST API endpointss
    │   ├── .env.example
    │   └── package.json
    └── frontend/                           # React Storefront UI (Port 5174)
        ├── src/
        │   ├── components/                 # Navbar, ProductGrid, DetailModal, CartDrawer, History
        │   ├── api.js
        │   ├── App.jsx
        │   └── index.css
        └── package.json
```

---

## 🚀 Tech Stack

- **Backend**: Node.js, Express.js, PostgreSQL (`pg` driver with connection pooling & ACID row-level locking `SELECT ... FOR UPDATE`).
- **Frontend**: React.js (Vite), Axios, Lucide Icons, Custom CSS Design System.
- **Database**: PostgreSQL (pgAdmin4 compatible).

---

## ⚡ Setup & Installation Instructions

### 1. Database Configuration (PostgreSQL / pgAdmin4)
Ensure PostgreSQL service is running on your machine.
Update the database credentials in `task-01/backend/.env` and `task-02/backend/.env` if your local postgres password is not `postgres`:

**`task-01/backend/.env`**:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=techloom_pos
DB_USER=postgres
DB_PASSWORD=postgres
RESERVATION_TTL_MINUTES=5
```

**`task-02/backend/.env`**:
```env
PORT=5001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=techloom_store
DB_USER=postgres
DB_PASSWORD=postgres
RESERVATION_TTL_MINUTES=5
```

---

### 2. Task 01 - POS System Execution

#### Run Backend:
```bash
cd task-01/backend
npm install
npm run db:init      # Automatically creates 'techloom_pos' DB & seeds initial products
npm run dev          # Runs backend on http://localhost:5000
```

#### Run Frontend:
```bash
cd task-01/frontend
npm install
npm run dev          # Runs React POS UI on http://localhost:5173
```

---

### 3. Task 02 - E-Commerce Storefront Execution

#### Run Backend:
```bash
cd task-02/backend
npm install
npm run db:init      # Automatically creates 'techloom_store' DB & seeds storefront products
npm run dev          # Runs backend on http://localhost:5001
```

#### Run Frontend:
```bash
cd task-02/frontend
npm install
npm run dev          # Runs React Storefront on http://localhost:5174
```

---

## 🧪 Feature Testing Guide

### 1. Concurrency Safety & Overselling Prevention
- **Test**: Open multiple browser tabs or send concurrent HTTP POST requests to `/api/orders/checkout` for a product with limited stock (e.g. 5 units).
- **Behavior**: PostgreSQL row locks (`SELECT ... FOR UPDATE`) ensure only available units are allocated. Once stock hits zero, subsequent concurrent checkout attempts receive an explicit `409 Insufficient Stock` error without creating negative inventory or partial order corruption.

### 2. 5-Minute Stock Reservation & Expiry Worker
- **Test**: Add products to cart and proceed to checkout.
- **Behavior**: Stock is immediately deducted from available stock and moved to `reserved_quantity`. A 5-minute countdown timer appears on the payment modal. If payment is not completed within 5 minutes, the backend background worker automatically updates the order status to `EXPIRED` and restores the reserved stock back to available stock.

### 3. Mock Payment Gateway Outcomes
- **SUCCESS**: Updates order status to `PAID`, permanently deducting reserved stock.
- **FAILURE**: Updates order status to `FAILED` and restores reserved stock to available stock immediately.
- **TIMEOUT**: Updates order status to `EXPIRED` and restores reserved stock to available stock immediately.

### 4. Idempotency & Duplicate Submission Prevention
- **Test**: Click the "Test Duplicate Payment Click" button in the payment modal.
- **Behavior**: The backend checks the `idempotency_key`. The second request is safely detected and blocked, returning `200 OK` with a duplicate submission notification and preventing double charges or multiple orders.

### 5. Order Cancellation & Refund Simulation (Task 02)
- **Test**: Go to "My Orders" in the storefront and click "Request Refund & Restore Stock" on a paid order.
- **Behavior**: The backend generates a refund transaction record in the `refunds` table, updates the order status to `REFUNDED`, and immediately restores the item stock to the available inventory.
