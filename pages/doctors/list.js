import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, updateDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
import { Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "react-hot-toast";

import { db } from "@/src/services/firebase/config";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { withAuth } from "@/src/components/layout/RouteGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/common/Card";
import { Button } from "@/src/components/common/Button";
import { useAuth } from "@/src/context/AuthContext";

function DoctorList() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reason, setReason] = useState("");
  const [actionType, setActionType] = useState(""); // "blacklist" or "whitelist"
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "doctor"));
    const unsub = onSnapshot(q, (snap) => {
      setDoctors(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Error fetching doctors:", err);
      toast.error("Failed to sync doctors list.");
    });
    return () => unsub();
  }, []);

  const openModal = (targetUser, type) => {
    setSelectedUser(targetUser);
    setActionType(type);
    setReason("");
    setIsModalOpen(true);
  };

  const handleStatusChange = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Please provide a reason.");
      return;
    }
    setUpdating(true);
    const newStatus = actionType === "blacklist" ? "blacklisted" : "active";

    try {
      await updateDoc(doc(db, "users", selectedUser.id), {
        status: newStatus
      });

      await addDoc(collection(db, "statusLogs"), {
        targetUserId: selectedUser.id,
        targetUserName: selectedUser.name || selectedUser.email,
        targetUserRole: selectedUser.role,
        actionBy: user.uid,
        actionByName: user.name || user.email,
        action: newStatus,
        reason,
        createdAt: serverTimestamp()
      });

      toast.success(`Doctor ${newStatus === "active" ? "whitelisted" : "blacklisted"} successfully!`);
      setIsModalOpen(false);
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  const filteredDoctors = doctors.filter(d => d.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Doctors Directory</h1>
          <p className="text-sm text-gray-500">View all registered doctors in the clinic. Manage access via Blacklist.</p>
        </div>

        <Card>
          <CardHeader className="border-b bg-gray-50/50 flex flex-row items-center justify-between py-4">
            <CardTitle>All Doctors</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by name..."
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
                    <th className="px-6 py-3">Doctor Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Access Control</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDoctors.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                        No doctors found.
                      </td>
                    </tr>
                  ) : (
                    filteredDoctors.map((doc) => (
                      <tr key={doc.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                             {doc.name ? doc.name[0] : "D"}
                           </div>
                           {doc.name || "Unnamed Doctor"}
                        </td>
                        <td className="px-6 py-4">{doc.email}</td>
                        <td className="px-6 py-4">
                           <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            doc.status === "blacklisted" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                          }`}>
                            {doc.status || "active"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {doc.status === "blacklisted" ? (
                            <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-800" onClick={() => openModal(doc, "whitelist")}>
                              <ShieldCheck className="w-4 h-4 mr-1" /> Whitelist
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800" onClick={() => openModal(doc, "blacklist")}>
                              <ShieldAlert className="w-4 h-4 mr-1" /> Blacklist
                            </Button>
                          )}
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">
              {actionType === "blacklist" ? "Blacklist Doctor" : "Whitelist Doctor"}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to {actionType} <strong>{selectedUser?.name || selectedUser?.email}</strong>?
            </p>
            <form onSubmit={handleStatusChange}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Action *</label>
                <textarea
                  required
                  className="w-full rounded-md border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="E.g., Suspicious activity, Violation of policy..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={updating} className={actionType === "blacklist" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}>
                  Confirm {actionType}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default withAuth(DoctorList, ["admin"]);