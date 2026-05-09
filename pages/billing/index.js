import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import Link from "next/link";
import { PlusCircle, Search } from "lucide-react";

import { db } from "@/src/services/firebase/config";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { withAuth } from "@/src/components/layout/RouteGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/common/Card";
import { Button } from "@/src/components/common/Button";

function BillingDashboard() {
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const q = query(collection(db, "invoices"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setInvoices(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) || inv.id.includes(searchTerm);
    const matchesFilter = filter === "All" ? true : inv.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Billing & Accounting</h1>
            <p className="text-sm text-gray-500">Manage invoices, payments, and financial tracking.</p>
          </div>
          <Link href="/billing/create">
            <Button className="gap-2">
              <PlusCircle className="w-4 h-4" /> Generate Invoice
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-3xl font-bold mt-2">${invoices.filter(i => i.status === "Paid").reduce((acc, curr) => acc + (curr.total || 0), 0).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-500">Pending Payments</p>
              <p className="text-3xl font-bold mt-2">${invoices.filter(i => i.status === "Pending").reduce((acc, curr) => acc + (curr.total || 0), 0).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-500">Invoices Generated</p>
              <p className="text-3xl font-bold mt-2">{invoices.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="border-b bg-gray-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 gap-4">
            <CardTitle>Invoices</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="flex gap-2">
                {["All", "Pending", "Paid", "Cancelled"].map(f => (
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
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search invoice or patient..."
                  className="pl-9 flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3">Invoice ID</th>
                    <th className="px-6 py-3">Patient Name</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                        No invoices found.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono text-xs text-gray-900">
                          INV-{inv.id.substring(0, 6).toUpperCase()}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">{inv.patientName}</td>
                        <td className="px-6 py-4">{inv.date}</td>
                        <td className="px-6 py-4 font-bold text-gray-900">${inv.total}</td>
                        <td className="px-6 py-4">
                           <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            inv.status === "Paid" ? "bg-green-100 text-green-800"
                            : inv.status === "Cancelled" ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {inv.status || "Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/billing/${inv.id}`}>
                            <Button variant="ghost" size="sm" className="text-blue-600">
                              View/Print
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

export default withAuth(BillingDashboard, ["admin", "accountant", "staff", "receptionist"]);
