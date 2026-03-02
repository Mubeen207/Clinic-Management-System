import { useState, useEffect } from "react";
import { auth, db } from "../../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import { useAuth } from "../../lib/authContext";

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
      else if (role === "receptionist")
        router.replace("/dashboard/StaffDashboard");
    }
  }, [user, role, loading, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoadingLocal(true);

    try {
      const { user: loggedInUser } = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

      const userDoc = await getDoc(doc(db, "users", loggedInUser.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userRole = userData.role;

        if (userData.status === "disabled") {
          alert("Your account is disabled. Contact Admin.");
          setLoadingLocal(false);
          return;
        }

        alert(`Welcome back, ${userData.name}!`);

        if (userRole === "admin") {
          router.replace("/dashboard/AdminDashboard");
        } else if (userRole === "doctor") {
          router.replace("/dashboard/doctor");
        } else if (userRole === "receptionist") {
          router.replace("/dashboard/staff");
        } else {
          router.replace("/dashboard");
        }
      } else {
        alert("User data not found in database!");
      }
    } catch (error) {
      console.error(error);
      alert("Invalid email or password!");
    } finally {
      setLoadingLocal(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-black">
        Verifying Session...
      </div>
    );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-black">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-xl shadow-lg w-96 flex flex-col gap-5"
      >
        <h1 className="text-2xl font-bold text-center text-blue-600">
          Hospital Login
        </h1>

        <input
          className="border p-3 rounded-lg focus:outline-blue-500"
          type="email"
          placeholder="Email Address"
          required
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="border p-3 rounded-lg focus:outline-blue-500"
          type="password"
          placeholder="Password"
          required
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          disabled={loadingLocal}
          className="bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {loadingLocal ? "Verifying..." : "Login"}
        </button>

        <p className="text-sm text-center text-gray-600 mt-4">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="text-green-600 font-bold hover:underline"
          >
            Register Here
          </button>
        </p>
      </form>
    </div>
  );
}
