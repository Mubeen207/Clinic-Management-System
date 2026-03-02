import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "./lib/authContext";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [user]);

  return <p>Loading...</p>;
}
