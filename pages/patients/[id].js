import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ArrowLeft, User, Activity, Edit2 } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

import { db } from "@/src/services/firebase/config";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { withAuth } from "@/src/components/layout/RouteGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/common/Card";
import { Button } from "@/src/components/common/Button";
import { Input } from "@/src/components/common/Input";

function PatientProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (!id) return;
    const fetchPatient = async () => {
      try {
        const docSnap = await getDoc(doc(db, "patients", id));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPatient(data);
          setFormData(data);
        } else {
          toast.error("Patient not found");
        }
      } catch (error) {
        toast.error("Failed to load patient");
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "patients", id), formData);
      setPatient(formData);
      setIsEditing(false);
      toast.success("Patient profile updated!");
    } catch (error) {
      toast.error("Update failed.");
    }
  };

  if (loading) return <DashboardLayout><div className="p-8 text-center text-gray-500">Loading profile...</div></DashboardLayout>;
  if (!patient) return <DashboardLayout><div className="p-8 text-center text-gray-500">Patient not found.</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/patients/listPatients">
              <Button variant="ghost" size="sm" className="px-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Patient Profile</h1>
              <p className="text-sm text-gray-500">Manage medical history and records.</p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => setIsEditing(!isEditing)} className="gap-2">
            <Edit2 className="w-4 h-4" /> {isEditing ? "Cancel Edit" : "Edit Profile"}
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardContent className="p-6 text-center">
              <div className="w-24 h-24 mx-auto bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <User className="w-12 h-12" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{patient.name}</h2>
              <p className="text-gray-500">{patient.gender}, {patient.age} years old</p>
              
              <div className="mt-6 border-t pt-6 text-left space-y-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Contact</p>
                  <p className="text-gray-900">{patient.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Blood Group</p>
                  <p className="text-red-600 font-bold">{patient.bloodGroup || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Address</p>
                  <p className="text-gray-900">{patient.address || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                {isEditing ? "Edit Information" : "Medical Details"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                    <Input label="Age" type="number" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} />
                    <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                    <Input label="Blood Group" value={formData.bloodGroup} onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})} />
                  </div>
                  <Input label="Address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                  <Button type="submit" className="mt-4">Save Changes</Button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-2">Patient History & Notes</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{patient.history || "No medical history recorded yet. Doctors can add notes during appointments."}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-2">Allergies</h3>
                    <p className="text-red-600 font-medium">{patient.allergies || "None reported."}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(PatientProfile, ["admin", "staff", "receptionist", "doctor"]);
