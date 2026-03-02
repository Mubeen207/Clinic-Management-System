import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import Link from "next/link";

export default function AppointmentList() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "appointments"), orderBy("date", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setAppointments(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Scheduled Appointments</h1>
      <div className="flex gap-4">
        {/* Home Button */}
        <Link href="/dashboard">
          <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition">
            Home
          </button>
        </Link>

        {/* Add New Appointment Button */}
        <Link href="/appointments/create">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-md">
            + Add New
          </button>
        </Link>
      </div>
      <table className="w-full border-collapse bg-white shadow-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-3 border">Patient</th>
            <th className="p-3 border">Date/Time</th>
            <th className="p-3 border">Status</th>
            <th className="p-3 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((app) => (
            <tr key={app.id}>
              <td className="p-3 border">{app.patientName}</td>
              <td className="p-3 border">
                {app.date} at {app.time}
              </td>
              <td className="p-3 border">
                <span
                  className={`px-2 py-1 rounded text-sm ${app.status === "Pending" ? "bg-yellow-100" : "bg-green-100"}`}
                >
                  {app.status}
                </span>
              </td>
              <td className="p-3 border text-blue-600">
                <Link href={`/appointments/${app.id}`}>View / Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
