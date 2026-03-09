class InventoryItem {
  final int? id;
  final String productName;
  final double quantity;
  final String unit;
  final double alertLevel;
  final String? lastUpdated;

  InventoryItem({
    this.id,
    required this.productName,
    required this.quantity,
    this.unit = 'liters',
    required this.alertLevel,
    this.lastUpdated,
  });

  bool get isLowStock => quantity <= alertLevel;

  Map<String, dynamic> toMap() {
    return {
      if (id != null) 'id': id,
      'product_name': productName,
      'quantity': quantity,
      'unit': unit,
      'alert_level': alertLevel,
      'last_updated': lastUpdated ?? DateTime.now().toIso8601String(),
    };
  }

  factory InventoryItem.fromMap(Map<String, dynamic> map) {
    return InventoryItem(
      id: map['id'] as int?,
      productName: map['product_name'] as String,
      quantity: (map['quantity'] as num).toDouble(),
      unit: (map['unit'] as String?) ?? 'liters',
      alertLevel: (map['alert_level'] as num).toDouble(),
      lastUpdated: map['last_updated'] as String?,
    );
  }

  InventoryItem copyWith({
    int? id,
    String? productName,
    double? quantity,
    String? unit,
    double? alertLevel,
    String? lastUpdated,
  }) {
    return InventoryItem(
      id: id ?? this.id,
      productName: productName ?? this.productName,
      quantity: quantity ?? this.quantity,
      unit: unit ?? this.unit,
      alertLevel: alertLevel ?? this.alertLevel,
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }
}
