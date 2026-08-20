'use client';

import { useMemo, useState } from 'react';

const DEFAULT_OBSERVATION = 'I noticed an opportunity to make the website clearer and easier for visitors to take the next step.';

type Lead = { to: string; business: string; industry: string; location: string; observation: string };

function buildMessage(business: string, industry: string, location: string, observation: string) {
  const safeBusiness = business.trim() || 'your business';
  const safeIndustry = industry.trim() || 'local service';
  const safeLocation = location.trim() || 'your area';
  const safeObservation = observation.trim() || DEFAULT_OBSERVATION;
  return `Hi ${safeBusiness},\n\nI came across your business while looking at ${safeIndustry} companies in ${safeLocation}.\n\nI’m Hariom, a web developer behind Hariom Builds. I build modern, mobile-friendly websites for service businesses, focused on making services clearer and enquiries easier.\n\nI’ve recently built several business website concepts, including roofing and property-maintenance projects:\nhttps://hariom-portfolio.pages.dev/\n\nI noticed ${safeObservation}\n\nIf improving your website is something you’re considering, I’d be happy to send over 2–3 specific ideas for your site.\n\nNo pressure at all — just thought it might be useful.\n\nBest,\nHariom\nHariom Builds\nWeb Developer`;
}

export default function HomePage() {
  const [to, setTo] = useState('');
  const [business, setBusiness] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [observation, setObservation] = useState('');
  const [subject, setSubject] = useState('Quick website idea for your business');
  const [manualMessage, setManualMessage] = useState('');
  const [batchInput, setBatchInput] = useState('');
  const [confirmBatch, setConfirmBatch] = useState(false);
  const [status, setStatus] = useState('');

  const generatedMessage = useMemo(() => buildMessage(business, industry, location, observation), [business, industry, location, observation]);
  const text = manualMessage || generatedMessage;

  function useGeneratedMessage() { setManualMessage(''); setStatus('✓ Personalized message refreshed.'); }

  function parseBatch(): Lead[] {
    return batchInput.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
      const [email, name, industryValue, locationValue, ...obs] = line.split('|').map(v => v.trim());
      return { to: email || '', business: name || '', industry: industryValue || industry || 'local service', location: locationValue || location || 'your area', observation: obs.join('|') || observation || DEFAULT_OBSERVATION };
    });
  }

  async function send() {
    if (!to.trim()) return setStatus('⚠ Add a recipient email first.');
    if (!business.trim()) return setStatus('⚠ Add the business name first.');
    if (text.includes('{{') || text.includes('}}')) return setStatus('⚠ Remove unresolved {{placeholders}} before sending.');
    setStatus('Sending…');
    try {
      const response = await fetch('/api/mailer/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: to.trim(), subject: subject.trim(), text }) });
      const data = await response.json();
      setStatus(response.ok ? '✓ Sent successfully' : `⚠ ${data.error || 'Send failed'}`);
    } catch { setStatus('⚠ Unable to reach the mail service.'); }
  }

  async function sendBatch() {
    if (!confirmBatch) return setStatus('⚠ Confirm you reviewed the batch before sending.');
    const leads = parseBatch();
    if (!leads.length) return setStatus('⚠ Add at least one lead.');
    if (leads.length > 10) return setStatus('⚠ Maximum 10 leads per batch.');
    if (leads.some(l => !l.to || !l.business)) return setStatus('⚠ Each line needs email and business name.');
    setStatus(`Sending ${leads.length} reviewed emails…`);
    try {
      const payload = leads.map(l => ({ to: l.to, subject: subject.trim().replace('your business', l.business), text: buildMessage(l.business, l.industry, l.location, l.observation) }));
      const response = await fetch('/api/mailer/batch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leads: payload, confirm: true }) });
      const data = await response.json();
      setStatus(response.ok ? `✓ Batch complete: ${data.sent} sent, ${data.failed} failed.` : `⚠ ${data.error || 'Batch failed'}`);
    } catch { setStatus('⚠ Unable to reach the batch mail service.'); }
  }

  return (
    <main className="mailer-shell"><div className="container">
      <header className="topbar"><div className="brand"><div className="brand-mark">H</div><div><p className="eyebrow">Hariom Builds</p><div className="brand-name">Private Outreach</div></div></div><a href="/api/mailer/auth" className="connect">✦ Connect Gmail</a></header>
      <section className="hero"><h1>Your outreach.<br /><span>Your Gmail. Your control.</span></h1><p>Research the lead, personalize the message, review it, then send directly from your own Gmail. Built for focused, relevant outreach — not bulk spam.</p></section>
      <div className="grid">
        <aside className="card"><h2>Lead details</h2><p className="muted">Fill these in once and the message is personalized automatically.</p>
          <div className="mini-fields">
            <div className="field"><label htmlFor="business">BUSINESS</label><input id="business" value={business} onChange={e => setBusiness(e.target.value)} placeholder="Acme Roofing" /></div>
            <div className="field"><label htmlFor="industry">INDUSTRY</label><input id="industry" value={industry} onChange={e => setIndustry(e.target.value)} placeholder="roofing" /></div>
            <div className="field"><label htmlFor="location">LOCATION</label><input id="location" value={location} onChange={e => setLocation(e.target.value)} placeholder="Manchester, UK" /></div>
            <div className="field"><label htmlFor="observation">WEBSITE OBSERVATION</label><textarea id="observation" className="observation" value={observation} onChange={e => setObservation(e.target.value)} placeholder={DEFAULT_OBSERVATION} /></div>
          </div>
          <ul className="checklist"><li><span className="check">✓</span><span>Use a verified public business email.</span></li><li><span className="check">✓</span><span>Mention one genuine website observation.</span></li><li><span className="check">✓</span><span>Review the final message before sending.</span></li><li><span className="check">✓</span><span>Keep outreach relevant and low-volume.</span></li></ul>
          <div className="tip"><strong>Pro tip:</strong> A specific observation is stronger than a generic pitch.</div>
        </aside>
        <section className="card"><div className="form-grid">
          <div className="field"><label htmlFor="recipient">RECIPIENT EMAIL</label><input id="recipient" value={to} onChange={e => setTo(e.target.value)} type="email" placeholder="owner@business.com" /></div>
          <div className="field"><label htmlFor="subject">SUBJECT</label><input id="subject" value={subject} onChange={e => setSubject(e.target.value)} /></div>
          <div className="field full"><div className="message-heading"><label htmlFor="message">MESSAGE</label><button type="button" className="refresh" onClick={useGeneratedMessage}>Use generated message</button></div><textarea id="message" value={text} onChange={e => setManualMessage(e.target.value)} />{text.includes('{{') || text.includes('}}') ? <p className="warning">Unresolved placeholder detected. Review before sending.</p> : null}</div>
        </div>
        <div className="actions"><button onClick={send} className="send">Send email →</button><span className="status">{status}</span></div>

        <div className="batch-box"><h2>Reviewed batch</h2><p className="muted">Paste up to 10 leads, one per line: <code>email | business | industry | location | observation</code></p><textarea value={batchInput} onChange={e => setBatchInput(e.target.value)} placeholder={'owner@example.com | Acme Roofing | roofing | Texas | I noticed the service pages are difficult to navigate.\nhello@example.com | Example Plumbing | plumbing | Florida | The mobile CTA could be more prominent.'} /><label className="confirm"><input type="checkbox" checked={confirmBatch} onChange={e => setConfirmBatch(e.target.checked)} /> I reviewed these leads and the outreach is relevant to each business.</label><button onClick={sendBatch} className="send batch-send">Send reviewed batch →</button></div>
      </section></div>
      <footer className="footer">Hariom Builds · Private Gmail Mailer · Low-volume reviewed outreach</footer>
    </div></main>
  );
}
