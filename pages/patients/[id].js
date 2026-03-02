import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { doc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function PatientDetails() {
  const router = useRouter();
  const { id } = router.query;

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;

    const getPatient = async () => {
      try {
        const docRef = doc(db, "patients", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setPatient({ id: docSnap.id, ...docSnap.data() });
        } else {
          alert("No such patient found!");
          router.push("/patients/listPatients");
        }
      } catch (error) {
        console.error("Error fetching patient:", error);
      } finally {
        setLoading(false);
      }
    };

    getPatient();
  }, [id, router]);

  const deletePatient = async () => {
    if (!confirm("Are you sure you want to delete this patient record? This cannot be undone.")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "patients", id));
      router.push("/patients/listPatients");
    } catch (error) {
      alert("Error deleting record.");
    }
  };

  const updatePatient = async () => {
    setUpdating(true);
    try {
      const docRef = doc(db, "patients", id);
      // We exclude the 'id' from the update payload
      const { id: _, ...dataToUpdate } = patient; 
      
      await updateDoc(docRef, dataToUpdate);
      alert("Updated Successfully");
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <p>Loading patient data...</p>;
  if (!patient) return <p>Patient not found.</p>;

  return (
    <div style={{ padding: "20px", maxWidth: "500px" }}>
      <h1>Edit Patient Details</h1>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <label>
          <strong>Name:</strong>
          <input 
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            value={patient.name} 
            onChange={(e) => setPatient({ ...patient, name: e.target.value })} 
          />
        </label>

        <label>
          <strong>Age:</strong>
          <input 
            type="number"
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            value={patient.age} 
            onChange={(e) => setPatient({ ...patient, age: e.target.value })} 
          />
        </label>

        <label>
          <strong>Disease:</strong>
          <input 
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            value={patient.disease} 
            onChange={(e) => setPatient({ ...patient, disease: e.target.value })} 
          />
        </label>

        <label>
          <strong>Phone:</strong>
          <input 
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            value={patient.phone} 
            onChange={(e) => setPatient({ ...patient, phone: e.target.value })} 
          />
        </label>

        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button 
            onClick={updatePatient} 
            disabled={updating}
            style={{ backgroundColor: "#4CAF50", color: "white", padding: "10px 20px", border: "none", cursor: "pointer" }}
          >
            {updating ? "Saving..." : "Update Record"}
          </button>

          <button 
            onClick={deletePatient}
            style={{ backgroundColor: "#f44336", color: "white", padding: "10px 20px", border: "none", cursor: "pointer" }}
          >
            Delete Patient
          </button>
        </div>
        
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "gray", cursor: "pointer", textDecoration: "underline" }}>
          Go Back
        </button>
      </div>
    </div>
  );
}