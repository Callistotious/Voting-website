export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <p className="seal text-gold-500 text-sm tracking-wide mb-6">Est. for the votes that matter to your group</p>
        <h1 className="font-display text-5xl md:text-7xl italic text-ivory leading-[1.05] max-w-3xl">
          Every vote, counted.<br />Every voter, verified.
        </h1>
        <div className="ballot-rule w-40 my-8" />
        <p className="max-w-md text-[15px] text-ivory/70 leading-relaxed">
          Medsam runs the voting for award nights, club elections, and polls where
          getting the count right matters. If you've been sent a voting link, open
          it on your phone or computer — your code and verification will guide you
          from there.
        </p>
      </div>
      <footer className="px-6 py-8 border-t border-gold-500/10">
        <div className="flex items-center justify-between text-xs text-ivory/40">
          <span>Medsam Voting</span>
          <a href="/admin/login" className="hover:text-gold-400 transition-colors">
            Organizer sign in
          </a>
        </div>
        <p className="text-center text-[11px] tracking-wide text-ivory/30 mt-4">
          Callisto's voting platform
        </p>
      </footer>
    </main>
  );
}
