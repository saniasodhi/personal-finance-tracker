import { useEffect, useState } from 'react';
import { REPO_URL } from '../config';
import { initialLang, saveLang, STRINGS, type Lang } from './i18n';

const TICKER = [
  { desc: 'Swiggy order', cat: 'Food', amt: '−₹240', color: 'var(--cat-food)' },
  { desc: 'Metro recharge', cat: 'Transport', amt: '−₹300', color: 'var(--cat-transport)' },
  { desc: 'Pocket money', cat: 'Income', amt: '+₹12,000', color: 'var(--cat-income)' },
  { desc: 'Myntra kurta', cat: 'Shopping', amt: '−₹1,299', color: 'var(--cat-shopping)' },
  { desc: 'PG rent', cat: 'Housing', amt: '−₹6,500', color: 'var(--cat-housing)' },
  { desc: 'Chai point', cat: 'Food', amt: '−₹40', color: 'var(--cat-food)' },
  { desc: 'Pharmacy', cat: 'Health', amt: '−₹210', color: 'var(--cat-health)' },
  { desc: 'BookMyShow', cat: 'Pleasure', amt: '−₹480', color: 'var(--cat-pleasure)' },
  { desc: 'Rapido bike', cat: 'Transport', amt: '−₹65', color: 'var(--cat-transport)' },
  { desc: 'Freelance gig', cat: 'Income', amt: '+₹2,500', color: 'var(--cat-income)' },
];

const CHIPS = [
  ['Food', 'var(--cat-food)'], ['Transport', 'var(--cat-transport)'], ['Shopping', 'var(--cat-shopping)'],
  ['Housing', 'var(--cat-housing)'], ['Health', 'var(--cat-health)'], ['Pleasure', 'var(--cat-pleasure)'],
  ['Income', 'var(--cat-income)'],
];

const CAL_LEVELS = [0, 1, 0, 4, 1, 2, 3, 0, 1, 1, 0, 2, 3, 3, 0, 1, 0, 1, 2, 3, 4, 2, 1, 0, 1, 2, 3, 3];
const CAL_COLORS = ['#2f1522', '#5a2a1c', '#9a5a14', '#e08a17', '#ffb627'];

const PETALS = [0, 30, 60, 90, 120, 150];

function Rangoli() {
  return (
    <svg className="rangoli" viewBox="0 0 400 400" aria-hidden="true">
      <g transform="translate(200 200)" fill="none" stroke="#ffb627" strokeWidth="1.4">
        <circle r="58" strokeOpacity=".28" />
        <circle r="122" strokeOpacity=".2" />
        <circle r="188" strokeOpacity=".12" strokeDasharray="2 8" />
        {PETALS.map((r) => <ellipse key={r} rx="32" ry="92" transform={`rotate(${r})`} strokeOpacity=".22" />)}
        {[15, 75, 135].map((r) => <ellipse key={r} rx="62" ry="164" transform={`rotate(${r})`} strokeOpacity=".14" />)}
        {Array.from({ length: 12 }, (_, i) => (
          <circle key={i} r="4" cx={Math.cos((i * Math.PI) / 6) * 122} cy={Math.sin((i * Math.PI) / 6) * 122} fill="#ffb627" fillOpacity=".35" stroke="none" />
        ))}
      </g>
    </svg>
  );
}

const Arrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const GitHub = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 .5a11.5 11.5 0 00-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 015.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0012 .5z" /></svg>
);
const Lock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="none" /><path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
);

export default function Landing() {
  const [lang, setLang] = useState<Lang>(initialLang);
  const t = STRINGS[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    saveLang(lang);
  }, [lang]);

  return (
    <div className="page">
      <header className="nav">
        <nav className="wrap nav-inner" aria-label="Main">
          <a className="brand" href="#top" aria-label="Kharcha home">
            <span className="brand-hi" aria-hidden="true">खर्चा</span>
            <span className="brand-en">kharcha</span>
          </a>
          <div className="nav-links">
            <a href="#features">{t.navFeatures}</a>
            <a href="#how">{t.navHow}</a>
            <a href="#open-source">{t.navOpen}</a>
            <a href="#faq">{t.navFaq}</a>
          </div>
          <div className="nav-right">
            <div className="lang" role="group" aria-label="Language">
              <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
              <button type="button" aria-pressed={lang === 'hi'} onClick={() => setLang('hi')} lang="hi">हिं</button>
            </div>
            <a className="icon-btn gh" href={REPO_URL} aria-label="Kharcha on GitHub"><GitHub /></a>
            <a className="btn btn-primary" href="app/index.html">{t.openApp}</a>
          </div>
        </nav>
      </header>

      <main id="top">
        {/* HERO */}
        <section className="hero">
          <div className="hero-glow" />
          <div className="wrap hero-grid">
            <div>
              <span className="pill"><span className="pulse" />{t.pill}</span>
              <h1><span>{t.heroA}</span><span className="accent">{t.heroB}</span></h1>
              <p className="hero-sub">{t.heroSub}</p>
              <div className="hero-ctas">
                <a className="btn btn-primary btn-lg" href="app/index.html">{t.ctaPrimary}<Arrow /></a>
                <a className="btn btn-ghost btn-lg" href="app/index.html?sample=1">{t.ctaSample}</a>
              </div>
              <p className="trust"><Lock />{t.trust}</p>
            </div>

            <div className="stage" aria-hidden="true">
              <Rangoli />
              <div className="phone">
                <div className="screen">
                  <div className="screen-top"><span>{t.phoneHello}</span><span className="avatar">R</span></div>
                  <div className="today">
                    <small>{t.phoneToday}</small>
                    <strong>₹580</strong>
                    <small>₹4,400 {t.phoneLeft}</small>
                  </div>
                  <div className="just-now">{t.phoneNow}</div>
                  <div className="toasts">
                    <div className="toast">
                      <div className="toast-row"><span>Swiggy</span><span>−₹240</span></div>
                      <div className="toast-sub">{t.paidVia} → <b>Food</b></div>
                    </div>
                    <div className="toast" style={{ animationDelay: '1.2s' }}>
                      <div className="toast-row"><span>Metro recharge</span><span>−₹300</span></div>
                      <div className="toast-sub">{t.paidVia} → <b>Transport</b></div>
                    </div>
                    <div className="toast" style={{ animationDelay: '2.4s' }}>
                      <div className="toast-row"><span>Chai point</span><span>−₹40</span></div>
                      <div className="toast-sub">{t.paidVia} → <b>Food</b></div>
                    </div>
                    <div className="toast in" style={{ animationDelay: '3.6s' }}>
                      <div className="toast-row"><span>Pocket money</span><span>+₹12,000</span></div>
                      <div className="toast-sub">{t.received} → <b>Income</b></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="float float-a">
                <span className="float-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6" stroke="#5ee29a" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
                <span><small>Freelance gig</small><span className="mono">+₹2,500</span></span>
              </div>
              <div className="float float-b">
                <small>Uber ride → <span style={{ color: 'var(--cat-transport)', fontWeight: 600 }}>Transport</span></small>
                <span className="mono">−₹152</span> · <span style={{ color: 'var(--marigold)' }}>{t.autoSorted}</span>
              </div>
            </div>
          </div>
        </section>

        {/* TICKER */}
        <section className="ticker" aria-label={t.tickerLabel}>
          <div className="ticker-track">
            {[...TICKER, ...TICKER].map((x, i) => (
              <div className="tick" key={i} aria-hidden={i >= TICKER.length}>
                <span className="dot" style={{ background: x.color }} />
                <span>{x.desc}</span>
                <span className="cat">{x.cat}</span>
                <span className="mono" style={{ color: x.amt.startsWith('+') ? 'var(--income)' : 'var(--text)' }}>{x.amt}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section className="section wrap" id="features">
          <div className="eyebrow">{t.featEyebrow}</div>
          <h2 className="h2" style={{ maxWidth: 780 }}>{t.featTitle}</h2>
          <div className="bento">
            <article className="card span-4">
              <h3>{t.fImportT}</h3>
              <p>{t.fImportD}</p>
              <div className="drop">
                <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" stroke="#ffb627" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span><strong>{t.fImportFile}</strong><br />42 {t.fImportDone}</span>
              </div>
            </article>
            <article className="card span-2">
              <h3>{t.fCatT}</h3>
              <p>{t.fCatD}</p>
              <div className="chips">
                {CHIPS.map(([c, col]) => <span className="chip" key={c}><i style={{ background: col }} />{c}</span>)}
              </div>
            </article>
            <article className="card span-3">
              <h3>{t.fCalT}</h3>
              <p>{t.fCalD}</p>
              <div className="mini-cal" aria-hidden="true">
                {CAL_LEVELS.map((l, i) => <span key={i} style={{ background: CAL_COLORS[l] }} />)}
              </div>
            </article>
            <article className="card span-3">
              <h3>{t.fBudT}</h3>
              <p>{t.fBudD}</p>
              <div className="budget-row"><span>Diwali</span><span className="mono">₹6,800 / ₹10,000</span></div>
              <div className="bar" role="img" aria-label="68% of budget used"><span style={{ width: '68%' }} /></div>
            </article>
            <article className="card span-2">
              <h3>{t.fBalT}</h3>
              <p>{t.fBalD}</p>
              <div className="math">₹1,500 − ₹100 = <b>₹1,400</b><br />₹1,400 + ₹3,000 = <em>₹4,400</em></div>
            </article>
            <article className="card span-2">
              <h3>{t.fPrivT}</h3>
              <p>{t.fPrivD}</p>
            </article>
            <article className="card span-2">
              <h3>{t.fLangT}</h3>
              <p>{t.fLangD}</p>
            </article>
          </div>
        </section>

        {/* HOW */}
        <section className="section wrap" id="how">
          <div className="eyebrow">{t.howEyebrow}</div>
          <h2 className="h2">{t.howTitle}</h2>
          <ol className="steps">
            <li><div className="n">01</div><h3>{t.h1T}</h3><p>{t.h1D}</p></li>
            <li><div className="n">02</div><h3>{t.h2T}</h3><p>{t.h2D}</p></li>
            <li><div className="n">03</div><h3>{t.h3T}</h3><p>{t.h3D}</p></li>
          </ol>
        </section>

        {/* OPEN SOURCE */}
        <section className="wrap" id="open-source">
          <div className="os">
            <div>
              <div className="eyebrow">{t.osEyebrow}</div>
              <h2 className="h2">{t.osTitle}</h2>
              <p className="lead">{t.osBody}</p>
              <div className="hero-ctas">
                <a className="btn btn-primary" href={REPO_URL}><GitHub size={18} />{t.osStar}</a>
                <a className="btn btn-ghost" href={`${REPO_URL}/blob/main/CONTRIBUTING.md`}>{t.osContribute}</a>
              </div>
            </div>
            <div className="code" role="img" aria-label="Code showing the ledger is saved to the browser's localStorage">
              <span className="c">{'// src/core/storage.ts'}</span>{'\n'}
              <span className="k">export function</span> saveLedger(ledger) {'{'}{'\n'}
              {'  '}localStorage.setItem({'\n'}
              {'    '}<span className="s">'kharcha:ledger:v1'</span>,{'\n'}
              {'    '}JSON.stringify(ledger),{'\n'}
              {'  '});{'\n'}
              {'}'}{'\n'}
              <span className="c">{'// That’s it. No fetch(), no server.'}</span>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="faq" id="faq">
          <h2 className="h2">{t.faqTitle}</h2>
          <div style={{ marginTop: 28 }}>
            <details open><summary>{t.q1}</summary><p>{t.a1}</p></details>
            <details><summary>{t.q2}</summary><p>{t.a2}</p></details>
            <details><summary>{t.q3}</summary><p>{t.a3}</p></details>
            <details><summary>{t.q4}</summary><p>{t.a4}</p></details>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="final">
          <div className="final-inner">
            <h2>{t.finalTitle}</h2>
            <p>{t.finalSub}</p>
            <a className="btn btn-dark btn-lg" href="app/index.html">{t.ctaPrimary}<Arrow /></a>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap footer-inner">
          <span>© {new Date().getFullYear()} Kharcha · {t.footerMade}</span>
          <span style={{ display: 'flex', gap: 20 }}>
            <a href={REPO_URL}>GitHub</a>
            <a href={`${REPO_URL}/issues`}>Report an issue</a>
            <a href={`${REPO_URL}/blob/main/LICENSE`}>License</a>
          </span>
        </div>
      </footer>
    </div>
  );
}

