import 'package:flutter_test/flutter_test.dart';

import 'package:laundry_management/main.dart';

void main() {
  testWidgets('App launches successfully', (WidgetTester tester) async {
    await tester.pumpWidget(const LaundryManagementApp());
    await tester.pump();

    // Verify the app shows the dashboard
    expect(find.text('Laundry Manager'), findsOneWidget);
    expect(find.text('Dashboard Overview'), findsOneWidget);
  });
}
