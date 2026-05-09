import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";

import { auth, db } from "@/src/services/firebase/config";
import { useAuth } from "@/src/context/AuthContext";
import { AuthLayout } from "@/src/components/layout/AuthLayout";
import { Input } from "@/src/components/common/Input";
import { Button } from "@/src/components/common/Button";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingLocal, setLoadingLocal] = useState(false);
  
  const router = useRouter();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && role) {
      if (role === "admin") router.replace("/dashboard/AdminDashboard");
      else if (role === "doctor") router.replace("/dashboard/DoctorDashboard");
      else if (role === "staff" || role === "receptionist") router.replace("/dashboard/StaffDashboard");
      else router.replace("/");
    }
  }, [user, role, loading, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoadingLocal(true);

    try {
      const { user: loggedInUser } = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "users", loggedInUser.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userRole = userData.role;

        if (userData.status === "blacklisted" || userData.status === "disabled") {
          await auth.signOut();
          toast.error("Account disabled. Please contact the administrator.");
          setLoadingLocal(false);
          return;
        }

        toast.success(`Welcome back!`);

        if (userRole === "admin") router.replace("/dashboard/AdminDashboard");
        else if (userRole === "doctor") router.replace("/dashboard/DoctorDashboard");
        else router.replace("/dashboard/StaffDashboard");
      } else {
        toast.error("User profile not found.");
        await auth.signOut();
      }
    } catch (error) {
      console.error("Login Error:", error);
      toast.error("Invalid email or password.");
    } finally {
      setLoadingLocal(false);
    }
  };

  if (loading) return null; // Let the AuthLayout handle flashes or AuthContext

  return (
    <AuthLayout title="Sign in to your account" subtitle="CareClinic Management System">
      <form onSubmit={handleLogin} className="space-y-6">
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="doctor@careclinic.com"
        />

        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
              Forgot password?
            </a>
          </div>
        </div>

        <Button type="submit" className="w-full" isLoading={loadingLocal}>
          Sign in
        </Button>
        
        <p className="text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-blue-600 hover:text-blue-500">
            Register now
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
