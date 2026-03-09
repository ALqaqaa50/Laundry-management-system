import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import '../database/database_helper.dart';
import '../models/customer.dart';
import '../models/order.dart';
import '../models/order_item.dart';
import '../utils/constants.dart';
import 'add_customer_screen.dart';
import 'invoice_screen.dart';

class NewOrderScreen extends StatefulWidget {
  final Customer? preselectedCustomer;

  const NewOrderScreen({super.key, this.preselectedCustomer});

  @override
  State<NewOrderScreen> createState() => _NewOrderScreenState();
}

class _NewOrderScreenState extends State<NewOrderScreen> {
  final DatabaseHelper _db = DatabaseHelper.instance;
  final _notesController = TextEditingController();
  Customer? _selectedCustomer;
  List<Customer> _customers = [];
  final List<OrderItem> _items = [];
  DateTime? _deliveryDate;
  String? _photoPath;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _selectedCustomer = widget.preselectedCustomer;
    _loadCustomers();
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _loadCustomers() async {
    final customers = await _db.getAllCustomers();
    if (mounted) {
      setState(() => _customers = customers);
    }
  }

  double get _totalPrice =>
      _items.fold(0.0, (sum, item) => sum + item.total);

  void _addItem() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _AddItemSheet(
        onAdd: (item) {
          setState(() => _items.add(item));
        },
      ),
    );
  }

  void _removeItem(int index) {
    setState(() => _items.removeAt(index));
  }

  Future<void> _pickDeliveryDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 3)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 60)),
    );
    if (date != null) {
      setState(() => _deliveryDate = date);
    }
  }

  Future<void> _takePhoto() async {
    try {
      final picker = ImagePicker();
      final photo = await picker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 80,
      );
      if (photo != null) {
        setState(() => _photoPath = photo.path);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Camera not available: $e')),
        );
      }
    }
  }

  Future<void> _saveOrder() async {
    if (_selectedCustomer == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a customer'),
          backgroundColor: AppColors.danger,
        ),
      );
      return;
    }
    if (_items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please add at least one item'),
          backgroundColor: AppColors.danger,
        ),
      );
      return;
    }

    setState(() => _isSaving = true);

    try {
      final nextNumber = await _db.getNextOrderNumber();
      final orderNumber = '${1000 + nextNumber}';

      final order = LaundryOrder(
        customerId: _selectedCustomer!.id!,
        orderNumber: orderNumber,
        status: OrderStatus.received,
        totalPrice: _totalPrice,
        deliveryDate: _deliveryDate?.toIso8601String(),
        notes: _notesController.text.trim().isNotEmpty
            ? _notesController.text.trim()
            : null,
        photoPath: _photoPath,
        items: _items,
        customerName: _selectedCustomer!.name,
        customerPhone: _selectedCustomer!.phone,
      );

      final orderId = await _db.insertOrder(order);
      final savedOrder = await _db.getOrderById(orderId);

      if (mounted && savedOrder != null) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => InvoiceScreen(order: savedOrder),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error saving order: $e'),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('New Order'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Step 1: Select Customer
            _buildSectionHeader('1. Select Customer', Icons.person),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[300]!),
              ),
              child: Column(
                children: [
                  if (_selectedCustomer != null)
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: CircleAvatar(
                        backgroundColor:
                            AppColors.primary.withValues(alpha: 0.1),
                        child: Text(
                          _selectedCustomer!.name[0].toUpperCase(),
                          style: const TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.bold),
                        ),
                      ),
                      title: Text(_selectedCustomer!.name,
                          style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text(_selectedCustomer!.phone),
                      trailing: IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () =>
                            setState(() => _selectedCustomer = null),
                      ),
                    )
                  else
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<Customer>(
                            decoration: const InputDecoration(
                              hintText: 'Select customer',
                              border: InputBorder.none,
                              contentPadding: EdgeInsets.symmetric(horizontal: 8),
                            ),
                            items: _customers.map((c) {
                              return DropdownMenuItem(
                                value: c,
                                child: Text('${c.name} (${c.phone})'),
                              );
                            }).toList(),
                            onChanged: (customer) {
                              setState(() => _selectedCustomer = customer);
                            },
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.person_add,
                              color: AppColors.primary),
                          onPressed: () async {
                            final result = await Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => const AddCustomerScreen()),
                            );
                            await _loadCustomers();
                            if (result != null && result is Customer) {
                              // Find the customer in the refreshed list by name/phone
                              final refreshedCustomer = _customers.firstWhere(
                                (c) =>
                                    c.name == result.name &&
                                    c.phone == result.phone,
                                orElse: () => result,
                              );
                              setState(
                                  () => _selectedCustomer = refreshedCustomer);
                            }
                          },
                        ),
                      ],
                    ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Step 2: Add Items
            _buildSectionHeader('2. Add Items', Icons.local_laundry_service),
            const SizedBox(height: 8),
            if (_items.isNotEmpty)
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: Column(
                  children: [
                    for (int i = 0; i < _items.length; i++)
                      ListTile(
                        leading: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.accent.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(Icons.dry_cleaning,
                              color: AppColors.accent, size: 20),
                        ),
                        title: Text(_items[i].itemType,
                            style:
                                const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Text(
                            '${_items[i].quantity} x \$${_items[i].price.toStringAsFixed(2)}'),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              '\$${_items[i].total.toStringAsFixed(2)}',
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.primary),
                            ),
                            IconButton(
                              icon: const Icon(Icons.remove_circle_outline,
                                  color: AppColors.danger, size: 20),
                              onPressed: () => _removeItem(i),
                            ),
                          ],
                        ),
                      ),
                    const Divider(),
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Total:',
                              style: TextStyle(
                                  fontSize: 18, fontWeight: FontWeight.bold)),
                          Text(
                            '\$${_totalPrice.toStringAsFixed(2)}',
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _addItem,
                icon: const Icon(Icons.add),
                label: const Text('Add Item'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  side: const BorderSide(color: AppColors.primary),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Step 3: Details
            _buildSectionHeader('3. Additional Details', Icons.info_outline),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[300]!),
              ),
              child: Column(
                children: [
                  // Delivery date
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.calendar_today,
                        color: AppColors.primary),
                    title: Text(
                      _deliveryDate != null
                          ? 'Delivery: ${DateFormat('MMM dd, yyyy').format(_deliveryDate!)}'
                          : 'Set Delivery Date',
                      style: TextStyle(
                        color: _deliveryDate != null
                            ? AppColors.textPrimary
                            : Colors.grey[600],
                      ),
                    ),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: _pickDeliveryDate,
                  ),
                  const Divider(),
                  // Photo
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.camera_alt,
                        color: AppColors.primary),
                    title: Text(
                      _photoPath != null
                          ? 'Photo attached'
                          : 'Take photo (optional)',
                      style: TextStyle(
                        color: _photoPath != null
                            ? AppColors.success
                            : Colors.grey[600],
                      ),
                    ),
                    trailing: _photoPath != null
                        ? const Icon(Icons.check_circle,
                            color: AppColors.success)
                        : const Icon(Icons.chevron_right),
                    onTap: _takePhoto,
                  ),
                  const Divider(),
                  // Notes
                  TextField(
                    controller: _notesController,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      hintText: 'Order notes (optional)',
                      border: InputBorder.none,
                      prefixIcon: Icon(Icons.note, color: AppColors.primary),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 30),

            // Save Order
            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton.icon(
                onPressed: _isSaving ? null : _saveOrder,
                icon: _isSaving
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.check_circle),
                label: Text(
                  _isSaving ? 'Saving...' : 'Create Order & Print Invoice',
                  style: const TextStyle(fontSize: 16),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.primary),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}

class _AddItemSheet extends StatefulWidget {
  final Function(OrderItem) onAdd;

  const _AddItemSheet({required this.onAdd});

  @override
  State<_AddItemSheet> createState() => _AddItemSheetState();
}

class _AddItemSheetState extends State<_AddItemSheet> {
  String _selectedType = ItemTypes.all.first;
  final _quantityController = TextEditingController(text: '1');
  late final TextEditingController _priceController;

  @override
  void initState() {
    super.initState();
    _priceController = TextEditingController(
      text: ItemTypes.defaultPrice(_selectedType).toStringAsFixed(2),
    );
  }

  @override
  void dispose() {
    _quantityController.dispose();
    _priceController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 20,
        right: 20,
        top: 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Add Item',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          // Item type selector
          DropdownButtonFormField<String>(
            initialValue: _selectedType,
            decoration: InputDecoration(
              labelText: 'Item Type',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            items: ItemTypes.all.map((type) {
              return DropdownMenuItem(value: type, child: Text(type));
            }).toList(),
            onChanged: (value) {
              if (value != null) {
                setState(() {
                  _selectedType = value;
                  _priceController.text =
                      ItemTypes.defaultPrice(value).toStringAsFixed(2);
                });
              }
            },
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _quantityController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: 'Quantity',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextFormField(
                  controller: _priceController,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: InputDecoration(
                    labelText: 'Price per item',
                    prefixText: '\$ ',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton.icon(
              onPressed: () {
                final quantity =
                    int.tryParse(_quantityController.text) ?? 1;
                final price =
                    double.tryParse(_priceController.text) ?? 0;
                if (quantity > 0 && price > 0) {
                  widget.onAdd(OrderItem(
                    itemType: _selectedType,
                    quantity: quantity,
                    price: price,
                  ));
                  Navigator.pop(context);
                }
              },
              icon: const Icon(Icons.add),
              label: const Text('Add Item'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}
