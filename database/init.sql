-- Vaidya-Vaani MVP Database Schema
-- PostgreSQL initialization script

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing table if exists
DROP TABLE IF EXISTS users CASCADE;

-- Users table - Authentication and basic info only
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('patient', 'doctor', 'staff', 'pharmacist')),
    name VARCHAR(200) NOT NULL,
    preferred_language VARCHAR(10) DEFAULT 'en',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_users_active ON users(is_active);

-- Sample data for testing
INSERT INTO users (phone_number, password_hash, user_type, name, preferred_language) VALUES
('9876543210', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIq.8MvH3W', 'patient', 'Ramesh Rao', 'te'),
('9876543211', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIq.8MvH3W', 'doctor', 'Dr. Priya Singh', 'en'),
('9876543212', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIq.8MvH3W', 'staff', 'Sunita Reddy', 'hi'),
('9876543213', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIq.8MvH3W', 'pharmacist', 'Ajay Kumar', 'en');

-- Password for all test users: password123
