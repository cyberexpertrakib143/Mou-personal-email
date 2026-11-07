/* Solo Tilt style motion layer: device-orientation + pointer parallax,
   scroll unfolds and 3D card hover. */
(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const stage = document.getElementById('tiltInner');
    if (!stage) return;

    // gate the reveal styles behind this class so content stays visible if
    // this script ever fails to run
    document.body.classList.add('motion-ready');

    const MAX_ROT = 14;     // deg the scene rotates
    const MAX_SHIFT = 60;   // px far layers travel
    const EASE = 0.085;

    // depth: how far an element floats from the glass (0 = flat on it)
    const LAYER_SELECTORS = [
        ['#dynamicImage', 0.75],
        ['#nameContainer', 0.48],
        ['#role', 0.4],
        ['#description', 0.35],
        ['#apiLinks', 0.2]
    ];

    const state = { tx: 0, ty: 0, cx: 0, cy: 0 };
    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

    let layers = [];
    let orientationBase = null;
    let usingPointer = false;
    let started = false;

    function collectLayers() {
        layers = [];
        LAYER_SELECTORS.forEach(([selector, depth]) => {
            document.querySelectorAll(selector).forEach((el) => {
                el.style.willChange = 'transform';
                layers.push({ el, depth });
            });
        });
    }

    function onPointerMove(e) {
        if (e.pointerType === 'touch') return;
        state.tx = (e.clientX / window.innerWidth) * 2 - 1;
        state.ty = (e.clientY / window.innerHeight) * 2 - 1;
        usingPointer = true;
    }

    // Gyroscope tilt - the Solo Tilt core. Only meaningful after a baseline
    // reading, so the first event just calibrates the resting angle.
    function onOrientation(e) {
        if (e.gamma == null && e.beta == null) return;
        const gamma = e.gamma || 0;
        const beta = e.beta || 0;
        if (!orientationBase) orientationBase = { gamma, beta };
        state.tx = clamp((gamma - orientationBase.gamma) / 28, -1, 1);
        state.ty = clamp((beta - orientationBase.beta) / 28, -1, 1);
        usingPointer = false;
    }

    function attachOrientation() {
        window.addEventListener('deviceorientation', onOrientation, true);
    }

    const OrientationEvent = window.DeviceOrientationEvent;
    const needsPermission = !!(OrientationEvent && typeof OrientationEvent.requestPermission === 'function');
    const motionBtn = document.getElementById('motionBtn');
    let motionAsked = false;

    // iOS 13+ only hands out sensor data after a real tap + user approval.
    async function requestMotion() {
        if (motionAsked) return;
        motionAsked = true;
        try {
            const result = await OrientationEvent.requestPermission();
            if (result === 'granted') attachOrientation();
            if (motionBtn) motionBtn.hidden = true;
        } catch (err) {
            motionAsked = false; // not a valid gesture - let the next tap retry
        }
    }

    if (needsPermission) {
        if (motionBtn) {
            motionBtn.hidden = false;
            motionBtn.addEventListener('click', requestMotion);
        }
        window.addEventListener('click', requestMotion, { passive: true });
    } else if (OrientationEvent) {
        attachOrientation();
    }

    let settled = false;
    function render() {
        state.cx += (state.tx - state.cx) * EASE;
        state.cy += (state.ty - state.cy) * EASE;

        // snap and stop writing once the easing is visually done, so an idle
        // page is not re-styling every element on every frame
        const done = Math.abs(state.tx - state.cx) < 0.0005 && Math.abs(state.ty - state.cy) < 0.0005;
        if (done) { state.cx = state.tx; state.cy = state.ty; }

        if (!done || !settled) {
            stage.style.transform =
                `rotateX(${(-state.cy * MAX_ROT).toFixed(2)}deg) ` +
                `rotateY(${(state.cx * MAX_ROT).toFixed(2)}deg)`;

            for (const { el, depth } of layers) {
                el.style.transform =
                    `translate3d(${(-state.cx * MAX_SHIFT * depth).toFixed(2)}px, ` +
                    `${(-state.cy * MAX_SHIFT * depth).toFixed(2)}px, 0)`;
            }
            settled = done;
        }

        requestAnimationFrame(render);
    }

    let revealObserver = null;

    // cards come from the side they sit on: left column from the left,
    // right column from the right, full-width cards alternate
    function setSide(el) {
        const r = el.getBoundingClientRect();
        if (r.width > window.innerWidth * 0.6) {
            el.dataset.from = Number(el.dataset.i) % 2 === 0 ? 'left' : 'right';
        } else {
            el.dataset.from = (r.left + r.width / 2) < window.innerWidth / 2 ? 'left' : 'right';
        }
    }

    // Replays every time: scrolling in slides things in, scrolling away resets them.
    function observeReveals() {
        if (!revealObserver) {
            revealObserver = new IntersectionObserver((entries) => {
                let n = 0;
                entries.forEach((entry) => {
                    const el = entry.target;
                    if (entry.isIntersecting) {
                        el.style.setProperty('--d', `${n++ * 90}ms`);
                        el.classList.add('is-in');
                    } else {
                        el.style.setProperty('--d', '0ms');
                        el.classList.remove('is-in');
                        if (el.classList.contains('reveal-side')) setSide(el);
                    }
                });
            }, { rootMargin: '0px 0px -6% 0px', threshold: 0.1 });
        }
        let i = 0;
        document.querySelectorAll('.api-item, .rv, .category-header, .reveal-up').forEach((el) => {
            if (el.classList.contains('reveal')) return;
            el.classList.add('reveal');
            if (el.classList.contains('api-item') || el.classList.contains('rv')) {
                el.classList.add('reveal-side');
                el.dataset.i = i++;
                setSide(el);
            }
            revealObserver.observe(el);
        });
    }

    function attachCardTilt(root) {
        root.querySelectorAll('.hero-section').forEach((card) => {
            if (card.dataset.tiltBound) return;
            card.dataset.tiltBound = '1';
            const item = card.closest('.api-item') || card.parentElement;
            item.style.perspective = '900px';

            card.addEventListener('pointermove', (e) => {
                if (e.pointerType === 'touch') return;
                const rect = card.getBoundingClientRect();
                const px = (e.clientX - rect.left) / rect.width - 0.5;
                const py = (e.clientY - rect.top) / rect.height - 0.5;
                card.style.setProperty('--rx', `${(px * 14).toFixed(2)}deg`);
                card.style.setProperty('--ry', `${(-py * 14).toFixed(2)}deg`);
            });
            card.addEventListener('pointerleave', () => {
                card.style.setProperty('--rx', '0deg');
                card.style.setProperty('--ry', '0deg');
            });
        });
    }

    function onLoaderHidden(cb) {
        const loader = document.getElementById('loadingScreen');
        if (!loader || loader.style.display === 'none') return cb();
        const timer = setInterval(() => {
            if (loader.style.display !== 'none') return;
            clearInterval(timer);
            cb();
        }, 120);
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    collectLayers();
    requestAnimationFrame(render);

    onLoaderHidden(() => {
        if (started) return;
        started = true;

        const content = document.getElementById('apiContent');
        observeReveals();
        if (content) {
            attachCardTilt(content);
            new MutationObserver(() => {
                observeReveals();
                attachCardTilt(content);
            }).observe(content, { childList: true, subtree: true });
        }
    });
})();
