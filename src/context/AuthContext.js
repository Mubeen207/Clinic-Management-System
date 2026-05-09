import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/src/services/firebase/config";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("hospital_user");
      setUser(null);
      setRole(null);
      router.push("/login");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  useEffect(() => {
    // Initial sync from local storage for faster UI paints
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("hospital_user") : null;
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        // eslint-disable-next-line
        setUser(parsed.user);
        // eslint-disable-next-line
        setRole(parsed.role);
      } catch (e) {
        console.error("Storage error", e);
      }
    }

    let userDocUnsub = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        userDocUnsub = onSnapshot(doc(db, "users", firebaseUser.uid), async (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.status === "blacklisted") {
              await signOut(auth);
              localStorage.removeItem("hospital_user");
              setUser(null);
              setRole(null);
              toast.error("Your account has been blacklisted. Please contact administration.");
              router.push("/login");
            } else {
              const userRole = userData.role;
              const userDataToStore = {
                user: { uid: firebaseUser.uid, email: firebaseUser.email, name: userData.name || firebaseUser.email },
                role: userRole,
              };

              localStorage.setItem("hospital_user", JSON.stringify(userDataToStore));
              setUser(userDataToStore.user);
              setRole(userRole);
            }
          } else {
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
            setRole(null);
          }
          setLoading(false);
        }, (err) => {
          console.error("Firestore snapshot error:", err);
          setLoading(false);
        });
      } else {
        if (userDocUnsub) userDocUnsub();
        localStorage.removeItem("hospital_user");
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (userDocUnsub) userDocUnsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
