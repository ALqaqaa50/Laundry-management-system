import 'package:flutter/material.dart';

class AppColors {
  static const Color primary = Color(0xFF1565C0);
  static const Color primaryLight = Color(0xFF42A5F5);
  static const Color primaryDark = Color(0xFF0D47A1);
  static const Color accent = Color(0xFF00BCD4);
  static const Color success = Color(0xFF4CAF50);
  static const Color warning = Color(0xFFFF9800);
  static const Color danger = Color(0xFFF44336);
  static const Color background = Color(0xFFF5F7FA);
  static const Color cardBackground = Colors.white;
  static const Color textPrimary = Color(0xFF212121);
  static const Color textSecondary = Color(0xFF757575);
}

class OrderStatus {
  static const String received = 'RECEIVED';
  static const String washing = 'WASHING';
  static const String drying = 'DRYING';
  static const String ready = 'READY';
  static const String delivered = 'DELIVERED';

  static List<String> get all => [received, washing, drying, ready, delivered];

  static String next(String current) {
    final index = all.indexOf(current);
    if (index < all.length - 1) {
      return all[index + 1];
    }
    return current;
  }

  static Color color(String status) {
    switch (status) {
      case received:
        return const Color(0xFF9E9E9E);
      case washing:
        return const Color(0xFF2196F3);
      case drying:
        return const Color(0xFFFF9800);
      case ready:
        return const Color(0xFF4CAF50);
      case delivered:
        return const Color(0xFF1565C0);
      default:
        return const Color(0xFF9E9E9E);
    }
  }

  static IconData icon(String status) {
    switch (status) {
      case received:
        return Icons.inbox;
      case washing:
        return Icons.local_laundry_service;
      case drying:
        return Icons.dry_cleaning;
      case ready:
        return Icons.check_circle;
      case delivered:
        return Icons.delivery_dining;
      default:
        return Icons.help;
    }
  }
}

class ItemTypes {
  static const String carpetSmall = 'Carpet (Small)';
  static const String carpetMedium = 'Carpet (Medium)';
  static const String carpetLarge = 'Carpet (Large)';
  static const String blanket = 'Blanket';

  static List<String> get all => [carpetSmall, carpetMedium, carpetLarge, blanket];

  static double defaultPrice(String type) {
    switch (type) {
      case carpetSmall:
        return 25.0;
      case carpetMedium:
        return 40.0;
      case carpetLarge:
        return 60.0;
      case blanket:
        return 20.0;
      default:
        return 0.0;
    }
  }
}
