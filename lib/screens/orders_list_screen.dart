import 'package:flutter/material.dart';
import '../database/database_helper.dart';
import '../models/order.dart';
import '../utils/constants.dart';
import '../widgets/order_card.dart';
import 'order_detail_screen.dart';
import 'new_order_screen.dart';

class OrdersListScreen extends StatefulWidget {
  final VoidCallback? onBack;

  const OrdersListScreen({super.key, this.onBack});

  @override
  State<OrdersListScreen> createState() => _OrdersListScreenState();
}

class _OrdersListScreenState extends State<OrdersListScreen>
    with SingleTickerProviderStateMixin {
  final DatabaseHelper _db = DatabaseHelper.instance;
  final TextEditingController _searchController = TextEditingController();
  late TabController _tabController;
  List<LaundryOrder> _orders = [];
  bool _isLoading = true;
  String? _filterStatus;

  final List<String> _tabs = ['All', ...OrderStatus.all];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        setState(() {
          _filterStatus =
              _tabController.index == 0 ? null : _tabs[_tabController.index];
        });
        _loadOrders();
      }
    });
    _loadOrders();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadOrders() async {
    setState(() => _isLoading = true);
    List<LaundryOrder> orders;
    if (_searchController.text.isNotEmpty) {
      orders = await _db.searchOrders(_searchController.text);
    } else if (_filterStatus != null) {
      orders = await _db.getOrdersByStatus(_filterStatus!);
    } else {
      orders = await _db.getAllOrders();
    }
    if (mounted) {
      setState(() {
        _orders = orders;
        _isLoading = false;
      });
    }
  }

  Future<void> _updateStatus(LaundryOrder order) async {
    final nextStatus = OrderStatus.next(order.status);
    if (nextStatus == order.status) return;

    await _db.updateOrderStatus(order.id!, nextStatus);
    _loadOrders();

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Order #${order.orderNumber} → $nextStatus'),
          backgroundColor: OrderStatus.color(nextStatus),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Orders'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        leading: widget.onBack != null
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: widget.onBack,
              )
            : null,
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: AppColors.primary,
          unselectedLabelColor: Colors.grey,
          indicatorColor: AppColors.primary,
          tabs: _tabs.map((tab) => Tab(text: tab)).toList(),
        ),
      ),
      body: Column(
        children: [
          // Search
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _searchController,
              onChanged: (value) => _loadOrders(),
              decoration: InputDecoration(
                hintText: 'Search orders by number, customer...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          _loadOrders();
                        },
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                fillColor: Colors.white,
              ),
            ),
          ),
          // Orders list
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _orders.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.receipt_long,
                                size: 64, color: Colors.grey[400]),
                            const SizedBox(height: 16),
                            Text(
                              'No orders found',
                              style: TextStyle(
                                color: Colors.grey[600],
                                fontSize: 16,
                              ),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadOrders,
                        child: ListView.builder(
                          itemCount: _orders.length,
                          itemBuilder: (context, index) {
                            final order = _orders[index];
                            return OrderCard(
                              order: order,
                              onTap: () async {
                                final fullOrder =
                                    await _db.getOrderById(order.id!);
                                if (fullOrder != null && context.mounted) {
                                  await Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) =>
                                          OrderDetailScreen(order: fullOrder),
                                    ),
                                  );
                                  _loadOrders();
                                }
                              },
                              onStatusUpdate: () => _updateStatus(order),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          await Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const NewOrderScreen()),
          );
          _loadOrders();
        },
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        child: const Icon(Icons.add),
      ),
    );
  }
}
