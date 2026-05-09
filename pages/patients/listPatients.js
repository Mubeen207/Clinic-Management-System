import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import Link from "next/link";
import { Search, UserPlus } from "lucide-react";

import { db } from "@/src/services/firebase/config";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { withAuth } from "@/src/components/layout/RouteGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/common/Card";
import { Button } from "@/src/components/common/Button";

function ListPatients() {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const q = query(collection(db, "patients"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPatients(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error fetching patients:", error);
    });
    return () => unsub();
  }, []);

  const filteredPatients = patients.filter((p) =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.phone?.includes(searchTerm)
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Patients Directory</h1>
            <p className="text-sm text-gray-500">View and manage all registered patients.</p>
          </div>
          <Link href="/patients/addPatients">
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" /> Add Patient
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader className="border-b bg-gray-50/50 flex flex-row items-center justify-between py-4">
            <CardTitle>All Patients</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by name or phone..."
                className="pl-9 flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3">Patient Name</th>
                    <th className="px-6 py-3">Age/Gender</th>
                    <th className="px-6 py-3">Contact</th>
                    <th className="px-6 py-3">Blood Group</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                        No patients found.
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map((patient) => (
                      <tr key={patient.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {patient.name}
                        </td>
                        <td className="px-6 py-4">
                          {patient.age} / {patient.gender}
                        </td>
                        <td className="px-6 py-4">{patient.phone}</td>
                        <td className="px-6 py-4 font-semibold text-red-600">
                          {patient.bloodGroup || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/patients/${patient.id}`}>
                            <Button variant="secondary" size="sm">
                              View Profile
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

export default withAuth(ListPatients, ["admin", "staff", "receptionist", "doctor"]);
