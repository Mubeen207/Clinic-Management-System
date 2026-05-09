import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { Megaphone, AlertCircle, Info, Heart, ThumbsUp, Send } from "lucide-react";
import { toast } from "react-hot-toast";

import { db } from "@/src/services/firebase/config";
import { useAuth } from "@/src/context/AuthContext";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { withAuth } from "@/src/components/layout/RouteGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/common/Card";
import { Button } from "@/src/components/common/Button";
import { Input } from "@/src/components/common/Input";

function Announcements() {
  const { user, role } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  
  // For Admin Creation
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill out both title and content.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "announcements"), {
        title,
        content,
        priority,
        createdBy: user.uid,
        createdByName: user.name || user.email,
        createdAt: serverTimestamp(),
        reactions: {
          like: [],
          heart: []
        }
      });
      setTitle("");
      setContent("");
      setPriority("Normal");
      toast.success("Announcement published to all users!");
    } catch (error) {
      toast.error("Failed to publish announcement.");
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (announcementId, currentReactions, type) => {
    const updatedReactions = { ...currentReactions };
    const userList = updatedReactions[type] || [];
    
    if (userList.includes(user.uid)) {
      // remove reaction
      updatedReactions[type] = userList.filter(uid => uid !== user.uid);
    } else {
      // add reaction
      updatedReactions[type] = [...userList, user.uid];
    }

    try {
      await updateDoc(doc(db, "announcements", announcementId), {
        reactions: updatedReactions
      });
    } catch (error) {
      toast.error("Failed to update reaction.");
    }
  };

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
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle>Broadcast Message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
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
                      <option value="Normal">Normal</option>
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
                <div className="flex justify-end">
                  <Button type="submit" isLoading={loading} className="gap-2">
                    <Send className="w-4 h-4" /> Publish
                  </Button>
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
              <Card key={ann.id} className={`overflow-hidden ${ann.priority === 'Emergency' ? 'ring-2 ring-red-500' : ''}`}>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        ann.priority === 'Emergency' ? 'bg-red-100' :
                        ann.priority === 'Important' ? 'bg-yellow-100' : 'bg-blue-100'
                      }`}>
                        {getPriorityIcon(ann.priority)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{ann.title}</h3>
                        <p className="text-xs text-gray-500">
                          Posted by <span className="font-semibold text-gray-700">{ann.createdByName}</span> • {ann.createdAt?.toDate().toLocaleString() || 'Just now'}
                        </p>
                      </div>
                    </div>
                    {ann.priority !== "Normal" && (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        ann.priority === 'Emergency' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {ann.priority.toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-gray-700 whitespace-pre-wrap pl-[52px]">
                    {ann.content}
                  </div>

                  <div className="mt-6 pl-[52px] flex gap-3 border-t pt-4">
                    <button 
                      onClick={() => handleReaction(ann.id, ann.reactions || {}, "like")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        (ann.reactions?.like || []).includes(user.uid) 
                        ? "bg-blue-100 text-blue-700" 
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" /> {(ann.reactions?.like || []).length}
                    </button>
                    
                    <button 
                      onClick={() => handleReaction(ann.id, ann.reactions || {}, "heart")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        (ann.reactions?.heart || []).includes(user.uid) 
                        ? "bg-red-100 text-red-700" 
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <Heart className="w-4 h-4" /> {(ann.reactions?.heart || []).length}
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(Announcements, ["admin", "doctor", "staff", "receptionist", "accountant"]);
