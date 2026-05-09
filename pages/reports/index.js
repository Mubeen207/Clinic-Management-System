import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { FileText, Download, ShieldAlert, Calendar } from "lucide-react";
import Link from "next/link";

import { db } from "@/src/services/firebase/config";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { withAuth } from "@/src/components/layout/RouteGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/common/Card";
import { Button } from "@/src/components/common/Button";

function ReportsDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("clinical"); // clinical or security

  useEffect(() => {
    // Clinical Reports
    const q1 = query(collection(db, "appointments"), orderBy("createdAt", "desc"));
    const unsub1 = onSnapshot(q1, (snap) => {
      setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(a => a.status === "Completed" || a.doctorNotes));
    });

    // Security Logs
    const q2 = query(collection(db, "statusLogs"), orderBy("createdAt", "desc"));
    const unsub2 = onSnapshot(q2, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const downloadCSV = (type) => {
    let dataToExport = [];
    let headers = [];
    let filename = "";

    if (type === "clinical") {
      headers = ["Patient Name", "Doctor Name", "Date", "Status", "Reason"];
      dataToExport = appointments.map(app => [
        `"${app.patientName}"`, 
        `"${app.doctorName}"`, 
        `"${app.date}"`, 
        `"${app.status}"`,
        `"${app.reason || ""}"`
      ]);
      filename = "Clinical_Reports_Export.csv";
    } else {
      headers = ["Action", "Target User", "Target Role", "Reason", "Action By"];
      dataToExport = logs.map(log => [
        `"${log.action}"`,
        `"${log.targetUserName}"`,
        `"${log.targetUserRole}"`,
        `"${log.reason}"`,
        `"${log.actionByName}"`
      ]);
      filename = "Security_Blacklist_Logs.csv";
    }

    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + dataToExport.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Reports & Analytics</h1>
            <p className="text-sm text-gray-500">View medical reports and security audit logs.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => downloadCSV(activeTab)} className="gap-2">
              <Download className="w-4 h-4" /> Export {activeTab === "clinical" ? "Clinical" : "Security"} CSV
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card 
            className={`cursor-pointer transition-all ${activeTab === "clinical" ? "ring-2 ring-blue-500" : ""}`}
            onClick={() => setActiveTab("clinical")}
          >
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Clinical Reports</p>
                <p className="text-3xl font-bold mt-2 text-gray-900">{appointments.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${activeTab === "security" ? "ring-2 ring-red-500" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Security / Blacklist Logs</p>
                <p className="text-3xl font-bold mt-2 text-gray-900">{logs.length}</p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <ShieldAlert className="w-6 h-6 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{activeTab === "clinical" ? "Clinical Directory" : "Audit Log"}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {activeTab === "clinical" ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3">Patient</th>
                      <th className="px-6 py-3">Doctor</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                          No medical reports available yet.
                        </td>
                      </tr>
                    ) : (
                      appointments.map((app) => (
                        <tr key={app.id} className="bg-white border-b hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">{app.patientName}</td>
                          <td className="px-6 py-4">Dr. {app.doctorName}</td>
                          <td className="px-6 py-4">{app.date}</td>
                          <td className="px-6 py-4 text-right flex justify-end gap-2">
                            <Link href={`/reports/${app.id}`}>
                              <Button variant="secondary" size="sm" className="gap-2">
                                <FileText className="w-4 h-4" /> View PDF
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
               <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3">Action</th>
                      <th className="px-6 py-3">Target User</th>
                      <th className="px-6 py-3">Role</th>
                      <th className="px-6 py-3">Reason</th>
                      <th className="px-6 py-3">Action By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                          No security actions logged.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="bg-white border-b hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              log.action === "blacklisted" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                            }`}>
                              {log.action.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">{log.targetUserName}</td>
                          <td className="px-6 py-4 uppercase text-xs">{log.targetUserRole}</td>
                          <td className="px-6 py-4 max-w-[200px] truncate" title={log.reason}>{log.reason}</td>
                          <td className="px-6 py-4 font-medium text-gray-900">{log.actionByName}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(ReportsDashboard, ["admin", "accountant", "doctor", "staff"]);
