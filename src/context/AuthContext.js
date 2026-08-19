import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/src/services/firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
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
    } catch (error) {
      console.error("Logout Error:", error);
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("hospital_user");
      }
      setUser(null);
      setRole(null);
      router.push("/login");
    }
  };

  useEffect(() => {
    let userDocUnsub = null;

    // Firebase Auth is the single source of truth for logged-in users
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (userDocUnsub) {
        userDocUnsub();
        userDocUnsub = null;
      }

      if (firebaseUser) {
        userDocUnsub = onSnapshot(
          doc(db, "users", firebaseUser.uid),
          async (userDoc) => {
            if (userDoc.exists()) {
              const userData = userDoc.data();
              if (userData.status === "blacklisted" || userData.status === "disabled") {
                await signOut(auth);
                if (typeof window !== "undefined") {
                  localStorage.removeItem("hospital_user");
                }
                setUser(null);
                setRole(null);
                toast.error("Your account has been disabled or blacklisted. Please contact administration.", { duration: 3000 });
                router.push("/login");
              } else {
                const userRole = userData.role;
                setUser({
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  name: userData.name || firebaseUser.email,
                });
                setRole(userRole);
              }
            } else {
              setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
              setRole(null);
            }
            setLoading(false);
          },
          (err) => {
            console.error("Firestore snapshot error:", err);
            setLoading(false);
          }
        );
      } else {
        if (typeof window !== "undefined") {
          localStorage.removeItem("hospital_user");
        }
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
