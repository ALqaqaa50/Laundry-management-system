import 'package:flutter/material.dart';
import '../database/database_helper.dart';
import '../models/inventory_item.dart';
import '../utils/constants.dart';

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  final DatabaseHelper _db = DatabaseHelper.instance;
  List<InventoryItem> _items = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadInventory();
  }

  Future<void> _loadInventory() async {
    setState(() => _isLoading = true);
    final items = await _db.getAllInventory();
    if (mounted) {
      setState(() {
        _items = items;
        _isLoading = false;
      });
    }
  }

  void _showAddEditDialog({InventoryItem? item}) {
    final nameController = TextEditingController(text: item?.productName ?? '');
    final qtyController =
        TextEditingController(text: item?.quantity.toString() ?? '');
    final unitController = TextEditingController(text: item?.unit ?? 'liters');
    final alertController =
        TextEditingController(text: item?.alertLevel.toString() ?? '5');

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(item == null ? 'Add Product' : 'Edit Product'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: InputDecoration(
                  labelText: 'Product Name',
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: qtyController,
                      keyboardType:
                          const TextInputType.numberWithOptions(decimal: true),
                      decoration: InputDecoration(
                        labelText: 'Quantity',
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: unitController,
                      decoration: InputDecoration(
                        labelText: 'Unit',
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: alertController,
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                decoration: InputDecoration(
                  labelText: 'Low Stock Alert Level',
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          if (item != null)
            TextButton(
              onPressed: () async {
                await _db.deleteInventoryItem(item.id!);
                if (context.mounted) Navigator.pop(context);
                _loadInventory();
              },
              child: const Text('Delete', style: TextStyle(color: AppColors.danger)),
            ),
          ElevatedButton(
            onPressed: () async {
              final name = nameController.text.trim();
              final qty = double.tryParse(qtyController.text) ?? 0;
              final unit = unitController.text.trim();
              final alert = double.tryParse(alertController.text) ?? 5;

              if (name.isEmpty) return;

              final newItem = InventoryItem(
                id: item?.id,
                productName: name,
                quantity: qty,
                unit: unit.isNotEmpty ? unit : 'liters',
                alertLevel: alert,
                lastUpdated: DateTime.now().toIso8601String(),
              );

              if (item == null) {
                await _db.insertInventoryItem(newItem);
              } else {
                await _db.updateInventoryItem(newItem);
              }
              if (context.mounted) Navigator.pop(context);
              _loadInventory();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
            ),
            child: Text(item == null ? 'Add' : 'Save'),
          ),
        ],
      ),
    );
  }

  void _showUpdateQuantityDialog(InventoryItem item) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Update ${item.productName}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
                'Current: ${item.quantity} ${item.unit}',
                style: TextStyle(color: Colors.grey[600])),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(
                labelText: 'Add quantity',
                hintText: 'Enter amount to add',
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              autofocus: true,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final addQty = double.tryParse(controller.text) ?? 0;
              if (addQty > 0) {
                final updated = item.copyWith(
                  quantity: item.quantity + addQty,
                  lastUpdated: DateTime.now().toIso8601String(),
                );
                await _db.updateInventoryItem(updated);
              }
              if (context.mounted) Navigator.pop(context);
              _loadInventory();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
            ),
            child: const Text('Add Stock'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final lowStockItems = _items.where((i) => i.isLowStock).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Inventory'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadInventory,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Low stock alert
                    if (lowStockItems.isNotEmpty) ...[
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppColors.danger.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                              color: AppColors.danger.withValues(alpha: 0.3)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.warning_amber_rounded,
                                    color: AppColors.danger),
                                SizedBox(width: 8),
                                Text(
                                  'Low Stock Alerts',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.danger,
                                    fontSize: 16,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            for (final item in lowStockItems)
                              Padding(
                                padding: const EdgeInsets.only(bottom: 4),
                                child: Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      '${item.productName}: ${item.quantity} ${item.unit} remaining',
                                      style: const TextStyle(
                                          color: AppColors.danger),
                                    ),
                                    GestureDetector(
                                      onTap: () =>
                                          _showUpdateQuantityDialog(item),
                                      child: const Text(
                                        'Restock',
                                        style: TextStyle(
                                          color: AppColors.primary,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    const Text(
                      'All Products',
                      style: TextStyle(
                          fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),

                    // Product list
                    for (final item in _items)
                      Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () => _showAddEditDialog(item: item),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                Container(
                                  width: 48,
                                  height: 48,
                                  decoration: BoxDecoration(
                                    color: item.isLowStock
                                        ? AppColors.danger
                                            .withValues(alpha: 0.1)
                                        : AppColors.success
                                            .withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Icon(
                                    item.isLowStock
                                        ? Icons.warning_amber_rounded
                                        : Icons.check_circle,
                                    color: item.isLowStock
                                        ? AppColors.danger
                                        : AppColors.success,
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        item.productName,
                                        style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 15),
                                      ),
                                      Text(
                                        'Alert at: ${item.alertLevel} ${item.unit}',
                                        style: TextStyle(
                                            color: Colors.grey[500],
                                            fontSize: 12),
                                      ),
                                    ],
                                  ),
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(
                                      '${item.quantity}',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 20,
                                        color: item.isLowStock
                                            ? AppColors.danger
                                            : AppColors.textPrimary,
                                      ),
                                    ),
                                    Text(
                                      item.unit,
                                      style: TextStyle(
                                          color: Colors.grey[500],
                                          fontSize: 12),
                                    ),
                                  ],
                                ),
                                const SizedBox(width: 8),
                                IconButton(
                                  icon: const Icon(Icons.add_circle_outline,
                                      color: AppColors.primary),
                                  onPressed: () =>
                                      _showUpdateQuantityDialog(item),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddEditDialog(),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        child: const Icon(Icons.add),
      ),
    );
  }
}
