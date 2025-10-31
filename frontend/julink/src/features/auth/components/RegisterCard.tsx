import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function RegisterCard() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Register</CardTitle>
        <CardDescription>
          Create your JULink account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="flex flex-col gap-6">
            {/* Username */}
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" placeholder="your_username" required />
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@ju.edu.jo"
                required
              />
            </div>

            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="First name" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Last name" required />
              </div>
            </div>

            {/* College */}
            <div className="grid gap-2">
              <Label htmlFor="college">Faculty</Label>
              <DropdownMenu>
                <DropdownMenuTrigger>Select Faculty</DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Faculties</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>King Abdullah II School of Information Technology</DropdownMenuItem>
                    <DropdownMenuItem>Faculty of Medicine</DropdownMenuItem>
                    <DropdownMenuItem>Faculty of Art</DropdownMenuItem>
                    <DropdownMenuItem>Faculty of Languages</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Password */}
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required />
            </div>

            {/* Repeat Password */}
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Repeat Password</Label>
              <Input id="confirmPassword" type="password" required />
            </div>
          </div>
        </form>
      </CardContent>

      <CardFooter className="flex-col gap-2">
        <Button type="submit" className="w-full">
          Register
        </Button>
        <Button variant="outline" className="w-full">
          Back to Login
        </Button>
      </CardFooter>
    </Card>
  )
}
