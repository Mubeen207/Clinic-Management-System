import { useAuth } from "../lib/authContext";
import AdminDashboard from "./AdminDashboard"; // Jo file humne abhi banayi thi
import DoctorDashboard from "./DoctorDashboard"; // Doctor ka alag view
import StaffDashboard from "./StaffDashboard";   // Staff ka alag view

export default function Dashboard() {
  const { user, role, loading } = useAuth();

  if (loading) return <p>Loading Dashboard...</p>;

  // Yahan browser decide karta hai ke kya dikhana hai
  return (
    <div>
      {/* 1. Agar Admin hai to Admin ka poora element/page dikhao */}
      {role === "admin" && <AdminDashboard />}

      {/* 2. Agar Doctor hai to sirf doctor wala hissa dikhao */}
      {role === "doctor" && <DoctorDashboard />}

      {/* 3. Agar Receptionist hai */}
      {role === "receptionist" && <StaffDashboard />}

      {/* Common Logout Button for everyone */}
      {!role && <p>No role assigned. Please contact admin.</p>}
    </div>
  );
}