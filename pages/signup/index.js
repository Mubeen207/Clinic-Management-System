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
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { user } = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

      // Privileged roles (doctor, accountant, admin) must be assigned by an authenticated admin through a secure server-side/admin-controlled process.
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        role: "staff",
        status: "active",
        createdAt: serverTimestamp(),
      });

      toast.success("Account created successfully!");
      router.push("/dashboard/StaffDashboard");
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

        {/* Privileged roles must be assigned by an authenticated admin through a secure server-side/admin-controlled process. */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            disabled
            className="flex h-10 w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-600 focus:outline-none cursor-not-allowed"
            value="staff"
          >
            <option value="staff">Staff / Receptionist</option>
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
