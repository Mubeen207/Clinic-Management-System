import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useRouter } from "next/router";
import Link from "next/link";

export default function AddPatient() {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    disease: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addPatient = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert("Please fill in the required fields.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "patients"), {
        ...formData,
        age: Number(formData.age),
        createdAt: serverTimestamp(),
      });

      router.push("/patients/listPatients");
    } catch (error) {
      console.error("Error adding patient: ", error);
      alert("Failed to add patient. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100/50 border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-50"></div>

        <div className="p-10 relative">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                New Patient
              </h1>
              <p className="text-slate-400 text-sm font-medium mt-1">
                Registration Desk
              </p>
            </div>
            <Link href="/dashboard">
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold transition-all active:scale-95">
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
          </div>

          <div className="space-y-5">
            <div className="relative group">
              <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1 ml-4 block group-focus-within:text-blue-500 transition-colors">
                Patient Name
              </label>
              <input
                name="name"
                placeholder="e.g. Ali Khan"
                className="w-full bg-slate-50 border-2 border-transparent p-4 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-300 font-medium text-slate-700"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Age Input */}
              <div className="relative group">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1 ml-4 block group-focus-within:text-blue-500 transition-colors">
                  Age
                </label>
                <input
                  name="age"
                  type="number"
                  placeholder="00"
                  className="w-full bg-slate-50 border-2 border-transparent p-4 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-300 font-medium text-slate-700"
                  value={formData.age}
                  onChange={handleChange}
                />
              </div>

              <div className="relative group">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1 ml-4 block group-focus-within:text-blue-500 transition-colors">
                  Phone
                </label>
                <input
                  name="phone"
                  placeholder="+92 XXX XXXXXXX"
                  className="w-full bg-slate-50 border-2 border-transparent p-4 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-300 font-medium text-slate-700"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="relative group">
              <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1 ml-4 block group-focus-within:text-blue-500 transition-colors">
                Condition / Disease
              </label>
              <input
                name="disease"
                placeholder="e.g. Fever, Blood Pressure"
                className="w-full bg-slate-50 border-2 border-transparent p-4 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-300 font-medium text-slate-700"
                value={formData.disease}
                onChange={handleChange}
              />
            </div>

            <button
              onClick={addPatient}
              disabled={loading}
              className="w-full mt-6 bg-blue-600 text-white p-5 rounded-3xl font-bold text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all disabled:bg-slate-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Complete Registration
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
