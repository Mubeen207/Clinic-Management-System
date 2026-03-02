import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../lib/authContext";
import Link from "next/link";

export default function DoctorDashboard() {
  const { user, role, loading, logout } = useAuth();
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    if (!user || role !== "doctor") return;

    const q = query(
      collection(db, "appointments"),
      where("status", "==", "Pending"),
      orderBy("createdAt", "desc"),
    );

    const unsub = onSnapshot(q, (snap) => {
      setAppointments(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsub();
  }, [user, role]);

  const handleGenerateReport = (patientName) => {
    alert(
      `Generating Medical Report for ${patientName}... \n(Tip: Install jsPDF to download this as PDF)`,
    );
  };

  if (loading)
    return (
      <div className="p-10 text-center font-bold text-blue-600">
        Verifying Doctor Session...
      </div>
    );

  if (role !== "doctor" && role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-red-600">Access Denied!</h1>
        <p className="text-gray-500">
          Only authorized doctors can access this panel.
        </p>
        <button onClick={logout} className="mt-4 text-blue-600 underline">
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black">
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold transition shadow-sm flex items-center gap-2"
          >
            <span>Logout</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Doctor Dashboard
            </h1>
            <p className="text-gray-500 text-sm italic">
              Welcome, Dr. {user?.email?.split("@")[0].toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/patients/listPatients">
            <button className="bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-100 text-sm font-semibold">
              📁 Patients List
            </button>
          </Link>
          <Link href="/appointments/list">
            <button className="bg-indigo-50 text-indigo-600 border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-100 text-sm font-semibold">
              📅 Schedule
            </button>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Patient Queue (Pending)
            </h2>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
              {appointments.length} Appointments Today
            </span>
          </div>

          {appointments.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-gray-400">
                No pending patients in your queue.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((app) => (
                <div
                  key={app.id}
                  className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 border rounded-xl hover:shadow-md transition bg-white border-gray-100"
                >
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                      {app.patientName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">
                        {app.patientName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Issue: {app.reason || "General Checkup"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 md:mt-0">
                    <Link href={`/appointments/${app.id}`}>
                      <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-bold shadow-sm">
                        Start Session
                      </button>
                    </Link>
                    <button
                      onClick={() => handleGenerateReport(app.patientName)}
                      className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 text-sm font-bold"
                    >
                      Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg mb-4 text-gray-800">
              Quick Actions
            </h3>
            <div className="flex flex-col gap-3">
              <Link href="/appointments/create">
                <button className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition">
                  + Book New Visit
                </button>
              </Link>
              <p className="text-xs text-center text-gray-400 mt-2 italic">
                Tip: Use 'Start Session' to update patient history.
              </p>
            </div>
          </div>

          <div className="bg-linear-to-br from-indigo-600 to-blue-700 p-6 rounded-2xl text-white shadow-lg">
            <h3 className="font-bold text-lg">Daily Goal</h3>
            <p className="text-sm text-blue-100 mt-2">
              You have completed 0/10 checkups today. Keep it up!
            </p>
            <div className="w-full bg-blue-900/30 h-2 mt-4 rounded-full overflow-hidden">
              <div className="bg-white w-1/12 h-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
