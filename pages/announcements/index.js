import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { Megaphone, AlertCircle, Info, Heart, ThumbsUp, Send, MoreVertical, Pin, Edit, Trash2, Users } from "lucide-react";
import { toast } from "react-hot-toast";

import { db } from "@/src/services/firebase/config";
import { useAuth } from "@/src/context/AuthContext";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { withAuth } from "@/src/components/layout/RouteGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/common/Card";
import { Button } from "@/src/components/common/Button";
import { Input } from "@/src/components/common/Input";
import { toSentenceCase } from "@/src/utils/formatSentenceCase";

function Announcements() {
  const { user, role } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  
  // For Admin Creation / Editing
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // For Admin Reaction Viewer
  const [viewingReactions, setViewingReactions] = useState(null);

  useEffect(() => {
    // Only order by createdAt to avoid Firestore Composite Index errors
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort pinned announcements to the top client-side
      data.sort((a, b) => {
        if (a.isPinned === b.isPinned) return 0;
        return a.isPinned ? -1 : 1;
      });
      setAnnouncements(data);
    }, (error) => {
      console.error("Error fetching announcements:", error);
      toast.error("Failed to load announcements.");
    });
    return () => unsub();
  }, []);

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill out both title and content.");
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "announcements", editingId), {
          title,
          content,
          priority,
          isPinned
        });
        toast.success("Announcement updated!");
      } else {
        await addDoc(collection(db, "announcements"), {
          title,
          content,
          priority,
          isPinned,
          createdBy: user.uid,
          createdByName: user.name || user.email,
          createdAt: serverTimestamp(),
          detailedReactions: {} // Maps uid -> { type, name, role, timestamp }
        });
        toast.success("Announcement published!");
      }
      resetForm();
    } catch (error) {
      toast.error("Failed to save announcement.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setPriority("Normal");
    setIsPinned(false);
    setEditingId(null);
  };

  const handleEditInit = (ann) => {
    setTitle(ann.title);
    setContent(ann.content);
    setPriority(ann.priority || "Normal");
    setIsPinned(ann.isPinned || false);
    setEditingId(ann.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await deleteDoc(doc(db, "announcements", id));
      toast.success("Announcement deleted.");
    } catch (error) {
      toast.error("Failed to delete.");
    }
  };

  const handlePinToggle = async (id, currentPinState) => {
    try {
      await updateDoc(doc(db, "announcements", id), { isPinned: !currentPinState });
      toast.success(currentPinState ? "Announcement unpinned" : "Announcement pinned");
    } catch (error) {
      toast.error("Failed to pin/unpin.");
    }
  };

  const handleReaction = async (announcementId, detailedReactions, type) => {
    const updatedReactions = { ...detailedReactions };
    
    // Check if user already reacted with THIS type
    const existingReaction = updatedReactions[user.uid];

    if (existingReaction && existingReaction.type === type) {
      // Toggle off if they clicked the exact same reaction
      delete updatedReactions[user.uid];
    } else {
      // Overwrite/Add new reaction
      updatedReactions[user.uid] = {
        type,
        name: user.name || user.email,
        role: role,
        timestamp: new Date().toISOString() // using JS date for immediate serialization without waiting for serverTimestamp
      };
    }

    try {
      await updateDoc(doc(db, "announcements", announcementId), {
        detailedReactions: updatedReactions
      });
    } catch (error) {
      toast.error("Failed to update reaction.");
    }
  };

  const reactionEmojis = [
    { type: "like", icon: "👍" },
    { type: "heart", icon: "❤️" },
    { type: "fire", icon: "🔥" },
    { type: "eyes", icon: "👀" },
    { type: "check", icon: "✅" },
    { type: "warning", icon: "⚠️" }
  ];

  const getPriorityIcon = (prio) => {
    if (prio === "Emergency") return <AlertCircle className="w-5 h-5 text-red-600" />;
    if (prio === "Important") return <Info className="w-5 h-5 text-yellow-600" />;
    return <Megaphone className="w-5 h-5 text-blue-600" />;
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Global Announcements</h1>
          <p className="text-sm text-gray-500">Official clinic news and updates.</p>
        </div>

        {role === "admin" && (
          <Card className={`border-l-4 ${editingId ? 'border-l-yellow-500' : 'border-l-blue-500'}`}>
            <CardHeader>
              <CardTitle>{editingId ? "Edit Announcement" : "Broadcast Message"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateOrUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Input 
                      placeholder="Announcement Title" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      required 
                    />
                  </div>
                  <div>
                    <select
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      <option value="Normal">Normal Priority</option>
                      <option value="Important">Important</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </div>
                </div>
                <textarea
                  required
                  className="w-full rounded-md border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  placeholder="Write your message here. All staff and doctors will see this..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <Pin className="w-4 h-4 text-gray-500" /> Pin this announcement to the top
                  </label>

                  <div className="flex gap-2">
                    {editingId && (
                      <Button type="button" variant="secondary" onClick={resetForm}>
                        Cancel Edit
                      </Button>
                    )}
                    <Button type="submit" isLoading={loading} className="gap-2">
                      <Send className="w-4 h-4" /> {editingId ? "Update" : "Publish"}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
              No announcements available at this time.
            </div>
          ) : (
            announcements.map((ann) => (
              <Card key={ann.id} className={`overflow-hidden relative ${ann.priority === 'Emergency' ? 'ring-2 ring-red-500' : ''}`}>
                <div className="p-6">
                  {/* Pin Badge */}
                  {ann.isPinned && (
                    <div className="absolute top-0 right-0 bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                      <Pin className="w-3 h-3" /> Pinned
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        ann.priority === 'Emergency' ? 'bg-red-100' :
                        ann.priority === 'Important' ? 'bg-yellow-100' : 'bg-blue-100'
                      }`}>
                        {getPriorityIcon(ann.priority)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                          {toSentenceCase(ann.title)}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Posted by <span className="font-semibold text-gray-700">{ann.createdByName}</span> • {ann.createdAt?.toDate().toLocaleString() || 'Just now'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 mt-1">
                      {ann.priority !== "Normal" && (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          ann.priority === 'Emergency' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {ann.priority.toUpperCase()}
                        </span>
                      )}

                      {/* Admin Controls */}
                      {role === "admin" && (
                        <div className="flex items-center gap-1 mt-2">
                          <button onClick={() => handlePinToggle(ann.id, ann.isPinned)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Toggle Pin">
                            <Pin className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEditInit(ann)} className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(ann.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-gray-700 whitespace-pre-wrap pl-[52px]">
                    {toSentenceCase(ann.content)}
                  </div>

                  <div className="mt-6 pl-[52px] flex flex-wrap items-center gap-2 border-t pt-4">
                    {reactionEmojis.map((reaction) => {
                      // Calculate counts from the detailedReactions map
                      const reactionsObj = ann.detailedReactions || {};
                      const count = Object.values(reactionsObj).filter(r => r.type === reaction.type).length;
                      const hasReacted = reactionsObj[user.uid]?.type === reaction.type;
                      
                      return (
                        <button 
                          key={reaction.type}
                          onClick={() => handleReaction(ann.id, ann.detailedReactions || {}, reaction.type)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            hasReacted
                            ? "bg-blue-100 text-blue-700 ring-1 ring-blue-300" 
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          <span className="text-base leading-none">{reaction.icon}</span> 
                          <span>{count > 0 ? count : ""}</span>
                        </button>
                      );
                    })}

                    {role === "admin" && Object.keys(ann.detailedReactions || {}).length > 0 && (
                      <button 
                        onClick={() => setViewingReactions(ann)}
                        className="ml-auto flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1"
                      >
                        <Users className="w-3.5 h-3.5" /> View Details
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Admin Reaction Viewer Modal */}
      {viewingReactions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl max-h-[80vh] flex flex-col">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" /> Reaction Details
            </h2>
            <div className="overflow-y-auto flex-1 border rounded-md">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b sticky top-0">
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-600">User</th>
                    <th className="px-4 py-2 font-medium text-gray-600">Reaction</th>
                    <th className="px-4 py-2 font-medium text-gray-600 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {Object.entries(viewingReactions.detailedReactions || {}).map(([uid, data]) => {
                    const rIcon = reactionEmojis.find(e => e.type === data.type)?.icon || "?";
                    return (
                      <tr key={uid} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{data.name}</p>
                          <p className="text-xs text-gray-500 uppercase">{data.role}</p>
                        </td>
                        <td className="px-4 py-3 text-lg">{rIcon}</td>
                        <td className="px-4 py-3 text-right text-xs text-gray-500">
                          {new Date(data.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-6 flex justify-end">
              <Button variant="secondary" onClick={() => setViewingReactions(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default withAuth(Announcements, ["admin", "doctor", "staff", "receptionist", "accountant"]);
