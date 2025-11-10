import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { registerUserThunk, resetState, sendOTPThunk, verifyOTPThunk } from "@/store/slices/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { Colleges } from "@/types/college";

export function RegisterCard() {
  const dispatch = useAppDispatch();
  const { loading, error, success } = useAppSelector((state) => state.auth);
  const [showOtp,setShowOtp]=useState(false);
  const collegeList = Object.entries(Colleges); 
  const [otpField,setOtpField] = useState({
    otp :""
  })
  const [form, setForm] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    college: "", 
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    dispatch(
      registerUserThunk({
        username: form.username,
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        college: form.college, 
        password: form.password,
      })
    );

    dispatch(
      sendOTPThunk(
        {
          email : form.email,
        }
      )
    )
    setShowOtp(true);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    dispatch(
      verifyOTPThunk({
        email: form.email,
        otp : otpField.otp
      })
    );
  };



  useEffect(() => {
    if (success) {
        
    }
  }, [success]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Register</CardTitle>
        <CardDescription>Create your JULink account</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={form.username} onChange={handleChange} placeholder="your_username" required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email } onChange={handleChange} placeholder="user@ju.edu.jo" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={form.firstName} onChange={handleChange} placeholder="First name" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={form.lastName} onChange={handleChange} placeholder="Last name" required />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="college">Faculty</Label>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  {form.college ? Colleges[form.college as keyof typeof Colleges] : "Select Faculty"}
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Faculties</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {collegeList.map(([key, name]) => (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => setForm({ ...form, college: key })}
                    >
                      {name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={form.password} onChange={handleChange} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Repeat Password</Label>
              <Input id="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required />
            </div>
            
           {showOtp && <div className="grid gap-1">
              <Label htmlFor="verifyOtp">OTP</Label>
              <Input id="confirmPassword" type="password" value={otpField.otp} onChange={handleChange} required />
            </div>
            }
            {error && <p className="text-red-500 text-sm">{"Please Check Your Credintials"}</p>}
          </div>
            
          <CardFooter className="flex-col gap-2 mt-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </Button>
            <Button variant="outline" className="w-full">
              Back to Login
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
