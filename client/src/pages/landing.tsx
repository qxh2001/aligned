import { useState, useEffect, useRef } from "react";
import "./landing.css";

const PILLS = ["Student", "Team lead / PM", "Professor / TA", "Startup founder", "Other"];

export default function LandingPage() {
  const [selectedPills, setSelectedPills] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "" });

  const featuresRef = useRef<HTMLElement>(null);
  const compareRef = useRef<HTMLElement>(null);
  const quoteRef = useRef<HTMLElement>(null);
  const eoiRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.title = "Aligned — Coordination for student project teams";
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "smooth";

    if (!document.querySelector('link[href*="DM+Serif+Display"]')) {
      const pc1 = Object.assign(document.createElement("link"), { rel: "preconnect", href: "https://fonts.googleapis.com" });
      const pc2 = Object.assign(document.createElement("link"), { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" });
      const font = Object.assign(document.createElement("link"), {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap",
      });
      document.head.append(pc1, pc2, font);
    }

    const refs = [featuresRef.current, compareRef.current, quoteRef.current, eoiRef.current].filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.08 }
    );
    refs.forEach((el) => observer.observe(el));

    return () => {
      document.documentElement.style.scrollBehavior = prev;
      observer.disconnect();
    };
  }, []);

  const togglePill = (pill: string) => {
    setSelectedPills((prev) => {
      const next = new Set(prev);
      next.has(pill) ? next.delete(pill) : next.add(pill);
      return next;
    });
  };

  const submitEOI = async () => {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
    if (!form.name.trim() || !emailOk) {
      setError("Please fill in your name and a valid email address.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/eoi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          roles: Array.from(selectedPills),
        }),
      });
      if (!res.ok) throw new Error("Server error");
      setSubmitted(true);
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div className="landing-page">
      {/* NAV */}
      <nav className="lp-nav">
        <div className="lp-container">
          <div className="lp-nav-inner">
            <a href="/" className="lp-logo">
              aligned <span className="lp-logo-dot" />
            </a>
            <a href="#eoi" className="lp-nav-cta">Request a demo</a>
          </div>
        </div>
      </nav>

      <div className="lp-container">

        {/* HERO */}
        <section className="lp-hero">
          <p className="lp-eyebrow">For project teams that move fast</p>
          <h1>Less coordination overhead.<br /><em>More actual work.</em></h1>
          <p className="lp-hero-sub">
            Aligned is a lightweight project hub that sits on top of the tools your team already uses — with AI-powered deadline extraction to get everyone on the same page in minutes.
          </p>
          <div className="lp-btn-row">
            <a href="#eoi" className="lp-btn-primary">Request a demo</a>
          </div>
          <div className="lp-stats">
            <div className="lp-stat">
              <div className="lp-stat-num">~30%</div>
              <div className="lp-stat-label">of final-week time lost<br />to coordination overhead</div>
            </div>
            <div className="lp-stat">
              <div className="lp-stat-num">&lt;5 min</div>
              <div className="lp-stat-label">to set up a project<br />and invite your team</div>
            </div>
            <div className="lp-stat">
              <div className="lp-stat-num">100%</div>
              <div className="lp-stat-label">of pilot users plan<br />to keep using Aligned</div>
            </div>
          </div>
        </section>

        {/* PRODUCT SHOWCASE */}
        <section className="lp-showcase lp-fade-in">
          <div className="lp-showcase-video">
            <video controls playsInline poster="/aligned-demo.png" preload="metadata">
              <source src="/demo.mov" type="video/mp4" />
            </video>
          </div>
        </section>

        {/* FEATURES */}
        <section className="lp-section lp-fade-in" ref={featuresRef}>
          <p className="lp-section-label">What it does</p>
          <div className="lp-feature-grid">

            <div className="lp-feature-item">
              <div className="lp-feature-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="2" width="5" height="5" rx="1.5" fill="#9485BA"/>
                  <rect x="9" y="2" width="5" height="5" rx="1.5" fill="#C5BAE0"/>
                  <rect x="2" y="9" width="5" height="5" rx="1.5" fill="#C5BAE0"/>
                  <rect x="9" y="9" width="5" height="5" rx="1.5" fill="#9485BA"/>
                </svg>
              </div>
              <div className="lp-feature-title">AI syllabus analysis</div>
              <div className="lp-feature-body">Upload a PDF. Claude extracts every deadline, weight, and deliverable into a shared team timeline — automatically.</div>
            </div>

            <div className="lp-feature-item">
              <div className="lp-feature-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 4h10M3 8h7M3 12h5" stroke="#9485BA" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="lp-feature-title">Shared deadline timeline</div>
              <div className="lp-feature-body">A single view of everything due — visible to the whole team, always up to date, no manual maintenance needed.</div>
            </div>

            <div className="lp-feature-item">
              <div className="lp-feature-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="5.5" stroke="#9485BA" strokeWidth="1.5"/>
                  <path d="M8 5v3.5l2 1.5" stroke="#9485BA" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="lp-feature-title">Action items</div>
              <div className="lp-feature-body">Add, assign, and track tasks in real time. No more "who was supposed to do that?" after every meeting.</div>
            </div>

            <div className="lp-feature-item">
              <div className="lp-feature-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="3" width="12" height="10" rx="2" stroke="#9485BA" strokeWidth="1.5"/>
                  <path d="M5.5 8h5M8 6v4" stroke="#9485BA" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="lp-feature-title">Tool links hub</div>
              <div className="lp-feature-body">Connect Slack, Drive, Notion, Figma, and more in one place. Aligned doesn't replace your tools — it connects them.</div>
            </div>

            <div className="lp-feature-item">
              <div className="lp-feature-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="5" cy="8" r="2.5" stroke="#9485BA" strokeWidth="1.5"/>
                  <circle cx="11" cy="5" r="2.5" stroke="#9485BA" strokeWidth="1.5"/>
                  <circle cx="11" cy="11" r="2.5" stroke="#9485BA" strokeWidth="1.5"/>
                  <path d="M7.5 8h1M7.5 7.5L9 5.5M7.5 8.5L9 10.5" stroke="#9485BA" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="lp-feature-title">Invite in one click</div>
              <div className="lp-feature-body">Share a link. Teammates join with no admin approval and no friction. New users sign up automatically.</div>
            </div>

            <div className="lp-feature-item">
              <div className="lp-feature-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="6" r="2.5" stroke="#9485BA" strokeWidth="1.5"/>
                  <path d="M3.5 13c0-2.49 2.01-4.5 4.5-4.5s4.5 2.01 4.5 4.5" stroke="#9485BA" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="lp-feature-title">Team directory</div>
              <div className="lp-feature-body">See who's on the project, what each person owns, and how to reach them — all in one view.</div>
            </div>

          </div>
        </section>

        {/* COMPARE */}
        <section className="lp-section lp-fade-in" ref={compareRef}>
          <p className="lp-section-label">How Aligned compares</p>
          <div className="lp-compare-grid">
            <div className="lp-cg-head" style={{ textAlign: "left", color: "var(--lp-text-muted)", background: "var(--lp-bg-surface)" }}></div>
            <div className="lp-cg-head">Notion / Asana</div>
            <div className="lp-cg-head highlight">Aligned</div>

            <div className="lp-cg-cell name">Setup time</div>
            <div className="lp-cg-cell cross">Hours</div>
            <div className="lp-cg-cell tick">Under 5 min</div>

            <div className="lp-cg-cell name">AI deadline extraction</div>
            <div className="lp-cg-cell cross">—</div>
            <div className="lp-cg-cell tick">Yes</div>

            <div className="lp-cg-cell name">Works with existing tools</div>
            <div className="lp-cg-cell dim">Partially</div>
            <div className="lp-cg-cell tick">Yes</div>

            <div className="lp-cg-cell name">Built for short projects</div>
            <div className="lp-cg-cell cross">No</div>
            <div className="lp-cg-cell tick">Yes</div>

            <div className="lp-cg-cell name">Requires full team buy-in</div>
            <div className="lp-cg-cell dim">Yes</div>
            <div className="lp-cg-cell tick">Minimal</div>
          </div>
        </section>

        {/* QUOTE */}
        <section className="lp-section lp-fade-in" ref={quoteRef}>
          <div className="lp-quote-card">
            <div className="lp-quote-mark">"</div>
            <p className="lp-quote-text">
              There's always one person who ends up managing everything without actually being the manager. Aligned makes that invisible work visible to the whole team.
            </p>
            <p className="lp-quote-attr">— Early pilot user</p>
          </div>
        </section>

        {/* EOI FORM */}
        <section className="lp-section lp-fade-in" id="eoi" ref={eoiRef}>
          <p className="lp-section-label">Get access</p>
          <div className="lp-eoi-card">
            <h2 className="lp-eoi-title">Request a demo</h2>
            <p className="lp-eoi-sub">Leave your details and we'll reach out with access.</p>

            {submitted ? (
              <div className="lp-eoi-success">
                <div className="lp-success-icon">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M5 10l3.5 3.5 6.5-7" stroke="#9485BA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="lp-success-title">You're on the list</h3>
                <p className="lp-success-sub">We'll reach out with access details. Thanks for your interest in Aligned.</p>
              </div>
            ) : (
              <div>
                <div className="lp-form-row lp-form-row--single">
                  <div className="lp-form-group">
                    <label className="lp-form-label" htmlFor="name">Name</label>
                    <input type="text" id="name" placeholder="Your name" autoComplete="name" {...field("name")} />
                  </div>
                </div>

                <div className="lp-form-row lp-form-row--single">
                  <div className="lp-form-group">
                    <label className="lp-form-label" htmlFor="email">Email address</label>
                    <input type="email" id="email" placeholder="you@example.com" autoComplete="email" {...field("email")} />
                  </div>
                </div>

                <div>
                  <p className="lp-role-label">I am a…</p>
                  <div className="lp-pill-row">
                    {PILLS.map((pill) => (
                      <span
                        key={pill}
                        className={`lp-pill${selectedPills.has(pill) ? " selected" : ""}`}
                        onClick={() => togglePill(pill)}
                      >
                        {pill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="lp-form-footer">
                  <p className="lp-privacy-note">No spam. We'll only reach out about your demo request.</p>
                  <button className="lp-btn-primary" onClick={submitEOI} disabled={submitting}>
                    {submitting ? "Submitting…" : "Request demo →"}
                  </button>
                </div>
                {error && <p className="lp-form-error">{error}</p>}
              </div>
            )}
          </div>
        </section>

      </div>

      {/* FOOTER */}
      <div className="lp-container">
        <footer className="lp-footer">
          <div className="lp-footer-logo">
            aligned <span className="lp-logo-dot" style={{ width: 5, height: 5 }} />
          </div>
          <p className="lp-footer-note">Coordination for teams that move fast</p>
        </footer>
      </div>
    </div>
  );
}
