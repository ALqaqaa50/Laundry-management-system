import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../models/order.dart';
import '../utils/constants.dart';

class InvoiceScreen extends StatelessWidget {
  final LaundryOrder order;

  const InvoiceScreen({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    final createdDate = DateTime.tryParse(order.createdAt);
    final deliveryDate =
        order.deliveryDate != null ? DateTime.tryParse(order.deliveryDate!) : null;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Invoice'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.print),
            onPressed: () => _printInvoice(context),
            tooltip: 'Print Invoice',
          ),
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: () => _shareInvoice(context),
            tooltip: 'Share as PDF',
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Container(
          padding: const EdgeInsets.all(24),
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
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Center(
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Icon(Icons.local_laundry_service,
                          size: 40, color: AppColors.primary),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'LAUNDRY PRO',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primaryDark,
                        letterSpacing: 2,
                      ),
                    ),
                    Text(
                      'Professional Carpet & Blankets Cleaning',
                      style: TextStyle(color: Colors.grey[600], fontSize: 12),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Tel: +966-XXX-XXXX | info@laundrypro.com',
                      style: TextStyle(color: Colors.grey[500], fontSize: 11),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              const Divider(thickness: 2),
              const SizedBox(height: 12),

              // Invoice Info
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('INVOICE',
                          style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                              color: AppColors.primary)),
                      Text('#${order.orderNumber}',
                          style: const TextStyle(
                              fontSize: 20, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  QrImageView(
                    data: order.orderNumber,
                    version: QrVersions.auto,
                    size: 80,
                    gapless: false,
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Dates
              Row(
                children: [
                  Expanded(
                    child: _buildInfoRow(
                      'Date',
                      createdDate != null
                          ? DateFormat('MMM dd, yyyy').format(createdDate)
                          : '-',
                    ),
                  ),
                  Expanded(
                    child: _buildInfoRow(
                      'Delivery',
                      deliveryDate != null
                          ? DateFormat('MMM dd, yyyy').format(deliveryDate)
                          : 'TBD',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Customer info
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Customer',
                        style: TextStyle(
                            color: Colors.grey[600], fontSize: 12)),
                    Text(order.customerName ?? 'Unknown',
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 16)),
                    if (order.customerPhone != null)
                      Text(order.customerPhone!,
                          style: TextStyle(color: Colors.grey[600])),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Items table
              Container(
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey[300]!),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  children: [
                    // Table header
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(8)),
                      ),
                      child: const Row(
                        children: [
                          Expanded(
                              flex: 3,
                              child: Text('Item',
                                  style:
                                      TextStyle(fontWeight: FontWeight.bold))),
                          Expanded(
                              child: Text('Qty',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                  textAlign: TextAlign.center)),
                          Expanded(
                              flex: 2,
                              child: Text('Price',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                  textAlign: TextAlign.right)),
                          Expanded(
                              flex: 2,
                              child: Text('Total',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                  textAlign: TextAlign.right)),
                        ],
                      ),
                    ),
                    // Items
                    for (final item in order.items)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 10),
                        decoration: BoxDecoration(
                          border: Border(
                              top: BorderSide(color: Colors.grey[200]!)),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                                flex: 3, child: Text(item.itemType)),
                            Expanded(
                                child: Text('${item.quantity}',
                                    textAlign: TextAlign.center)),
                            Expanded(
                                flex: 2,
                                child: Text(
                                    '\$${item.price.toStringAsFixed(2)}',
                                    textAlign: TextAlign.right)),
                            Expanded(
                                flex: 2,
                                child: Text(
                                    '\$${item.total.toStringAsFixed(2)}',
                                    textAlign: TextAlign.right,
                                    style: const TextStyle(
                                        fontWeight: FontWeight.w600))),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Total
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.2)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'TOTAL AMOUNT',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primaryDark,
                      ),
                    ),
                    Text(
                      '\$${order.totalPrice.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Status
              Center(
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  decoration: BoxDecoration(
                    color: OrderStatus.color(order.status)
                        .withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    'Status: ${order.status}',
                    style: TextStyle(
                      color: OrderStatus.color(order.status),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Footer
              const Divider(),
              Center(
                child: Text(
                  'Thank you for choosing Laundry Pro!\nWe take care of your items with love.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey[500], fontSize: 12),
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _printInvoice(context),
                  icon: const Icon(Icons.print),
                  label: const Text('Print'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => Navigator.popUntil(
                      context, (route) => route.isFirst),
                  icon: const Icon(Icons.check),
                  label: const Text('Done'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(color: Colors.grey[600], fontSize: 12)),
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
      ],
    );
  }

  Future<void> _printInvoice(BuildContext context) async {
    final pdf = await _generatePdf();
    await Printing.layoutPdf(onLayout: (_) async => pdf);
  }

  Future<void> _shareInvoice(BuildContext context) async {
    final pdf = await _generatePdf();
    await Printing.sharePdf(bytes: pdf, filename: 'invoice_${order.orderNumber}.pdf');
  }

  Future<Uint8List> _generatePdf() async {
    final doc = pw.Document();
    final createdDate = DateTime.tryParse(order.createdAt);
    final deliveryDate =
        order.deliveryDate != null ? DateTime.tryParse(order.deliveryDate!) : null;

    doc.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(40),
        build: (context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              // Header
              pw.Center(
                child: pw.Column(
                  children: [
                    pw.Text('LAUNDRY PRO',
                        style: pw.TextStyle(
                            fontSize: 24, fontWeight: pw.FontWeight.bold)),
                    pw.SizedBox(height: 4),
                    pw.Text('Professional Carpet & Blankets Cleaning',
                        style: const pw.TextStyle(fontSize: 10)),
                    pw.Text('Tel: +966-XXX-XXXX | info@laundrypro.com',
                        style: const pw.TextStyle(
                            fontSize: 9, color: PdfColors.grey600)),
                  ],
                ),
              ),
              pw.SizedBox(height: 16),
              pw.Divider(thickness: 2),
              pw.SizedBox(height: 12),

              // Invoice info
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text('INVOICE',
                          style: pw.TextStyle(
                              fontWeight: pw.FontWeight.bold,
                              color: PdfColors.blue800)),
                      pw.Text('#${order.orderNumber}',
                          style: pw.TextStyle(
                              fontSize: 18,
                              fontWeight: pw.FontWeight.bold)),
                    ],
                  ),
                  pw.BarcodeWidget(
                    data: order.orderNumber,
                    barcode: pw.Barcode.qrCode(),
                    width: 80,
                    height: 80,
                  ),
                ],
              ),
              pw.SizedBox(height: 12),

              // Dates
              pw.Row(
                children: [
                  pw.Expanded(
                    child: pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text('Date',
                            style: const pw.TextStyle(
                                color: PdfColors.grey600, fontSize: 10)),
                        pw.Text(
                          createdDate != null
                              ? DateFormat('MMM dd, yyyy').format(createdDate)
                              : '-',
                          style:
                              pw.TextStyle(fontWeight: pw.FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                  pw.Expanded(
                    child: pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text('Delivery',
                            style: const pw.TextStyle(
                                color: PdfColors.grey600, fontSize: 10)),
                        pw.Text(
                          deliveryDate != null
                              ? DateFormat('MMM dd, yyyy')
                                  .format(deliveryDate)
                              : 'TBD',
                          style:
                              pw.TextStyle(fontWeight: pw.FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              pw.SizedBox(height: 12),

              // Customer
              pw.Container(
                width: double.infinity,
                padding: const pw.EdgeInsets.all(10),
                decoration: pw.BoxDecoration(
                  color: PdfColors.grey100,
                  borderRadius: pw.BorderRadius.circular(4),
                ),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text('Customer',
                        style: const pw.TextStyle(
                            color: PdfColors.grey600, fontSize: 10)),
                    pw.Text(order.customerName ?? 'Unknown',
                        style: pw.TextStyle(
                            fontWeight: pw.FontWeight.bold, fontSize: 14)),
                    if (order.customerPhone != null)
                      pw.Text(order.customerPhone!),
                  ],
                ),
              ),
              pw.SizedBox(height: 16),

              // Items table
              pw.TableHelper.fromTextArray(
                headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold),
                headerDecoration:
                    const pw.BoxDecoration(color: PdfColors.blue50),
                cellPadding: const pw.EdgeInsets.all(8),
                cellAlignment: pw.Alignment.centerLeft,
                headers: ['Item', 'Qty', 'Price', 'Total'],
                data: [
                  for (final item in order.items)
                    [
                      item.itemType,
                      '${item.quantity}',
                      '\$${item.price.toStringAsFixed(2)}',
                      '\$${item.total.toStringAsFixed(2)}',
                    ],
                ],
              ),
              pw.SizedBox(height: 12),

              // Total
              pw.Container(
                width: double.infinity,
                padding: const pw.EdgeInsets.all(12),
                decoration: pw.BoxDecoration(
                  color: PdfColors.blue50,
                  borderRadius: pw.BorderRadius.circular(4),
                ),
                child: pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('TOTAL AMOUNT',
                        style: pw.TextStyle(
                            fontWeight: pw.FontWeight.bold,
                            fontSize: 14)),
                    pw.Text('\$${order.totalPrice.toStringAsFixed(2)}',
                        style: pw.TextStyle(
                            fontWeight: pw.FontWeight.bold,
                            fontSize: 18,
                            color: PdfColors.blue800)),
                  ],
                ),
              ),
              pw.SizedBox(height: 8),

              pw.Center(
                child: pw.Text('Status: ${order.status}',
                    style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
              ),
              pw.SizedBox(height: 20),
              pw.Divider(),
              pw.Center(
                child: pw.Text(
                  'Thank you for choosing Laundry Pro!\nWe take care of your items with love.',
                  textAlign: pw.TextAlign.center,
                  style: const pw.TextStyle(
                      fontSize: 10, color: PdfColors.grey600),
                ),
              ),
            ],
          );
        },
      ),
    );

    return Uint8List.fromList(await doc.save());
  }
}
