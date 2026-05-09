import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { db } from "@/src/services/firebase/config";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { withAuth } from "@/src/components/layout/RouteGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/common/Card";
import { Input } from "@/src/components/common/Input";
import { Button } from "@/src/components/common/Button";

function AddPatient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "Male",
    phone: "",
    bloodGroup: "",
    address: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "patients"), {
        ...formData,
        age: Number(formData.age),
        createdAt: serverTimestamp(),
      });
      toast.success("Patient registered successfully!");
      router.push("/patients/listPatients");
    } catch (error) {
      toast.error("Error registering patient.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/patients/listPatients">
            <Button variant="ghost" size="sm" className="px-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Register New Patient</h1>
            <p className="text-sm text-gray-500">Enter patient details below.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Full Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <Input
                  label="Age"
                  type="number"
                  required
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <Input
                  label="Phone Number"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <Input
                  label="Blood Group"
                  placeholder="e.g. O+"
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                />
                <Input
                  label="Address"
                  className="md:col-span-2"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Link href="/patients/listPatients">
                  <Button type="button" variant="secondary">Cancel</Button>
                </Link>
                <Button type="submit" isLoading={loading}>Register Patient</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(AddPatient, ["admin", "staff", "receptionist", "doctor"]);
