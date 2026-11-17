"use client";
import { useEffect, useState } from "react";

const STATUS_LABEL = {
  active: "Active",
  grace: "Grace period",
  locked: "Locked"
};

const STATUS_COLOR = {
  active: "text-emerald-400 border-emerald-400/40",
  grace: "text-gold-400 border-gold-400/40",
  locked: "text-red-400 border-red-400/40"
};

export default function SuperAdminDashboard() {
  const [clients, setClients] = useState([]);
  const [polls, setPolls] = useState([]);
  const [form, setForm] = useState({ clientName: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    const [cRes, pRes] = await Promise.all([
      fetch("/api/super-admin/clients"),
      fetch("/api/super-admin/polls")
    ]);
    if (cRes.ok) setClients((await cRes.json()).clients);
    if (pRes.ok) setPolls((await pRes.json()).polls);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function createClient(e) {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/super-admin/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Couldn't create that account.");
      return;
    }
    setForm({ clientName: "", email: "", password: "" });
    setMessage(`Account created for ${form.clientName}.`);
    loadAll();
  }

  async function changeStatus(pollId, serviceStatus) {
    await fetch(`/api/super-admin/polls/${pollId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceStatus })
    });
    loadAll();
  }

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center text-ivory/50 text-sm">Loading…</main>;
  }

  return (
    <main className="min-h-screen px-6 py-12 max-w-5xl mx-auto">
      <header className="mb-10">
        <p className="seal text-gold-500 text-base tracking-wide">Callisto</p>
        <h1 className="font-display text-4xl">Super admin</h1>
        <p className="text-ivory/50 text-sm mt-2">Full visibility across every client's polls, and the service status switch described in the Terms of Service.</p>
      </header>

      <section className="mb-12">
        <h2 className="font-display text-xl mb-4">Add a client</h2>
        <form onSubmit={createClient} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end max-w-2xl">
          <div className="md:col-span-1">
            <label className="block text-xs text-ivory/60 mb-1">Client name</label>
            <input
              required
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              className="w-full px-3 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs text-ivory/60 mb-1">Admin email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs text-ivory/60 mb-1">Temporary password</label>
            <input
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" className="bg-gold-500 text-midnight-950 text-sm font-medium py-2.5 hover:bg-gold-400 transition-colors">
            Create account
          </button>
        </form>
        {message && <p className="text-sm text-gold-400 mt-3">{message}</p>}
      </section>

      <section>
        <h2 className="font-display text-xl mb-4">All polls</h2>
        <div className="ballot-rule mb-4" />
        <div className="space-y-3">
          {polls.length === 0 && <p className="text-ivory/50 text-sm">No polls yet.</p>}
          {polls.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-gold-500/10">
             <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-ivory/50">
                  {p.client_name} · {p.client_email} · {p.voted_count}/{p.voter_count} voted · {p.voting_status}
                </p>
                <a href={`/super-admin/polls/${p.id}`} className="text-xs text-gold-400 hover:text-gold-300 transition-colors">
                  Manage this poll →
                </a>
              </div>
              <select
                value={p.service_status}
                onChange={(e) => changeStatus(p.id, e.target.value)}
                className={`bg-midnight-900 border text-xs px-2 py-1.5 ${STATUS_COLOR[p.service_status]}`}
              >
                {Object.entries(STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </section>
     <p className="text-center text-[11px] tracking-wide text-ivory/30 mt-12">
        Callisto's voting platform
      </p>
    </main>
  );
}
