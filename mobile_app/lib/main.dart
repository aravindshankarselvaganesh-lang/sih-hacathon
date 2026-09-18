import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'database/offline_database.dart';
import 'screens/dashboard_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
    debugPrint('FlutterError: ${details.exception}');
    debugPrint('${details.stack}');
  };

  // Pre-warm offline-first SQLite so first screen never blocks on DB open.
  try {
    await OfflineDatabase.instance.database;
  } catch (e, stack) {
    debugPrint('OfflineDatabase pre-warm failed: $e');
    debugPrint('$stack');
  }

  runApp(const SulfScanApp());
}

class SulfScanApp extends StatelessWidget {
  const SulfScanApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SULFSCAN - H2S Safety Monitor',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0284C7),
          primary: const Color(0xFF0284C7),
          secondary: const Color(0xFF0F172A),
        ),
        useMaterial3: true,
        fontFamily: 'Roboto',
      ),
      home: const DashboardScreen(),
    );
  }
}
