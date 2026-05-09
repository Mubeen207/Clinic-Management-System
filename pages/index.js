import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/src/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (role === "admin") router.replace("/dashboard/AdminDashboard");
        else if (role === "doctor") router.replace("/dashboard/DoctorDashboard");
        else if (role === "staff" || role === "receptionist") router.replace("/dashboard/StaffDashboard");
        else if (role === "accountant") router.replace("/dashboard/AccountantDashboard");
        else router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [user, role, loading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
      <p className="mt-4 text-gray-600">Redirecting...</p>
    </div>
  );
}
