import { useEffect, useState, useRef } from "react";
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, getDocs, doc, setDoc, updateDoc, deleteDoc, writeBatch, where, increment } from "firebase/firestore";
import { Send, Search, User, MoreVertical, Edit2, Trash2, Check, CheckCheck, ArrowLeft, Megaphone, MessageSquare } from "lucide-react";
import { toast } from "react-hot-toast";

import { db } from "@/src/services/firebase/config";
import { useAuth } from "@/src/context/AuthContext";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { withAuth } from "@/src/components/layout/RouteGuard";

// Helper function to format role names cleanly (e.g. doctor -> Doctor)
const formatRole = (roleStr) => {
  if (!roleStr) return "";
  return roleStr.charAt(0).toUpperCase() + roleStr.slice(1);
};

function Messages() {
  const { user, role } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeUser, setActiveUser] = useState(null); // null, 'announcements', or user object

  const [messages, setMessages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Message Edit State
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editMsgText, setEditMsgText] = useState("");
  const [activeMenu, setActiveMenu] = useState(null);

  const [chatsData, setChatsData] = useState({});

  // 1. Fetch Staff & Doctors List
  useEffect(() => {
    if (!user) return;
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, "users"));

      const staffList = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => u.id !== user.uid && u.role !== "patient" && u.status !== "blacklisted");
      setUsers(staffList);
    };
    fetchUsers();
  }, [user]);

  const getChatId = (uid1, uid2) => {
    return uid1 > uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
  };

  // 2. Sync Chat Summaries
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "chats"), where("participants", "array-contains", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const cData = {};
      snap.docs.forEach(doc => {
        cData[doc.id] = { id: doc.id, ...doc.data() };
      });
      setChatsData(cData);
    });
    return () => unsub();
  }, [user]);

  // 3. Sync Announcements Channel
  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("timestamp", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAnnouncements(msgs);
      if (activeUser?.isAnnouncement) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }, (err) => console.error("Error loading announcements", err));

    return () => unsub();
  }, [activeUser]);

  // 4. Sync Direct Messages for Active Contact
  useEffect(() => {
    if (!activeUser || activeUser.isAnnouncement || !user) return;

    const chatId = getChatId(user.uid, activeUser.id);
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    // Clear unread count for active chat
    updateDoc(doc(db, "chats", chatId), {
      [`unreadCount.${user.uid}`]: 0
    }).catch(e => console.log("Init chat unread zeroing", e));

    const unsub = onSnapshot(q, async (snap) => {
      const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

      // Handle Read Receipts
      const unreadMsgs = snap.docs.filter(d => {
        const data = d.data();
        return data.senderId === activeUser.id && !data.isRead;
      });

      if (unreadMsgs.length > 0) {
        const batch = writeBatch(db);
        unreadMsgs.forEach(d => {
          batch.update(d.ref, { isRead: true, readAt: serverTimestamp() });
        });
        await batch.commit();
      }
    });

    return () => unsub();
  }, [activeUser, user]);

  // 5. Send Direct Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeUser) return;

    if (activeUser.isAnnouncement) {
      return handleSendAnnouncement();
    }

    const chatId = getChatId(user.uid, activeUser.id);
    const text = newMessage;
    setNewMessage("");

    try {
      await setDoc(doc(db, "chats", chatId), {
        participants: [user.uid, activeUser.id],
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        unreadCount: {
          [user.uid]: 0,
          [activeUser.id]: increment(1)
        }
      }, { merge: true });

      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: user.uid,
        text,
        timestamp: serverTimestamp(),
        isRead: false,
        isEdited: false,
        isDeleted: false
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message.");
    }
  };

  // 6. Send Announcement Broadcast (Admin only)
  const handleSendAnnouncement = async () => {
    if (!newMessage.trim() || role !== "admin") return;
    const text = newMessage;
    setNewMessage("");

    try {
      await addDoc(collection(db, "announcements"), {
        senderId: user.uid,
        senderName: user.name || user.email,
        senderRole: formatRole(user.role || "Admin"),
        text,
        timestamp: serverTimestamp()
      });
      toast.success("Announcement broadcasted successfully!");
    } catch (err) {
      console.error("Error posting announcement:", err);
      toast.error("Failed to post announcement.");
    }
  };

  const handleUpdateMessage = async (e) => {
    e.preventDefault();
    if (!editMsgText.trim() || !editingMsgId || !activeUser || activeUser.isAnnouncement) return;

    const chatId = getChatId(user.uid, activeUser.id);
    try {
      await updateDoc(doc(db, "chats", chatId, "messages", editingMsgId), {
        text: editMsgText,
        isEdited: true,
        editedAt: serverTimestamp()
      });
      setEditingMsgId(null);
      setEditMsgText("");
    } catch (error) {
      toast.error("Failed to edit message");
    }
  };

  const handleDeleteMessage = async (msgId, softDelete = true) => {
    if (!activeUser || activeUser.isAnnouncement) return;
    const chatId = getChatId(user.uid, activeUser.id);
    setActiveMenu(null);
    try {
      if (softDelete) {
        await updateDoc(doc(db, "chats", chatId, "messages", msgId), {
          text: "🚫 This message was deleted",
          isDeleted: true
        });
      } else {
        await deleteDoc(doc(db, "chats", chatId, "messages", msgId));
      }
    } catch (error) {
      toast.error("Failed to delete message");
    }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const announcementChannelObj = {
    id: "announcements",
    name: "Announcements",
    description: "Official Clinic News And Updates.",
    isAnnouncement: true
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex overflow-hidden border rounded-xl bg-white shadow-sm relative">

        {/* Sidebar Contacts & Channels list */}
        <div className={`border-r flex-col bg-gray-50 w-full md:w-1/3 ${activeUser ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b bg-white">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Messages & Announcements</h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search Messages & Contacts..."
                className="pl-9 flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Pinned Announcements Channel */}
            <div
              onClick={() => {
                setActiveUser(announcementChannelObj);
                setEditingMsgId(null);
                setActiveMenu(null);
              }}
              className={`flex items-center gap-3 p-4 cursor-pointer border-b transition-colors ${
                activeUser?.isAnnouncement ? 'bg-purple-50 border-l-4 border-l-purple-600' : 'hover:bg-purple-50/50 border-l-4 border-l-transparent'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                <Megaphone className="w-6 h-6" />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-baseline mb-0.5">
                  <p className="font-bold text-gray-900 truncate">Announcements</p>
                  <span className="text-[10px] font-semibold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                    Channel
                  </span>
                </div>
                <p className="text-xs text-purple-600 font-medium truncate">
                  Official Clinic News And Updates.
                </p>
              </div>
            </div>

            {/* Direct Contacts List */}
            {filteredUsers.length === 0 ? (
              <p className="p-4 text-center text-sm text-gray-500">No contacts found.</p>
            ) : (
              filteredUsers
                .map(u => {
                  const cId = getChatId(user.uid, u.id);
                  const chatInfo = chatsData[cId];
                  return { ...u, chatInfo, lastTime: chatInfo?.lastMessageTime?.toMillis() || 0 };
                })
                .sort((a, b) => b.lastTime - a.lastTime)
                .map(u => {
                  const unread = u.chatInfo?.unreadCount?.[user.uid] || 0;
                  const formattedName = u.name || "Unnamed User";
                  const formattedRole = formatRole(u.role || "Staff");

                  return (
                    <div
                      key={u.id}
                      onClick={() => {
                        setActiveUser(u);
                        setEditingMsgId(null);
                        setActiveMenu(null);
                        if (u.chatInfo) {
                          updateDoc(doc(db, "chats", u.chatInfo.id), {
                            [`unreadCount.${user.uid}`]: 0
                          }).catch(() => { });
                        }
                      }}
                      className={`flex items-center gap-3 p-4 cursor-pointer border-b transition-colors ${
                        activeUser?.id === u.id && !activeUser?.isAnnouncement ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-gray-100 border-l-4 border-l-transparent'
                      }`}
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                          {u.name ? formattedName[0] : <User className="w-6 h-6" />}
                        </div>
                        {unread > 0 && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                            {unread > 99 ? '99+' : unread}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <p className={`font-semibold truncate ${unread > 0 ? 'text-black' : 'text-gray-900'}`}>{formattedName}</p>
                          {u.chatInfo?.lastMessageTime && (
                            <span className={`text-[10px] ${unread > 0 ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                              {new Date(u.chatInfo.lastMessageTime.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs truncate ${unread > 0 ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
                          {u.chatInfo?.lastMessage || formattedRole}
                        </p>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Chat / Channel Pane */}
        <div className={`flex-col bg-white relative w-full md:w-2/3 ${!activeUser ? 'hidden md:flex' : 'flex'}`}>
          {activeUser ? (
            <>
              {/* Header */}
              <div className="p-4 border-b flex items-center gap-3 bg-white shadow-sm z-10">
                <button
                  onClick={() => setActiveUser(null)}
                  className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                {activeUser.isAnnouncement ? (
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                    <Megaphone className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                    {activeUser.name ? activeUser.name[0] : <User className="w-5 h-5" />}
                  </div>
                )}
                <div>
                  <h2 className="font-bold text-gray-900">{activeUser.name}</h2>
                  <p className="text-xs text-gray-500 font-medium">
                    {activeUser.isAnnouncement ? "Official Clinic News And Updates." : formatRole(activeUser.role || "Available")}
                  </p>
                </div>
              </div>

              {/* Messages / Announcements Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50" onClick={() => setActiveMenu(null)}>
                {activeUser.isAnnouncement ? (
                  announcements.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <Megaphone className="w-12 h-12 mb-2 text-purple-300" />
                      <p className="font-medium text-gray-500">No announcements posted yet.</p>
                    </div>
                  ) : (
                    announcements.map(ann => (
                      <div key={ann.id} className="bg-white border border-purple-100 rounded-xl p-4 shadow-sm space-y-2">
                        <div className="flex items-center justify-between border-b pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-sm">{ann.senderName || "Admin"}</span>
                            <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {formatRole(ann.senderRole || "Admin")}
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-400">
                            {ann.timestamp?.toDate ? ann.timestamp.toDate().toLocaleString() : "Just now"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {ann.text}
                        </p>
                      </div>
                    ))
                  )
                ) : (
                  messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <MessageSquare className="w-12 h-12 mb-2 text-gray-300" />
                      <p>Start a secure conversation with {activeUser.name}</p>
                    </div>
                  ) : (
                    messages.map(msg => {
                      const isMine = msg.senderId === user.uid;
                      const isEditingThis = editingMsgId === msg.id;

                      return (
                        <div key={msg.id} className={`flex group ${isMine ? 'justify-end' : 'justify-start'}`}>

                          {/* Action Menu (Sender only) */}
                          {isMine && !msg.isDeleted && !isEditingThis && (
                            <div className="relative opacity-0 group-hover:opacity-100 transition-opacity flex items-center pr-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenu(activeMenu === msg.id ? null : msg.id);
                                }}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {activeMenu === msg.id && (
                                <div className="absolute right-8 top-0 bg-white border shadow-lg rounded-md overflow-hidden z-20 w-40 flex flex-col">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setEditingMsgId(msg.id); setEditMsgText(msg.text); setActiveMenu(null); }}
                                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-gray-700"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" /> Edit Message
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id, true); }}
                                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 text-red-600"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete (Soft)
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id, false); }}
                                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 text-red-600 border-t"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete for everyone
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Message Bubble */}
                          <div className={`max-w-[70%] rounded-2xl px-4 py-2 relative ${
                            isMine ? 'bg-blue-600 text-white rounded-br-none shadow-sm' : 'bg-white border text-gray-900 rounded-bl-none shadow-sm'
                          } ${msg.isDeleted ? 'italic text-opacity-70 bg-gray-100 border border-gray-300 text-gray-500' : ''}`}>

                            {isEditingThis ? (
                              <form onSubmit={handleUpdateMessage} className="flex gap-2">
                                <input
                                  autoFocus
                                  className="text-sm bg-blue-700 text-white placeholder-blue-300 border-b border-blue-400 focus:outline-none focus:border-white px-1"
                                  value={editMsgText}
                                  onChange={(e) => setEditMsgText(e.target.value)}
                                />
                                <button type="submit" className="text-white hover:text-blue-200">
                                  <Send className="w-3 h-3" />
                                </button>
                              </form>
                            ) : (
                              <p className="text-sm break-words whitespace-pre-wrap">{msg.text}</p>
                            )}

                            {/* Metadata */}
                            <div className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${isMine ? (msg.isDeleted ? 'text-gray-400' : 'text-blue-200') : 'text-gray-400'}`}>
                              {msg.isEdited && !msg.isDeleted && <span className="italic mr-1">(edited)</span>}
                              <span>{msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}</span>

                              {isMine && !msg.isDeleted && (
                                <span className="ml-1">
                                  {msg.isRead ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3 h-3 opacity-70" />}
                                </span>
                              )}
                            </div>
                          </div>

                        </div>
                      )
                    })
                  )
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t">
                {activeUser.isAnnouncement ? (
                  role === "admin" ? (
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Broadcast a clinic announcement..."
                        className="flex-1 h-10 rounded-full border border-purple-300 bg-purple-50/50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="h-10 px-5 rounded-full bg-purple-600 flex items-center gap-1.5 text-white font-medium text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <Megaphone className="w-4 h-4" /> Broadcast
                      </button>
                    </form>
                  ) : (
                    <div className="p-3 text-center text-xs text-gray-500 bg-gray-50 rounded-lg border">
                      📢 Read-only channel. Only Admins can post clinic announcements.
                    </div>
                  )
                ) : (
                  <>
                    {editingMsgId ? (
                      <div className="flex items-center justify-between text-sm text-gray-500 px-2 py-1 mb-2 bg-yellow-50 rounded border border-yellow-100">
                        <span>Editing message...</span>
                        <button onClick={() => setEditingMsgId(null)} className="hover:text-gray-800 underline">Cancel</button>
                      </div>
                    ) : null}

                    <form onSubmit={editingMsgId ? handleUpdateMessage : handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type your message..."
                        className="flex-1 h-10 rounded-full border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={editingMsgId ? editMsgText : newMessage}
                        onChange={(e) => editingMsgId ? setEditMsgText(e.target.value) : setNewMessage(e.target.value)}
                      />
                      <button
                        type="submit"
                        disabled={editingMsgId ? !editMsgText.trim() : !newMessage.trim()}
                        className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <Send className="w-4 h-4 ml-0.5" />
                      </button>
                    </form>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
              <User className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-500">Select a contact or channel to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(Messages, ["admin", "doctor", "staff", "receptionist", "accountant"]);
