import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Users, Calendar, Stethoscope, Activity, TrendingUp, ShieldAlert } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { db } from "@/src/services/firebase/config";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { withAuth } from "@/src/components/layout/RouteGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/common/Card";

function AdminDashboard() {
  const [stats, setStats] = useState({
    appointments: 0,
    doctors: 0,
    patientsToday: 0,
    totalPatients: 0,
    blacklisted: 0,
  });
  
  const [chartData, setChartData] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const appSnap = await getDocs(collection(db, "appointments"));

        const doctorQuery = query(collection(db, "users"), where("role", "==", "doctor"));
        const doctorSnap = await getDocs(doctorQuery);
        const activeDoctorsCount = doctorSnap.docs.filter(d => d.data().status !== "blacklisted").length;

        const blacklistedQuery = query(collection(db, "users"), where("status", "==", "blacklisted"));
        const blacklistedSnap = await getDocs(blacklistedQuery);

        const patientSnap = await getDocs(collection(db, "patients"));
        
        const today = new Date().toISOString().split("T")[0];
        const patientTodayQuery = query(collection(db, "patients"), where("createdAt", ">=", today));
        const patientTodaySnap = await getDocs(patientTodayQuery);

        setStats({
          appointments: appSnap.size,
          doctors: activeDoctorsCount,
          totalPatients: patientSnap.size,
          patientsToday: patientTodaySnap.size,
          blacklisted: blacklistedSnap.size,
        });

        // Simple real data aggregation for chart (group by date)
        const dateCounts = {};
        appSnap.docs.forEach(doc => {
          const date = doc.data().date;
          if (date) {
            // grab last 5 chars of date (MM-DD)
            const shortDate = date.substring(5);
            dateCounts[shortDate] = (dateCounts[shortDate] || 0) + 1;
          }
        });

        // Convert to array and sort
        const formattedChart = Object.keys(dateCounts).sort().slice(-7).map(k => ({
          name: k,
          appointments: dateCounts[k]
        }));
        setChartData(formattedChart.length > 0 ? formattedChart : [{name: "No Data", appointments: 0}]);

        // Fetch recent status logs
        const logsSnap = await getDocs(collection(db, "statusLogs"));
        // Since we don't have a complex index, just sort in JS for now (or use orderBy if index exists)
        const logs = logsSnap.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()).slice(0, 5);
        setRecentLogs(logs);

      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { title: "Total Appointments", value: stats.appointments, icon: Calendar, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Active Doctors", value: stats.doctors, icon: Stethoscope, color: "text-red-600", bg: "bg-red-100" },
    { title: "Total Patients", value: stats.totalPatients, icon: Users, color: "text-green-600", bg: "bg-green-100" },
    { title: "Blacklisted Users", value: stats.blacklisted, icon: ShieldAlert, color: "text-orange-600", bg: "bg-orange-100" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Overview of clinic operations and security statistics.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2 text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Appointments Overview (Recent Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} dx={-10} allowDecimals={false} />
                    <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="appointments" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Recent Security Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {recentLogs.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4 text-center">No recent security actions.</p>
                ) : (
                  recentLogs.map((log) => (
                    <div key={log.id} className="flex items-center">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${log.action === "blacklisted" ? "bg-red-100" : "bg-green-100"}`}>
                        <ShieldAlert className={`h-5 w-5 ${log.action === "blacklisted" ? "text-red-600" : "text-green-600"}`} />
                      </div>
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          User {log.action === "blacklisted" ? "Blacklisted" : "Whitelisted"}
                        </p>
                        <p className="text-sm text-gray-500 truncate max-w-[200px]" title={log.reason}>
                          {log.targetUserName} - {log.reason}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(AdminDashboard, ["admin"]);
