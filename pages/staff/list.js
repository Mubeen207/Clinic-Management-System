import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, updateDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
import { Search, ShieldAlert, ShieldCheck, Key } from "lucide-react";
import { toast } from "react-hot-toast";

import { auth, db } from "@/src/services/firebase/config";
import { sendPasswordResetEmail } from "firebase/auth";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { withAuth } from "@/src/components/layout/RouteGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/common/Card";
import { Button } from "@/src/components/common/Button";
import { Input } from "@/src/components/common/Input";
import { useAuth } from "@/src/context/AuthContext";

function StaffList() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reason, setReason] = useState("");
  const [actionType, setActionType] = useState(""); // "blacklist", "whitelist", "changePassword"
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "in", ["staff", "receptionist", "accountant"]));
    const unsub = onSnapshot(q, (snap) => {
      setStaff(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Error fetching staff:", err);
      toast.error("Failed to sync staff list.");
    });
    return () => unsub();
  }, []);

  const openModal = (targetUser, type) => {
    setSelectedUser(targetUser);
    setActionType(type);
    setReason("");
    setIsModalOpen(true);
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser?.email) {
      toast.error("User email is missing.");
      return;
    }
    setUpdating(true);
    try {
      await sendPasswordResetEmail(auth, selectedUser.email);

      await addDoc(collection(db, "statusLogs"), {
        targetUserId: selectedUser.id,
        targetUserName: selectedUser.name || selectedUser.email,
        targetUserRole: selectedUser.role,
        actionBy: user.uid,
        actionByName: user.name || user.email,
        action: "password_reset_sent",
        reason: "Admin initiated password reset email from Admin panel",
        createdAt: serverTimestamp()
      });

      toast.success(`Password reset email sent to ${selectedUser.email}!`);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Password Reset Error:", error);
      toast.error("Failed to send password reset email.");
    } finally {
      setUpdating(false);
    }
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

      toast.success(`User ${newStatus === "active" ? "whitelisted" : "blacklisted"} successfully!`);
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  const filteredStaff = staff.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Staff Directory</h1>
          <p className="text-sm text-gray-500">View all clinic staff and receptionists. Manage access & passwords.</p>
        </div>

        <Card>
          <CardHeader className="border-b bg-gray-50/50 flex flex-row items-center justify-between py-4">
            <CardTitle>All Staff</CardTitle>
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
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                        No staff found.
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((person) => (
                      <tr key={person.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">
                           {person.name || "Unnamed Staff"}
                        </td>
                        <td className="px-6 py-4 uppercase font-semibold text-xs text-blue-600">{person.role}</td>
                        <td className="px-6 py-4">{person.email}</td>
                        <td className="px-6 py-4">
                           <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            person.status === "blacklisted" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                          }`}>
                            {person.status || "active"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => openModal(person, "changePassword")}
                          >
                            <Key className="w-4 h-4 mr-1" /> Change Password
                          </Button>

                          {person.status === "blacklisted" ? (
                            <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-800" onClick={() => openModal(person, "whitelist")}>
                              <ShieldCheck className="w-4 h-4 mr-1" /> Whitelist
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800" onClick={() => openModal(person, "blacklist")}>
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
            {actionType === "changePassword" ? (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Reset User Password</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Send a secure password reset email to <strong>{selectedUser?.name || "Staff"}</strong> (<code>{selectedUser?.email}</code>).
                </p>

                <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={updating} className="bg-blue-600 hover:bg-blue-700">
                      Send Reset Email
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4">
                  {actionType === "blacklist" ? "Blacklist User" : "Whitelist User"}
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
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default withAuth(StaffList, ["admin"]);
