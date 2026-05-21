import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { getMyUsername } from "@/domain/profile/services/profileServices";

export const handleLoginSuccess = async (router: AppRouterInstance, loginPayload: any) => {
  try {
    if(loginPayload.isFirstLogin === true){
      router.push("/onboarding");
      return;
    }
    const response = await getMyUsername();
    console.log("Full response:", response);
    
    // Use type assertion since the actual response structure differs from ApiResponse
    const typedResponse = response as any;
    
    if (typedResponse.Status === "Success" && typedResponse.username) {
      console.log("Username fetched:", typedResponse.username);
      router.push(`/${typedResponse.username}`);
    } else {
      console.error("Username not found in response");
      router.push("/login");
    }
  } catch (error) {
    console.error("Failed to fetch username:", error);
    router.push("/login");
  }
};
