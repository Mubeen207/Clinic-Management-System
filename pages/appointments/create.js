import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { useRouter } from "next/router";
import Link from "next/link";

export default function CreateAppointment() {
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({
    patientId: "",
    date: "",
    time: "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fetch patients to populate a dropdown
  useEffect(() => {
    const fetchPatients = async () => {
      const snap = await getDocs(collection(db, "patients"));
      setPatients(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchPatients();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedPatient = patients.find((p) => p.id === formData.patientId);
      await addDoc(collection(db, "appointments"), {
        ...formData,
        patientName: selectedPatient?.name || "Unknown",
        status: "Pending",
        createdAt: serverTimestamp(),
      });
      router.push("/appointments/list");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto bg-white shadow-lg rounded-xl">
      <h1 className="text-2xl font-bold mb-4">Book Appointment</h1>
       <Link href="/dashboard">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-md">
            Home
          </button>
        </Link>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <select
          required
          className="border p-2 rounded"
          onChange={(e) =>
            setFormData({ ...formData, patientId: e.target.value })
          }
        >
          <option value="">Select Patient</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          required
          className="border p-2 rounded"
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        />
        <input
          type="time"
          required
          className="border p-2 rounded"
          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
        />
        <textarea
          placeholder="Reason for visit"
          className="border p-2 rounded"
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
        />
        <button
          disabled={loading}
          className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          {loading ? "Booking..." : "Confirm Appointment"}
        </button>
      </form>
    </div>
  );
}
