import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { doc, getDoc } from "firebase/firestore";
import { ArrowLeft, Printer, FileDown } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

import { db } from "@/src/services/firebase/config";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { withAuth } from "@/src/components/layout/RouteGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/common/Card";
import { Button } from "@/src/components/common/Button";

function ReportViewer() {
  const router = useRouter();
  const { id } = router.query;
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchApp = async () => {
      try {
        const docSnap = await getDoc(doc(db, "appointments", id));
        if (docSnap.exists()) {
          setAppointment(docSnap.data());
        } else {
          toast.error("Report not found");
        }
      } catch (error) {
        toast.error("Failed to load report");
      } finally {
        setLoading(false);
      }
    };
    fetchApp();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <DashboardLayout><div className="p-8 text-center text-gray-500">Loading report...</div></DashboardLayout>;
  if (!appointment) return <DashboardLayout><div className="p-8 text-center text-gray-500">Report not found.</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <Link href="/appointments/list">
              <Button variant="ghost" size="sm" className="px-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Medical Report</h1>
              <p className="text-sm text-gray-500">View and print clinical summary.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </div>

        <Card className="print:shadow-none print:border-none">
          <CardHeader className="border-b pb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-blue-600">CareClinic</h2>
                <p className="text-sm text-gray-500 mt-1">123 Health Ave, Medical City</p>
                <p className="text-sm text-gray-500">Phone: +1 234 567 890</p>
              </div>
              <div className="text-right">
                <h3 className="text-xl font-bold text-gray-900">Medical Report</h3>
                <p className="text-sm text-gray-500">Date: {appointment.date}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            <div className="grid grid-cols-2 gap-8 border-b pb-8">
              <div>
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Patient Details</h4>
                <p className="font-bold text-gray-900 text-lg">{appointment.patientName}</p>
                <p className="text-gray-600">Status: {appointment.status}</p>
              </div>
              <div className="text-right">
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Consulting Doctor</h4>
                <p className="font-bold text-gray-900 text-lg">Dr. {appointment.doctorName}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Reason for Visit / Symptoms</h4>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 min-h-[60px] print:border-none print:bg-white print:p-0">
                  <p className="text-gray-700 whitespace-pre-wrap">{appointment.reason || "Not specified."}</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Doctor&apos;s Diagnosis & Notes</h4>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 min-h-[100px] print:border-none print:bg-white print:p-0">
                  <p className="text-gray-700 whitespace-pre-wrap">{appointment.doctorNotes || "No notes recorded yet."}</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Prescription</h4>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 min-h-[100px] print:border-none print:bg-white print:p-0">
                  <p className="text-gray-700 whitespace-pre-wrap">{appointment.prescription || "No prescription issued."}</p>
                </div>
              </div>
            </div>

            <div className="pt-20 pb-10 flex justify-between items-end border-t mt-12">
              <div className="text-sm text-gray-500">
                <p>This is a computer generated document.</p>
                <p>Valid without signature.</p>
              </div>
              <div className="text-center w-48">
                <div className="border-b border-gray-400 h-8 mb-2"></div>
                <p className="text-sm font-bold text-gray-900">Dr. {appointment.doctorName}</p>
                <p className="text-xs text-gray-500">Signature / Stamp</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(ReportViewer, ["admin", "doctor", "staff", "receptionist", "patient", "accountant"]);