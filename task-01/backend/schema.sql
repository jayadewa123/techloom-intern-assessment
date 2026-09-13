-- Drop existing tables if they exist
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- Create Products Table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    reserved_quantity INT NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Orders Table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'RESERVED' CHECK (status IN ('PENDING', 'RESERVED', 'PAID', 'CANCELLED', 'EXPIRED', 'FAILED')),
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    idempotency_key VARCHAR(255) UNIQUE,
    reservation_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Order Items Table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL
);

-- Create Payment Transactions Table
CREATE TABLE payment_transactions (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('SUCCESS', 'FAILURE', 'TIMEOUT')),
    amount NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert Seed Data
INSERT INTO products (name, sku, price, stock_quantity, reserved_quantity) VALUES
('Wireless POS Barcode Scanner', 'POS-SCN-001', 49.99, 15, 0),
('Thermal Receipt Printer 80mm', 'POS-PRN-002', 89.50, 10, 0),
('Heavy-Duty Cash Drawer', 'POS-DWR-003', 35.00, 8, 0),
('10.1 inch Touchscreen POS Terminal', 'POS-TRM-004', 299.00, 5, 0),
('Magnetic Card Reader (MSR)', 'POS-MSR-005', 19.99, 25, 0),
('Thermal Receipt Paper Rolls (Pack of 10)', 'POS-PPR-006', 12.00, 50, 0);
