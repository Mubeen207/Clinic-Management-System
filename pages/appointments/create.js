import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";

import { db } from "@/src/services/firebase/config";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { withAuth } from "@/src/components/layout/RouteGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/common/Card";
import { Input } from "@/src/components/common/Input";
import { Button } from "@/src/components/common/Button";

function CreateAppointment() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  
  const [formData, setFormData] = useState({
    patientId: "",
    patientName: "",
    doctorId: "",
    doctorName: "",
    date: "",
    time: "",
    reason: "",
    status: "Pending", // Pending, Confirmed, Cancelled, Completed
  });

  useEffect(() => {
    const fetchPatientsAndDoctors = async () => {
      try {
        const pSnap = await getDocs(collection(db, "patients"));
        setPatients(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const dSnap = await getDocs(query(collection(db, "users"), where("role", "==", "doctor")));
        setDoctors(dSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        toast.error("Failed to load options.");
      }
    };
    fetchPatientsAndDoctors();
  }, []);

  const handlePatientChange = (e) => {
    const pId = e.target.value;
    const pData = patients.find(p => p.id === pId);
    setFormData({ ...formData, patientId: pId, patientName: pData ? pData.name : "" });
  };

  const handleDoctorChange = (e) => {
    const dId = e.target.value;
    const dData = doctors.find(d => d.id === dId);
    setFormData({ ...formData, doctorId: dId, doctorName: dData ? dData.name : "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.doctorId) {
      toast.error("Please select a patient and a doctor.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "appointments"), {
        ...formData,
        createdAt: serverTimestamp(),
      });
      toast.success("Appointment booked successfully!");
      router.push("/appointments/list");
    } catch (error) {
      toast.error("Error booking appointment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Book Appointment</h1>
          <p className="text-sm text-gray-500">Schedule a new visit for a patient.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Appointment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Patient *</label>
                  <select
                    required
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.patientId}
                    onChange={handlePatientChange}
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Doctor *</label>
                  <select
                    required
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.doctorId}
                    onChange={handleDoctorChange}
                  >
                    <option value="">-- Choose Doctor --</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>{d.name || d.email}</option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Date *"
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
                
                <Input
                  label="Time Slot *"
                  type="time"
                  required
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />

                <Input
                  label="Reason for Visit / Symptoms"
                  className="md:col-span-2"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" isLoading={loading}>Confirm Booking</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(CreateAppointment, ["admin", "staff", "receptionist"]);
