import { useState } from "react";
import { auth, db } from "../../lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/router";

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "receptionist",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (formData.role === "admin") {
      const adminKey = prompt("Enter Secret Admin Key to register:");
      if (adminKey !== "321") {
        alert("You are not authorized to create an Admin account!");
        return;
      }
    }
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        createdAt: serverTimestamp(),
      });

      alert("Account Created!");

      if (formData.role === "admin") router.push("/dashboard/AdminDashboard");
      else if (formData.role === "doctor")
        router.push("/dashboard/DoctorDashboard");
      else router.push("/dashboard/StaffDashboard");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-black">
      <form
        onSubmit={handleSignup}
        className="bg-white p-8 rounded-lg shadow-md w-96 flex flex-col gap-4"
      >
        <h1 className="text-2xl font-bold text-center">Staff Registration</h1>

        <input
          className="border p-2 rounded"
          placeholder="Full Name"
          required
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <input
          className="border p-2 rounded"
          type="email"
          placeholder="Email"
          required
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <input
          className="border p-2 rounded"
          type="password"
          placeholder="Password"
          required
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
        />

        <select
          className="border p-2 rounded bg-white"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
        >
          <option value="receptionist">Receptionist</option>
          <option value="doctor">Doctor</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
        >
          {loading ? "Creating..." : "Sign Up"}
        </button>

        <div className="text-center mt-2">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-blue-600 font-bold hover:underline"
            >
              Login
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
