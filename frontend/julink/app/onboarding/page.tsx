// app/onboarding/page.tsx
import { OnboardingForm } from "@/domain/profile/components/OnboardingForm";

export default function OnboardingPage() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">

            <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-300 my-8">
                <OnboardingForm />
            </div>

        </div>
    );
}