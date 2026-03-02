import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import Link from "next/link";

export default function ListPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "patients"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPatients(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching patients: ", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-100 w-full animate-in fade-in zoom-in duration-500">
        <div className="bg-white/60 backdrop-blur-lg p-8 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-white flex flex-col items-center gap-6">
          <div className="relative flex items-center justify-center h-16 w-16">
            <div className="absolute inset-0 bg-blue-100 rounded-2xl rotate-6 animate-pulse"></div>
            <div className="absolute inset-0 bg-blue-600/10 rounded-2xl -rotate-6 animate-pulse delay-75"></div>
            <svg
              className="relative h-8 w-8 text-blue-600 animate-pulse"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>

          <div className="text-center">
            <p className="text-slate-800 font-black text-sm uppercase tracking-[0.2em] mb-1">
              Syncing Patients
            </p>
            <div className="flex items-center justify-center gap-1.5">
              <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></span>
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-center p-8 border-b border-slate-100 gap-4 bg-linear-to-r from-white to-slate-50">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              Patient Records
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Manage and monitor all clinic visitors
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-all active:scale-95">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
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

            <Link href="/patients/addPatients">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">
                <span className="text-lg">+</span> Add New Patient
              </button>
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          {patients.length === 0 ? (
            <div className="p-20 text-center">
              <div className="bg-slate-50 inline-block p-4 rounded-full mb-4">
                <svg
                  className="h-10 w-10 text-slate-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <p className="text-slate-400 font-medium">
                No patients found in the database.
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Patient Name
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Age
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Diagnosis
                  </th>
                  <th className="px-8 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-blue-50/30 transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                          {patient.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-700">
                          {patient.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-slate-600 font-medium">
                      {patient.age ? (
                        `${patient.age} yrs`
                      ) : (
                        <span className="text-slate-300 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100 uppercase tracking-tight">
                        {patient.disease}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <Link href={`/patients/${patient.id}`}>
                        <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-blue-600 hover:text-white transition-all">
                          View Profile
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-slate-50 p-4 px-8 text-xs text-slate-400 font-medium border-t border-slate-100">
          Showing {patients.length} total records
        </div>
      </div>
    </div>
  );
}
