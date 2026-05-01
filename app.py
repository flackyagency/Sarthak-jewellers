from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
from database import init_db, get_db_connection, hash_password
import sqlite3
import os
import uuid
from werkzeug.utils import secure_filename

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# Initialize database
init_db()

# --- Static File Routes ---
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

# --- API Routes ---
@app.route('/api/products', methods=['GET'])
def get_products():
    conn = get_db_connection()
    products = conn.execute('SELECT * FROM products').fetchall()
    conn.close()
    return jsonify([dict(row) for row in products])

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    phone = data.get('phone')
    password = data.get('password')
    role_requested = data.get('role', 'customer').lower()

    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE phone = ? AND password = ? AND role = ?', 
                        (phone, hash_password(password), role_requested)).fetchone()
    conn.close()

    if user:
        return jsonify({"success": True, "message": "Login successful", "role": user['role']})
    else:
        return jsonify({"success": False, "message": "Invalid credentials or you are not registered as this role"}), 401

otp_store = {}

@app.route('/api/forgot-password-otp', methods=['POST'])
def forgot_password_otp():
    data = request.json
    phone = data.get('phone')
    if not phone or len(phone) != 10:
        return jsonify({"success": False, "message": "Invalid phone number"}), 400
        
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE phone = ?", (phone,)).fetchone()
    conn.close()
    if not user:
        return jsonify({"success": False, "message": "Mobile number not found in our records"}), 404

    import random
    otp = str(random.randint(100000, 999999))
    otp_store[phone] = otp
    
    return jsonify({"success": True, "message": f"OTP sent! (Demo OTP: {otp})"})

@app.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    data = request.json
    phone = data.get('phone')
    otp = data.get('otp')
    
    if otp_store.get(phone) == otp:
        return jsonify({"success": True, "message": "OTP verified successfully!"})
    else:
        return jsonify({"success": False, "message": "Invalid or expired OTP"}), 400

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    phone = data.get('phone')
    password = data.get('password')
    
    conn = get_db_connection()
    conn.execute("UPDATE users SET password = ? WHERE phone = ?", (hash_password(password), phone))
    conn.commit()
    conn.close()
    
    if phone in otp_store:
        del otp_store[phone]
        
    return jsonify({"success": True, "message": "Password reset successfully!"})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    name = data.get('name', '')
    phone = data.get('phone')
    password = data.get('password')
    
    if not phone or not password:
        return jsonify({"success": False, "message": "Phone number and password required"}), 400

    conn = get_db_connection()
    try:
        conn.execute("INSERT INTO users (name, phone, password, role) VALUES (?, ?, ?, ?)",
                     (name, phone, hash_password(password), 'customer'))
        conn.commit()
        success = True
        message = "Registration successful"
    except sqlite3.IntegrityError:
        success = False
        message = "Mobile number already registered"
    finally:
        conn.close()

    return jsonify({"success": success, "message": message})

@app.route('/api/admin/products', methods=['POST'])
def add_product():
    if 'image' not in request.files:
        return jsonify({"success": False, "message": "No image uploaded"}), 400
        
    file = request.files['image']
    if file.filename == '':
        return jsonify({"success": False, "message": "No image selected"}), 400

    name = request.form.get('name')
    price = request.form.get('price')
    category = request.form.get('category')
    
    if not name or not price or not category:
        return jsonify({"success": False, "message": "Missing product details"}), 400

    assets_dir = os.path.join(os.path.dirname(__file__), 'assets')
    os.makedirs(assets_dir, exist_ok=True)
    
    ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'png'
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(assets_dir, unique_filename)
    file.save(file_path)
    
    db_image_path = f"assets/{unique_filename}"

    conn = get_db_connection()
    conn.execute("INSERT INTO products (name, price, image, category) VALUES (?, ?, ?, ?)",
                 (name, price, db_image_path, category))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Product added successfully"})

@app.route('/api/admin/products/<int:id>', methods=['DELETE'])
def delete_product(id):
    conn = get_db_connection()
    conn.execute("DELETE FROM products WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Product deleted"})

@app.route('/api/admin/products/<int:id>', methods=['PUT'])
def update_product_price(id):
    data = request.json
    new_price = data.get('price')
    if new_price is None:
        return jsonify({"success": False, "message": "Price is required"}), 400

    conn = get_db_connection()
    conn.execute("UPDATE products SET price = ? WHERE id = ?", (new_price, id))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Price updated successfully"})

@app.route('/api/checkout', methods=['POST'])
def checkout():
    data = request.json
    phone = data.get('phone')
    address = data.get('address')
    items = data.get('items')
    total_amount = data.get('total_amount')
    
    if not phone or not address or not items:
        return jsonify({"success": False, "message": "Missing checkout details"}), 400

    import json
    items_str = json.dumps(items)

    conn = get_db_connection()
    conn.execute("INSERT INTO orders (customer_phone, customer_address, total_amount, items, status) VALUES (?, ?, ?, ?, ?)",
                 (phone, address, total_amount, items_str, 'Pending'))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Order placed successfully!"})

@app.route('/api/admin/orders', methods=['GET'])
def get_orders():
    conn = get_db_connection()
    orders = conn.execute('SELECT * FROM orders ORDER BY created_at DESC').fetchall()
    conn.close()
    return jsonify([dict(row) for row in orders])

@app.route('/api/admin/orders/<int:id>', methods=['DELETE'])
def delete_order(id):
    conn = get_db_connection()
    conn.execute("DELETE FROM orders WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Order deleted"})

@app.route('/api/admin/orders/<int:id>/status', methods=['PUT'])
def update_order_status(id):
    data = request.json
    new_status = data.get('status')
    if not new_status:
        return jsonify({"success": False, "message": "Status is required"}), 400

    conn = get_db_connection()
    conn.execute("UPDATE orders SET status = ? WHERE id = ?", (new_status, id))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Order status updated"})

@app.route('/api/customer/orders/<phone>', methods=['GET'])
def get_customer_orders(phone):
    conn = get_db_connection()
    orders = conn.execute('SELECT * FROM orders WHERE customer_phone = ? ORDER BY created_at DESC', (phone,)).fetchall()
    conn.close()
    return jsonify([dict(row) for row in orders])

@app.route('/api/admin/customers', methods=['GET'])
def get_customers():
    conn = get_db_connection()
    customers = conn.execute('SELECT id, name, phone FROM users WHERE role = "customer"').fetchall()
    conn.close()
    return jsonify([dict(row) for row in customers])

if __name__ == '__main__':
    app.run(debug=True, port=5000)
