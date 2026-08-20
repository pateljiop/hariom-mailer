'use client';

import { useState } from 'react';

const template = `Hi {{business}},

I came across your business while looking at {{industry}} companies in {{location}}.

I’m Hariom, a web developer behind Hariom Builds. I build modern, mobile-friendly websites for service businesses, focused on making services clearer and enquiries easier.

I’ve recently built several business website concepts, including roofing and property-maintenance projects:
https://hariom-portfolio.pages.dev/

I noticed {{observation}}

If improving your website is something you’re considering, I’d be happy to send over 2–3 specific ideas for your site.

No pressure at all — just thought it might be useful.

Best,
Hariom
Hariom Builds
Web Developer`;

export default function HomePage() {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('Quick website idea for your business');
  const [text, setText] = useState(template);
  const [status, setStatus] = useState('');

  async function send() {
    if (!to) return setStatus('⚠ Add a recipient email first.');
    setStatus('Sending…');
    try {
      const response = await fetch('/api/mailer/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, text }),
      });
      const data = await response.json();
      setStatus(response.ok ? '✓ Sent successfully' : `⚠ ${data.error || 'Send failed'}`);
    } catch {
      setStatus('⚠ Unable to reach the mail service.');
    }
  }

  return (
    <main className="mailer-shell">
      <div className="container">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">H</div>
            <div>
              <p className="eyebrow">Hariom Builds</p>
              <div className="brand-name">Private Outreach</div>
            </div>
          </div>
          <a href="/api/mailer/auth" className="connect">✦ Connect Gmail</a>
        </header>

        <section className="hero">
          <h1>Your outreach.<br /><span>Your Gmail. Your control.</span></h1>
          <p>Review, personalize and send high-quality business outreach directly from your own Gmail account. Built for focused, relevant lead generation — not bulk spam.</p>
        </section>

        <div className="grid">
          <aside className="card">
            <h2>Lead checklist</h2>
            <p className="muted">A better message starts with better research.</p>
            <ul className="checklist">
              <li><span className="check">✓</span><span>Use a verified public business email.</span></li>
              <li><span className="check">✓</span><span>Personalize the business, location and observation.</span></li>
              <li><span className="check">✓</span><span>Review the message before sending.</span></li>
              <li><span className="check">✓</span><span>Keep outreach relevant and low-volume.</span></li>
            </ul>
            <div className="tip"><strong>Pro tip:</strong> One specific observation about their website is much stronger than a generic pitch.</div>
          </aside>

          <section className="card">
            <div className="form-grid">
              <div className="field">
                <label htmlFor="recipient">RECIPIENT EMAIL</label>
                <input id="recipient" value={to} onChange={e => setTo(e.target.value)} type="email" placeholder="owner@business.com" />
              </div>
              <div className="field">
                <label htmlFor="subject">SUBJECT</label>
                <input id="subject" value={subject} onChange={e => setSubject(e.target.value)} />
              </div>
              <div className="field full">
                <label htmlFor="message">MESSAGE</label>
                <textarea id="message" value={text} onChange={e => setText(e.target.value)} />
              </div>
            </div>
            <div className="actions">
              <button onClick={send} className="send">Send email →</button>
              <span className="status">{status}</span>
            </div>
          </section>
        </div>

        <footer className="footer">Hariom Builds · Private Gmail Mailer · Send from your own account</footer>
      </div>
    </main>
  );
}
