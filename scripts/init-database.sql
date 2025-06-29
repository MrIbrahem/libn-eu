-- Initialize SQLite database for Triangle Area Calculator
-- This script creates the necessary tables for storing calculation logs

-- Create calculations table to store all triangle area calculations
CREATE TABLE IF NOT EXISTS calculations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    side1 REAL NOT NULL,
    side2 REAL NOT NULL,
    hypotenuse REAL NOT NULL,
    area_m2 REAL NOT NULL,
    area_labnah REAL NOT NULL,
    session_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create calculation_logs table for detailed operation logs
CREATE TABLE IF NOT EXISTS calculation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    calculation_id INTEGER,
    log_type TEXT NOT NULL, -- 'calculation', 'add_to_total', 'error'
    message TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (calculation_id) REFERENCES calculations(id)
);

-- Create totals table to track cumulative totals per session
CREATE TABLE IF NOT EXISTS totals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    total_area_m2 REAL DEFAULT 0,
    total_area_labnah REAL DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calculations_timestamp ON calculations(timestamp);
CREATE INDEX IF NOT EXISTS idx_calculations_session ON calculations(session_id);
CREATE INDEX IF NOT EXISTS idx_logs_calculation_id ON calculation_logs(calculation_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON calculation_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_totals_session ON totals(session_id);

-- Insert sample data for testing (optional)
-- INSERT INTO calculations (side1, side2, hypotenuse, area_m2, area_labnah, session_id) 
-- VALUES (3.0, 4.0, 5.0, 6.0, 0.135135, 'sample-session');
