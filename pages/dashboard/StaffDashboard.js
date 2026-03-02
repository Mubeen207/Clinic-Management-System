import { useEffect, useState } from "react";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../lib/authContext";
import Link from "next/link";

export default function StaffDashboard() {
  const { user, role, loading, logout } = useAuth();
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    if (role !== "receptionist" && role !== "admin") return;

    const q = query(
      collection(db, "appointments"),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setAppointments(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [role]);

  if (loading)
    return <p className="p-10 text-center font-bold">Loading Staff Panel...</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-6 rounded-xl shadow-sm border gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Receptionist Dashboard
          </h1>
          <p className="text-gray-500">Welcome, {user?.email}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/patients/addPatients">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold transition shadow-md">
              + Register Patient
            </button>
          </Link>

          <Link href="/appointments/create">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold transition shadow-md">
              📅 Book Appointment
            </button>
          </Link>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 font-semibold transition shadow-md"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <p className="text-sm text-gray-500 uppercase font-bold">
            Total Bookings
          </p>
          <p className="text-2xl font-bold">{appointments.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500 uppercase font-bold">
            Pending Today
          </p>
          <p className="text-2xl font-bold">
            {appointments.filter((a) => a.status === "Pending").length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md border">
          <h2 className="text-xl font-bold mb-4">Current Appointments List</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 border text-gray-700">Patient Name</th>
                  <th className="p-3 border text-gray-700">Date & Time</th>
                  <th className="p-3 border text-gray-700">Status</th>
                  <th className="p-3 border text-center text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-10 text-center text-gray-400">
                      No appointments found.
                    </td>
                  </tr>
                ) : (
                  appointments.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 transition">
                      <td className="p-3 border font-medium">
                        {app.patientName}
                      </td>
                      <td className="p-3 border text-sm">
                        {app.date} <span className="text-gray-400">|</span>{" "}
                        {app.time}
                      </td>
                      <td className="p-3 border">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            app.status === "Completed"
                              ? "bg-green-100 text-green-700"
                              : app.status === "Cancelled"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="p-3 border text-center">
                        <Link href={`/appointments/${app.id}`}>
                          <button className="bg-gray-100 hover:bg-blue-100 text-blue-600 px-3 py-1 rounded text-sm font-bold transition">
                            Update
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
