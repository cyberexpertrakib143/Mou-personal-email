/* API stack: cards that get covered shrink + dim a little */
(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    let items = [], ticking = false;
    const collect = () => { items = [...document.querySelectorAll('#apiStack .stack-item')]; };
    function update() {
        ticking = false;
        for (let i = 0; i < items.length - 1; i++) {
            const card = items[i].firstElementChild, next = items[i + 1];
            if (next.style.display === 'none' || items[i].style.display === 'none') { card.style.transform = ''; card.style.filter = ''; continue; }
            const pin = parseFloat(getComputedStyle(items[i]).top) || 0;
            const span = items[i].offsetHeight + 40;
            const p = Math.min(1, Math.max(0, 1 - (next.getBoundingClientRect().top - pin) / span));
            card.style.transform = p ? `scale(${(1 - .05 * p).toFixed(4)})` : '';
            card.style.filter = p ? `brightness(${(1 - .45 * p).toFixed(3)})` : '';
        }
    }
    const tick = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    addEventListener('scroll', tick, { passive: true });
    addEventListener('resize', tick, { passive: true });
    window.addEventListener('portfolio:ready', () => { collect(); tick(); });
    document.getElementById('searchInput')?.addEventListener('input', () => setTimeout(() => { collect(); tick(); }, 0));
    collect();
})();
