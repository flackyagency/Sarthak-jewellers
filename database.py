import sqlite3
import os
import hashlib

DB_FILE = 'shop.db'

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def init_db():
    conn = get_db_connection()
    c = conn.cursor()

    # Create Users table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT DEFAULT "",
            phone TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        )
    ''')

    # Create Products table
    c.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            image TEXT NOT NULL,
            category TEXT NOT NULL
        )
    ''')

    # Create Orders Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_phone TEXT NOT NULL,
            customer_address TEXT NOT NULL,
            total_amount REAL NOT NULL,
            items TEXT NOT NULL,
            status TEXT DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Insert default owner if not exists
    c.execute("SELECT * FROM users WHERE role='owner'")
    if not c.fetchone():
        c.execute("INSERT INTO users (phone, password, role) VALUES (?, ?, ?)",
                  ('6266364351', hash_password('brijesh@2008'), 'owner'))

    # Insert default products if empty
    c.execute("SELECT COUNT(*) FROM products")
    count = c.fetchone()[0]
    
    if count == 0:
        default_products = [
            ("Classic Diamond Solitaire", 2499.00, "assets/product_ring.png", "Rings"),
            ("Emerald Cut Halo Ring", 3200.00, "assets/product_ring.png", "Rings"),
            ("Gold & Diamond Pendant", 1850.00, "assets/product_necklace.png", "Necklaces"),
            ("Sapphire Teardrop Necklace", 2100.00, "assets/product_necklace.png", "Necklaces"),
            ("Diamond Drop Earrings", 4500.00, "assets/product_earrings.png", "Earrings"),
            ("Pearl & Gold Studs", 850.00, "assets/product_earrings.png", "Earrings")
        ]
        c.executemany("INSERT INTO products (name, price, image, category) VALUES (?, ?, ?, ?)", default_products)

    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    print("Database initialized successfully.")
