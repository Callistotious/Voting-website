"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TABS = ["Overview", "Categories", "Voters", "Results"];

export default function SuperAdminManagePoll({ params }) {
  const { pollId } = params;
  const router = useRouter();
  const [tab, setTab] = useState("Overview");
  const [poll, setPoll] = useState(null);
  const [categories, setCategories] = useState([]);
  const [notice, setNotice] = useState("");

  async function load() {
    const res = await fetch(`/api/admin/polls/${pollId}`);
    if (res.status === 401) return router.push("/super-admin/login");
    if (res.status === 404) return router.push("/super-admin/dashboard");
    const data = await res.json();
    setPoll(data.poll);
    setCategories(data.categories);
  }

  useEffect(() => {
    load();
  }, [pollId]);

  if (!poll) {
    return <main className="min-h-screen flex items-center justify-center text-ivory/50 text-sm">Loading…</main>;
  }

  return (
    <main className="min-h-screen px-6 py-12 max-w-4xl mx-auto">
      <a href="/super-admin/dashboard" className="text-xs text-ivory/40 hover:text-cyan-400 transition-colors">← Super admin dashboard</a>
      <header className="mt-4 mb-8">
        <p className="seal text-cyan-400 text-base tracking-wide">Medsam · Super Admin</p>
        <h1 className="font-display text-4xl">{poll.name}</h1>
        {poll.service_status !== "active" && (
          <div className={`mt-3 text-sm px-4 py-2 border inline-block ${poll.service_status === "locked" ? "border-red-400/40 text-red-400" : "border-cyan-400/40 text-cyan-400"}`}>
            {poll.service_status === "locked"
              ? "This poll is locked. Results and exports are withheld until payment is resolved."
              : "This poll is in a grace period."}
          </div>
        )}
      </header>

      <nav className="flex gap-6 border-b border-cyan-500/10 mb-8 text-sm">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 -mb-px border-b-2 transition-colors ${tab === t ? "border-cyan-500 text-cyan-400" : "border-transparent text-ivory/50 hover:text-ivory"}`}
          >
            {t}
          </button>
        ))}
      </nav>

      {notice && <p className="text-sm text-cyan-400 mb-6">{notice}</p>}

      {tab === "Overview" && <OverviewTab poll={poll} pollId={pollId} onChange={load} setNotice={setNotice} />}
      {tab === "Categories" && <CategoriesTab categories={categories} pollId={pollId} onChange={load} />}
      {tab === "Voters" && <VotersTab pollId={pollId} />}
      {tab === "Results" && <ResultsTab pollId={pollId} />}

      <p className="text-center text-[11px] tracking-wide text-ivory/30 mt-12">
        Callisto's voting platform
      </p>
    </main>
  );
}

function OverviewTab({ poll, pollId, onChange, setNotice }) {
  async function patch(body) {
    const res = await fetch(`/api/admin/polls/${pollId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      setNotice(data.error);
      return;
    }
    setNotice("");
    onChange();
  }

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <label className="block text-sm mb-2">Voting status</label>
        <div className="flex gap-2">
          {["draft", "open", "closed"].map((s) => (
            <button
              key={s}
              onClick={() => patch({ votingStatus: s })}
              className={`px-4 py-2 text-sm border transition-colors capitalize ${
                poll.voting_status === s ? "bg-cyan-500 text-midnight-950 border-cyan-500" : "border-cyan-500/30 text-ivory/70 hover:border-cyan-500/60"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="text-xs text-ivory/40 mt-2">Voters can only reach the ballot while this is "open".</p>
      </div>

      <div className="flex items-center justify-between py-4 border-t border-gold-500/10">
        <div>
          <p className="text-sm">Require email OTP verification</p>
          <p className="text-xs text-ivory/40 mt-1">Voters confirm a 6-digit code sent to their email before they can vote.</p>
        </div>
        <ToggleSwitch checked={!!poll.otp_required} onChange={(v) => patch({ otpRequired: v })} />
      </div>

      <div className="flex items-center justify-between py-4 border-t border-cyan-500/10">
        <div>
          <p className="text-sm">Open voting</p>
          <p className="text-xs text-ivory/40 mt-1">
            Anyone with an email can vote, instead of only emails on the voter list.
          </p>
        </div>
        <ToggleSwitch checked={!!poll.open_voting} onChange={(v) => patch({ openVoting: v })} />
      </div>

      <div className="flex items-center justify-between py-4 border-t border-cyan-500/10">
        <div>
          <p className="text-sm">Publish results page</p>
          <p className="text-xs text-ivory/40 mt-1">
            {poll.service_status === "locked" ? "Unavailable while this poll is locked." : "Makes /results/" + pollId + " visible to anyone with the link."}
          </p>
        </div>
        <ToggleSwitch
          checked={!!poll.results_public}
          disabled={poll.service_status === "locked"}
          onChange={(v) => patch({ resultsPublic: v })}
        />
      </div>

      <div className="pt-4 border-t border-cyan-500/10 text-xs text-ivory/40">
        Voter link to share: <br />
        <code className="text-cyan-400">{"/vote/" + pollId}</code>
      </div>

      <div className="mt-16 pt-8 border-t border-red-500/20">
        <p className="text-sm text-red-400 font-medium mb-1">Danger zone</p>
        <p className="text-xs text-ivory/40 mb-4">These actions can't be undone.</p>
        <div className="flex gap-3">
          <button
            onClick={async () => {
              if (!window.confirm("This erases every vote and resets all voters to not-yet-voted. Continue?")) return;
              const res = await fetch(`/api/admin/polls/${pollId}/reset-votes`, { method: "POST" });
              if (res.ok) {
                setNotice("All votes have been reset.");
                onChange();
              } else {
                setNotice((await res.json()).error || "Couldn't reset votes.");
              }
            }}
            className="text-sm px-4 py-2 border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Reset all votes
          </button>
          <button
            onClick={async () => {
              if (!window.confirm("This permanently deletes this poll and everything in it. Continue?")) return;
              const res = await fetch(`/api/admin/polls/${pollId}`, { method: "DELETE" });
              if (res.ok) {
                window.location.href = "/super-admin/dashboard";
              } else {
                setNotice((await res.json()).error || "Couldn't delete poll.");
              }
            }}
            className="text-sm px-4 py-2 border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Delete poll
          </button>
        </div>
      </div>

    </div>
  );
}

function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <button
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 flex items-center px-0.5 transition-colors ${checked ? "bg-cyan-500" : "bg-midnight-700"} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      <span className={`w-5 h-5 bg-ivory transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

function CategoriesTab({ categories, pollId, onChange }) {
  const [newCategory, setNewCategory] = useState("");
  const [nomineeDrafts, setNomineeDrafts] = useState({});

  async function addCategory(e) {
    e.preventDefault();
    if (!newCategory.trim()) return;
    await fetch(`/api/admin/polls/${pollId}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategory })
    });
    setNewCategory("");
    onChange();
  }

  async function deleteCategory(categoryId) {
    await fetch(`/api/admin/polls/${pollId}/categories/${categoryId}`, { method: "DELETE" });
    onChange();
  }

  async function addNominee(categoryId) {
    const name = (nomineeDrafts[categoryId] || "").trim();
    if (!name) return;
    await fetch(`/api/admin/polls/${pollId}/nominees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, name })
    });
    setNomineeDrafts({ ...nomineeDrafts, [categoryId]: "" });
    onChange();
  }

  async function deleteNominee(nomineeId) {
    await fetch(`/api/admin/polls/${pollId}/nominees/${nomineeId}`, { method: "DELETE" });
    onChange();
  }

  return (
    <div className="space-y-10 max-w-xl">
      <form onSubmit={addCategory} className="flex gap-3">
        <input
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="e.g. Best Dressed"
          className="flex-1 px-3 py-2 text-sm"
        />
        <button className="bg-cyan-500 text-midnight-950 text-sm font-medium px-4 hover:bg-cyan-400 transition-colors">
          Add category
        </button>
      </form>

      {categories.length === 0 && <p className="text-sm text-ivory/50">No categories yet — add your first one above.</p>}

      {categories.map((cat) => (
        <div key={cat.id} className="border-t border-cyan-500/10 pt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg">{cat.name}</h3>
            <button onClick={() => deleteCategory(cat.id)} className="text-xs text-ivory/40 hover:text-red-400 transition-colors">
              Remove category
            </button>
          </div>
          <ul className="space-y-1 mb-3">
            {cat.nominees.map((n) => (
              <li key={n.id} className="flex items-center justify-between text-sm py-1.5 border-b border-cyan-500/5">
                <span>{n.name}</span>
                <button onClick={() => deleteNominee(n.id)} className="text-xs text-ivory/30 hover:text-red-400 transition-colors">
                  Remove
                </button>
              </li>
            ))}
            {cat.nominees.length === 0 && <li className="text-xs text-ivory/40">No nominees yet.</li>}
          </ul>
          <div className="flex gap-2">
            <input
              value={nomineeDrafts[cat.id] || ""}
              onChange={(e) => setNomineeDrafts({ ...nomineeDrafts, [cat.id]: e.target.value })}
              placeholder="Nominee name"
              className="flex-1 px-3 py-1.5 text-sm"
            />
            <button onClick={() => addNominee(cat.id)} className="text-sm px-3 py-1.5 border border-cyan-500/30 hover:border-cyan-500/60 transition-colors">
              Add
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function VotersTab({ pollId }) {
  const [voters, setVoters] = useState(null);
  const [raw, setRaw] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch(`/api/admin/polls/${pollId}/voters`);
    const data = await res.json();
    setVoters(data.voters);
  }

  useEffect(() => {
    load();
  }, [pollId]);

  async function addVoters(e) {
    e.preventDefault();
    const res = await fetch(`/api/admin/polls/${pollId}/voters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raw })
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error);
      return;
    }
    setMessage(`Added ${data.added} voter(s).${data.skipped.length ? ` Skipped ${data.skipped.length} invalid line(s).` : ""}`);
    setRaw("");
    load();
  }

  async function resetVoter(voterId) {
    await fetch(`/api/admin/polls/${pollId}/voters/${voterId}`, { method: "PATCH" });
    load();
  }

  async function removeVoter(voterId) {
    await fetch(`/api/admin/polls/${pollId}/voters/${voterId}`, { method: "DELETE" });
    load();
  }

  if (!voters) return <p className="text-sm text-ivory/50">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <form onSubmit={addVoters} className="mb-8">
        <label className="block text-sm mb-2">Add voters</label>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={5}
          placeholder={"One per line:\njane@example.com, Jane Doe\njohn@example.com, John Smith"}
          className="w-full px-3 py-2 text-sm font-mono text-xs"
        />
        <button className="mt-3 bg-cyan-500 text-midnight-950 text-sm font-medium px-4 py-2 hover:bg-cyan-400 transition-colors">
          Add to voter list
        </button>
        {message && <p className="text-xs text-cyan-400 mt-2">{message}</p>}
      </form>

      <p className="text-xs text-ivory/40 mb-4">
        {voters.filter((v) => v.status === "voted").length} of {voters.length} voted
      </p>

      <div className="space-y-1">
        {voters.map((v) => (
          <div key={v.id} className="flex items-center justify-between text-sm py-2 border-b border-cyan-500/5">
            <div>
              <span>{v.email}</span>
              {v.name && <span className="text-ivory/40"> · {v.name}</span>}
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs ${v.status === "voted" ? "text-emerald-400" : v.status === "otp_sent" ? "text-cyan-400" : "text-ivory/40"}`}>
                {v.status === "voted" ? "Voted" : "Not started"}
              </span>
              {v.status !== "voted" && (
                <button onClick={() => resetVoter(v.id)} className="text-xs text-ivory/30 hover:text-cyan-400 transition-colors">
                  Reset
                </button>
              )}
              <button onClick={() => removeVoter(v.id)} className="text-xs text-ivory/30 hover:text-red-400 transition-colors">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultsTab({ pollId }) {
  const [tally, setTally] = useState(null);

  async function load() {
    const res = await fetch(`/api/admin/polls/${pollId}/results`);
    const data = await res.json();
    setTally(data.tally);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [pollId]);

  if (!tally) return <p className="text-sm text-ivory/50">Loading…</p>;

  return (
    <div className="max-w-2xl space-y-10">
      {tally.length === 0 && <p className="text-sm text-ivory/50">Add categories and nominees to see live counts here.</p>}
      {tally.map(({ category, nominees }) => {
        const max = Math.max(1, ...nominees.map((n) => n.votes));
        return (
          <div key={category.id}>
            <h3 className="font-display text-lg mb-3">{category.name}</h3>
            <div className="space-y-2">
              {nominees.map((n) => (
                <div key={n.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{n.name}</span>
                    <span className="text-ivory/50">{n.votes}</span>
                  </div>
                  <div className="h-1.5 bg-midnight-700">
                    <div className="h-1.5 bg-cyan-500" style={{ width: `${(n.votes / max) * 100}%` }} />
                  </div>
                </div>
              ))}
              {nominees.length === 0 && <p className="text-xs text-ivory/40">No nominees in this category.</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}