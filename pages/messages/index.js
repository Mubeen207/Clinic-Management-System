import { useEffect, useState, useRef } from "react";
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, getDocs, doc, setDoc } from "firebase/firestore";
import { Send, Search, User } from "lucide-react";

import { db } from "@/src/services/firebase/config";
import { useAuth } from "@/src/context/AuthContext";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { withAuth } from "@/src/components/layout/RouteGuard";
import { Card } from "@/src/components/common/Card";

function Messages() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeUser, setActiveUser] = useState(null);
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Fetch all allowed users
  useEffect(() => {
    if (!user) return;
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, "users"));
      // Only authorized staff, no patients
      const staffList = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => u.id !== user.uid && u.role !== "patient" && u.status !== "blacklisted");
      setUsers(staffList);
    };
    fetchUsers();
  }, [user]);

  // Generate deterministic Chat ID
  const getChatId = (uid1, uid2) => {
    return uid1 > uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
  };

  // Listen to messages for active chat
  useEffect(() => {
    if (!activeUser || !user) return;

    const chatId = getChatId(user.uid, activeUser.id);
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => unsub();
  }, [activeUser, user]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeUser) return;

    const chatId = getChatId(user.uid, activeUser.id);
    const text = newMessage;
    setNewMessage(""); // Optimistic clear

    try {
      // Ensure chat document exists (optional, useful for recent lists)
      await setDoc(doc(db, "chats", chatId), {
        participants: [user.uid, activeUser.id],
        lastMessage: text,
        lastMessageTime: serverTimestamp()
      }, { merge: true });

      // Add message
      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: user.uid,
        text,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex overflow-hidden border rounded-xl bg-white shadow-sm">
        
        {/* Sidebar Contacts list */}
        <div className="w-1/3 border-r flex flex-col bg-gray-50">
          <div className="p-4 border-b bg-white">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Conversations</h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search staff or doctors..."
                className="pl-9 flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <p className="p-4 text-center text-sm text-gray-500">No users found.</p>
            ) : (
              filteredUsers.map(u => (
                <div 
                  key={u.id}
                  onClick={() => setActiveUser(u)}
                  className={`flex items-center gap-3 p-4 cursor-pointer border-b transition-colors ${
                    activeUser?.id === u.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-gray-100 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                    {u.name ? u.name[0] : <User className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold text-gray-900 truncate">{u.name}</p>
                    <p className="text-xs text-gray-500 uppercase">{u.role}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Pane */}
        <div className="w-2/3 flex flex-col bg-white">
          {activeUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center gap-3 bg-white shadow-sm z-10">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                  {activeUser.name ? activeUser.name[0] : <User className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{activeUser.name}</h2>
                  <p className="text-xs text-green-600 font-medium">Available</p>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <MessageSquare className="w-12 h-12 mb-2 text-gray-300" />
                    <p>Start a new conversation with {activeUser.name}</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMine = msg.senderId === user.uid;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          isMine ? 'bg-blue-600 text-white rounded-br-none shadow-sm' : 'bg-white border text-gray-900 rounded-bl-none shadow-sm'
                        }`}>
                          <p className="text-sm">{msg.text}</p>
                          <p className={`text-[10px] mt-1 text-right ${isMine ? 'text-blue-100' : 'text-gray-400'}`}>
                            {msg.timestamp?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) || 'Sending...'}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1 h-10 rounded-full border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
              <User className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-500">Select a contact to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(Messages, ["admin", "doctor", "staff", "receptionist", "accountant"]);

// Need to define MessageSquare since I used it in empty state placeholder
import { MessageSquare } from "lucide-react";
