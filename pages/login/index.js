import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
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
  const [authError, setAuthError] = useState("");
  
  const router = useRouter();
  const { user, role, loading, loginUser } = useAuth();

  useEffect(() => {
    if (!loading && user && role) {
      if (role === "admin") router.replace("/dashboard/AdminDashboard");
      else if (role === "doctor") router.replace("/dashboard/DoctorDashboard");
      else if (role === "staff" || role === "receptionist" || role === "accountant") router.replace("/dashboard/StaffDashboard");
      else router.replace("/");
    }
  }, [user, role, loading, router]);

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      toast.error("Please enter your email address first.");
      setAuthError("Please enter your email address above to receive a password reset link.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      toast.success(`Password reset email sent to ${cleanEmail}! Check your inbox.`, { duration: 3000 });
      setAuthError("");
    } catch (error) {
      console.warn("Forgot Password Error:", error.code || error.message);
      toast.error("Failed to send reset email. Please verify the email address.", { duration: 3000 });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoadingLocal(true);
    setAuthError("");

    try {
      const cleanEmail = email.trim();
      let loggedInUid = null;
      let userData = null;

      // 1. Try standard Firebase Auth login
      try {
        const { user: firebaseUser } = await signInWithEmailAndPassword(auth, cleanEmail, password);
        loggedInUid = firebaseUser.uid;
        const userDoc = await getDoc(doc(db, "users", loggedInUid));
        if (userDoc.exists()) userData = userDoc.data();
      } catch (authErr) {
        // 2. Fallback: Check if Admin set a direct password (tempPassword) in Firestore
        const q = query(collection(db, "users"), where("email", "==", cleanEmail));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const matchedDoc = snap.docs[0];
          const matchedData = matchedDoc.data();
          if (matchedData.tempPassword && matchedData.tempPassword === password) {
            loggedInUid = matchedDoc.id;
            userData = matchedData;
          } else {
            throw authErr;
          }
        } else {
          throw authErr;
        }
      }

      if (userData) {
        const userRole = userData.role;

        if (userData.status === "blacklisted" || userData.status === "disabled") {
          await auth.signOut();
          const disabledMsg = "Account disabled. Please contact the administrator.";
          setAuthError(disabledMsg);
          toast.error(disabledMsg, { duration: 3000 });
          setLoadingLocal(false);
          return;
        }

        const sessionUser = { uid: loggedInUid, email: cleanEmail, name: userData.name || cleanEmail };
        loginUser(sessionUser, userRole);

        toast.success(`Welcome back!`, { duration: 2500 });

        if (userRole === "admin") router.replace("/dashboard/AdminDashboard");
        else if (userRole === "doctor") router.replace("/dashboard/DoctorDashboard");
        else router.replace("/dashboard/StaffDashboard");
      } else {
        const noProfileMsg = "User profile not found.";
        setAuthError(noProfileMsg);
        toast.error(noProfileMsg, { duration: 3000 });
        await auth.signOut();
      }
    } catch (error) {
      console.warn("Login Attempt Failed:", error.code || error.message);
      
      let message = "Invalid email or password.";
      if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
        message = "Invalid email or password. Please check your credentials.";
      } else if (error.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (error.code === "auth/too-many-requests") {
        message = "Too many failed login attempts. Please try again later.";
      } else if (error.code === "auth/user-disabled") {
        message = "This account has been disabled.";
      }
      
      setAuthError(message);
      toast.error(message);
    } finally {
      setLoadingLocal(false);
    }
  };

  if (loading) return null; // Let the AuthLayout handle flashes or AuthContext

  return (
    <AuthLayout title="Sign in to your account" subtitle="CareClinic Management System">
      <form onSubmit={handleLogin} className="space-y-6">
        {authError && (
          <div className="rounded-md bg-red-50 p-3 border border-red-200 text-sm font-medium text-red-600">
            {authError}
          </div>
        )}

        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (authError) setAuthError("");
          }}
          placeholder="doctor@careclinic.com"
        />

        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (authError) setAuthError("");
          }}
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
            <button
              type="button"
              onClick={handleForgotPassword}
              className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer bg-transparent border-0 p-0"
            >
              Forgot password?
            </button>
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
