import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import Link from "next/link";

export default function AppointmentDetails() {
  const router = useRouter();
  const { appointmentId } = router.query;
  const [appointment, setAppointment] = useState(null);

  useEffect(() => {
    if (!appointmentId) return;
    const fetchDetails = async () => {
      const docRef = doc(db, "appointments", appointmentId);
      const snap = await getDoc(docRef);
      if (snap.exists()) setAppointment(snap.data());
    };
    fetchDetails();
  }, [appointmentId]);

  const handleUpdateStatus = async (newStatus) => {
    const docRef = doc(db, "appointments", appointmentId);
    await updateDoc(docRef, { status: newStatus });
    setAppointment({ ...appointment, status: newStatus });
    alert("Status Updated");
  };

  const handleDelete = async () => {
    if (confirm("Delete this appointment?")) {
      await deleteDoc(doc(db, "appointments", appointmentId));
      router.push("/appointments/list");
    }
  };

  if (!appointment) return <p className="p-8">Loading...</p>;

  return (
    <div className="p-8 max-w-lg mx-auto bg-white rounded-xl shadow-md border">
      <h1 className="text-xl font-bold mb-4">Manage Appointment</h1>
       <Link href="/appointments/list">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-md">
            Back
          </button>
        </Link>
      <p><strong>Patient:</strong> {appointment.patientName}</p>
      <p><strong>Date:</strong> {appointment.date} at {appointment.time}</p>
      <p><strong>Reason:</strong> {appointment.reason}</p>
      <p><strong>Current Status:</strong> {appointment.status}</p>

      <div className="mt-6 flex gap-2">
        <button onClick={() => handleUpdateStatus("Completed")} className="bg-green-500 text-white px-4 py-2 rounded">Mark Completed</button>
        <button onClick={() => handleUpdateStatus("Cancelled")} className="bg-orange-500 text-white px-4 py-2 rounded">Cancel</button>
        <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded">Delete Record</button>
      </div>
    </div>
  );
}