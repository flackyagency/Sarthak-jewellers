import sqlite3
import hashlib

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

conn = sqlite3.connect('shop.db')
c = conn.cursor()
c.execute("UPDATE users SET email=?, password=? WHERE role='owner'", 
          ('brijesh@sarthakjewellaries.com', hash_password('brijesh@2008')))
conn.commit()
conn.close()
print('Owner credentials updated successfully!')
