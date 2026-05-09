import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, updateDoc, doc, getDocs } from "firebase/firestore";
import { AlertTriangle, ShieldCheck, Clock, Search } from "lucide-react";
import { toast } from "react-hot-toast";

import { db } from "@/src/services/firebase/config";
import { useAuth } from "@/src/context/AuthContext";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { withAuth } from "@/src/components/layout/RouteGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/common/Card";
import { Button } from "@/src/components/common/Button";
import { Input } from "@/src/components/common/Input";

function ComplaintsDashboard() {
  const { user, role } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Creation state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reportedUserId, setReportedUserId] = useState("");
  const [loading, setLoading] = useState(false);

  // Admin Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // Fetch users for dropdown
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.id !== user.uid));
    };
    fetchUsers();

    // Fetch complaints
    const q = query(collection(db, "complaints"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // If not admin, only see complaints YOU reported
      if (role !== "admin") {
        data = data.filter(c => c.reporterId === user.uid);
      }
      setComplaints(data);
    });

    return () => unsub();
  }, [user.uid, role]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !reportedUserId) {
      toast.error("Please fill out all fields.");
      return;
    }

    const reportedUser = users.find(u => u.id === reportedUserId);

    setLoading(true);
    try {
      await addDoc(collection(db, "complaints"), {
        reporterId: user.uid,
        reporterName: user.name || user.email,
        reportedUserId: reportedUser.id,
        reportedUserName: reportedUser.name || reportedUser.email,
        title,
        description,
        status: "Pending",
        adminNotes: "",
        createdAt: serverTimestamp()
      });
      setTitle("");
      setDescription("");
      setReportedUserId("");
      toast.success("Complaint filed successfully. Admin will review shortly.");
    } catch (error) {
      toast.error("Failed to file complaint.");
    } finally {
      setLoading(false);
    }
  };

  const openAdminModal = (comp) => {
    setSelectedComplaint(comp);
    setStatusUpdate(comp.status);
    setAdminNotes(comp.adminNotes || "");
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await updateDoc(doc(db, "complaints", selectedComplaint.id), {
        status: statusUpdate,
        adminNotes
      });
      toast.success("Complaint updated successfully.");
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Failed to update complaint.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Complaint Management</h1>
          <p className="text-sm text-gray-500">File internal grievances and track issue resolution.</p>
        </div>

        {/* Complaint Submission Form (For Everyone) */}
        <Card>
          <CardHeader>
            <CardTitle>File a New Complaint</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Complaint Subject" 
                  placeholder="e.g. Unprofessional behavior" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required 
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reported Staff/Doctor *</label>
                  <select
                    required
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={reportedUserId}
                    onChange={(e) => setReportedUserId(e.target.value)}
                  >
                    <option value="">-- Select Person --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name || u.email} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Description *</label>
                <textarea
                  required
                  className="w-full rounded-md border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  placeholder="Provide detailed information regarding the incident..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" isLoading={loading} className="gap-2 bg-red-600 hover:bg-red-700">
                  <AlertTriangle className="w-4 h-4" /> Submit Report
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Complaints List */}
        <Card>
          <CardHeader>
            <CardTitle>{role === "admin" ? "All Submitted Complaints (Admin View)" : "My Filed Complaints"}</CardTitle>
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
                    {role === "admin" && <th className="px-6 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {complaints.length === 0 ? (
                    <tr>
                      <td colSpan={role === "admin" ? 6 : 4} className="px-6 py-10 text-center text-gray-500">
                        No complaints found.
                      </td>
                    </tr>
                  ) : (
                    complaints.map((comp) => (
                      <tr key={comp.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">{comp.createdAt?.toDate().toLocaleDateString() || "Today"}</td>
                        {role === "admin" && <td className="px-6 py-4 font-bold text-gray-900">{comp.reporterName}</td>}
                        <td className="px-6 py-4 font-medium text-red-600">{comp.reportedUserName}</td>
                        <td className="px-6 py-4 truncate max-w-[200px]" title={comp.description}>
                          <strong>{comp.title}</strong>
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
              <p><strong>Subject:</strong> {selectedComplaint.title}</p>
              <p className="mt-2 text-gray-700 whitespace-pre-wrap">{selectedComplaint.description}</p>
            </div>

            <form onSubmit={handleUpdateStatus}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={statusUpdate}
                    onChange={(e) => setStatusUpdate(e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes (Confidential)</label>
                  <textarea
                    className="w-full rounded-md border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Internal notes regarding investigation..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={updating} className="bg-blue-600 hover:bg-blue-700">
                  Update Record
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default withAuth(ComplaintsDashboard, ["admin", "accountant", "doctor", "staff", "receptionist"]);
