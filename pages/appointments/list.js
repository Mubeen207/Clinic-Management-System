import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
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
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Scheduled <span className="text-blue-600">Appointments</span>
            </h1>
            <p className="text-slate-500 font-medium mt-2">
              Manage your daily patient flow and timing
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
            <Link href="/dashboard">
              <button className="px-5 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-bold transition-all flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Home
              </button>
            </Link>
            <Link href="/appointments/create">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center gap-2">
                <span>+</span> Book New
              </button>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-4xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="p-6 text-left text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                    Patient
                  </th>
                  <th className="p-6 text-left text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                    Schedule
                  </th>
                  <th className="p-6 text-left text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                    Status
                  </th>
                  <th className="p-6 text-center text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                    Management
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {appointments.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-blue-50/40 transition-all group"
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-100 ring-4 ring-white">
                          {app.patientName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">
                            {app.patientName}
                          </p>
                          <p className="text-xs text-slate-400 font-medium">
                            ID: #APP-{app.id.slice(-4)}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="text-slate-700 font-bold flex items-center gap-2">
                          <svg
                            className="h-4 w-4 text-blue-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {app.date}
                        </span>
                        <span className="text-slate-400 text-sm font-medium ml-6">
                          {app.time}
                        </span>
                      </div>
                    </td>

                    <td className="p-6">
                      <span
                        className={`px-4 py-1.5 rounded-full text-xs font-black tracking-wide flex w-fit items-center gap-1.5 ${
                          app.status === "Pending"
                            ? "bg-amber-50 text-amber-600 border border-amber-100"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full animate-pulse ${app.status === "Pending" ? "bg-amber-500" : "bg-emerald-500"}`}
                        ></span>
                        {app.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="p-6 text-center">
                      <Link href={`/appointments/${app.id}`}>
                        <button className="bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 transition-all shadow-md active:scale-95">
                          Edit Session
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {appointments.length === 0 && (
            <div className="py-20 text-center bg-white">
              <p className="text-slate-400 font-bold">
                No appointments scheduled for today.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
