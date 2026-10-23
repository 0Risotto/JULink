import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export const handleLoginSuccess = async (
  router: AppRouterInstance,
  loginPayload: { user?: { first_login?: boolean | null } },
) => {
  if (loginPayload.user?.first_login) {
    router.push("/onboarding");
    return;
  }
  router.push("/home");
};
