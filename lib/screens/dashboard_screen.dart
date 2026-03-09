import 'package:flutter/material.dart';
import '../database/database_helper.dart';
import '../utils/constants.dart';
import '../widgets/stat_card.dart';
import 'new_order_screen.dart';
import 'orders_list_screen.dart';
import 'customers_screen.dart';
import 'reports_screen.dart';
import 'inventory_screen.dart';
import 'qr_scanner_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final DatabaseHelper _db = DatabaseHelper.instance;
  int _todayOrders = 0;
  int _pendingOrders = 0;
  int _completedOrders = 0;
  double _todayRevenue = 0.0;
  int _lowStockCount = 0;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    final todayOrders = await _db.getTodayOrders();
    final statusCounts = await _db.getOrderStatusCounts();
    final lowStock = await _db.getLowStockItems();

    final today = DateTime.now();
    final startOfDay = DateTime(today.year, today.month, today.day);
    final endOfDay = startOfDay.add(const Duration(days: 1));
    final revenue = await _db.getRevenueForPeriod(
      startOfDay.toIso8601String(),
      endOfDay.toIso8601String(),
    );

    if (mounted) {
      setState(() {
        _todayOrders = todayOrders.length;
        _pendingOrders = (statusCounts[OrderStatus.received] ?? 0) +
            (statusCounts[OrderStatus.washing] ?? 0) +
            (statusCounts[OrderStatus.drying] ?? 0);
        _completedOrders = (statusCounts[OrderStatus.ready] ?? 0) +
            (statusCounts[OrderStatus.delivered] ?? 0);
        _todayRevenue = revenue;
        _lowStockCount = lowStock.length;
      });
    }
  }

  Widget _buildDashboardHome() {
    return RefreshIndicator(
      onRefresh: _loadDashboardData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Laundry Manager',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: AppColors.primaryDark,
                          ),
                    ),
                    Text(
                      'Dashboard Overview',
                      style: TextStyle(color: Colors.grey[600], fontSize: 14),
                    ),
                  ],
                ),
                IconButton(
                  icon: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.qr_code_scanner,
                        color: AppColors.primary),
                  ),
                  onPressed: () async {
                    await Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (_) => const QrScannerScreen()),
                    );
                    _loadDashboardData();
                  },
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Stat Cards
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.2,
              children: [
                StatCard(
                  title: 'Today\'s Orders',
                  value: '$_todayOrders',
                  icon: Icons.shopping_bag,
                  color: AppColors.primary,
                ),
                StatCard(
                  title: 'Pending',
                  value: '$_pendingOrders',
                  icon: Icons.pending_actions,
                  color: AppColors.warning,
                ),
                StatCard(
                  title: 'Completed',
                  value: '$_completedOrders',
                  icon: Icons.check_circle,
                  color: AppColors.success,
                ),
                StatCard(
                  title: 'Revenue Today',
                  value: '\$${_todayRevenue.toStringAsFixed(0)}',
                  icon: Icons.attach_money,
                  color: const Color(0xFF7B1FA2),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Low stock alert
            if (_lowStockCount > 0)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                  color: AppColors.danger.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                      color: AppColors.danger.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.warning_amber_rounded,
                        color: AppColors.danger),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        '$_lowStockCount item(s) running low on stock!',
                        style: const TextStyle(
                          color: AppColors.danger,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        setState(() => _currentIndex = 4);
                      },
                      child: const Text('View'),
                    ),
                  ],
                ),
              ),

            // Quick Actions
            const Text(
              'Quick Actions',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildQuickAction(
                    icon: Icons.add_circle,
                    label: 'New Order',
                    color: AppColors.primary,
                    onTap: () async {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) => const NewOrderScreen()),
                      );
                      _loadDashboardData();
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildQuickAction(
                    icon: Icons.people,
                    label: 'Customers',
                    color: AppColors.accent,
                    onTap: () {
                      setState(() => _currentIndex = 2);
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildQuickAction(
                    icon: Icons.bar_chart,
                    label: 'Reports',
                    color: AppColors.success,
                    onTap: () {
                      setState(() => _currentIndex = 3);
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildQuickAction(
                    icon: Icons.qr_code_scanner,
                    label: 'Scan QR',
                    color: const Color(0xFF7B1FA2),
                    onTap: () async {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) => const QrScannerScreen()),
                      );
                      _loadDashboardData();
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildQuickAction(
                    icon: Icons.inventory_2,
                    label: 'Inventory',
                    color: AppColors.warning,
                    onTap: () {
                      setState(() => _currentIndex = 4);
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildQuickAction(
                    icon: Icons.list_alt,
                    label: 'All Orders',
                    color: AppColors.danger,
                    onTap: () {
                      setState(() => _currentIndex = 1);
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickAction({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 18),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 6),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.w600,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      _buildDashboardHome(),
      OrdersListScreen(onBack: () => setState(() => _currentIndex = 0)),
      CustomersScreen(onBack: () => setState(() => _currentIndex = 0)),
      const ReportsScreen(),
      const InventoryScreen(),
    ];

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(child: screens[_currentIndex]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) {
          setState(() => _currentIndex = index);
          if (index == 0) _loadDashboardData();
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.list_alt_outlined),
            selectedIcon: Icon(Icons.list_alt),
            label: 'Orders',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outline),
            selectedIcon: Icon(Icons.people),
            label: 'Customers',
          ),
          NavigationDestination(
            icon: Icon(Icons.bar_chart_outlined),
            selectedIcon: Icon(Icons.bar_chart),
            label: 'Reports',
          ),
          NavigationDestination(
            icon: Icon(Icons.inventory_2_outlined),
            selectedIcon: Icon(Icons.inventory_2),
            label: 'Inventory',
          ),
        ],
      ),
      floatingActionButton: _currentIndex == 0
          ? FloatingActionButton.extended(
              onPressed: () async {
                await Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const NewOrderScreen()),
                );
                _loadDashboardData();
              },
              icon: const Icon(Icons.add),
              label: const Text('New Order'),
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
            )
          : null,
    );
  }
}
