import { useAuth } from "../../lib/authContext";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "../../lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function AdminDashboard() {
  const { user, role, loading, logout } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState({
    appointments: 0,
    doctors: 0,
    patientsToday: 0,
  });

  useEffect(() => {
    if (!loading && (!user || role !== "admin")) {
      router.push("/login");
    }

    const fetchStats = async () => {
      try {
        const appSnap = await getDocs(collection(db, "appointments"));

        const doctorQuery = query(
          collection(db, "users"),
          where("role", "==", "doctor"),
        );
        const doctorSnap = await getDocs(doctorQuery);

        const today = new Date().toISOString().split("T")[0];
        const patientQuery = query(
          collection(db, "patients"),
          where("createdAt", ">=", today),
        );
        const patientSnap = await getDocs(patientQuery);

        setStats({
          appointments: appSnap.size,
          doctors: doctorSnap.size,
          patientsToday: patientSnap.size,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    if (role === "admin") {
      fetchStats();
    }
  }, [role, loading, user, router]);

  if (loading)
    return (
      <div className="p-10 text-center font-bold">Checking Admin Access...</div>
    );
  if (role !== "admin") return null;

  const adminActions = [
    {
      title: "Appointments List",
      path: "/appointments/list",
      icon: "📅",
      color: "bg-blue-500",
    },
    {
      title: "Patients List",
      path: "/patients/listPatients",
      icon: "🏥",
      color: "bg-green-500",
    },
    {
      title: "Staff Management",
      path: "/staff/list",
      icon: "👥",
      color: "bg-purple-500",
    },
    {
      title: "Doctors Directory",
      path: "/doctors/list",
      icon: "👨‍⚕️",
      color: "bg-red-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black">
      <header className="flex justify-between items-center p-4 bg-white shadow">
        <h1>Welcome, {user?.email}</h1>

        <button
          onClick={logout}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
        >
          Sign Out
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminActions.map((action, index) => (
          <Link href={action.path} key={index}>
            <div
              className={`cursor-pointer transform hover:scale-105 transition-all p-6 rounded-xl shadow-lg text-white ${action.color}`}
            >
              <div className="text-4xl mb-4">{action.icon}</div>
              <h2 className="text-xl font-semibold">{action.title}</h2>
              <p className="text-sm opacity-80 mt-2">
                Manage all {action.title.toLowerCase()}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-bold mb-4">System Overview (Live)</h3>
          <div className="space-y-4">
            <p className="flex justify-between border-b pb-2">
              Total Appointments{" "}
              <span className="font-bold text-blue-600">
                {stats.appointments}
              </span>
            </p>
            <p className="flex justify-between border-b pb-2">
              Active Doctors{" "}
              <span className="font-bold text-red-600">{stats.doctors}</span>
            </p>
            <p className="flex justify-between border-b pb-2">
              New Patients (Today){" "}
              <span className="font-bold text-green-600">
                {stats.patientsToday}
              </span>
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center justify-center bg-linear-to-r from-gray-50 to-gray-100">
          <p className="text-gray-500 italic text-center">
            "Admin has authority to Add, Edit, and Delete any record across the
            system."
          </p>
        </div>
      </div>
    </div>
  );
}
