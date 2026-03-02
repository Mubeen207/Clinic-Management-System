import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import Link from "next/link";

export default function DoctorsList() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        // Sirf un users ko lao jinka role 'doctor' hai
        const q = query(collection(db, "users"), where("role", "==", "doctor"));
        const querySnapshot = await getDocs(q);
        const doctorsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDoctors(doctorsData);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to remove this doctor?")) {
      await deleteDoc(doc(db, "users", id));
      setDoctors(doctors.filter(d => d.id !== id)); // List refresh karein
    }
  };

  if (loading) return <p className="text-center p-10">Loading Doctors...</p>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-black">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Doctors Directory</h1>
        <Link href="/dashboard/AdminDashboard">
          <button className="bg-gray-200 px-4 py-2 rounded-lg text-sm">Back to Dashboard</button>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-4 font-semibold">Name</th>
              <th className="p-4 font-semibold">Email</th>
              <th className="p-4 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-10 text-center text-gray-500">No doctors registered yet.</td>
              </tr>
            ) : (
              doctors.map((doctor) => (
                <tr key={doctor.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-4 font-medium">{doctor.name}</td>
                  <td className="p-4 text-gray-600">{doctor.email}</td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => handleDelete(doctor.id)}
                      className="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 transition text-sm"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}