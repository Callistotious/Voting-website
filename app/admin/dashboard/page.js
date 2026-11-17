"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const [polls, setPolls] = useState(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/polls");
    if (res.status === 401) {
      router.push("/admin/login");
      return;
    }
    const data = await res.json();
    setPolls(data.polls);
  }

  useEffect(() => {
    load();
  }, []);

  async function createPoll(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setName("");
    router.push(`/admin/polls/${data.id}`);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  if (!polls) {
    return <main className="min-h-screen flex items-center justify-center text-ivory/50 text-sm">Loading…</main>;
  }

  return (
    <main className="min-h-screen px-6 py-12 max-w-4xl mx-auto">
      <header className="flex items-start justify-between mb-10">
        <div>
          <p className="seal text-gold-500 text-base tracking-wide">Medsam</p>
          <h1 className="font-display text-4xl">Your polls</h1>
        </div>
        <button onClick={logout} className="text-xs text-ivory/50 hover:text-gold-400 transition-colors">
          Sign out
        </button>
      </header>

      <form onSubmit={createPoll} className="flex gap-3 mb-10 max-w-md">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Annual Awards 2026"
          className="flex-1 px-3 py-2.5 text-sm"
        />
        <button className="bg-gold-500 text-midnight-950 text-sm font-medium px-5 hover:bg-gold-400 transition-colors">
          New poll
        </button>
      </form>
      {error && <p className="text-sm text-red-400 -mt-6 mb-6">{error}</p>}

      <div className="ballot-rule mb-4" />

      {polls.length === 0 && (
        <p className="text-ivory/50 text-sm">You haven't created a poll yet. Give it a name above to start.</p>
      )}

      <div className="space-y-3">
        {polls.map((p) => (
          <Link
            key={p.id}
            href={`/admin/polls/${p.id}`}
            className="flex items-center justify-between py-4 border-b border-gold-500/10 hover:border-gold-500/40 transition-colors group"
          >
            <div>
              <p className="font-display text-lg group-hover:text-gold-400 transition-colors">{p.name}</p>
              <p className="text-xs text-ivory/50 mt-1">
                {p.voting_status} · {p.voted_count}/{p.voter_count} voted
                {p.service_status !== "active" && (
                  <span className="ml-2 text-gold-400">· {p.service_status === "locked" ? "locked by Medsam" : "grace period"}</span>
                )}
              </p>
            </div>
            <span className="text-ivory/30 group-hover:text-gold-400 transition-colors">→</span>
          </Link>
        ))}
      </div>
       <p className="text-center text-[11px] tracking-wide text-ivory/30 mt-12">
        Callisto's voting platform
        -- Contact 0740462146 for more projects -- 
      </p>
    </main>
  );
}
