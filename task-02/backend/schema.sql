-- Drop existing tables
DROP TABLE IF EXISTS refunds CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- Create Products Table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    reserved_quantity INT NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    rating NUMERIC(3, 1) DEFAULT 4.5,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Orders Table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'RESERVED' CHECK (status IN ('PENDING', 'RESERVED', 'PAID', 'REFUNDED', 'CANCELLED', 'EXPIRED', 'FAILED')),
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

-- Create Refunds Table
CREATE TABLE refunds (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    reason VARCHAR(255) DEFAULT 'Customer requested refund',
    refund_status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Sample E-Commerce Products
INSERT INTO products (name, description, category, price, stock_quantity, rating, image_url) VALUES
('QuantumX Mechanical Keyboard', 'RGB Backlit, Hot-Swappable Tactile Switches for gaming and productivity', 'Peripherals', 129.99, 12, 4.8, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80'),
('UltraView 27-inch 4K Monitor', 'HDR400 IPS Display, 144Hz Refresh Rate with USB-C Hub built-in', 'Electronics', 399.50, 6, 4.9, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80'),
('SonicPro ANC Wireless Headphones', 'Active Noise Cancellation, 40-hour Battery Life, Spatial Audio', 'Audio', 189.00, 15, 4.7, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'),
('ErgoDesk Dual Motor Standing Desk', 'Electric Height Adjustable, Memory Presets, Heavy-Duty Steel Frame', 'Furniture', 450.00, 4, 4.6, 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=600&q=80'),
('TechLoom HD POS Thermal Printer', 'High-speed receipt printing with Auto-Cutter for retail and dining', 'POS Hardware', 95.00, 8, 4.8, 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'),
('ProStreamer 4K Webcam', 'Autofocus, Dual Noise-Canceling Microphones, Low Light Enhancement', 'Electronics', 79.99, 20, 4.5, 'https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?auto=format&fit=crop&w=600&q=80'),
('Precision Wireless Ergonomic Mouse', 'Multi-Device Pairing, Silent Clicks, Ergonomic Thumb Rest', 'Peripherals', 49.99, 25, 4.6, 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80');
