import 'package:flutter/material.dart';
import 'package:julink/core/configs/theme/app_colors.dart';

class AppTheme {
  static final lightTheme =ThemeData(
    primaryColor: AppColors.primary,
    fontFamily: 'Inter',
    scaffoldBackgroundColor: AppColors.lightBackground,
    brightness: Brightness.light,
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
      backgroundColor: AppColors.primary,
      textStyle: TextStyle(fontSize: 16,fontWeight: FontWeight.normal),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))
      ),

    )
  );


//----------dark


static final darkTheme =ThemeData(
    primaryColor: AppColors.primary,
        fontFamily: 'Inter',

    scaffoldBackgroundColor: AppColors.darkBackground,
    brightness: Brightness.dark,
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
      backgroundColor: AppColors.primary,
      textStyle: TextStyle(fontSize: 16,fontWeight: FontWeight.normal),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))
      ),

    )
  );

}