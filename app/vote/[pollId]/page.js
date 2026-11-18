"use client";
import { useState } from "react";

export default function VotePage({ params }) {
  const { pollId } = params;
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pollName, setPollName] = useState("");
  const [categories, setCategories] = useState([]);
  const [selections, setSelections] = useState({});

  async function requestCode(e) {
  e.preventDefault();
  setError("");
  setLoading(true);
  const res = await fetch(`/api/vote/${pollId}/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  const data = await res.json();
  if (!res.ok) {
    setLoading(false);
    return setError(data.error);
  }

  if (data.otpRequired === false) {
    // No OTP for this poll — we already have a voting session, skip to the ballot.
    const ballotRes = await fetch(`/api/vote/${pollId}/ballot`);
    const ballotData = await ballotRes.json();
    setLoading(false);
    if (!ballotRes.ok) return setError(ballotData.error);
    setPollName(ballotData.pollName);
    setCategories(ballotData.categories);
    setStep("ballot");
    return;
  }

  setLoading(false);
  setStep("otp");
}

  async function verifyCode(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch(`/api/vote/${pollId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code })
    });
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      return setError(data.error);
    }
    const ballotRes = await fetch(`/api/vote/${pollId}/ballot`);
    const ballotData = await ballotRes.json();
    setLoading(false);
    if (!ballotRes.ok) return setError(ballotData.error);
    setPollName(ballotData.pollName);
    setCategories(ballotData.categories);
    setStep("ballot");
  }

  function pick(categoryId, nomineeId) {
    setSelections({ ...selections, [categoryId]: nomineeId });
  }

  async function submitBallot(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch(`/api/vote/${pollId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selections })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error);
    setStep("done");
  }

  return (
    <main className="min-h-screen px-6 py-16 flex flex-col items-center">
      <div className="w-full max-w-lg">
        <p className="seal text-gold-500 text-base tracking-wide text-center mb-2">Medsam</p>

        {step === "email" && (
          <form onSubmit={requestCode}>
            <h1 className="font-display text-3xl text-center mb-8 italic">Cast your vote</h1>
            <label className="block text-xs text-ivory/60 mb-1">Your email</label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 text-sm mb-4"
            />
            {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
            <button disabled={loading} className="w-full bg-gold-500 text-midnight-950 font-medium py-2.5 text-sm hover:bg-gold-400 transition-colors disabled:opacity-60">
              {loading ? "Sending code…" : "Send me a code"}
            </button>
            <p className="text-xs text-ivory/40 text-center mt-4">We'll email a 6-digit code to confirm it's you.</p>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={verifyCode}>
            <h1 className="font-display text-3xl text-center mb-3 italic">Check your email</h1>
            <p className="text-sm text-ivory/60 text-center mb-8">We sent a code to {email}</p>
            <label className="block text-xs text-ivory/60 mb-1">6-digit code</label>
            <input
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              placeholder="000000"
              className="w-full px-3 py-2.5 text-center tracking-[0.5em] text-lg mb-4"
            />
            {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
            <button disabled={loading} className="w-full bg-gold-500 text-midnight-950 font-medium py-2.5 text-sm hover:bg-gold-400 transition-colors disabled:opacity-60">
              {loading ? "Checking…" : "Verify and continue"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("email"); setError(""); }}
              className="w-full text-xs text-ivory/40 hover:text-gold-400 transition-colors mt-4"
            >
              Use a different email
            </button>
          </form>
        )}

        {step === "ballot" && (
          <form onSubmit={submitBallot}>
            <h1 className="font-display text-3xl text-center mb-1 italic">{pollName}</h1>
            <p className="text-sm text-ivory/50 text-center mb-10">Pick one nominee in each category.</p>
            <div className="space-y-10">
              {categories.map((cat) => (
                <div key={cat.id}>
                  <h2 className="font-display text-lg mb-3">{cat.name}</h2>
                  <div className="ballot-rule mb-4" />
                  <div className="space-y-2">
                    {cat.nominees.map((n) => (
                      <label
                        key={n.id}
                        className={`flex items-center justify-between px-4 py-3 border cursor-pointer transition-colors ${
                          selections[cat.id] === n.id ? "border-gold-500 bg-midnight-800" : "border-gold-500/15 hover:border-gold-500/40"
                        }`}
                      >
                        <span className="text-sm">{n.name}</span>
                        <input
                          type="radio"
                          name={cat.id}
                          checked={selections[cat.id] === n.id}
                          onChange={() => pick(cat.id, n.id)}
                          className="accent-gold-500"
                        />
                      </label>
                    ))}
                    {cat.nominees.length === 0 && <p className="text-xs text-ivory/40">No nominees listed in this category.</p>}
                  </div>
                </div>
              ))}
            </div>
            {error && <p className="text-sm text-red-400 mt-6">{error}</p>}
            <button disabled={loading} className="w-full bg-gold-500 text-midnight-950 font-medium py-3 text-sm mt-10 hover:bg-gold-400 transition-colors disabled:opacity-60">
              {loading ? "Submitting…" : "Submit my vote"}
            </button>
            <p className="text-xs text-ivory/40 text-center mt-3">You can only submit once — review your picks before continuing.</p>
          </form>
        )}

        {step === "done" && (
          <div className="text-center py-10">
            <div className="ballot-rule w-24 mx-auto mb-8" />
            <h1 className="font-display text-3xl italic mb-3">Your vote is counted</h1>
            <p className="text-sm text-ivory/60">Thank you for taking part. You can close this page now.</p>
          </div>
        )}
      </div>
       <p className="text-center text-[11px] tracking-wide text-ivory/30 mt-12">
        Callisto's voting platform <br/>-- Crevin made this🙂 -- 
      </p>
    </main>
  );
}
