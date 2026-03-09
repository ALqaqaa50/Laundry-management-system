import 'order_item.dart';

class LaundryOrder {
  final int? id;
  final int customerId;
  final String orderNumber;
  final String status;
  final double totalPrice;
  final String? deliveryDate;
  final String? notes;
  final String? photoPath;
  final String createdAt;
  final String? customerName;
  final String? customerPhone;
  List<OrderItem> items;

  LaundryOrder({
    this.id,
    required this.customerId,
    required this.orderNumber,
    this.status = 'RECEIVED',
    this.totalPrice = 0.0,
    this.deliveryDate,
    this.notes,
    this.photoPath,
    String? createdAt,
    this.customerName,
    this.customerPhone,
    List<OrderItem>? items,
  })  : createdAt = createdAt ?? DateTime.now().toIso8601String(),
        items = items ?? [];

  Map<String, dynamic> toMap() {
    return {
      if (id != null) 'id': id,
      'customer_id': customerId,
      'order_number': orderNumber,
      'status': status,
      'total_price': totalPrice,
      'delivery_date': deliveryDate,
      'notes': notes,
      'photo_path': photoPath,
      'created_at': createdAt,
    };
  }

  factory LaundryOrder.fromMap(Map<String, dynamic> map) {
    return LaundryOrder(
      id: map['id'] as int?,
      customerId: map['customer_id'] as int,
      orderNumber: map['order_number'] as String,
      status: map['status'] as String,
      totalPrice: (map['total_price'] as num).toDouble(),
      deliveryDate: map['delivery_date'] as String?,
      notes: map['notes'] as String?,
      photoPath: map['photo_path'] as String?,
      createdAt: (map['created_at'] as String?) ?? DateTime.now().toIso8601String(),
      customerName: map['customer_name'] as String?,
      customerPhone: map['customer_phone'] as String?,
    );
  }

  LaundryOrder copyWith({
    int? id,
    int? customerId,
    String? orderNumber,
    String? status,
    double? totalPrice,
    String? deliveryDate,
    String? notes,
    String? photoPath,
    String? createdAt,
    String? customerName,
    String? customerPhone,
    List<OrderItem>? items,
  }) {
    return LaundryOrder(
      id: id ?? this.id,
      customerId: customerId ?? this.customerId,
      orderNumber: orderNumber ?? this.orderNumber,
      status: status ?? this.status,
      totalPrice: totalPrice ?? this.totalPrice,
      deliveryDate: deliveryDate ?? this.deliveryDate,
      notes: notes ?? this.notes,
      photoPath: photoPath ?? this.photoPath,
      createdAt: createdAt ?? this.createdAt,
      customerName: customerName ?? this.customerName,
      customerPhone: customerPhone ?? this.customerPhone,
      items: items ?? this.items,
    );
  }
}
