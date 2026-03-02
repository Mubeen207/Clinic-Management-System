import { useAuth } from "../../lib/authContext";
import AdminDashboard from "./AdminDashboard";
import DoctorDashboard from "./DoctorDashboard";
import StaffDashboard from "./StaffDashboard";

export default function Dashboard() {
  const { user, role, loading } = useAuth();

  if (loading) return <p>Loading Dashboard...</p>;

  return (
    <div>
      {role === "admin" && <AdminDashboard />}

      {role === "doctor" && <DoctorDashboard />}

      {role === "receptionist" && <StaffDashboard />}

      {!role && <p>No role assigned. Please contact admin.</p>}
    </div>
  );
}
