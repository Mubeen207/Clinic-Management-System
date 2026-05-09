import { useEffect, useState } from "react";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import Link from "next/link";
import { Calendar, UserPlus, FileText } from "lucide-react";

import { db } from "@/src/services/firebase/config";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { withAuth } from "@/src/components/layout/RouteGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/common/Card";
import { Button } from "@/src/components/common/Button";

function StaffDashboard() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "appointments"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setAppointments(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Staff Dashboard</h1>
            <p className="text-sm text-gray-500">Manage reception, bookings, and patient registration.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/patients/addPatients">
              <Button variant="secondary" className="gap-2">
                <UserPlus className="w-4 h-4" /> Register Patient
              </Button>
            </Link>
            <Link href="/appointments/create">
              <Button className="gap-2">
                <Calendar className="w-4 h-4" /> Book Appointment
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                  <p className="text-3xl font-bold mt-2">{appointments.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending Today</p>
                  <p className="text-3xl font-bold mt-2">
                    {appointments.filter((a) => a.status === "Pending").length}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Calendar className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th scope="col" className="px-6 py-3">Patient Name</th>
                    <th scope="col" className="px-6 py-3">Date & Time</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                    <th scope="col" className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                        No appointments found.
                      </td>
                    </tr>
                  ) : (
                    appointments.map((app) => (
                      <tr key={app.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {app.patientName}
                        </td>
                        <td className="px-6 py-4">
                          {app.date} <span className="text-gray-300 mx-1">|</span> {app.time}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            app.status === "Completed" ? "bg-green-100 text-green-800"
                            : app.status === "Cancelled" ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {app.status || "Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/appointments/${app.id}`}>
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                              Update
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

export default withAuth(StaffDashboard, ["receptionist", "staff", "admin"]);
