"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signInWithGoogle } from "@/lib/diary-service";

/**
 * The one real sign-in page for the whole app (ADR-0004: Access requires an
 * Account). Every entry point that needs a session redirects here with `?next=`
 * and comes back once signed in.
 *
 * PILOT: Google is the only way in. Email (magic link / one-time code) is not
 * offered because Resend has no verified sending domain yet. The
 * `requestMagicLink` / `verifyEmailCode` seam still lives in `diary-service`, so
 * re-adding the email path is a UI-only change once a domain is verified.
 *
 * Design ports the "Come on in." sign-in page (formerly a static marketing page)
 * into the app, with the method box reduced to Google-only. Styles are scoped
 * under `.signin-page` so they never collide with the global app CSS.
 */
export default function SignInPage() {
  return (
    <Suspense>
      <SignInView />
    </Suspense>
  );
}

function SignInView() {
  const params = useSearchParams();
  const nextParam = params.get("next") || "/diary";
  // `next` is attacker-controllable; only follow same-origin absolute paths so
  // the sign-in redirect can't be turned into an open redirect.
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/diary";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursorWord, setCursorWord] = useState("COME IN");
  const rootRef = useRef<HTMLDivElement>(null);
  const curRef = useRef<HTMLDivElement>(null);

  async function google() {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle(next);
      // Success redirects the browser to Google, so this component unmounts.
    } catch {
      setError("Couldn't start Google sign-in. Try again in a moment.");
      setBusy(false);
    }
  }

  // Googly eyes on the peeking cat follow the cursor. Pointer-fine + motion-OK
  // only; cleaned up on unmount.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (!window.matchMedia("(pointer:fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const eyes = Array.from(root.querySelectorAll<SVGGElement>(".eye"))
      .map((g) => ({ ew: g.querySelector<SVGCircleElement>(".ew"), pp: g.querySelector<SVGCircleElement>(".pp") }))
      .filter((e) => e.ew && e.pp) as { ew: SVGCircleElement; pp: SVGCircleElement }[];
    if (!eyes.length) return;
    let mx = window.innerWidth / 2, my = 0, raf = 0;
    const look = () => {
      raf = 0;
      for (const o of eyes) {
        const r = o.ew.getBoundingClientRect();
        if (!r.width) continue;
        const dx = mx - (r.x + r.width / 2), dy = my - (r.y + r.height / 2);
        const d = Math.hypot(dx, dy) || 1;
        o.pp.style.transform = `translate(${(dx / d) * 3.4}px,${(dy / d) * 3.4}px)`;
      }
    };
    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      if (!raf) raf = requestAnimationFrame(look);
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // A short word trails the cursor: "COME IN" over the hero, "STAY" over the
  // dark band. The spans are React-rendered (below) so React owns them; here we
  // only move them on mousemove (a CSS transition gives the soft glide). Re-binds
  // when the word changes, since the span count changes. Pointer-fine + motion-OK.
  useEffect(() => {
    const cur = curRef.current;
    if (!cur) return;
    if (!window.matchMedia("(pointer:fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e: MouseEvent) => {
      const x = e.clientX + 20, y = e.clientY + 22;
      const t = e.target as Element | null;
      const over = !!(t && t.closest && t.closest("a,button,input"));
      const spans = cur.children;
      for (let i = 0; i < spans.length; i++) {
        const s = spans[i] as HTMLElement;
        s.style.transform = `translate(${x + i * 10}px, ${y}px)`;
        s.style.opacity = over ? "0" : "1";
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [cursorWord]);

  // Switch the trailing word based on which section is in view.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) setCursorWord(en.target.getAttribute("data-cursor") || "COME IN");
        }
      },
      { threshold: 0.5 }
    );
    root.querySelectorAll<HTMLElement>("[data-cursor]").forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  const paw = (
    <span className="dot" aria-hidden="true">
      <svg viewBox="0 0 34 30">
        <circle cx="14" cy="15" r="12" fill="#FF6B4A" />
        <path d="M3.5 11 Q14 18 25 9 M2.5 17 Q14 23 25.5 15 M6 23 Q15 27 22 21 M6.5 7 Q16 6 24 12" stroke="#D8492B" strokeWidth="1.7" fill="none" strokeLinecap="round" />
        <path d="M25 18 Q33 19 30 27 Q28 30 24 29" stroke="#FF6B4A" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </svg>
    </span>
  );

  return (
    <div className="signin-page" ref={rootRef}>
      <style>{CSS}</style>
      <div className="cur" aria-hidden="true" ref={curRef}>
        {[...cursorWord].map((ch, i) => (
          <span key={cursorWord + i} style={{ transitionDelay: `${i * 0.018}s` }}>
            {ch === " " ? " " : ch}
          </span>
        ))}
      </div>

      <header className="si-header">
        <a className="wordmark" href="/">
          pouncity{paw}
        </a>
        <nav className="topnav" aria-label="Primary">
          <a className="nav-more" href="/#how">How it works</a>
          <a href="/">Back to site <span aria-hidden="true">&rarr;</span></a>
        </nav>
      </header>

      <main>
        <section className="s-auth" data-cursor="COME IN">
          <div className="auth-ghost" aria-hidden="true">Welcome</div>
          <div className="auth-stage">
            <div className="auth-copy">
              <h1 className="poster">Come on in.</h1>
              <p>
                One tap and you&rsquo;re in, no passwords ever. New here or coming back, it&rsquo;s
                the same friendly door. Your pet&rsquo;s diary is waiting on the other side.
              </p>
              <ul className="reassure">
                <li><span className="tick" aria-hidden="true">&#10003;</span> No passwords, just your Google account, one tap</li>
                <li><span className="tick" aria-hidden="true">&#10003;</span> Set up your pet&rsquo;s diary in seconds</li>
                <li><span className="tick" aria-hidden="true">&#10003;</span> Hand it to any sitter, no account needed</li>
              </ul>
            </div>

            <div className="auth-card">
              <div className="peek" aria-hidden="true">
                <svg viewBox="0 0 170 100">
                  <ellipse cx="52" cy="42" rx="15" ry="26" transform="rotate(30 52 42)" fill="#161616" />
                  <ellipse cx="118" cy="41" rx="14" ry="25" transform="rotate(-34 118 41)" fill="#161616" />
                  <path d="M28 100 C 28 52 52 42 85 42 C 118 42 142 52 142 100 Z" fill="#161616" />
                  <g className="eye"><circle className="ew" cx="62" cy="70" r="12" fill="#fff" /><circle className="pp" cx="62" cy="70" r="5" fill="#161616" /></g>
                  <g className="eye"><circle className="ew" cx="108" cy="70" r="12" fill="#fff" /><circle className="pp" cx="108" cy="70" r="5" fill="#161616" /></g>
                  <path d="M79 82 L91 82 L85 91 Z" fill="#FF6B4A" />
                </svg>
              </div>

              <div className="card-head">
                <h2>Sign in or sign up</h2>
                <p>Same door for new friends and old. No password to remember.</p>
              </div>

              <button type="button" className="gbtn" onClick={google} disabled={busy}>
                <svg viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-2.7-.4-3.9H24v7.1h12.1c-.2 1.8-1.6 4.5-4.5 6.3l6.9 5.3c4.1-3.8 6.6-9.4 6.6-14.8z" />
                  <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.3c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.9-12.5-9.2l-7.1 5.5C7.5 40.9 15.1 46 24 46z" />
                  <path fill="#FBBC05" d="M11.5 28.4c-.5-1.4-.7-2.9-.7-4.4s.3-3 .7-4.4l-7.1-5.5C2.9 17.1 2 20.4 2 24s.9 6.9 2.4 9.9l7.1-5.5z" />
                  <path fill="#EA4335" d="M24 10.4c3.2 0 5.4 1.4 6.6 2.5l4.9-4.8C32.9 5.4 28.9 3.5 24 3.5 15.1 3.5 7.5 8.6 4.4 15.6l7.1 5.5C13.3 15.8 18.2 10.4 24 10.4z" />
                </svg>
                {busy ? "Connecting to Google…" : "Continue with Google"}
              </button>

              {error && (
                <p className="err-msg" role="alert">{error}</p>
              )}

              <p className="fineprint">
                One tap signs you in, and sets up your account if you&rsquo;re new. By continuing you
                agree to our <a href="/terms">Terms</a> &amp; <a href="/privacy">Privacy</a>.
              </p>
            </div>
          </div>
        </section>

        <section className="s-close dome" data-cursor="STAY">
          <div className="close-inner">
            <div className="assure">
              <div className="cell">
                <h3>
                  <span className="ic" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="none" stroke="#FFF7E6" strokeWidth="2" /><path d="M7 12.5 L10.5 16 L17 8.5" fill="none" stroke="#FFF7E6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                  Passwordless, always
                </h3>
                <p>Sign in with your Google account. Nothing to remember, nothing to leak.</p>
              </div>
              <div className="cell">
                <h3>
                  <span className="ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M13 2 L4 14 H11 L10 22 L20 9 H12 Z" fill="#FFF7E6" /></svg></span>
                  Ready in seconds
                </h3>
                <p>Add your pet&rsquo;s name, breed and weight and the diary starts building itself.</p>
              </div>
              <div className="cell">
                <h3>
                  <span className="ic" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="3" fill="#FFF7E6" /><circle cx="18" cy="6" r="3" fill="#FFF7E6" /><circle cx="18" cy="18" r="3" fill="#FFF7E6" /><path d="M8.6 10.6 L15.4 7.4 M8.6 13.4 L15.4 16.6" stroke="#FFF7E6" strokeWidth="2" strokeLinecap="round" /></svg></span>
                  Hand-off, handled
                </h3>
                <p>Share the diary with any sitter by link, they see everything, no account needed.</p>
              </div>
            </div>

            <footer>
              <div className="foot-top">
                <div className="foot-brand">
                  <span className="wordmark">pouncity{paw}</span>
                  <p>One living diary for your pet, for cats, dogs and the humans who love them.</p>
                </div>
                <div className="foot-col">
                  <h4>Pouncity</h4>
                  <a href="/">Home</a>
                  <a href="/#how">How it works</a>
                </div>
                <div className="foot-col">
                  <h4>Legal</h4>
                  <a href="/privacy">Privacy</a>
                  <a href="/terms">Terms of use</a>
                </div>
                <div className="foot-col">
                  <h4>Say hi</h4>
                  <a href="https://www.instagram.com/pouncity" target="_blank" rel="noopener noreferrer">Instagram</a>
                  <a href="mailto:supportpouncity@gmail.com">supportpouncity@gmail.com</a>
                </div>
              </div>
              <div className="foot-bottom">
                <small>&copy; 2026 POUNCITY &middot; 100% VECTOR FUR</small>
                <small>MADE WITH &#128062; FOR GOOD HUMANS</small>
              </div>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}

const CSS = `
.signin-page{
  --panel:#FFFDF6; --dome:clamp(26px,7vw,96px);
  position:relative; min-height:100vh;
  background:var(--sun); color:var(--ink);
  font-family:var(--font-body); line-height:1.5;
  overflow-x:hidden; overflow-x:clip;
}
.signin-page a{color:inherit}
.signin-page .mono,.signin-page .wordmark{font-family:var(--font-display)}

/* cursor word trail */
.signin-page .cur{position:fixed; top:0; left:0; z-index:900; pointer-events:none; mix-blend-mode:difference}
.signin-page .cur span{position:fixed; top:0; left:0; color:#fff; font:500 .82rem var(--font-mono); will-change:transform; opacity:0; transition:transform .14s ease-out, opacity .22s ease}
@media (pointer:coarse){.signin-page .cur{display:none}}

/* header */
.signin-page .si-header{
  position:absolute; top:0; left:0; right:0; z-index:40;
  display:flex; align-items:center; justify-content:space-between; gap:12px 22px;
  padding:16px clamp(20px,4vw,48px);
}
.signin-page .wordmark{
  font-family:var(--font-display); font-weight:700; font-size:1.4rem;
  letter-spacing:-.01em; display:flex; align-items:baseline; gap:4px;
  color:var(--ink); text-decoration:none;
}
.signin-page .wordmark .dot{width:16px; height:14px; display:inline-block; line-height:0}
.signin-page .wordmark .dot svg{width:100%; height:100%; display:block}
.signin-page .topnav{display:flex; align-items:center; gap:clamp(14px,2.4vw,30px)}
.signin-page .topnav a{
  text-decoration:none; color:var(--ink);
  font:600 .92rem var(--font-display); letter-spacing:.01em; white-space:nowrap;
  transition:opacity .15s ease;
}
.signin-page .topnav a:hover{opacity:.62}

/* hero */
.signin-page main{position:relative}
.signin-page section{position:relative}
.signin-page .dome{border-radius:50% 50% 0 0 / var(--dome) var(--dome) 0 0; margin-top:calc(-1 * var(--dome))}
.signin-page .s-auth{
  z-index:1; min-height:100svh; display:flex; align-items:center;
  padding:calc(84px + 3vh) clamp(20px,4vw,48px) calc(var(--dome) + 6vh); overflow:clip;
}
.signin-page .auth-ghost{
  position:absolute; top:8%; left:50%; transform:translateX(-50%);
  z-index:0; white-space:nowrap; pointer-events:none;
  font-family:var(--font-display); font-weight:700;
  font-size:clamp(4rem,20vw,18rem); letter-spacing:-.02em; text-transform:uppercase;
  color:#F2B92E;
}
.signin-page .auth-stage{
  position:relative; z-index:1; width:100%; max-width:1120px; margin:0 auto;
  display:grid; grid-template-columns:1.05fr .95fr; gap:clamp(28px,5vw,72px); align-items:center;
}
.signin-page .auth-copy{max-width:30ch}
.signin-page h1.poster{
  font-family:var(--font-display); font-weight:700;
  font-size:clamp(2.9rem,7vw,5.6rem); line-height:.95; letter-spacing:-.015em;
  text-transform:uppercase; color:var(--sun-ghost); margin:0;
}
.signin-page .auth-copy p{margin:20px 0 0; max-width:34ch; font-size:clamp(1rem,1.35vw,1.18rem); font-weight:500}
.signin-page .auth-copy .reassure{list-style:none; margin:26px 0 0; padding:0; display:flex; flex-direction:column; gap:11px}
.signin-page .auth-copy .reassure li{display:flex; align-items:center; gap:11px; font-weight:600; font-size:.98rem}
.signin-page .auth-copy .reassure .tick{
  flex:none; width:22px; height:22px; border-radius:50%;
  background:var(--ink); color:var(--sun); display:grid; place-items:center; font-size:.72rem;
}

/* card */
.signin-page .auth-card{
  position:relative; background:var(--panel); color:var(--ink);
  border:2.5px solid var(--ink); border-radius:26px;
  box-shadow:8px 10px 0 rgba(22,22,22,.14);
  padding:clamp(22px,2.6vw,34px);
  display:flex; flex-direction:column; gap:16px;
  max-width:440px; width:100%; justify-self:end;
}
.signin-page .peek{position:absolute; top:-70px; right:26px; width:118px; z-index:0; line-height:0; pointer-events:none; animation:si-peekbob 4.5s ease-in-out infinite}
@keyframes si-peekbob{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}
.signin-page .card-head{position:relative; z-index:1}
.signin-page .card-head h2{font-family:var(--font-display); font-weight:700; font-size:1.5rem; letter-spacing:-.01em; margin:0}
.signin-page .card-head p{margin:5px 0 0; font-size:.92rem; color:#4c4638}
.signin-page .gbtn{
  display:flex; align-items:center; justify-content:center; gap:11px; width:100%;
  padding:15px 18px; border:2.5px solid var(--ink); border-radius:14px;
  background:#fff; color:var(--ink); cursor:pointer;
  font:600 1.02rem var(--font-display); letter-spacing:.01em;
  transition:transform .15s ease, background .15s ease;
}
.signin-page .gbtn svg{width:20px; height:20px; flex:none}
.signin-page .gbtn:hover{transform:translateY(-2px); background:var(--cream)}
.signin-page .gbtn:active{transform:translateY(0)}
.signin-page .gbtn:disabled{cursor:default; opacity:.7; transform:none}
.signin-page .err-msg{margin:0; font-size:.86rem; font-weight:600; color:var(--coral-text)}
.signin-page .fineprint{font-size:.8rem; line-height:1.45; margin:0; color:#4c4638}
.signin-page .fineprint a{color:var(--coral-text); text-decoration:underline; text-underline-offset:2px}

/* close + footer band */
.signin-page .s-close{z-index:2; background:var(--ink); color:var(--cream); padding:calc(var(--dome) + 8vh) clamp(20px,4vw,48px) 0; overflow:clip}
.signin-page .close-inner{max-width:1120px; margin:0 auto}
.signin-page .assure{display:grid; grid-template-columns:repeat(3,1fr); gap:clamp(20px,4vw,54px); padding-bottom:clamp(46px,8vh,90px)}
.signin-page .assure .cell h3{font-family:var(--font-display); font-weight:700; font-size:1.14rem; margin:0 0 6px; display:flex; align-items:center; gap:9px; color:var(--cream)}
.signin-page .assure .cell h3 .ic{width:26px; height:26px; flex:none; line-height:0}
.signin-page .assure .cell p{margin:0; font-size:.93rem; color:rgba(255,247,230,.72); max-width:30ch}
.signin-page footer{border-top:1.5px solid rgba(255,247,230,.2); padding:clamp(34px,6vh,60px) 0 max(22px,env(safe-area-inset-bottom))}
.signin-page .foot-top{display:grid; grid-template-columns:1.4fr repeat(3,1fr); gap:clamp(24px,4vw,48px); align-items:start}
.signin-page .foot-brand .wordmark{font-size:1.5rem; color:var(--cream)}
.signin-page .foot-brand .wordmark .dot{width:15px; height:13px}
.signin-page .foot-brand p{margin:14px 0 0; max-width:26ch; font-size:.9rem; color:rgba(255,247,230,.68)}
.signin-page .foot-col h4{font:600 .72rem var(--font-mono); letter-spacing:.16em; text-transform:uppercase; color:rgba(255,247,230,.5); margin:0 0 14px}
.signin-page .foot-col a{display:block; text-decoration:none; color:var(--cream); font-weight:500; font-size:.96rem; margin-bottom:10px; transition:opacity .15s ease}
.signin-page .foot-col a:hover{opacity:.62}
.signin-page .foot-bottom{display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-top:clamp(30px,5vh,54px); padding-top:20px; border-top:1.5px solid rgba(255,247,230,.14)}
.signin-page .foot-bottom small{font-family:var(--font-mono); font-size:.64rem; letter-spacing:.08em; color:rgba(255,247,230,.62)}

/* googly eyes blink */
.signin-page .eye{transform-box:fill-box; transform-origin:center; animation:si-blink 5.6s ease-in-out infinite}
.signin-page .eye .pp{transform-box:fill-box}
@keyframes si-blink{0%,94.5%,100%{transform:scaleY(1)}96.6%{transform:scaleY(.06)}}

/* responsive */
@media (max-width:860px){
  .signin-page .auth-stage{grid-template-columns:1fr; gap:64px; max-width:460px}
  .signin-page .auth-copy{max-width:none; text-align:center; margin:0 auto}
  .signin-page .auth-copy p{margin-left:auto; margin-right:auto}
  .signin-page .auth-copy .reassure{align-items:center}
  .signin-page .auth-card{justify-self:center}
  .signin-page .peek{width:92px; top:-54px}
  .signin-page .auth-ghost{top:5%}
  .signin-page .foot-top{grid-template-columns:1fr 1fr; gap:30px 24px}
  .signin-page .foot-brand{grid-column:1 / -1}
  .signin-page .assure{grid-template-columns:1fr; gap:24px}
}
@media (max-width:520px){
  .signin-page .nav-more{display:none}
  .signin-page .foot-top{grid-template-columns:1fr}
  .signin-page .peek{right:auto; left:50%; transform:translateX(-50%); animation:none}
}
@media (prefers-reduced-motion:reduce){
  .signin-page *{animation:none!important; transition:none!important}
}
`;
