import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import useAuthStore from '../store/authStore'
import axiosInstance from '../api/axios'

    export default function Landing() {
    const heroRef = useRef(null)
    const { user, logout } = useAuthStore()

    const handleLogout = async () => {
        await axiosInstance.post('/auth/logout')
        logout()
    }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1 }
    )
    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="landing">
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');

    .landing {
        font-family: 'DM Sans', sans-serif;
        background: #0d0f1a;
        color: #e8e8f0;
        min-height: 100vh;
        overflow-x: hidden;
    }

    .fade-up {
        opacity: 0;
        transform: translateY(28px);
        transition: opacity 0.7s ease, transform 0.7s ease;
    }
    .fade-up.visible {
        opacity: 1;
        transform: translateY(0);
    }
    .fade-up:nth-child(2) { transition-delay: 0.1s; }
    .fade-up:nth-child(3) { transition-delay: 0.2s; }
    .fade-up:nth-child(4) { transition-delay: 0.3s; }

    .nav {
        position: fixed;
        top: 0; left: 0; right: 0;
        z-index: 100;
        padding: 20px 48px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: rgba(13, 15, 26, 0.88);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid rgba(99, 102, 241, 0.12);
    }

    .nav-logo {
        display: flex;
        align-items: center;
        gap: 10px;
        text-decoration: none;
    }

    .nav-logo-mark {
        width: 32px;
        height: 32px;
        background: #4f46e5;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'DM Serif Display', serif;
        font-size: 18px;
        color: #ffffff;
        font-weight: 400;
    }

    .nav-logo-text {
        font-size: 16px;
        font-weight: 500;
        color: #e8e8f0;
        letter-spacing: -0.02em;
    }

    .nav-links {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .btn-ghost {
        padding: 8px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 400;
        color: #94a3b8;
        background: transparent;
        border: none;
        cursor: pointer;
        text-decoration: none;
        transition: color 0.2s;
        font-family: 'DM Sans', sans-serif;
    }
    .btn-ghost:hover { color: #e8e8f0; }

    .btn-primary {
        padding: 9px 22px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        color: #ffffff;
        background: #4f46e5;
        border: none;
        cursor: pointer;
        text-decoration: none;
        transition: background 0.2s, transform 0.15s;
        font-family: 'DM Sans', sans-serif;
    }
    .btn-primary:hover {
        background: #4338ca;
        transform: translateY(-1px);
    }

    .hero {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 120px 24px 80px;
        position: relative;
    }

    .hero::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(79, 70, 229, 0.15) 0%, transparent 70%);
        pointer-events: none;
    }

    .hero-eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 14px;
        border-radius: 100px;
        border: 1px solid rgba(99, 102, 241, 0.3);
        font-size: 12px;
        font-weight: 400;
        color: #818cf8;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        margin-bottom: 32px;
    }

    .hero-eyebrow-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #818cf8;
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
    }

    .hero-title {
        font-family: 'DM Serif Display', serif;
        font-size: clamp(48px, 8vw, 88px);
        font-weight: 400;
        line-height: 1.05;
        letter-spacing: -0.02em;
        color: #e8e8f0;
        margin: 0 0 8px;
        max-width: 800px;
    }

    .hero-title-italic {
        font-style: italic;
        color: #818cf8;
    }

    .hero-subtitle {
        font-size: clamp(16px, 2.5vw, 20px);
        font-weight: 300;
        color: #475569;
        max-width: 520px;
        line-height: 1.65;
        margin: 24px auto 48px;
    }

    .hero-actions {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        justify-content: center;
    }

    .btn-hero {
        padding: 14px 32px;
        border-radius: 10px;
        font-size: 15px;
        font-weight: 500;
        color: #ffffff;
        background: #4f46e5;
        border: none;
        cursor: pointer;
        text-decoration: none;
        transition: all 0.2s;
        font-family: 'DM Sans', sans-serif;
        letter-spacing: -0.01em;
    }
    .btn-hero:hover {
        background: #4338ca;
        transform: translateY(-2px);
    }

    .btn-hero-outline {
        padding: 13px 32px;
        border-radius: 10px;
        font-size: 15px;
        font-weight: 400;
        color: #94a3b8;
        background: transparent;
        border: 1px solid rgba(99, 102, 241, 0.25);
        cursor: pointer;
        text-decoration: none;
        transition: all 0.2s;
        font-family: 'DM Sans', sans-serif;
    }
    .btn-hero-outline:hover {
        border-color: rgba(99, 102, 241, 0.5);
        color: #e8e8f0;
    }

    .divider {
        width: 1px;
        height: 14px;
        background: rgba(99, 102, 241, 0.2);
    }

    .hero-note {
        font-size: 13px;
        color: #334155;
        margin-top: 20px;
    }

    .section {
        padding: 100px 48px;
        max-width: 1100px;
        margin: 0 auto;
    }

    .section-label {
        font-size: 11px;
        font-weight: 500;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #818cf8;
        margin-bottom: 20px;
    }

    .section-title {
        font-family: 'DM Serif Display', serif;
        font-size: clamp(32px, 5vw, 52px);
        font-weight: 400;
        line-height: 1.1;
        letter-spacing: -0.02em;
        color: #e8e8f0;
        margin: 0 0 20px;
        max-width: 600px;
    }

    .section-title em {
        font-style: italic;
        color: #818cf8;
    }

    .section-body {
        font-size: 16px;
        font-weight: 300;
        color: #475569;
        line-height: 1.7;
        max-width: 480px;
    }

    .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1px;
        background: rgba(99, 102, 241, 0.08);
        border: 1px solid rgba(99, 102, 241, 0.1);
        border-radius: 16px;
        overflow: hidden;
        margin-top: 64px;
    }

    .feature-card {
        background: #0d0f1a;
        padding: 36px 32px;
        transition: background 0.2s;
    }
    .feature-card:hover { background: #111320; }

    .feature-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: rgba(79, 70, 229, 0.12);
        border: 1px solid rgba(99, 102, 241, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 20px;
        font-size: 18px;
        color: #818cf8;
    }

    .feature-title {
        font-size: 15px;
        font-weight: 500;
        color: #e8e8f0;
        margin: 0 0 10px;
        letter-spacing: -0.01em;
    }

    .feature-desc {
        font-size: 14px;
        font-weight: 300;
        color: #334155;
        line-height: 1.65;
        margin: 0;
    }

    .roles-section {
        padding: 100px 48px;
        background: #0a0c16;
        border-top: 1px solid rgba(99, 102, 241, 0.06);
        border-bottom: 1px solid rgba(99, 102, 241, 0.06);
    }

    .roles-inner {
        max-width: 1100px;
        margin: 0 auto;
    }

    .roles-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 24px;
        margin-top: 56px;
    }

    .role-card {
        padding: 32px 28px;
        border-radius: 14px;
        border: 1px solid rgba(99, 102, 241, 0.1);
        background: #0d0f1a;
        transition: border-color 0.2s, transform 0.2s;
    }
    .role-card:hover {
        border-color: rgba(99, 102, 241, 0.3);
        transform: translateY(-3px);
    }

    .role-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 100px;
        font-size: 11px;
        font-weight: 500;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        margin-bottom: 20px;
    }

    .role-badge.writer {
        background: rgba(16, 185, 129, 0.1);
        color: #34d399;
        border: 1px solid rgba(16, 185, 129, 0.2);
    }
    .role-badge.editor {
        background: rgba(79, 70, 229, 0.12);
        color: #818cf8;
        border: 1px solid rgba(79, 70, 229, 0.25);
    }
    .role-badge.admin {
        background: rgba(239, 68, 68, 0.1);
        color: #f87171;
        border: 1px solid rgba(239, 68, 68, 0.15);
    }

    .role-title {
        font-family: 'DM Serif Display', serif;
        font-size: 22px;
        color: #e8e8f0;
        margin: 0 0 12px;
        font-weight: 400;
    }

    .role-desc {
        font-size: 14px;
        font-weight: 300;
        color: #475569;
        line-height: 1.65;
        margin: 0 0 20px;
    }

    .role-perks {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .role-perks li {
        font-size: 13px;
        color: #475569;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .role-perks li::before {
        content: '';
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: #4f46e5;
        flex-shrink: 0;
    }

    .cta-section {
        padding: 120px 48px;
        text-align: center;
        position: relative;
    }

    .cta-section::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: radial-gradient(ellipse 60% 60% at 50% 100%, rgba(79, 70, 229, 0.1) 0%, transparent 70%);
        pointer-events: none;
    }

    .cta-title {
        font-family: 'DM Serif Display', serif;
        font-size: clamp(36px, 6vw, 64px);
        font-weight: 400;
        line-height: 1.1;
        letter-spacing: -0.02em;
        color: #e8e8f0;
        margin: 0 0 20px;
    }

    .cta-title em {
        font-style: italic;
        color: #818cf8;
    }

    .cta-sub {
        font-size: 16px;
        font-weight: 300;
        color: #475569;
        margin: 0 auto 48px;
        max-width: 400px;
        line-height: 1.6;
    }

    .footer {
        padding: 32px 48px;
        border-top: 1px solid rgba(99, 102, 241, 0.06);
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 12px;
    }

    .footer-copy {
        font-size: 13px;
        color: #1e293b;
    }

    .footer-tagline {
        font-size: 13px;
        color: #1e293b;
        font-style: italic;
        font-family: 'DM Serif Display', serif;
    }

    @media (max-width: 768px) {
        .nav { padding: 16px 20px; }
        .section { padding: 64px 20px; }
        .roles-section { padding: 64px 20px; }
        .cta-section { padding: 80px 20px; }
        .footer { padding: 24px 20px; }
        .btn-ghost { display: none; }
    }
    `}</style>

      {/* Nav */}
      <nav className="nav">
        <a href="/" className="nav-logo">
          <div className="nav-logo-mark">O</div>
          <span className="nav-logo-text">OrbitBoard</span>
        </a>
        <div className="nav-links">
        {user ? (
            <>
            <Link to="/dashboard" className="btn-ghost">Dashboard</Link>
            <button onClick={handleLogout} className="btn-primary">Logout</button>
            </>
        ) : (
            <>
            <Link to="/login" className="btn-ghost">Sign in</Link>
            <Link to="/register" className="btn-primary">Get started</Link>
            </>
        )}
        </div>
      </nav>

      {/* Hero */}
      <section className="hero" ref={heroRef}>
        <div className="hero-eyebrow fade-up">
          <span className="hero-eyebrow-dot" />
          Editorial workflow platform
        </div>

        <h1 className="hero-title fade-up">
          Where stories go from<br />
          <span className="hero-title-italic">draft to published</span>
        </h1>

        <p className="hero-subtitle fade-up">
          OrbitBoard brings writers, editors, and admins into one structured workspace — with kanban boards, rich editing, and a full review pipeline.
        </p>

        <div className="hero-actions fade-up">
        {user ? (
            <Link to="/dashboard" className="btn-hero">Go to Dashboard</Link>
        ) : (
            <>
            <Link to="/register" className="btn-hero">Start for free</Link>
            <div className="divider" />
            <Link to="/login" className="btn-hero-outline">Sign in</Link>
            </>
        )}
        </div>

        <p className="hero-note fade-up">No credit card required &nbsp;·&nbsp; Free to use</p>
      </section>

      {/* Features */}
      <section className="section">
        <p className="section-label fade-up">Built for newsrooms</p>
        <h2 className="section-title fade-up">
          Every tool your<br />
          <em>editorial team</em> needs
        </h2>
        <p className="section-body fade-up">
          From pitch to publication, OrbitBoard keeps your entire team aligned with clear roles, structured boards, and a transparent review process.
        </p>

        <div className="features-grid">
          {[
            { icon: '⬡', title: 'Kanban boards', desc: 'Visualize your editorial pipeline with drag-friendly lists. Every article moves through your workflow with full visibility.' },
            { icon: '✦', title: 'Role-based access', desc: 'Writers, editors, and admins each see exactly what they need. No noise, no confusion — just focused work.' },
            { icon: '◈', title: 'Rich text editor', desc: 'A full WYSIWYG editor with headings, lists, quotes, and multi-language support including Bangla.' },
            { icon: '⟳', title: 'Review pipeline', desc: 'Editors copy articles to their board for review. Edits stay separate. Original articles sync status automatically.' },
            { icon: '◎', title: 'Version compare', desc: 'Writers compare their original draft against the edited version side by side, before and after review.' },
            { icon: '⬕', title: 'Activity log', desc: 'Full audit trail on every article — who changed the status, when it was picked for review, every action recorded.' },
          ].map((f, i) => (
            <div key={i} className="feature-card fade-up">
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <div className="roles-section">
        <div className="roles-inner">
          <p className="section-label fade-up">Three roles, one team</p>
          <h2 className="section-title fade-up">
            Designed for how<br />
            <em>editorial teams</em> work
          </h2>

          <div className="roles-grid">
            <div className="role-card fade-up">
              <span className="role-badge writer">Writer</span>
              <h3 className="role-title">Write & submit</h3>
              <p className="role-desc">Writers own their board, manage their article lists, and submit work for editorial review.</p>
              <ul className="role-perks">
                <li>Personal article board</li>
                <li>Rich text editor with auto-save</li>
                <li>Submit articles for review</li>
                <li>Compare original vs edited</li>
                <li>Comment on articles</li>
              </ul>
            </div>

            <div className="role-card fade-up">
              <span className="role-badge editor">Editor</span>
              <h3 className="role-title">Review & polish</h3>
              <p className="role-desc">Editors pick articles from writer boards, edit in isolation, and publish without touching the original.</p>
              <ul className="role-perks">
                <li>Pick any article for review</li>
                <li>Edit copy — original untouched</li>
                <li>Sync status back to source</li>
                <li>Activity log access</li>
                <li>Full comment thread control</li>
              </ul>
            </div>

            <div className="role-card fade-up">
              <span className="role-badge admin">Admin</span>
              <h3 className="role-title">Manage & oversee</h3>
              <p className="role-desc">Admins run the group — creating boards, assigning roles, and maintaining the full editorial structure.</p>
              <ul className="role-perks">
                <li>Create and close boards</li>
                <li>Assign roles per board</li>
                <li>Delete any article</li>
                <li>Full group management</li>
                <li>Complete audit trail</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <section className="cta-section">
        <h2 className="cta-title fade-up">
          Your newsroom,<br />
          <em>finally organised</em>
        </h2>
        <p className="cta-sub fade-up">
          Get your team writing, reviewing, and publishing — all in one place.
        </p>
        <div className="hero-actions fade-up">
        {user ? (
            <Link to="/dashboard" className="btn-hero">Go to Dashboard</Link>
        ) : (
            <>
            <Link to="/register" className="btn-hero">Create your workspace</Link>
            <div className="divider" />
            <Link to="/login" className="btn-hero-outline">Sign in</Link>
            </>
        )}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <span className="footer-copy">© 2025 OrbitBoard</span>
        <span className="footer-tagline">Built for storytellers</span>
      </footer>
    </div>
  )
}
