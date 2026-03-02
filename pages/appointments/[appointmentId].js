import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
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

  if (!appointment)
    return (
      <div className="flex items-center justify-center min-h-100 w-full p-8 animate-in fade-in duration-700">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 bg-blue-500/20 rounded-2xl animate-ping opacity-40"></div>

            <div className="relative w-14 h-14 bg-white border-2 border-blue-100 rounded-2xl shadow-lg flex items-center justify-center">
              <svg
                className="w-7 h-7 text-blue-600 animate-pulse"
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
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-slate-800 font-black text-sm uppercase tracking-[0.25em]">
              Retrieving Schedule
            </h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1 animate-pulse">
              Connecting to Database...
            </p>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden">
        <div className="bg-linear-to-br from-blue-600 to-indigo-700 p-8 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              Appointment Details
            </h1>
            <p className="text-blue-100/80 text-sm font-medium">
              Ticket ID: #APT-{appointment.id?.slice(-5)}
            </p>
          </div>
          <Link href="/appointments/list">
            <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-5 py-2 rounded-xl font-bold transition-all active:scale-95 flex items-center gap-2">
              ← Back
            </button>
          </Link>
        </div>

        <div className="p-10">
          <div className="flex items-center gap-6 mb-10 pb-8 border-b border-slate-100">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 text-3xl font-black shadow-inner">
              {appointment.patientName.charAt(0)}
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                {appointment.patientName}
              </h2>
              <div className="flex gap-4 mt-1">
                <span className="flex items-center gap-1.5 text-slate-500 font-bold text-sm">
                  <svg
                    className="w-4 h-4 text-blue-500"
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
                  {appointment.date}
                </span>
                <span className="flex items-center gap-1.5 text-slate-500 font-bold text-sm">
                  <svg
                    className="w-4 h-4 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {appointment.time}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                Reason for Visit
              </p>
              <p className="text-slate-700 font-bold text-lg bg-slate-50 p-4 rounded-2xl border border-slate-100 italic">
                "{appointment.reason}"
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                Appointment Status
              </p>
              <div
                className={`inline-flex items-center gap-2 p-4 rounded-2xl w-full border ${
                  appointment.status === "Completed"
                    ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                    : appointment.status === "Cancelled"
                      ? "bg-orange-50 border-orange-100 text-orange-600"
                      : "bg-amber-50 border-amber-100 text-amber-600"
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    appointment.status === "Completed"
                      ? "bg-emerald-500"
                      : appointment.status === "Cancelled"
                        ? "bg-orange-500"
                        : "bg-amber-500"
                  }`}
                ></span>
                <span className="font-black text-lg">{appointment.status}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <p className="text-xs font-bold text-slate-500 text-center mb-4 uppercase tracking-[0.2em]">
              Available Actions
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleUpdateStatus("Completed")}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-100 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Complete Appointment
              </button>

              <button
                onClick={() => handleUpdateStatus("Cancelled")}
                className="flex-1 bg-white border-2 border-orange-200 text-orange-600 hover:bg-orange-50 font-black py-4 rounded-2xl transition-all active:scale-95"
              >
                Cancel Session
              </button>
            </div>

            <button
              onClick={handleDelete}
              className="w-full bg-red-50 text-red-500 hover:bg-red-600 hover:text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 text-sm"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete Permanently
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
