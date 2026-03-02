import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useRouter } from "next/router";
import Link from "next/link";

export default function AddPatient() {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    disease: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Handle input changes dynamically
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addPatient = async (e) => {
    e.preventDefault(); // Prevents page reload if you wrap this in a <form>

    // Simple validation
    if (!formData.name || !formData.phone) {
      alert("Please fill in the required fields.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "patients"), {
        ...formData,
        age: Number(formData.age), // Ensure age is stored as a number
        createdAt: serverTimestamp(), // Better than new Date() for Firebase sync
      });

      router.push("/patients/listPatients");
    } catch (error) {
      console.error("Error adding patient: ", error);
      alert("Failed to add patient. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px" }}>
      <h1>Add Patient</h1>
      <Link href="/dashboard">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-md">
          Home
        </button>
      </Link>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
        />
        <input
          name="age"
          type="number"
          placeholder="Age"
          value={formData.age}
          onChange={handleChange}
        />
        <input
          name="disease"
          placeholder="Disease"
          value={formData.disease}
          onChange={handleChange}
        />
        <input
          name="phone"
          placeholder="Phone"
          value={formData.phone}
          onChange={handleChange}
        />

        <button onClick={addPatient} disabled={loading}>
          {loading ? "Adding..." : "Add Patient"}
        </button>
      </div>
    </div>
  );
}
