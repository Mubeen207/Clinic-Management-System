import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { doc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function PatientDetails() {
  const router = useRouter();
  const { id } = router.query;

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;

    const getPatient = async () => {
      try {
        const docRef = doc(db, "patients", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setPatient({ id: docSnap.id, ...docSnap.data() });
        } else {
          alert("No such patient found!");
          router.push("/patients/listPatients");
        }
      } catch (error) {
        console.error("Error fetching patient:", error);
      } finally {
        setLoading(false);
      }
    };

    getPatient();
  }, [id, router]);

  const deletePatient = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this patient record? This cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await deleteDoc(doc(db, "patients", id));
      router.push("/patients/listPatients");
    } catch (error) {
      alert("Error deleting record.");
    }
  };

  const updatePatient = async () => {
    setUpdating(true);
    try {
      const docRef = doc(db, "patients", id);
      const { id: _, ...dataToUpdate } = patient;

      await updateDoc(docRef, dataToUpdate);
      alert("Updated Successfully");
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-100 w-full bg-slate-50/50 rounded-[3rem]">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 border-4 border-blue-100 rounded-full animate-ping"></div>
          <div className="relative w-12 h-12 bg-white shadow-xl rounded-2xl flex items-center justify-center">
            <svg
              className="w-6 h-6 text-blue-600 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        </div>
        <p className="mt-6 text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">
          Accessing Patient File
        </p>
      </div>
    );
  if (!patient)
    return (
      <div className="flex flex-col items-center justify-center min-h-100 w-full p-8 text-center">
        <div className="bg-rose-50 p-6 rounded-[2.5rem] border border-rose-100 inline-flex flex-col items-center">
          <div className="w-16 h-16 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200 mb-4">
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h3 className="text-xl font-black text-slate-800 tracking-tight">
            Record Missing
          </h3>
          <p className="text-slate-500 font-medium text-sm mt-1 max-w-50">
            We couldn't find any patient with this ID.
          </p>

          <button
            onClick={() => router.back()}
            className="mt-6 px-6 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all active:scale-95"
          >
            Go Back
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
        <div className="bg-linear-to-r from-slate-800 to-slate-900 p-8 text-white relative">
          <div className="relative z-10">
            <h1 className="text-2xl font-black tracking-tight">
              Edit Patient Profile
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Update information or manage records
            </p>
          </div>
          <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                Full Name
              </label>
              <input
                className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-semibold text-slate-700"
                value={patient.name}
                onChange={(e) =>
                  setPatient({ ...patient, name: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                Age (Years)
              </label>
              <input
                type="number"
                className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-semibold text-slate-700"
                value={patient.age}
                onChange={(e) =>
                  setPatient({ ...patient, age: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                Condition
              </label>
              <input
                className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-semibold text-slate-700"
                value={patient.disease}
                onChange={(e) =>
                  setPatient({ ...patient, disease: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                Contact Number
              </label>
              <input
                className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-semibold text-slate-700"
                value={patient.phone}
                onChange={(e) =>
                  setPatient({ ...patient, phone: e.target.value })
                }
              />
            </div>
          </div>
          <div className="pt-6 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={updatePatient}
                disabled={updating}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-100 transition-all active:scale-[0.98] disabled:bg-slate-300 flex items-center justify-center gap-2"
              >
                {updating ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  "Save Changes"
                )}
              </button>

              <button
                onClick={deletePatient}
                className="px-6 py-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete
              </button>
            </div>

            <button
              onClick={() => router.back()}
              className="w-full mt-4 py-2 text-slate-400 font-semibold hover:text-slate-600 transition-colors flex items-center justify-center gap-1 text-sm"
            >
              ← Cancel and Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
