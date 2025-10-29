import React, { useState } from 'react'
import Card from '../../../components/common/CardComponent' // adjust path if needed

interface RegisterForm {
  username: string
  email: string
  firstName: string
  password: string
  repeatedPassword: string
}

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState<RegisterForm>({
    username: '',
    email: '',
    firstName: '',
    password: '',
    repeatedPassword: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.repeatedPassword) {
      alert("Passwords don't match!")
      return
    }
    console.log('Form submitted', formData)
  }

  return (
    <div>
      <Card>
        <h1>Register</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleChange}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />
          <input
            type="password"
            name="repeatedPassword"
            placeholder="Repeat Password"
            value={formData.repeatedPassword}
            onChange={handleChange}
          />
          <button type="submit">Register</button>
        </form>
      </Card>
    </div>
  )
}

export default RegisterPage
