import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ArrowLeft, Edit, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

import { db } from "@/src/services/firebase/config";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { withAuth } from "@/src/components/layout/RouteGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/common/Card";
import { Button } from "@/src/components/common/Button";
import { Input } from "@/src/components/common/Input";

function AppointmentDetails() {
  const router = useRouter();
  const { appointmentId } = router.query;
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [prescription, setPrescription] = useState("");

  useEffect(() => {
    if (!appointmentId) return;
    const fetchApp = async () => {
      try {
        const docSnap = await getDoc(doc(db, "appointments", appointmentId));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAppointment(data);
          setStatus(data.status || "Pending");
          setNotes(data.doctorNotes || "");
          setPrescription(data.prescription || "");
        } else {
          toast.error("Appointment not found");
        }
      } catch (error) {
        toast.error("Failed to load appointment");
      } finally {
        setLoading(false);
      }
    };
    fetchApp();
  }, [appointmentId]);

  const handleUpdate = async () => {
    try {
      await updateDoc(doc(db, "appointments", appointmentId), {
        status,
        doctorNotes: notes,
        prescription,
      });
      toast.success("Appointment updated successfully!");
      router.push("/appointments/list");
    } catch (error) {
      toast.error("Failed to update appointment");
    }
  };

  if (loading) return <DashboardLayout><div className="p-8 text-center text-gray-500">Loading appointment...</div></DashboardLayout>;
  if (!appointment) return <DashboardLayout><div className="p-8 text-center text-gray-500">Appointment not found.</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/appointments/list">
            <Button variant="ghost" size="sm" className="px-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Manage Session</h1>
            <p className="text-sm text-gray-500">Appointment with {appointment.patientName}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 h-fit">
            <CardHeader>
              <CardTitle>Session Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">Patient</p>
                <p className="text-gray-900 font-medium">{appointment.patientName}</p>
                <Link href={`/patients/${appointment.patientId}`}>
                  <span className="text-xs text-blue-600 hover:underline cursor-pointer">View Profile</span>
                </Link>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Doctor</p>
                <p className="text-gray-900 font-medium">Dr. {appointment.doctorName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Date & Time</p>
                <p className="text-gray-900">{appointment.date} at {appointment.time}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Reason / Symptoms</p>
                <p className="text-gray-900">{appointment.reason || "N/A"}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Clinical Updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Status</label>
                <select
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor&apos;s Notes (Diagnosis)</label>
                <textarea
                  className="w-full rounded-md border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  placeholder="Enter diagnosis and observations..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prescription</label>
                <textarea
                  className="w-full rounded-md border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  placeholder="Medication names, dosage, duration..."
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleUpdate} className="gap-2">
                  <Save className="w-4 h-4" /> Save Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(AppointmentDetails, ["admin", "doctor", "staff", "receptionist"]);
