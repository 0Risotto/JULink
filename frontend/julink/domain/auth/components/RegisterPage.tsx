import Image from "next/image";
import { RegisterCard } from "../components/RegisterCard";
import julinkLogo from "@assets/icons/julink_logo.svg";
import YouTubeEmbed from "@/components/common/youtube/YoutubeFrame";

function RegisterPage() {
  return (
    <div className="flex min-h-screen justify-center  ">
      {/* Left side with logo and description */}
      <div className="hidden  lg:flex flex-col  justify-center px-20 space-y-6 ">
        <Image src={julinkLogo} alt="JULink logo" className="w-40 h-auto" />
        <p className="max-w-md text-lg  text-justify">
          A social platform created by students at the University of Jordan to
          enhance communication and collaboration within the university
          community.
        </p>
        <YouTubeEmbed videoId="UZl_0maRuvY" width="500" height="350" />
      </div>

      {/* Right side with the login card */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="lg:hidden mt-8 mb-4">
          <Image src={julinkLogo} alt="JULink logo" className="w-64 h-auto" />
        </div>
        {/* Added p-4 to the container below */}
        <div className="w-full max-w-md  drop-shadow-xl">
          <RegisterCard />
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;