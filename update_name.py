import sqlite3
conn = sqlite3.connect('shop.db')
try:
    conn.execute('ALTER TABLE users ADD COLUMN name TEXT DEFAULT ""')
    conn.commit()
    print("Column added.")
except Exception as e:
    print(e)
finally:
    conn.close()
