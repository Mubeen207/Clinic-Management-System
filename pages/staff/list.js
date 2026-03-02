import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import Link from "next/link";

export default function StaffList() {
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const q = query(
          collection(db, "users"),
          where("role", "==", "receptionist"),
        );
        const querySnapshot = await getDocs(q);
        const staffData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStaffMembers(staffData);
      } catch (error) {
        console.error("Error fetching staff:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, []);

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "disabled" ? "active" : "disabled";
    if (confirm(`Mark this staff member as ${newStatus}?`)) {
      const staffRef = doc(db, "users", id);
      await updateDoc(staffRef, { status: newStatus });

      setStaffMembers(
        staffMembers.map((s) =>
          s.id === id ? { ...s, status: newStatus } : s,
        ),
      );
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-75 w-full animate-in fade-in duration-500">
        <div className="relative flex items-center gap-4 bg-white/80 backdrop-blur-md px-8 py-5 rounded-4xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100">
          <div className="flex gap-1">
            <span className="w-1.5 h-6 bg-blue-600 rounded-full animate-[bounce_1s_infinite_0.1s]"></span>
            <span className="w-1.5 h-6 bg-blue-500 rounded-full animate-[bounce_1s_infinite_0.2s]"></span>
            <span className="w-1.5 h-6 bg-blue-400 rounded-full animate-[bounce_1s_infinite_0.3s]"></span>
          </div>

          <div className="flex flex-col">
            <span className="text-slate-800 font-black text-sm uppercase tracking-[0.15em]">
              Retrieving Data
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest animate-pulse">
              Staff Directory
            </span>
          </div>

          <div className="absolute -z-10 inset-0 bg-blue-50 rounded-4xl scale-110 blur-xl opacity-50 animate-pulse"></div>
        </div>
      </div>
    );

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-black">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Staff Management</h1>
          <p className="text-gray-500">
            Manage Receptionists and Support Staff
          </p>
        </div>
        <Link href="/dashboard/AdminDashboard">
          <button className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm">
            ← Back to Dashboard
          </button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-4 font-bold text-gray-700">Name</th>
              <th className="p-4 font-bold text-gray-700">Email</th>
              <th className="p-4 font-bold text-gray-700">Status</th>
              <th className="p-4 font-bold text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staffMembers.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  className="p-10 text-center text-gray-400 italic"
                >
                  No staff members found.
                </td>
              </tr>
            ) : (
              staffMembers.map((member) => (
                <tr
                  key={member.id}
                  className="border-b hover:bg-blue-50/30 transition"
                >
                  <td className="p-4 font-medium">{member.name}</td>
                  <td className="p-4 text-gray-600">{member.email}</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        member.status === "disabled"
                          ? "bg-red-100 text-red-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {member.status === "disabled"
                        ? "🔴 Disabled"
                        : "🟢 Active"}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => toggleStatus(member.id, member.status)}
                      className={`text-sm font-semibold px-4 py-1.5 rounded-md transition ${
                        member.status === "disabled"
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-600"
                      }`}
                    >
                      {member.status === "disabled" ? "Enable" : "Disable"}
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
