import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:julink/common/helper/is_dark_mode.dart';
import 'package:julink/common/widgets/button/basic_app_button.dart';
import 'package:julink/common/widgets/button/cancel_app_button.dart';
import 'package:julink/core/configs/assets/app_vectors.dart';
import 'package:julink/core/configs/theme/app_colors.dart';

class SignupPage extends StatefulWidget {
  const SignupPage({super.key});

  @override
  State<SignupPage> createState() => _SignupPageState();
}

class _SignupPageState extends State<SignupPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Container(
          width: 700,
          height: 800,
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            color: context.isDarkMode
                ? const Color(0xffF1F1F1)
                : const Color(0xffF1F1F1),
            borderRadius: BorderRadius.circular(16),
            boxShadow: const [
              BoxShadow(
                color: Colors.black26,
                blurRadius: 12,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: const SignupForm(),
        ),
      ),
    );
  }
}

class SignupForm extends StatefulWidget {
  const SignupForm({super.key});

  @override
  State<SignupForm> createState() => _SignupFormState();
}

class _SignupFormState extends State<SignupForm> {
  final TextEditingController _firstNameController = TextEditingController();
  final TextEditingController _lastNameController = TextEditingController();
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _repeatPasswordController =
      TextEditingController();
  final TextEditingController _collegeController = TextEditingController();
  final TextEditingController _majorController = TextEditingController();

  final RegExp _emailRegex = RegExp(r'^[a-zA-Z0-9._%+-]+@ju\.edu\.jo$');

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _repeatPasswordController.dispose();
    _collegeController.dispose();
    _majorController.dispose();
    super.dispose();
  }

  bool _isValidEmail(String email) {
    return _emailRegex.hasMatch(email);
  }

  bool _isValidPassword(String password) {
    return password.length >= 8;
  }

  bool _passwordMatch(String password, String reEnteredPassword) {
    return password == reEnteredPassword;
  }

  bool _isValidUsername(String username) {
    print('username Validation is still not done yet');
    return true; // for now
  }

  void _formSubmit() async {
    final formData = {
      "firstName": _firstNameController.text.trim(),
      "lastName": _lastNameController.text.trim(),
      "email": _emailController.text.trim(),
      "password": _passwordController.text.trim(),
      "major": _majorController.text.trim(),
      "username": _usernameController.text.trim(),
      "confirmedPassword": _repeatPasswordController.text.trim(),
      "college": _collegeController.text.trim(),
    };
    if (!_isValidEmail(formData["email"]!)) {
      _emailController.clear();
      print("invalid email yuh");
      return;
    }
    if (!_passwordMatch(
      formData["password"]!,
      formData["confirmedPassword"]!,
    )) {
      print("passwords dont match");
      _repeatPasswordController.clear();
    }

    final jsonMessage = jsonEncode(formData);

    try {
      final response = await http.post(
        Uri.parse('http://localhost:8080/entry/createUser'),
        body: jsonMessage,
      );
      print("error happened here");
      if (response.statusCode == 200) {
        print('Success! Server response: ${response.body}');
      }
    } catch (e) {
      print('Error sending request: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        SvgPicture.asset(AppVectors.logo, height: 110, width: 99.1),
        const SizedBox(height: 50),
        const Text(
          "Sign in With Your Account",
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        const Text(
          "Join JULink and connect with your university community",
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w500,
            color: Color(0xff949494),
          ),
        ),
        const SizedBox(height: 15),
        Row(
          children: [
            Expanded(
              child: _buildField(context, _firstNameController, "First Name"),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildField(context, _lastNameController, "Last Name"),
            ),
          ],
        ),
        const SizedBox(height: 5),
        _buildField(context, _collegeController, "College"),
        const SizedBox(height: 5),
        _buildField(context, _majorController, "Major"),
        const SizedBox(height: 5),
        _buildField(context, _usernameController, "Username"),
        const SizedBox(height: 5),
        _buildField(
          context,
          _emailController,
          "email@ju.edu.jo",
          errorText: 'Email must end with @ju.edu.jo',
        ),
        const SizedBox(height: 5),
        _buildField(context, _passwordController, "Password", isPassword: true),
        const SizedBox(height: 5),
        _buildField(
          context,
          _repeatPasswordController,
          "Repeat Your Password",
          isPassword: true,
        ),
        const SizedBox(height: 15),
        Row(
          children: [
            Expanded(
              child: BasicAppButton(
                onPressed: _formSubmit,
                // Access field values like _firstNameController.text
                title: "Create Account  →",
                height: 70,
              ),
            ),
            Expanded(child: CancelAppButton(onPressed: () {}, height: 70)),
          ],
        ),
      ],
    );
  }

  Widget _buildField(
    BuildContext context,
    TextEditingController controller,
    String hint, {
    bool isPassword = false,
    String? errorText,
  }) {
    return TextField(
      controller: controller,
      obscureText: isPassword,

      decoration: InputDecoration(
        focusedBorder: OutlineInputBorder(
          borderSide: BorderSide(color: AppColors.primary, width: 2),
          borderRadius: BorderRadius.circular(13),
        ),
        hoverColor: AppColors.primary,
        hintText: hint,
        errorText: errorText,
        hintStyle: const TextStyle(color: Color(0xff949494)),
        isDense: false,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(13)),
      ).applyDefaults(Theme.of(context).inputDecorationTheme),
    );
  }
}
