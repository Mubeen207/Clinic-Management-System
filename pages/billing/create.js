import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

import { db } from "@/src/services/firebase/config";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { withAuth } from "@/src/components/layout/RouteGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/common/Card";
import { Input } from "@/src/components/common/Input";
import { Button } from "@/src/components/common/Button";

function CreateInvoice() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  
  const [formData, setFormData] = useState({
    patientId: "",
    patientName: "",
    date: new Date().toISOString().split('T')[0],
    status: "Pending",
    notes: "",
  });

  const [items, setItems] = useState([
    { description: "Consultation Fee", quantity: 1, price: 50 },
  ]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const pSnap = await getDocs(collection(db, "patients"));
        setPatients(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        toast.error("Failed to load patients.");
      }
    };
    fetchPatients();
  }, []);

  const handlePatientChange = (e) => {
    const pId = e.target.value;
    const pData = patients.find(p => p.id === pId);
    setFormData({ ...formData, patientId: pId, patientName: pData ? pData.name : "" });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = field === "description" ? value : Number(value);
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { description: "", quantity: 1, price: 0 }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  const total = items.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId) {
      toast.error("Please select a patient.");
      return;
    }
    if (items.length === 0 || items.some(i => !i.description)) {
      toast.error("Please provide valid invoice items.");
      return;
    }

    setLoading(true);
    try {
      const invRef = await addDoc(collection(db, "invoices"), {
        ...formData,
        items,
        total,
        createdAt: serverTimestamp(),
      });
      toast.success("Invoice generated successfully!");
      router.push(`/billing/${invRef.id}`);
    } catch (error) {
      toast.error("Error generating invoice.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/billing">
            <Button variant="ghost" size="sm" className="px-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Create Invoice</h1>
            <p className="text-sm text-gray-500">Generate a new bill for a patient.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Patient *</label>
                  <select
                    required
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.patientId}
                    onChange={handlePatientChange}
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
                    ))}
                  </select>
                </div>
                
                <Input
                  label="Date *"
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Line Items</CardTitle>
              <Button type="button" variant="secondary" size="sm" onClick={addItem} className="gap-2">
                <Plus className="w-4 h-4" /> Add Item
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 px-1 hidden md:grid">
                  <div className="col-span-6">Description</div>
                  <div className="col-span-2">Qty</div>
                  <div className="col-span-3">Unit Price ($)</div>
                  <div className="col-span-1"></div>
                </div>

                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-12 md:col-span-6">
                      <Input 
                        placeholder="Treatment / Medicine" 
                        required 
                        value={item.description}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <Input 
                        type="number" 
                        min="1" 
                        required 
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", e.target.value)}
                      />
                    </div>
                    <div className="col-span-6 md:col-span-3">
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        required 
                        value={item.price}
                        onChange={(e) => updateItem(index, "price", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1 flex justify-end">
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 border-t pt-4 flex justify-end">
                <div className="w-64 space-y-3">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-gray-900 border-t pt-3">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" isLoading={loading}>Generate Invoice</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(CreateInvoice, ["admin", "accountant", "staff", "receptionist"]);
