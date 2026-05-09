import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { FileText, Printer } from "lucide-react";
import Link from "next/link";

import { db } from "@/src/services/firebase/config";
import { useAuth } from "@/src/context/AuthContext";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { withAuth } from "@/src/components/layout/RouteGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/common/Card";
import { Button } from "@/src/components/common/Button";

function Prescriptions() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "appointments"), where("doctorId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      let data = snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter(d => d.prescription && d.prescription.trim() !== "");
        
      data.sort((a, b) => new Date(b.createdAt?.toMillis() || 0) - new Date(a.createdAt?.toMillis() || 0));
      setPrescriptions(data);
    });
    return () => unsub();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">My Prescriptions</h1>
          <p className="text-sm text-gray-500">History of all prescriptions issued to your patients.</p>
        </div>

        <Card>
          <CardHeader className="border-b bg-gray-50/50 py-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Issued Prescriptions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Patient</th>
                    <th className="px-6 py-3">Prescription Preview</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                        No prescriptions issued yet. Start an appointment session to prescribe medication.
                      </td>
                    </tr>
                  ) : (
                    prescriptions.map((app) => (
                      <tr key={app.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{app.date}</td>
                        <td className="px-6 py-4 font-bold text-blue-600">{app.patientName}</td>
                        <td className="px-6 py-4 truncate max-w-md">{app.prescription}</td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <Link href={`/reports/${app.id}`}>
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 gap-2">
                              <Printer className="w-4 h-4" /> Print
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

export default withAuth(Prescriptions, ["doctor", "admin"]);
