import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:julink/common/helper/is_dark_mode.dart';
import 'package:julink/core/configs/assets/app_vectors.dart';

class SigninPage extends StatelessWidget {
  const SigninPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
    
      body: Center(
        
        child: Container(
          width: 480,
          height: 555,
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
          child: SigninForm(),
        ),
      ),
    );
  }
 
}
 class SigninForm extends StatelessWidget {
  const SigninForm({super.key});

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
        SizedBox(height:  30,),
        _emailField(context)
        

      ],
    );
  }
  
}
Widget _emailField(BuildContext context) {
    return TextField(
      decoration: InputDecoration(hintText: 'Enter Email',isDense: true,border: InputBorder.none)
          .applyDefaults(Theme.of(context).inputDecorationTheme),
    );
  }
