-- =================================================================
--         UBER CLONE V2 - COMPLETE DATABASE SCHEMA
-- =================================================================
-- This script contains all table definitions for the ride-sharing,
-- delivery, and marketplace features.
-- Execute in order to ensure dependencies are met.
-- =================================================================

-- =========================================
-- SECTION 1: CORE USER & DRIVER TABLES
-- =========================================

-- Stores basic user information linked to Clerk ID
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    clerk_id VARCHAR(50) UNIQUE NOT NULL
);

-- Stores driver/courier information, their vehicle, and status
CREATE TABLE drivers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    profile_image_url TEXT,
    car_image_url TEXT,
    car_model VARCHAR(100),
    license_plate VARCHAR(20) UNIQUE,
    car_seats INTEGER NOT NULL CHECK (car_seats > 0),
    status VARCHAR(20) DEFAULT 'offline', -- offline, online, in_ride, on_delivery
    verification_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    can_do_deliveries BOOLEAN DEFAULT false
);

-- Stores driver verification documents
CREATE TABLE driver_documents (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id) NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- e.g., 'license', 'vehicle_registration'
    document_url TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verification_status VARCHAR(20) DEFAULT 'pending'
);

-- =========================================
-- SECTION 2: RIDE-SHARING TABLES
-- =========================================

-- Defines different ride tiers and their pricing structure
CREATE TABLE ride_tiers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    base_fare DECIMAL(10, 2) NOT NULL,
    per_minute_rate DECIMAL(10, 2) NOT NULL,
    per_mile_rate DECIMAL(10, 2) NOT NULL,
    image_url TEXT
);

-- Stores information about each ride
CREATE TABLE rides (
    ride_id SERIAL PRIMARY KEY,
    origin_address VARCHAR(255) NOT NULL,
    destination_address VARCHAR(255) NOT NULL,
    origin_latitude DECIMAL(9, 6) NOT NULL,
    origin_longitude DECIMAL(9, 6) NOT NULL,
    destination_latitude DECIMAL(9, 6) NOT NULL,
    destination_longitude DECIMAL(9, 6) NOT NULL,
    ride_time INTEGER NOT NULL,
    fare_price DECIMAL(10, 2) NOT NULL CHECK (fare_price >= 0),
    payment_status VARCHAR(20) NOT NULL,
    driver_id INTEGER REFERENCES drivers(id),
    user_id VARCHAR(100) NOT NULL,
    tier_id INTEGER REFERENCES ride_tiers(id),
    scheduled_for TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- SECTION 3: MARKETPLACE & DELIVERY TABLES
-- =========================================

-- Represents businesses on the platform (restaurants, shops, etc.)
CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    latitude DECIMAL(9, 6) NOT NULL,
    longitude DECIMAL(9, 6) NOT NULL,
    category VARCHAR(50), -- e.g., 'Restaurant', 'Groceries', 'Pharmacy'
    cuisine_type VARCHAR(50), -- e.g., 'Italian', 'Mexican'
    logo_url TEXT,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    is_open BOOLEAN DEFAULT true,
    owner_clerk_id VARCHAR(50)
);

-- Represents items sold by stores
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    category VARCHAR(50), -- e.g., 'Appetizers', 'Main Course', 'Beverages'
    is_available BOOLEAN DEFAULT true
);

-- Tracks a delivery order from creation to completion
CREATE TABLE delivery_orders (
    order_id SERIAL PRIMARY KEY,
    user_clerk_id VARCHAR(50) NOT NULL,
    store_id INTEGER REFERENCES stores(id) NOT NULL,
    courier_id INTEGER REFERENCES drivers(id),
    delivery_address VARCHAR(255) NOT NULL,
    delivery_latitude DECIMAL(9, 6) NOT NULL,
    delivery_longitude DECIMAL(9, 6) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) NOT NULL,
    tip DECIMAL(10, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'pending', -- pending, preparing, ready_for_pickup, picked_up, delivered, cancelled
    payment_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Join table for products within a delivery order
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES delivery_orders(order_id) NOT NULL,
    product_id INTEGER REFERENCES products(id) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase DECIMAL(10, 2) NOT NULL
);

-- =========================================
-- SECTION 4: SHARED & GENERAL PURPOSE TABLES
-- =========================================

-- Manages promotional codes and discounts for rides or deliveries
CREATE TABLE promotions (
    id SERIAL PRIMARY KEY,
    promo_code VARCHAR(50) UNIQUE NOT NULL,
    discount_percentage DECIMAL(5, 2),
    discount_amount DECIMAL(10, 2),
    expiry_date DATE,
    is_active BOOLEAN DEFAULT true
);

-- Manages user wallet balances
CREATE TABLE wallets (
    id SERIAL PRIMARY KEY,
    user_clerk_id VARCHAR(50) NOT NULL UNIQUE,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tracks all wallet transactions (credits and debits)
CREATE TABLE wallet_transactions (
    id SERIAL PRIMARY KEY,
    wallet_id INTEGER REFERENCES wallets(id) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL, -- 'credit', 'debit'
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stores ratings for rides, deliveries, or stores
-- A generic rating table can be more flexible
CREATE TABLE ratings (
    id SERIAL PRIMARY KEY,
    ride_id INTEGER REFERENCES rides(ride_id), -- For ride ratings
    order_id INTEGER REFERENCES delivery_orders(order_id), -- For delivery ratings
    store_id INTEGER REFERENCES stores(id), -- For store ratings
    rated_by_clerk_id VARCHAR(50) NOT NULL,
    rated_clerk_id VARCHAR(50), -- For rating a driver/courier
    rating_value INTEGER NOT NULL CHECK (rating_value BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stores emergency contacts for users
CREATE TABLE emergency_contacts (
    id SERIAL PRIMARY KEY,
    user_clerk_id VARCHAR(50) NOT NULL,
    contact_name VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL
);

-- Stores chat messages for rides or deliveries
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    ride_id INTEGER REFERENCES rides(ride_id),
    order_id INTEGER REFERENCES delivery_orders(order_id),
    sender_clerk_id VARCHAR(50) NOT NULL,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
