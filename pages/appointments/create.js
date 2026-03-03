import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { useRouter } from "next/router";
import Link from "next/link";

export default function CreateAppointment() {
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({
    patientId: "",
    date: "",
    time: "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchPatients = async () => {
      const snap = await getDocs(collection(db, "patients"));
      setPatients(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchPatients();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedPatient = patients.find((p) => p.id === formData.patientId);
      await addDoc(collection(db, "appointments"), {
        ...formData,
        patientName: selectedPatient?.name || "Unknown",
        status: "Pending",
        createdAt: serverTimestamp(),
      });
      router.push("/appointments/list");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white/90 backdrop-blur-lg rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white overflow-hidden">
        <div className="h-2 w-full bg-linear-to-r from-blue-400 via-indigo-500 to-purple-500"></div>

        <div className="p-10">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                Book Session
              </h1>
              <p className="text-slate-500 text-sm font-medium mt-1">
                Schedule a new visit
              </p>
            </div>
            <Link href="/dashboard">
              <button className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-all active:scale-90 shadow-inner">
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
              </button>
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                Select Patient
              </label>
              <div className="relative group">
                <select
                  required
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all appearance-none cursor-pointer font-semibold text-slate-700"
                  onChange={(e) =>
                    setFormData({ ...formData, patientId: e.target.value })
                  }
                >
                  <option value="">Choose from records...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-semibold text-slate-700"
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  Time
                </label>
                <input
                  type="time"
                  required
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-semibold text-slate-700"
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                Reason for Visit
              </label>
              <textarea
                placeholder="e.g. Regular checkup or specific symptoms"
                rows="3"
                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-semibold text-slate-700 resize-none"
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
              />
            </div>

            <button
              disabled={loading}
              className={`w-full mt-4 p-5 rounded-3xl font-black text-lg transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.97] ${
                loading
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200"
              }`}
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-slate-400 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg
                    className="w-6 h-6"
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
                  Confirm Appointment
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
