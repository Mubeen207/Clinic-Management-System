import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";

import { db } from "@/src/services/firebase/config";
import { useAuth } from "@/src/context/AuthContext";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { withAuth } from "@/src/components/layout/RouteGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/common/Card";
import { Button } from "@/src/components/common/Button";

function AppointmentsList() {
  const { role, user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState("All"); // All, Pending, Confirmed, Completed, Cancelled

  useEffect(() => {
    // Ideally if doctor, we only query their appointments.
    // For simplicity in UI filter, we'll fetch all and filter client side, or better, query side.
    const q = query(collection(db, "appointments"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      let data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      if (role === "doctor") {
        data = data.filter(d => d.doctorId === user.uid);
      }
      setAppointments(data);
    });
    return () => unsub();
  }, [role, user]);

  const filtered = appointments.filter(a => filter === "All" ? true : a.status === filter);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Appointments List</h1>
            <p className="text-sm text-gray-500">Manage patient bookings and schedules.</p>
          </div>
          {(role === "admin" || role === "staff" || role === "receptionist") && (
            <Link href="/appointments/create">
              <Button className="gap-2">
                <CalendarPlus className="w-4 h-4" /> Book New
              </Button>
            </Link>
          )}
        </div>

        <Card>
          <CardHeader className="border-b bg-gray-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 gap-4">
            <CardTitle>Schedule</CardTitle>
            <div className="flex gap-2">
              {["All", "Pending", "Confirmed", "Completed", "Cancelled"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition ${
                    filter === f ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3">Patient</th>
                    <th className="px-6 py-3">Doctor</th>
                    <th className="px-6 py-3">Date & Time</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                        No appointments found for this filter.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((app) => (
                      <tr key={app.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {app.patientName || "Unknown"}
                        </td>
                        <td className="px-6 py-4">Dr. {app.doctorName || "Unassigned"}</td>
                        <td className="px-6 py-4">
                          {app.date} <span className="text-gray-300 mx-1">|</span> {app.time}
                        </td>
                        <td className="px-6 py-4">
                           <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            app.status === "Completed" ? "bg-green-100 text-green-800"
                            : app.status === "Cancelled" ? "bg-red-100 text-red-800"
                            : app.status === "Confirmed" ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {app.status || "Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={app.status === "Completed" ? `/reports/${app.id}` : `/appointments/${app.id}`}>
                            <Button variant="ghost" size="sm" className="text-blue-600">
                              {app.status === "Completed" ? "View Report" : "Manage"}
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(AppointmentsList, ["admin", "staff", "receptionist", "doctor"]);
