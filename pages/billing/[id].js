import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ArrowLeft, Printer, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

import { db } from "@/src/services/firebase/config";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { withAuth } from "@/src/components/layout/RouteGuard";
import { Card, CardContent, CardHeader } from "@/src/components/common/Card";
import { Button } from "@/src/components/common/Button";

function ViewInvoice() {
  const router = useRouter();
  const { id } = router.query;
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchInv = async () => {
      try {
        const docSnap = await getDoc(doc(db, "invoices", id));
        if (docSnap.exists()) {
          setInvoice({ id: docSnap.id, ...docSnap.data() });
        } else {
          toast.error("Invoice not found");
        }
      } catch (error) {
        toast.error("Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };
    fetchInv();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleMarkAsPaid = async () => {
    setUpdating(true);
    try {
      await updateDoc(doc(db, "invoices", id), { status: "Paid" });
      setInvoice({ ...invoice, status: "Paid" });
      toast.success("Invoice marked as paid!");
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <DashboardLayout><div className="p-8 text-center text-gray-500">Loading invoice...</div></DashboardLayout>;
  if (!invoice) return <DashboardLayout><div className="p-8 text-center text-gray-500">Invoice not found.</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <Link href="/billing">
              <Button variant="ghost" size="sm" className="px-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Invoice Details</h1>
              <p className="text-sm text-gray-500">View and manage invoice status.</p>
            </div>
          </div>
          <div className="flex gap-2">
            {invoice.status !== "Paid" && (
              <Button onClick={handleMarkAsPaid} isLoading={updating} className="gap-2 bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4" /> Mark as Paid
              </Button>
            )}
            <Button variant="secondary" onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </div>

        <Card className="print:shadow-none print:border-none print:m-0">
          <CardHeader className="border-b pb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold text-blue-600">CareClinic</h2>
                <p className="text-sm text-gray-500 mt-1">123 Health Ave, Medical City</p>
                <p className="text-sm text-gray-500">Email: billing@careclinic.com</p>
              </div>
              <div className="text-right">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">INVOICE</h3>
                <p className="text-sm text-gray-500">Invoice ID: <span className="font-mono text-gray-900">INV-{invoice.id.substring(0,6).toUpperCase()}</span></p>
                <p className="text-sm text-gray-500">Date: <span className="text-gray-900">{invoice.date}</span></p>
                <div className="mt-4 inline-block">
                  {invoice.status === "Paid" ? (
                    <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold border border-green-200">
                      <CheckCircle className="w-4 h-4" /> PAID
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold border border-yellow-200">
                      <Clock className="w-4 h-4" /> PENDING
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-8 space-y-8">
            <div>
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Billed To</h4>
              <p className="font-bold text-gray-900 text-lg">{invoice.patientName}</p>
            </div>

            <div className="mt-8">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-gray-900 text-gray-900 text-sm">
                    <th className="py-3 px-2">Description</th>
                    <th className="py-3 px-2 text-center w-24">Qty</th>
                    <th className="py-3 px-2 text-right w-32">Unit Price</th>
                    <th className="py-3 px-2 text-right w-32">Amount</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {invoice.items?.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-4 px-2">{item.description}</td>
                      <td className="py-4 px-2 text-center">{item.quantity}</td>
                      <td className="py-4 px-2 text-right">${item.price.toFixed(2)}</td>
                      <td className="py-4 px-2 text-right font-medium text-gray-900">${(item.quantity * item.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-4">
              <div className="w-64 space-y-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${invoice.total?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 border-t-2 border-gray-900 pt-4">
                  <span>Total Due</span>
                  <span>${invoice.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="pt-20 border-t mt-12 text-sm text-gray-500 text-center">
              <p>Thank you for choosing CareClinic.</p>
              <p>For any billing inquiries, please contact billing@careclinic.com</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(ViewInvoice, ["admin", "accountant", "staff", "receptionist", "patient"]);
