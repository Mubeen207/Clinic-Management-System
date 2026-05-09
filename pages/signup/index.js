import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "react-hot-toast";

import { auth, db } from "@/src/services/firebase/config";
import { AuthLayout } from "@/src/components/layout/AuthLayout";
import { Input } from "@/src/components/common/Input";
import { Button } from "@/src/components/common/Button";

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff", // default changed to staff to match DB roles usually
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (formData.role === "admin") {
      const adminKey = prompt("Enter Secret Admin Key to register:");
      if (adminKey !== "321") {
        toast.error("Unauthorized Admin creation attempt.");
        setLoading(false);
        return;
      }
    }

    try {
      const { user } = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: "active",
        createdAt: serverTimestamp(),
      });

      toast.success("Account created successfully!");

      if (formData.role === "admin") router.push("/dashboard/AdminDashboard");
      else if (formData.role === "doctor") router.push("/dashboard/DoctorDashboard");
      else if (formData.role === "accountant") router.push("/dashboard/AccountantDashboard");
      else router.push("/dashboard/StaffDashboard");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create a new account" subtitle="Join the CareClinic team">
      <form onSubmit={handleSignup} className="space-y-5">
        <Input
          label="Full Name"
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Dr. John Doe"
        />

        <Input
          label="Email address"
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="john@careclinic.com"
        />

        <Input
          label="Password"
          type="password"
          required
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="••••••••"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          >
            <option value="staff">Staff / Receptionist</option>
            <option value="doctor">Doctor</option>
            <option value="accountant">Accountant</option>
          </select>
        </div>

        <Button type="submit" className="w-full" isLoading={loading}>
          Create Account
        </Button>

        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
