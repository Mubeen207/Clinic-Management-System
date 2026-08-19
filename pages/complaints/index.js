import { useEffect, useState } from "react";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, getDocs, updateDoc, doc, where } from "firebase/firestore";
import { AlertCircle, CheckCircle2, Clock, Send, MessageSquare, Filter, UserX } from "lucide-react";
import { toast } from "react-hot-toast";

import { db } from "@/src/services/firebase/config";
import { useAuth } from "@/src/context/AuthContext";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { withAuth } from "@/src/components/layout/RouteGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/common/Card";
import { Button } from "@/src/components/common/Button";
import { Input } from "@/src/components/common/Input";
import { toSentenceCase } from "@/src/utils/formatSentenceCase";

function ComplaintsDashboard() {
  const { user, role } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [users, setUsers] = useState([]);
  const [reportedUserId, setReportedUserId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Admin review state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [status, setStatus] = useState("Under Review");
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Fetch users for dropdown
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.id !== user.uid));
      } catch (err) {
        console.error("Failed to load user directory for complaint targets", err);
      }
    };
    fetchUsers();

    // Fetch complaints with role-scoped queries to match security rules
    const q = role === "admin"
      ? query(collection(db, "complaints"), orderBy("createdAt", "desc"))
      : query(collection(db, "complaints"), where("reporterId", "==", user.uid));

    const unsub = onSnapshot(q, (snap) => {
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (role !== "admin") {
        data.sort((a, b) => new Date(b.createdAt?.toDate ? b.createdAt.toDate() : 0) - new Date(a.createdAt?.toDate ? a.createdAt.toDate() : 0));
      }
      setComplaints(data);
    });

    return () => unsub();
  }, [user, role]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!reportedUserId || !title || !description) {
      toast.error("Please fill in all fields.");
      return;
    }

    const targetUser = users.find(u => u.id === reportedUserId);
    setSubmitting(true);

    try {
      await addDoc(collection(db, "complaints"), {
        reporterId: user.uid,
        reporterName: user.name || "Anonymous Staff",
        reporterRole: role,
        reportedUserId,
        reportedUserName: targetUser ? targetUser.name : "Unknown",
        reportedUserRole: targetUser ? targetUser.role : "Staff",
        title,
        description,
        status: "Pending",
        adminNotes: "",
        createdAt: serverTimestamp()
      });

      toast.success("Complaint submitted successfully.");
      setTitle("");
      setDescription("");
      setReportedUserId("");
    } catch (err) {
      toast.error("Failed to submit complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  const openAdminModal = (comp) => {
    setSelectedComplaint(comp);
    setStatus(comp.status || "Under Review");
    setAdminNotes(comp.adminNotes || "");
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setUpdating(true);

    try {
      await updateDoc(doc(db, "complaints", selectedComplaint.id), {
        status,
        adminNotes,
        reviewedBy: user.uid,
        reviewedAt: serverTimestamp()
      });

      toast.success("Complaint status updated.");
      setIsModalOpen(false);
    } catch (err) {
      toast.error("Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Complaints & Grievances</h1>
          <p className="text-sm text-gray-500">Submit and track workplace issue reports.</p>
        </div>

        {/* Complaint Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" /> File a Complaint
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Staff / Person</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={reportedUserId}
                    onChange={(e) => setReportedUserId(e.target.value)}
                  >
                    <option value="">-- Choose User --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role ? u.role.toUpperCase() : "STAFF"})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Complaint Subject</label>
                  <Input 
                    placeholder="Brief title of the issue"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Incident Description</label>
                <textarea
                  className="w-full rounded-md border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  placeholder="Provide context, time, date, and details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={submitting} className="gap-2 bg-red-600 hover:bg-red-700">
                  <Send className="w-4 h-4" /> Submit Report
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Complaints Table */}
        <Card>
          <CardHeader>
            <CardTitle>{role === "admin" ? "All Submitted Complaints" : "My Reported Complaints"}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    {role === "admin" && <th className="px-6 py-3">Reporter</th>}
                    <th className="px-6 py-3">Reported Person</th>
                    <th className="px-6 py-3">Subject</th>
                    <th className="px-6 py-3">Status</th>
                    {role === "admin" && <th className="px-6 py-3 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {complaints.length === 0 ? (
                    <tr>
                      <td colSpan={role === "admin" ? 6 : 5} className="px-6 py-10 text-center text-gray-500">
                        No complaints filed yet.
                      </td>
                    </tr>
                  ) : (
                    complaints.map((comp) => (
                      <tr key={comp.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">{comp.createdAt?.toDate ? comp.createdAt.toDate().toLocaleDateString() : "Today"}</td>
                        {role === "admin" && <td className="px-6 py-4 font-bold text-gray-900">{comp.reporterName}</td>}
                        <td className="px-6 py-4 font-medium text-red-600">{comp.reportedUserName}</td>
                        <td className="px-6 py-4 truncate max-w-[200px]" title={toSentenceCase(comp.description)}>
                          <strong>{toSentenceCase(comp.title)}</strong>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            comp.status === "Resolved" ? "bg-green-100 text-green-800" :
                            comp.status === "Rejected" ? "bg-gray-200 text-gray-800" :
                            comp.status === "Under Review" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {comp.status}
                          </span>
                        </td>
                        {role === "admin" && (
                          <td className="px-6 py-4 text-right">
                            <Button variant="secondary" size="sm" onClick={() => openAdminModal(comp)}>
                              Review
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Review Modal */}
      {isModalOpen && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-xl font-bold mb-4">Review Complaint</h2>
            
            <div className="bg-gray-50 p-4 rounded-md mb-4 border text-sm space-y-2">
              <p><strong>Reporter:</strong> {selectedComplaint.reporterName}</p>
              <p><strong>Against:</strong> <span className="text-red-600 font-bold">{selectedComplaint.reportedUserName}</span></p>
              <p><strong>Subject:</strong> {toSentenceCase(selectedComplaint.title)}</p>
              <p className="mt-2 text-gray-700 whitespace-pre-wrap">{toSentenceCase(selectedComplaint.description)}</p>
            </div>

            <form onSubmit={handleUpdateStatus}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Action Notes</label>
                  <textarea
                    className="w-full rounded-md border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                    placeholder="Enter resolution details..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updating}>
                    Save Resolution
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default withAuth(ComplaintsDashboard, ["admin", "doctor", "staff", "receptionist", "accountant"]);
