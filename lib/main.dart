import 'package:flutter/material.dart';
import 'package:julink/core/configs/theme/app_theme.dart';
import 'package:julink/presentation/splash/pages/splash.dart';

void main() {
  runApp(const MainApp());
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      theme: AppTheme.lightTheme,
      home: const SplashPage(),
      debugShowCheckedModeBanner: false,
    );
  }
}
