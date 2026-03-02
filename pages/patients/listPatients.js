import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import Link from "next/link";

export default function ListPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Create a query to sort patients by creation date (newest first)
    const q = query(collection(db, "patients"), orderBy("createdAt", "desc"));

    // Set up a real-time listener
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPatients(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching patients: ", error);
        setLoading(false);
      },
    );

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  if (loading) return <p>Loading patients...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>All Patients</h1>
        <Link href="/dashboard">
          <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition">
            Home
          </button>
        </Link>
        <Link href="/patients/addPatients">
          <button style={{ height: "fit-content" }}>+ Add New</button>
        </Link>
      </div>

      {patients.length === 0 ? (
        <p>No patients found.</p>
      ) : (
        <table
          border="1"
          cellPadding="10"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "20px",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f4f4f4", textAlign: "left" }}>
              <th>Name</th>
              <th>Age</th>
              <th>Disease</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.id}>
                <td>{patient.name}</td>
                <td>{patient.age || "N/A"}</td>
                <td>{patient.disease}</td>
                <td>
                  <Link href={`/patients/${patient.id}`}>
                    <span
                      style={{
                        color: "blue",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      View Details
                    </span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
