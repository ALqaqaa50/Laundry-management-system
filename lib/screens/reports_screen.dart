import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../database/database_helper.dart';
import '../utils/constants.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen>
    with SingleTickerProviderStateMixin {
  final DatabaseHelper _db = DatabaseHelper.instance;
  late TabController _tabController;

  List<Map<String, dynamic>> _dailyRevenue = [];
  List<Map<String, dynamic>> _mostRequested = [];
  List<Map<String, dynamic>> _topCustomers = [];
  double _weeklyRevenue = 0;
  double _monthlyRevenue = 0;
  Map<String, int> _statusCounts = {};

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadReportData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadReportData() async {
    final dailyRevenue = await _db.getDailyRevenue(30);
    final mostRequested = await _db.getMostRequestedItems();
    final topCustomers = await _db.getTopCustomers();
    final statusCounts = await _db.getOrderStatusCounts();

    final now = DateTime.now();
    final weekStart = now.subtract(Duration(days: now.weekday - 1));
    final monthStart = DateTime(now.year, now.month, 1);
    final weeklyRevenue = await _db.getRevenueForPeriod(
      weekStart.toIso8601String(),
      now.toIso8601String(),
    );
    final monthlyRevenue = await _db.getRevenueForPeriod(
      monthStart.toIso8601String(),
      now.toIso8601String(),
    );

    if (mounted) {
      setState(() {
        _dailyRevenue = dailyRevenue;
        _mostRequested = mostRequested;
        _topCustomers = topCustomers;
        _weeklyRevenue = weeklyRevenue;
        _monthlyRevenue = monthlyRevenue;
        _statusCounts = statusCounts;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Reports & Analytics'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: Colors.grey,
          indicatorColor: AppColors.primary,
          tabs: const [
            Tab(text: 'Revenue', icon: Icon(Icons.attach_money, size: 18)),
            Tab(text: 'Items', icon: Icon(Icons.pie_chart, size: 18)),
            Tab(text: 'Customers', icon: Icon(Icons.people, size: 18)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildRevenueTab(),
          _buildItemsTab(),
          _buildCustomersTab(),
        ],
      ),
    );
  }

  Widget _buildRevenueTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Revenue summary cards
          Row(
            children: [
              Expanded(
                child: _buildRevenueCard(
                  'This Week',
                  '\$${_weeklyRevenue.toStringAsFixed(0)}',
                  Icons.calendar_view_week,
                  AppColors.primary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildRevenueCard(
                  'This Month',
                  '\$${_monthlyRevenue.toStringAsFixed(0)}',
                  Icons.calendar_month,
                  AppColors.success,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Order status breakdown
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
                const Text('Order Status Breakdown',
                    style:
                        TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                for (final status in OrderStatus.all)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Container(
                          width: 12,
                          height: 12,
                          decoration: BoxDecoration(
                            color: OrderStatus.color(status),
                            borderRadius: BorderRadius.circular(3),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(child: Text(status)),
                        Text(
                          '${_statusCounts[status] ?? 0}',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Revenue chart
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
                const Text('Daily Revenue (Last 30 Days)',
                    style:
                        TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                SizedBox(
                  height: 200,
                  child: _dailyRevenue.isEmpty
                      ? Center(
                          child: Text('No revenue data yet',
                              style: TextStyle(color: Colors.grey[500])))
                      : BarChart(
                          BarChartData(
                            barGroups: _dailyRevenue
                                .asMap()
                                .entries
                                .map((entry) {
                              final revenue =
                                  (entry.value['revenue'] as num?)
                                          ?.toDouble() ??
                                      0;
                              return BarChartGroupData(
                                x: entry.key,
                                barRods: [
                                  BarChartRodData(
                                    toY: revenue,
                                    color: AppColors.primary,
                                    width: 8,
                                    borderRadius: const BorderRadius.vertical(
                                        top: Radius.circular(4)),
                                  ),
                                ],
                              );
                            }).toList(),
                            titlesData: FlTitlesData(
                              leftTitles: const AxisTitles(
                                  sideTitles:
                                      SideTitles(showTitles: false)),
                              rightTitles: const AxisTitles(
                                  sideTitles:
                                      SideTitles(showTitles: false)),
                              topTitles: const AxisTitles(
                                  sideTitles:
                                      SideTitles(showTitles: false)),
                              bottomTitles: AxisTitles(
                                sideTitles: SideTitles(
                                  showTitles: true,
                                  getTitlesWidget: (value, meta) {
                                    final index = value.toInt();
                                    if (index >= 0 &&
                                        index < _dailyRevenue.length &&
                                        index % 5 == 0) {
                                      final dateStr = _dailyRevenue[index]
                                          ['date'] as String;
                                      final date =
                                          DateTime.tryParse(dateStr);
                                      if (date != null) {
                                        return Padding(
                                          padding:
                                              const EdgeInsets.only(top: 4),
                                          child: Text(
                                            DateFormat('dd').format(date),
                                            style: const TextStyle(
                                                fontSize: 10),
                                          ),
                                        );
                                      }
                                    }
                                    return const SizedBox();
                                  },
                                ),
                              ),
                            ),
                            gridData: const FlGridData(show: false),
                            borderData: FlBorderData(show: false),
                          ),
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildItemsTab() {
    final colors = [
      AppColors.primary,
      AppColors.accent,
      AppColors.success,
      AppColors.warning,
      AppColors.danger,
      const Color(0xFF7B1FA2),
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Pie chart
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
                const Text('Most Requested Items',
                    style:
                        TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                SizedBox(
                  height: 200,
                  child: _mostRequested.isEmpty
                      ? Center(
                          child: Text('No data yet',
                              style: TextStyle(color: Colors.grey[500])))
                      : PieChart(
                          PieChartData(
                            sections: _mostRequested
                                .asMap()
                                .entries
                                .map((entry) {
                              final qty = (entry.value['total_quantity']
                                          as num?)
                                      ?.toDouble() ??
                                  0;
                              return PieChartSectionData(
                                value: qty,
                                color: colors[
                                    entry.key % colors.length],
                                title: '${qty.toInt()}',
                                titleStyle: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12),
                                radius: 80,
                              );
                            }).toList(),
                            sectionsSpace: 2,
                          ),
                        ),
                ),
                const SizedBox(height: 16),
                // Legend
                for (int i = 0; i < _mostRequested.length; i++)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Container(
                          width: 14,
                          height: 14,
                          decoration: BoxDecoration(
                            color: colors[i % colors.length],
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _mostRequested[i]['item_type'] as String? ?? '',
                          ),
                        ),
                        Text(
                          '${(_mostRequested[i]['total_quantity'] as num?)?.toInt() ?? 0} items',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCustomersTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Top Customers',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            if (_topCustomers.isEmpty)
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Text('No customer data yet',
                      style: TextStyle(color: Colors.grey[500])),
                ),
              )
            else
              for (int i = 0; i < _topCustomers.length; i++)
                Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: i == 0
                        ? const Color(0xFFFFF8E1)
                        : i == 1
                            ? const Color(0xFFF5F5F5)
                            : i == 2
                                ? const Color(0xFFFBE9E7)
                                : Colors.grey[50],
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: i == 0
                              ? const Color(0xFFFFD700)
                              : i == 1
                                  ? const Color(0xFFC0C0C0)
                                  : i == 2
                                      ? const Color(0xFFCD7F32)
                                      : Colors.grey[400],
                        ),
                        child: Center(
                          child: Text(
                            '${i + 1}',
                            style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _topCustomers[i]['name'] as String? ?? '',
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold),
                            ),
                            Text(
                              '${_topCustomers[i]['order_count']} orders',
                              style: TextStyle(
                                  color: Colors.grey[600], fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        '\$${((_topCustomers[i]['total_spent'] as num?)?.toDouble() ?? 0).toStringAsFixed(0)}',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                ),
          ],
        ),
      ),
    );
  }

  Widget _buildRevenueCard(
      String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(title, style: TextStyle(color: Colors.grey[600], fontSize: 13)),
        ],
      ),
    );
  }
}
