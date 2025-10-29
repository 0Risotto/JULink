import { LoginCard } from '../components/LoginCard'
import julinkLogo from '../../../assets/icons/julink_logo.svg'
import julinkLogo2 from '../../../assets/images/julink_logo_noname.png'

function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center  ">
      {/* Left side with logo and description */}
      <div className="flex-1 flex flex-col items-left justify-center px-12 space-y-6 ml-40 ">
        <img
          src={julinkLogo}
          alt="JULink logo"
          className="w-40 h-auto"
        />
        <p className="max-w-md text-lg text-gray-700 text-justify">
          A social platform created by students at the University of Jordan to enhance communication and
          collaboration within the university community.
        </p>
      </div>

      {/* Right side with the login card */}
      <div className="flex-1 flex items-center justify-center">
        <LoginCard />
      </div>
    </div>
  )
}

export default LoginPage
