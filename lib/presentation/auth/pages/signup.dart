import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:julink/common/helper/is_dark_mode.dart';
import 'package:julink/common/widgets/button/basic_app_button.dart';
import 'package:julink/common/widgets/button/cancel_app_button.dart';
import 'package:julink/core/configs/assets/app_vectors.dart';
import 'package:julink/core/configs/theme/app_colors.dart';

class SignupPage extends StatelessWidget {
  const SignupPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
    
      body: Center(
        
        child: Container(
          width: 700,
          height: 800,
          padding: EdgeInsets.all(32),
          decoration: BoxDecoration(
            color: context.isDarkMode? Color(0xffF1F1F1):Color(0xffF1F1F1),
            borderRadius: BorderRadius.circular(16),
            boxShadow: const[
              BoxShadow(
                color: Colors.black26,blurRadius: 12,offset: Offset(0,4)
              )
            ]
          ),
          child: SignupForm(),
        ),
      ),
    );
  }
 
}
 class SignupForm extends StatelessWidget {
  const SignupForm({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        SvgPicture.asset(AppVectors.logo,height: 110,width: 99.1),
        SizedBox(height:  50,),
        Text("Sign in With Your Account",
          style:TextStyle(fontSize: 24,fontWeight: FontWeight.w600,),
          
        ),
        const SizedBox(height: 8,),
        
        Text("Join JULink and connect with your university community",
          style:TextStyle(fontSize: 16,fontWeight: FontWeight.w500,color: Color(0xff949494)),
          
        )
        ,
        SizedBox(height:  15,),
        //fields here 
        Row(children: [
          Expanded(child: _firstNameField(context),), SizedBox(width: 10,),Expanded(child: _lastNameField(context),),

        ],),
      SizedBox(height:  5),
    
           _collegeField(context),
            SizedBox(height:  5),
 
           _majorField(context),

            SizedBox(height:  5),

      _usernameField(context),
              SizedBox(height:  5),

      _emailField(context),
      SizedBox(height:  5),

       _passwordField(context),
      SizedBox(height:  5),

      _repeatPasswordField(context),
      SizedBox(height:  15),

      Row(
        children: [
          Expanded(child: BasicAppButton(onPressed: (){},title: "Create Account  →",height: 70,))
          ,
          Expanded(child: CancelAppButton(onPressed: (){},height: 70,))
          
          ],
      )

        

      ],
    );
  }
  
}
Widget _firstNameField(BuildContext context) {

    return TextField(
      decoration: InputDecoration(
        focusedBorder: OutlineInputBorder(
          borderSide: BorderSide(color: AppColors.primary,width: 2),
          borderRadius: BorderRadius.circular(13)
        ),
      hoverColor: AppColors.primary,hintText: 'First Name',
      hintStyle: TextStyle(color:Color(0xff949494) ),
      isDense: false,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(13),))
          .applyDefaults(Theme.of(context).inputDecorationTheme),
          
    );
  }
Widget _lastNameField(BuildContext context) {

    return TextField(
      decoration: InputDecoration(
        focusedBorder: OutlineInputBorder(
          borderSide: BorderSide(color: AppColors.primary,width: 2),
          borderRadius: BorderRadius.circular(13)
        ),
      hoverColor: AppColors.primary,hintText: 'Last Name',
      hintStyle: TextStyle(color:Color(0xff949494) ),
      isDense: false,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(13),))
          .applyDefaults(Theme.of(context).inputDecorationTheme),
          
    );
  }




  Widget _usernameField(BuildContext context) {

    return TextField(
      decoration: InputDecoration(
        focusedBorder: OutlineInputBorder(
          borderSide: BorderSide(color: AppColors.primary,width: 2),
          borderRadius: BorderRadius.circular(13)
        ),
      hoverColor: AppColors.primary,hintText: 'Username',
      hintStyle: TextStyle(color:Color(0xff949494) ),
      isDense: false,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(13),))
          .applyDefaults(Theme.of(context).inputDecorationTheme),
          
    );
  }

  Widget _emailField(BuildContext context) {

    return TextField(
      decoration: InputDecoration(
        focusedBorder: OutlineInputBorder(
          borderSide: BorderSide(color: AppColors.primary,width: 2),
          borderRadius: BorderRadius.circular(13)
        ),
      hoverColor: AppColors.primary,hintText: 'email@ju.edu.jo',
      hintStyle: TextStyle(color:Color(0xff949494) ),
      isDense: false,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(13),))
          .applyDefaults(Theme.of(context).inputDecorationTheme),
          
    );
  }
  Widget _passwordField(BuildContext context) {

    return TextField(
      obscureText:true,
      decoration: InputDecoration(
        focusedBorder: OutlineInputBorder(
          borderSide: BorderSide(color: AppColors.primary,width: 2),
          borderRadius: BorderRadius.circular(13)
        ),
      hoverColor: AppColors.primary,hintText: 'Password',
      hintStyle: TextStyle(color:Color(0xff949494) ),
      isDense: false,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(13),))
          .applyDefaults(Theme.of(context).inputDecorationTheme),
          
    );
  }

  Widget _repeatPasswordField(BuildContext context) {

    return TextField(
              obscureText:true,
      decoration: InputDecoration(
        focusedBorder: OutlineInputBorder(
          borderSide: BorderSide(color: AppColors.primary,width: 2),
          borderRadius: BorderRadius.circular(13)
        ),
      hoverColor: AppColors.primary,hintText: 'Repeat Your Password',
      hintStyle: TextStyle(color:Color(0xff949494) ),
      isDense: false,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(13),))
          .applyDefaults(Theme.of(context).inputDecorationTheme),
          
    );
  }
  Widget _majorField(BuildContext context) {

    return TextField(
      decoration: InputDecoration(
        focusedBorder: OutlineInputBorder(
          borderSide: BorderSide(color: AppColors.primary,width: 2),
          borderRadius: BorderRadius.circular(13)
        ),
      hoverColor: AppColors.primary,hintText: 'Major',
      hintStyle: TextStyle(color:Color(0xff949494) ),
      isDense: false,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(13),))
          .applyDefaults(Theme.of(context).inputDecorationTheme),
          
    );
  }
  
  
  Widget _collegeField(BuildContext context) {

    return TextField(
      decoration: InputDecoration(
        focusedBorder: OutlineInputBorder(
          borderSide: BorderSide(color: AppColors.primary,width: 2),
          borderRadius: BorderRadius.circular(13)
        ),
      hoverColor: AppColors.primary,hintText: 'College',
      hintStyle: TextStyle(color:Color(0xff949494) ),
      isDense: false,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(13),))
          .applyDefaults(Theme.of(context).inputDecorationTheme),
          
    );
  }
  