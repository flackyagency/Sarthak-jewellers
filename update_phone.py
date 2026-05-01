import sqlite3
conn = sqlite3.connect('shop.db')
conn.execute("UPDATE users SET phone='6266364351' WHERE role='owner'")
conn.commit()
conn.close()
print('Owner phone updated!')
