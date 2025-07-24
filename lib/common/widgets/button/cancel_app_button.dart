import 'package:flutter/material.dart';

class CancelAppButton extends StatelessWidget {
  final VoidCallback onPressed;
  final double? height;

  const CancelAppButton({
    super.key,
    required this.onPressed,
    this.height,
  });

  @override
  Widget build(BuildContext context) {
    return TextButton(
      onPressed: onPressed,
      style: TextButton.styleFrom(
        backgroundColor: const Color(0xFFE8E8E8),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(26),
        ),
        minimumSize: Size.fromHeight(height ?? 80),
      ),
      child: const Text(
        "Cancel",
        style: TextStyle(
          color: Color(0xFF949494),
        ),
      ),
    );
  }
}
