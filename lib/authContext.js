import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/router";
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setRole(null);
      router.push("/login");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const storedUser =
      typeof window !== "undefined"
        ? localStorage.getItem("hospital_user")
        : null;

    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed.user);
        setRole(parsed.role);
      } catch (e) {
        console.error("Storage error", e);
      }
    }

    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const snap = await getDoc(docRef);

          if (snap.exists()) {
            const userRole = snap.data().role;
            const userDataToStore = {
              user: { uid: currentUser.uid, email: currentUser.email },
              role: userRole,
            };

            localStorage.setItem(
              "hospital_user",
              JSON.stringify(userDataToStore),
            );
            setUser(currentUser);
            setRole(userRole);
          } else {
            setUser(currentUser);
            setRole(null);
          }
        } catch (err) {
          console.error("Firestore error:", err);
        }
      } else {
        localStorage.removeItem("hospital_user");
        setUser(null);
        setRole(null);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600 font-medium">
          Setting up your dashboard...
        </p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
