import { useEffect, useState, type FormEvent } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

type Material = { id: string; title?: string; description?: string; link?: string };
type Student = { id: string; email?: string; role?: string };

export default function AdminDashboard() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function loadMaterials() {
    try {
      const snap = await getDocs(collection(db, "materials"));
      setMaterials(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {
      setMessage("Could not load materials. Check Firestore rules.");
    }
  }

  async function loadStudents() {
    try {
      const snap = await getDocs(collection(db, "users"));
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {
      setMessage("Could not load students. Check Firestore rules.");
    }
  }

  useEffect(() => {
    loadMaterials();
    loadStudents();
  }, []);

  function resetForm() {
    setTitle("");
    setDescription("");
    setLink("");
    setEditingId(null);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setMessage("Saving...");
    try {
      const data = { title: title.trim(), description: description.trim(), link: link.trim() };
      if (editingId) {
        await updateDoc(doc(db, "materials", editingId), data);
        setMessage("Material updated.");
      } else {
        await addDoc(collection(db, "materials"), { ...data, createdAt: serverTimestamp() });
        setMessage("Material added.");
      }
      resetForm();
      loadMaterials();
    } catch {
      setMessage("Could not save. Check that Firestore rules allow admins to write materials.");
    }
  }

  async function handleDelete(item: Material) {
    if (!window.confirm(`Delete "${item.title || "Untitled material"}"?`)) return;
    try {
      await deleteDoc(doc(db, "materials", item.id));
      setMessage("Material deleted.");
      loadMaterials();
    } catch {
      setMessage("Could not delete. Check Firestore rules.");
    }
  }

  return (
    <section className="panel">
      <h2>Admin Dashboard</h2>

      <form onSubmit={handleSave}>
        <h3>{editingId ? "Edit Material" : "Add Material"}</h3>
        <label>Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Week 1 Notes" />
        <label>Description</label>
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description" />
        <label>Link (optional)</label>
        <input type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." />
        <button type="submit">{editingId ? "Save Changes" : "Add Material"}</button>
        {editingId && (
          <button type="button" className="secondary" onClick={resetForm}>Cancel Edit</button>
        )}
      </form>
      <p>{message}</p>

      <h3>All Materials ({materials.length})</h3>
      {materials.map(item => (
        <article key={item.id}>
          <h4>{item.title || "Untitled material"}</h4>
          <p>{item.description || ""}</p>
          {item.link && <p><a href={item.link} target="_blank" rel="noreferrer">Open link</a></p>}
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setEditingId(item.id);
              setTitle(item.title || "");
              setDescription(item.description || "");
              setLink(item.link || "");
              setMessage("");
            }}
          >
            Edit
          </button>
          <button type="button" className="secondary" onClick={() => handleDelete(item)}>Delete</button>
        </article>
      ))}

      <h3>Students ({students.filter(s => s.role !== "admin").length})</h3>
      <ul>
        {students.filter(s => s.role !== "admin").map(s => (
          <li key={s.id}>{s.email || s.id}</li>
        ))}
      </ul>
    </section>
  );
}
