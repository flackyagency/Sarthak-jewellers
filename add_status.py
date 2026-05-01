import sqlite3

def add_status_column():
    conn = sqlite3.connect('shop.db')
    c = conn.cursor()
    try:
        c.execute("ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'Pending'")
        conn.commit()
        print("Successfully added status column.")
    except sqlite3.OperationalError as e:
        print(f"Column might already exist: {e}")
    conn.close()

if __name__ == '__main__':
    add_status_column()
