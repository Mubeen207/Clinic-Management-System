import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/src/context/AuthContext";
import { Loader2 } from "lucide-react";

/**
 * Client-Side Route Guard (withAuth HOC)
 * 
 * NOTE: Client-side route guards handle UX redirection and UI access control only.
 * They rely on Firebase Auth state and the role loaded directly from the user's Firestore profile via AuthContext.
 * Server-side authorization must be enforced via Firestore Security Rules.
 */
export function withAuth(WrappedComponent, allowedRoles = []) {
  return function ProtectedRoute(props) {
    const { user, role, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!user) {
          router.replace("/login");
        } else if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
          // Redirect user to their designated dashboard if route is not authorized for their role
          if (role === "admin") router.replace("/dashboard/AdminDashboard");
          else if (role === "doctor") router.replace("/dashboard/DoctorDashboard");
          else if (role === "staff" || role === "receptionist") router.replace("/dashboard/StaffDashboard");
          else if (role === "accountant") router.replace("/dashboard/AccountantDashboard");
          else router.replace("/");
        }
      }
    }, [user, role, loading, router]);

    if (loading || !user || (allowedRoles.length > 0 && !allowedRoles.includes(role))) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-black">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
          <p className="mt-4 text-gray-600 font-medium">Verifying access...</p>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}
