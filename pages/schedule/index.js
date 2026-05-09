import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import Link from "next/link";

import { db } from "@/src/services/firebase/config";
import { useAuth } from "@/src/context/AuthContext";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { withAuth } from "@/src/components/layout/RouteGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/common/Card";
import { Button } from "@/src/components/common/Button";

function DoctorSchedule() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "appointments"), where("doctorId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      let data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      // Sort by date and time
      data.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
      setAppointments(data);
    });
    return () => unsub();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">My Schedule</h1>
          <p className="text-sm text-gray-500">View and manage your upcoming patient appointments.</p>
        </div>

        <Card>
          <CardHeader className="border-b bg-gray-50/50 py-4">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              Upcoming Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3">Date & Time</th>
                    <th className="px-6 py-3">Patient</th>
                    <th className="px-6 py-3">Reason</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                        No appointments scheduled.
                      </td>
                    </tr>
                  ) : (
                    appointments.map((app) => (
                      <tr key={app.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {app.date} at {app.time}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-blue-600">{app.patientName}</td>
                        <td className="px-6 py-4 truncate max-w-xs">{app.reason || "N/A"}</td>
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
                            <Button variant="secondary" size="sm">
                              {app.status === "Completed" ? "View Report" : "Start Session"}
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

export default withAuth(DoctorSchedule, ["doctor", "admin"]);
