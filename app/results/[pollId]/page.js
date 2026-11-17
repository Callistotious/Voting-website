"use client";
import { useEffect, useState } from "react";

export default function ResultsPage({ params }) {
  const { pollId } = params;
  const [state, setState] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const res = await fetch(`/api/results/${pollId}`);
      const data = await res.json();
      if (active) setState(data);
    }
    load();
    const interval = setInterval(load, 10000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [pollId]);

  if (!state) {
    return <main className="min-h-screen flex items-center justify-center text-ivory/50 text-sm">Loading…</main>;
  }

  if (state.unavailable) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <p className="seal text-gold-500 text-base tracking-wide mb-4">Medsam</p>
          <h1 className="font-display text-3xl italic mb-3">Results unavailable</h1>
          <p className="text-sm text-ivory/50 max-w-sm">
            {state.reason === "locked"
              ? "The organizer running this poll hasn't settled it with Medsam yet, so results are withheld for now."
              : "The organizer hasn't published results for this poll yet."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-16 flex flex-col items-center">
      <div className="w-full max-w-lg">
        <p className="seal text-gold-500 text-base tracking-wide text-center mb-2">Medsam</p>
        <h1 className="font-display text-3xl italic text-center mb-10">{state.pollName}</h1>
        <div className="space-y-10">
          {state.tally.map(({ category, nominees }) => {
            const max = Math.max(1, ...nominees.map((n) => n.votes));
            const total = nominees.reduce((s, n) => s + n.votes, 0);
            const leader = nominees[0];
            return (
              <div key={category.id}>
                <h2 className="font-display text-lg mb-3">{category.name}</h2>
                <div className="ballot-rule mb-4" />
                <div className="space-y-3">
                  {nominees.map((n) => (
                    <div key={n.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className={leader && n.id === leader.id && total > 0 ? "text-gold-400" : ""}>{n.name}</span>
                        <span className="text-ivory/50">{n.votes}</span>
                      </div>
                      <div className="h-1.5 bg-midnight-700">
                        <div className="h-1.5 bg-gold-500" style={{ width: `${(n.votes / max) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-center text-[11px] tracking-wide text-ivory/30 mt-12">
        Callisto's voting platform
      </p>
    </main>
  );
}
