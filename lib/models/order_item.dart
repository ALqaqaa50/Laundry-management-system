class OrderItem {
  final int? id;
  final int? orderId;
  final String itemType;
  final int quantity;
  final double price;

  OrderItem({
    this.id,
    this.orderId,
    required this.itemType,
    required this.quantity,
    required this.price,
  });

  double get total => quantity * price;

  Map<String, dynamic> toMap() {
    return {
      if (id != null) 'id': id,
      if (orderId != null) 'order_id': orderId,
      'item_type': itemType,
      'quantity': quantity,
      'price': price,
    };
  }

  factory OrderItem.fromMap(Map<String, dynamic> map) {
    return OrderItem(
      id: map['id'] as int?,
      orderId: map['order_id'] as int?,
      itemType: map['item_type'] as String,
      quantity: map['quantity'] as int,
      price: (map['price'] as num).toDouble(),
    );
  }

  OrderItem copyWith({
    int? id,
    int? orderId,
    String? itemType,
    int? quantity,
    double? price,
  }) {
    return OrderItem(
      id: id ?? this.id,
      orderId: orderId ?? this.orderId,
      itemType: itemType ?? this.itemType,
      quantity: quantity ?? this.quantity,
      price: price ?? this.price,
    );
  }
}
