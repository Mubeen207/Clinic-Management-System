import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { Users, Calendar as CalendarIcon, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";

import { db } from "@/src/services/firebase/config";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { withAuth } from "@/src/components/layout/RouteGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/common/Card";
import { Button } from "@/src/components/common/Button";

function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "appointments"),
      where("status", "==", "Pending"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setAppointments(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsub();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Doctor Dashboard</h1>
          <p className="text-sm text-gray-500">Manage your daily appointments and patients.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Appointments Today</p>
                <p className="text-3xl font-bold mt-2 text-gray-900">{appointments.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <CalendarIcon className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Reviews</p>
                <p className="text-3xl font-bold mt-2 text-gray-900">0</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Completed Sessions</p>
                <p className="text-3xl font-bold mt-2 text-gray-900">0</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Patient Queue (Pending)</CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  No pending patients in your queue.
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((app) => (
                    <div key={app.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-gray-100 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold">
                          {app.patientName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{app.patientName}</p>
                          <p className="text-sm text-gray-500">Issue: {app.reason || "General Checkup"}</p>
                        </div>
                      </div>
                      <div className="mt-4 sm:mt-0 flex gap-2">
                        <Link href={`/appointments/${app.id}`}>
                          <Button size="sm" variant="primary">Start Session</Button>
                        </Link>
                        <Link href={`/reports/${app.id}`}>
                          <Button size="sm" variant="secondary">View Report</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/appointments/create" className="block">
                <Button className="w-full">Book New Visit</Button>
              </Link>
              <Link href="/patients/listPatients" className="block">
                <Button variant="secondary" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50">
                  Patients List
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(DoctorDashboard, ["doctor", "admin"]);
