import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { CreditCard, DollarSign, FileText, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";

import { db } from "@/src/services/firebase/config";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { withAuth } from "@/src/components/layout/RouteGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/common/Card";
import { Button } from "@/src/components/common/Button";

function AccountantDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingInvoices: 0,
    paidInvoices: 0,
    pendingAmount: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "invoices"));
    const unsub = onSnapshot(q, (snap) => {
      let revenue = 0;
      let pendingCount = 0;
      let paidCount = 0;
      let pendingAmt = 0;
      
      const transactions = [];

      snap.forEach(doc => {
        const data = doc.data();
        if (data.status === "Paid") {
          revenue += (data.total || 0);
          paidCount++;
        } else {
          pendingAmt += (data.total || 0);
          pendingCount++;
        }
        transactions.push({ id: doc.id, ...data });
      });

      setStats({
        totalRevenue: revenue,
        pendingInvoices: pendingCount,
        paidInvoices: paidCount,
        pendingAmount: pendingAmt,
      });

      // Sort recent by date
      transactions.sort((a,b) => new Date(b.date) - new Date(a.date));
      setRecentTransactions(transactions.slice(0, 6));
    });

    return () => unsub();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Accountant Dashboard</h1>
            <p className="text-sm text-gray-500">Overview of finances, invoices, and billing.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/billing/create">
              <Button className="gap-2">
                <CreditCard className="w-4 h-4" /> Create Invoice
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Collected Revenue</p>
                <p className="text-2xl font-bold mt-2 text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Revenue</p>
                <p className="text-2xl font-bold mt-2 text-gray-900">${stats.pendingAmount.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Invoices</p>
                <p className="text-2xl font-bold mt-2 text-gray-900">{stats.pendingInvoices}</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Paid Invoices</p>
                <p className="text-2xl font-bold mt-2 text-gray-900">{stats.paidInvoices}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3">Invoice ID</th>
                    <th className="px-6 py-3">Patient</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    recentTransactions.map((tx) => (
                      <tr key={tx.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono text-xs text-gray-900">
                          INV-{tx.id.substring(0, 6).toUpperCase()}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">{tx.patientName}</td>
                        <td className="px-6 py-4">{tx.date}</td>
                        <td className="px-6 py-4 font-bold text-gray-900">${tx.total}</td>
                        <td className="px-6 py-4 text-right">
                           <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tx.status === "Paid" ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {tx.status || "Pending"}
                          </span>
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

export default withAuth(AccountantDashboard, ["accountant", "admin"]);
