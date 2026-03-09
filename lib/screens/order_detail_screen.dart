import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../database/database_helper.dart';
import '../models/order.dart';
import '../utils/constants.dart';
import '../widgets/status_badge.dart';
import 'invoice_screen.dart';

class OrderDetailScreen extends StatefulWidget {
  final LaundryOrder order;

  const OrderDetailScreen({super.key, required this.order});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  final DatabaseHelper _db = DatabaseHelper.instance;
  late LaundryOrder _order;

  @override
  void initState() {
    super.initState();
    _order = widget.order;
  }

  Future<void> _updateStatus(String newStatus) async {
    await _db.updateOrderStatus(_order.id!, newStatus);
    final updated = await _db.getOrderById(_order.id!);
    if (updated != null && mounted) {
      setState(() => _order = updated);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Status updated to $newStatus'),
          backgroundColor: OrderStatus.color(newStatus),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final createdDate = DateTime.tryParse(_order.createdAt);
    final deliveryDate = _order.deliveryDate != null
        ? DateTime.tryParse(_order.deliveryDate!)
        : null;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Order #${_order.orderNumber}'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.print),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => InvoiceScreen(order: _order),
                ),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status & QR Code
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Order #${_order.orderNumber}',
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          if (createdDate != null)
                            Text(
                              DateFormat('MMM dd, yyyy - hh:mm a')
                                  .format(createdDate),
                              style: TextStyle(color: Colors.grey[600]),
                            ),
                        ],
                      ),
                      StatusBadge(status: _order.status),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // QR Code
                  QrImageView(
                    data: _order.orderNumber,
                    version: QrVersions.auto,
                    size: 150,
                    gapless: false,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Scan to track order',
                    style: TextStyle(color: Colors.grey[500], fontSize: 12),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Status workflow
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Workflow Progress',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  _buildStatusTimeline(),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Customer info
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Customer',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: CircleAvatar(
                      backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                      child: const Icon(Icons.person, color: AppColors.primary),
                    ),
                    title: Text(_order.customerName ?? 'Unknown'),
                    subtitle: Text(_order.customerPhone ?? ''),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Items
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Items',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  for (final item in _order.items)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(item.itemType),
                          ),
                          Text('${item.quantity} x \$${item.price.toStringAsFixed(2)}'),
                          const SizedBox(width: 16),
                          Text(
                            '\$${item.total.toStringAsFixed(2)}',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  const Divider(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Total',
                        style: TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        '\$${_order.totalPrice.toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Delivery date
            if (deliveryDate != null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.calendar_today, color: AppColors.primary),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Expected Delivery',
                            style: TextStyle(color: Colors.grey)),
                        Text(
                          DateFormat('MMM dd, yyyy').format(deliveryDate),
                          style: const TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

            const SizedBox(height: 20),

            // Update status button
            if (_order.status != OrderStatus.delivered)
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton.icon(
                  onPressed: () =>
                      _updateStatus(OrderStatus.next(_order.status)),
                  icon: Icon(
                      OrderStatus.icon(OrderStatus.next(_order.status))),
                  label: Text(
                    'Move to ${OrderStatus.next(_order.status)}',
                    style: const TextStyle(fontSize: 16),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor:
                        OrderStatus.color(OrderStatus.next(_order.status)),
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

  Widget _buildStatusTimeline() {
    final statuses = OrderStatus.all;
    final currentIndex = statuses.indexOf(_order.status);

    return Row(
      children: [
        for (int i = 0; i < statuses.length; i++) ...[
          Expanded(
            child: Column(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: i <= currentIndex
                        ? OrderStatus.color(statuses[i])
                        : Colors.grey[300],
                  ),
                  child: Icon(
                    OrderStatus.icon(statuses[i]),
                    size: 16,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  statuses[i],
                  style: TextStyle(
                    fontSize: 8,
                    fontWeight: i <= currentIndex
                        ? FontWeight.bold
                        : FontWeight.normal,
                    color: i <= currentIndex
                        ? OrderStatus.color(statuses[i])
                        : Colors.grey,
                  ),
                ),
              ],
            ),
          ),
          if (i < statuses.length - 1)
            Expanded(
              child: Container(
                height: 3,
                color: i < currentIndex
                    ? OrderStatus.color(statuses[i + 1])
                    : Colors.grey[300],
              ),
            ),
        ],
      ],
    );
  }
}
