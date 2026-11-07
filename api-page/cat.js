/* Cat: sleeping intro gate (tap to enter) + a cat that sits bottom-left, naps, and gets angry when touched */
(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const $ = (id) => document.getElementById(id);
    const rnd = (a, b) => a + Math.random() * (b - a);
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const HEART = 'M0 4 C-10 -4 -10 -12 -4 -12 C-1 -12 0 -9 0 -8 C0 -9 1 -12 4 -12 C10 -12 10 -4 0 4Z';

    document.body.insertAdjacentHTML('beforeend',
        '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
        '<linearGradient id="cOr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffbe6b"/><stop offset="1" stop-color="#ee8420"/></linearGradient>' +
        '<radialGradient id="cEye" cx=".5" cy=".4" r=".65"><stop offset="0" stop-color="#d6ff7a"/><stop offset="1" stop-color="#46b82e"/></radialGradient>' +
        '</defs></svg>');

    function catSVG() {
        return `<svg class="mcat" viewBox="0 -14 80 74" aria-hidden="true">
<g class="p-sit">
 <path class="cat-tail s-tail" d="M48 54 Q72 56 66 36"/>
 <g class="s-hind"><rect x="44" y="44" width="5" height="13" rx="2.5"/></g>
 <g class="s-body">
  <ellipse cx="36" cy="40" rx="14" ry="16"/>
  <rect x="29" y="44" width="5" height="13" rx="2.5"/><rect x="38" y="44" width="5" height="13" rx="2.5"/>
 </g>
 <g class="s-head">
  <circle cx="36" cy="17" r="10"/>
  <polygon points="27,12 28,2 35,9"/><polygon points="37,9 44,2 45,12"/>
  <g class="s-eyes"><ellipse class="eye blink" cx="32.5" cy="17" rx="1.6" ry="2.2"/><ellipse class="eye blink" cx="39.5" cy="17" rx="1.6" ry="2.2"/></g>
  <g class="s-happy line"><path d="M30.5 18 Q32.5 14.5 34.5 18"/><path d="M37.5 18 Q39.5 14.5 41.5 18"/></g>
  <g class="s-sleepeyes line"><path d="M30.5 16.5 Q32.5 19.5 34.5 16.5"/><path d="M37.5 16.5 Q39.5 19.5 41.5 16.5"/></g>
  <path class="nose" d="M35 21 L37 21 L36 22.6Z"/>
  <g class="s-mouth line"><path d="M36 22.6 Q34.5 24.5 33 23.6"/><path d="M36 22.6 Q37.5 24.5 39 23.6"/></g>
  <ellipse class="s-yawn nose" cx="36" cy="24.4" rx="2.6" ry="3"/>
  <ellipse class="s-tongue nose" cx="36" cy="25.2" rx="1.6" ry="2.2"/>
  <g class="s-angry"><path d="M29 12.8 L35 15.8 M43 12.8 L37 15.8"/><path d="M33 25.4 Q36 22.8 39 25.4"/></g>
  <path class="line" d="M27 21 L19 19 M27 23 L19 25 M45 21 L53 19 M45 23 L53 25" opacity=".6"/>
 </g>
 <g class="s-arm s-arm-l"><rect x="29" y="44" width="5" height="13" rx="2.5"/></g>
 <g class="s-arm s-arm-r"><rect x="38" y="44" width="5" height="13" rx="2.5"/></g>
 <g transform="translate(20 4)"><path class="s-h hh1 hrt" d="${HEART}" transform="scale(.5)"/></g>
 <g transform="translate(53 2)"><path class="s-h hh2 hrt" d="${HEART}" transform="scale(.6)"/></g>
 <g transform="translate(36 -8)"><path class="s-h hh3 hrt" d="${HEART}" transform="scale(.45)"/></g>
 <g class="s-angry s-vein"><path d="M45 3 Q48.5 3 48.5 6.5 M52 3 Q48.5 3 48.5 6.5 M45 10 Q48.5 10 48.5 6.5 M52 10 Q48.5 10 48.5 6.5"/></g>
 <text class="s-angry s-grr" x="55" y="16" font-size="8" font-weight="700">grr!</text>
 <text class="s-z zz1" x="50" y="6" font-size="10" font-weight="700">z</text>
 <text class="s-z zz2" x="57" y="-3" font-size="13" font-weight="700">Z</text>
</g></svg>`;
    }

    /* ---------- behaviours ---------- */
    const ACTS = [['lick', 3200], ['scratch', 2600], ['love', 3400], ['yawn', 2100], ['sleep', 9000], ['wave', 2400], ['love', 3000], ['sleep', 8000], ['lick', 3000]];
    function setAct(cat, name) {
        [...cat.classList].filter((c) => c.startsWith('act-')).forEach((c) => cat.classList.remove(c));
        if (name) cat.classList.add('act-' + name);
    }
    function idleLoop(cat, active) {
        let last = '';
        (async function loop() {
            await wait(rnd(1500, 3000));
            if (!active()) return loop();
            let a;
            do { a = ACTS[Math.floor(Math.random() * ACTS.length)]; } while (a[0] === last);
            last = a[0];
            setAct(cat, a[0]);
            await wait(a[1]);
            if (cat.classList.contains('act-' + a[0])) setAct(cat, null);
            loop();
        })();
    }
    function burst(host, n) {
        for (let i = 0; i < n; i++) {
            const h = document.createElement('span');
            h.className = 'heartfx';
            h.textContent = ['\uD83D\uDC9A', '\uD83D\uDC9A', '\uD83D\uDC9A'][i % 3];
            h.style.left = rnd(20, 80) + '%';
            h.style.top = rnd(10, 50) + '%';
            h.style.setProperty('--dx', rnd(-40, 40) + 'px');
            h.style.setProperty('--s', rnd(16, 28) + 'px');
            h.style.animationDelay = i * 70 + 'ms';
            host.appendChild(h);
            setTimeout(() => h.remove(), 1700 + i * 70);
        }
    }

    /* ---------- intro gate ---------- */
    const gate = $('loadingScreen');
    let siteReady = !!window.__dataReady;
    window.addEventListener('gate:data-ready', () => { siteReady = true; });

    function buildScrollCat() {
        const wrap = document.createElement('div');
        wrap.id = 'pCat';
        wrap.innerHTML = '<div class="flip"><div class="pcat sitting">' + catSVG() + '</div></div>';
        document.body.appendChild(wrap);
        const cat = wrap.querySelector('.pcat');
        let angry = false, calmTimer = null;
        wrap.addEventListener('click', () => {
            angry = true;
            setAct(cat, 'angry');
            clearTimeout(calmTimer);
            calmTimer = setTimeout(() => { angry = false; if (cat.classList.contains('act-angry')) setAct(cat, null); }, 2200);
        });
        idleLoop(cat, () => !angry);
    }

    if (!gate) { buildScrollCat(); return; }

    document.body.classList.add('no-scroll');
    gate.classList.add('gate');
    gate.innerHTML = '<div class="gate-stage" id="gateStage"><div class="gate-cat" id="gateCat"><div class="pcat sitting" id="gatePcat">' + catSVG() + '</div></div><div class="gate-shadow"></div></div><p class="gate-hint" id="gateHint">Tap the cat</p>';
    const stage = $('gateStage'), gcat = $('gateCat'), pc = $('gatePcat'), hint = $('gateHint');
    let seated = false, tapped = false;

    // cat is already in the middle, fast asleep (no walk-in, no loading wait)
    gcat.style.transform = 'none';
    setAct(pc, 'sleep');
    seated = true; stage.classList.add('seated');
    hint.textContent = 'Tap the cat';
    requestAnimationFrame(() => hint.classList.add('show'));

    async function enter() {
        if (tapped) return;
        tapped = true;
        // cat wakes up happy for a moment, then you're in the dashboard
        setAct(pc, 'love'); burst(stage, 8);
        hint.classList.remove('show');
        await wait(700);
        gate.classList.add('leaving');
        while (!window.__dataReady) await wait(100);
        await wait(450);
        window.enterSite && window.enterSite();
        buildScrollCat();
    }
    gcat.addEventListener('click', enter);
})();
