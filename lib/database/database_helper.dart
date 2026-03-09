import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/customer.dart';
import '../models/order.dart';
import '../models/order_item.dart';
import '../models/inventory_item.dart';

class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._init();
  static Database? _database;

  DatabaseHelper._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('laundry_management.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 1,
      onCreate: _createDB,
    );
  }

  Future<void> _createDB(Database db, int version) async {
    await db.execute('''
      CREATE TABLE customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT DEFAULT '',
        created_at TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        order_number TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'RECEIVED',
        total_price REAL NOT NULL DEFAULT 0.0,
        delivery_date TEXT,
        notes TEXT,
        photo_path TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers (id)
      )
    ''');

    await db.execute('''
      CREATE TABLE order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        item_type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders (id)
      )
    ''');

    await db.execute('''
      CREATE TABLE inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_name TEXT NOT NULL,
        quantity REAL NOT NULL DEFAULT 0,
        unit TEXT DEFAULT 'liters',
        alert_level REAL NOT NULL DEFAULT 5,
        last_updated TEXT
      )
    ''');

    // Seed default inventory items
    await db.insert('inventory', {
      'product_name': 'Carpet Shampoo',
      'quantity': 20.0,
      'unit': 'liters',
      'alert_level': 5.0,
      'last_updated': DateTime.now().toIso8601String(),
    });
    await db.insert('inventory', {
      'product_name': 'Fabric Softener',
      'quantity': 15.0,
      'unit': 'liters',
      'alert_level': 5.0,
      'last_updated': DateTime.now().toIso8601String(),
    });
    await db.insert('inventory', {
      'product_name': 'Fragrance',
      'quantity': 10.0,
      'unit': 'liters',
      'alert_level': 3.0,
      'last_updated': DateTime.now().toIso8601String(),
    });
    await db.insert('inventory', {
      'product_name': 'Stain Remover',
      'quantity': 8.0,
      'unit': 'liters',
      'alert_level': 3.0,
      'last_updated': DateTime.now().toIso8601String(),
    });
    await db.insert('inventory', {
      'product_name': 'Bleach',
      'quantity': 12.0,
      'unit': 'liters',
      'alert_level': 4.0,
      'last_updated': DateTime.now().toIso8601String(),
    });
  }

  // ==================== CUSTOMERS ====================

  Future<int> insertCustomer(Customer customer) async {
    final db = await database;
    return await db.insert('customers', customer.toMap());
  }

  Future<List<Customer>> getAllCustomers() async {
    final db = await database;
    final result = await db.query('customers', orderBy: 'name ASC');
    return result.map((map) => Customer.fromMap(map)).toList();
  }

  Future<List<Customer>> searchCustomers(String query) async {
    final db = await database;
    final result = await db.query(
      'customers',
      where: 'name LIKE ? OR phone LIKE ?',
      whereArgs: ['%$query%', '%$query%'],
      orderBy: 'name ASC',
    );
    return result.map((map) => Customer.fromMap(map)).toList();
  }

  Future<Customer?> getCustomerById(int id) async {
    final db = await database;
    final result = await db.query('customers', where: 'id = ?', whereArgs: [id]);
    if (result.isEmpty) return null;
    return Customer.fromMap(result.first);
  }

  Future<int> updateCustomer(Customer customer) async {
    final db = await database;
    return await db.update(
      'customers',
      customer.toMap(),
      where: 'id = ?',
      whereArgs: [customer.id],
    );
  }

  Future<int> deleteCustomer(int id) async {
    final db = await database;
    return await db.delete('customers', where: 'id = ?', whereArgs: [id]);
  }

  // ==================== ORDERS ====================

  Future<int> insertOrder(LaundryOrder order) async {
    final db = await database;
    final orderId = await db.insert('orders', order.toMap());

    for (final item in order.items) {
      await db.insert('order_items', {
        'order_id': orderId,
        'item_type': item.itemType,
        'quantity': item.quantity,
        'price': item.price,
      });
    }

    return orderId;
  }

  Future<List<LaundryOrder>> getAllOrders() async {
    final db = await database;
    final result = await db.rawQuery('''
      SELECT orders.*, customers.name as customer_name, customers.phone as customer_phone
      FROM orders
      LEFT JOIN customers ON orders.customer_id = customers.id
      ORDER BY orders.created_at DESC
    ''');
    return result.map((map) => LaundryOrder.fromMap(map)).toList();
  }

  Future<List<LaundryOrder>> getOrdersByStatus(String status) async {
    final db = await database;
    final result = await db.rawQuery('''
      SELECT orders.*, customers.name as customer_name, customers.phone as customer_phone
      FROM orders
      LEFT JOIN customers ON orders.customer_id = customers.id
      WHERE orders.status = ?
      ORDER BY orders.created_at DESC
    ''', [status]);
    return result.map((map) => LaundryOrder.fromMap(map)).toList();
  }

  Future<List<LaundryOrder>> getOrdersByCustomer(int customerId) async {
    final db = await database;
    final result = await db.rawQuery('''
      SELECT orders.*, customers.name as customer_name, customers.phone as customer_phone
      FROM orders
      LEFT JOIN customers ON orders.customer_id = customers.id
      WHERE orders.customer_id = ?
      ORDER BY orders.created_at DESC
    ''', [customerId]);
    return result.map((map) => LaundryOrder.fromMap(map)).toList();
  }

  Future<LaundryOrder?> getOrderByNumber(String orderNumber) async {
    final db = await database;
    final result = await db.rawQuery('''
      SELECT orders.*, customers.name as customer_name, customers.phone as customer_phone
      FROM orders
      LEFT JOIN customers ON orders.customer_id = customers.id
      WHERE orders.order_number = ?
    ''', [orderNumber]);
    if (result.isEmpty) return null;
    final order = LaundryOrder.fromMap(result.first);
    order.items = await getOrderItems(order.id!);
    return order;
  }

  Future<LaundryOrder?> getOrderById(int id) async {
    final db = await database;
    final result = await db.rawQuery('''
      SELECT orders.*, customers.name as customer_name, customers.phone as customer_phone
      FROM orders
      LEFT JOIN customers ON orders.customer_id = customers.id
      WHERE orders.id = ?
    ''', [id]);
    if (result.isEmpty) return null;
    final order = LaundryOrder.fromMap(result.first);
    order.items = await getOrderItems(order.id!);
    return order;
  }

  Future<int> updateOrderStatus(int orderId, String status) async {
    final db = await database;
    return await db.update(
      'orders',
      {'status': status},
      where: 'id = ?',
      whereArgs: [orderId],
    );
  }

  Future<List<LaundryOrder>> getTodayOrders() async {
    final db = await database;
    final today = DateTime.now().toIso8601String().substring(0, 10);
    final result = await db.rawQuery('''
      SELECT orders.*, customers.name as customer_name, customers.phone as customer_phone
      FROM orders
      LEFT JOIN customers ON orders.customer_id = customers.id
      WHERE orders.created_at LIKE ?
      ORDER BY orders.created_at DESC
    ''', ['$today%']);
    return result.map((map) => LaundryOrder.fromMap(map)).toList();
  }

  Future<int> getNextOrderNumber() async {
    final db = await database;
    final result = await db.rawQuery('SELECT MAX(id) as max_id FROM orders');
    final maxId = result.first['max_id'] as int?;
    return (maxId ?? 0) + 1;
  }

  // ==================== ORDER ITEMS ====================

  Future<List<OrderItem>> getOrderItems(int orderId) async {
    final db = await database;
    final result = await db.query(
      'order_items',
      where: 'order_id = ?',
      whereArgs: [orderId],
    );
    return result.map((map) => OrderItem.fromMap(map)).toList();
  }

  // ==================== INVENTORY ====================

  Future<List<InventoryItem>> getAllInventory() async {
    final db = await database;
    final result = await db.query('inventory', orderBy: 'product_name ASC');
    return result.map((map) => InventoryItem.fromMap(map)).toList();
  }

  Future<List<InventoryItem>> getLowStockItems() async {
    final db = await database;
    final result = await db.rawQuery(
      'SELECT * FROM inventory WHERE quantity <= alert_level ORDER BY quantity ASC',
    );
    return result.map((map) => InventoryItem.fromMap(map)).toList();
  }

  Future<int> insertInventoryItem(InventoryItem item) async {
    final db = await database;
    return await db.insert('inventory', item.toMap());
  }

  Future<int> updateInventoryItem(InventoryItem item) async {
    final db = await database;
    return await db.update(
      'inventory',
      item.toMap(),
      where: 'id = ?',
      whereArgs: [item.id],
    );
  }

  Future<int> deleteInventoryItem(int id) async {
    final db = await database;
    return await db.delete('inventory', where: 'id = ?', whereArgs: [id]);
  }

  // ==================== REPORTS ====================

  Future<double> getRevenueForPeriod(String startDate, String endDate) async {
    final db = await database;
    final result = await db.rawQuery('''
      SELECT COALESCE(SUM(total_price), 0) as revenue
      FROM orders
      WHERE created_at >= ? AND created_at <= ?
    ''', [startDate, endDate]);
    return (result.first['revenue'] as num).toDouble();
  }

  Future<List<Map<String, dynamic>>> getDailyRevenue(int days) async {
    final db = await database;
    final result = await db.rawQuery('''
      SELECT DATE(created_at) as date, SUM(total_price) as revenue, COUNT(*) as count
      FROM orders
      WHERE created_at >= DATE('now', '-$days days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    ''');
    return result;
  }

  Future<List<Map<String, dynamic>>> getMostRequestedItems() async {
    final db = await database;
    final result = await db.rawQuery('''
      SELECT item_type, SUM(quantity) as total_quantity, COUNT(*) as order_count
      FROM order_items
      GROUP BY item_type
      ORDER BY total_quantity DESC
    ''');
    return result;
  }

  Future<List<Map<String, dynamic>>> getTopCustomers({int limit = 10}) async {
    final db = await database;
    final result = await db.rawQuery('''
      SELECT customers.name, customers.phone,
             COUNT(orders.id) as order_count,
             COALESCE(SUM(orders.total_price), 0) as total_spent
      FROM customers
      LEFT JOIN orders ON customers.id = orders.customer_id
      GROUP BY customers.id
      ORDER BY total_spent DESC
      LIMIT ?
    ''', [limit]);
    return result;
  }

  Future<Map<String, int>> getOrderStatusCounts() async {
    final db = await database;
    final result = await db.rawQuery('''
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status
    ''');
    final counts = <String, int>{};
    for (final row in result) {
      counts[row['status'] as String] = row['count'] as int;
    }
    return counts;
  }

  Future<List<LaundryOrder>> searchOrders(String query) async {
    final db = await database;
    final result = await db.rawQuery('''
      SELECT orders.*, customers.name as customer_name, customers.phone as customer_phone
      FROM orders
      LEFT JOIN customers ON orders.customer_id = customers.id
      WHERE orders.order_number LIKE ? OR customers.name LIKE ? OR customers.phone LIKE ?
      ORDER BY orders.created_at DESC
    ''', ['%$query%', '%$query%', '%$query%']);
    return result.map((map) => LaundryOrder.fromMap(map)).toList();
  }
}
