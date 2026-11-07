/* Portfolio layer: interactive controls and settings.json integration */
(() => {
    const $ = (id) => document.getElementById(id);
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));

    window.renderPortfolio = (s) => {
        const p = s.profile || {};
        const ab = p.about || {};

        if ($('aboutText')) {
            $('aboutText').innerHTML = (ab.paragraphs || []).map((t) =>
                `<p>${esc(t)}</p>`).join('');
        }

        if ($('aboutGrid')) {
            $('aboutGrid').innerHTML = (p.details || []).map((d) => `
                <div class="rx-detail-item">
                    <span class="rx-detail-ico"><i class="${esc(d.icon)}" aria-hidden="true"></i></span>
                    <div><small>${esc(d.label)}</small><b>${esc(d.value)}</b></div>
                </div>`).join('');
        }

        if ($('skillsList')) {
            const coreSet = new Set([
                'javascript', 'react.js', 'node.js', 'express.js', 'express',
                'mongodb', 'html5', 'css3', 'tailwind css', 'git & github'
            ]);
            const extras = (s.skills || []).filter((k) => !coreSet.has(String(k).toLowerCase()));
            $('skillsList').innerHTML = extras.map((k) =>
                `<span class="rx-extra-chip">${esc(k)}</span>`).join('');
        }

        if ($('projectsGrid')) {
            $('projectsGrid').innerHTML = (s.projects || []).map((pr) => `
                <div class="rx-proj-mini-card">
                    <div class="rx-proj-mini-top">
                        <span class="rx-proj-mini-ico"><i class="${esc(pr.icon || 'fa-solid fa-code')}" aria-hidden="true"></i></span>
                        ${pr.platform ? `<span class="rx-proj-mini-tags">${esc(pr.platform)}</span>` : ''}
                    </div>
                    <h4>${esc(pr.name)}</h4>
                    <p>${esc(pr.desc)}</p>
                    <div class="rx-proj-mini-tags">${(pr.tags || []).map((t) => esc(t)).join(' · ')}</div>
                </div>`).join('');
        }

        if ($('contactLinks') && Array.isArray(s.links) && s.links.length > 0) {
            const primaryUrl = s.links[0].url || 'https://wa.me/message/ZK73V6OFSA2IA1';
            $('contactLinks').innerHTML = `
                <a href="${esc(primaryUrl)}" target="_blank" rel="noopener noreferrer" class="rx-send-msg-btn">
                    <i class="fa-regular fa-envelope" aria-hidden="true"></i>
                    <span>Send Message</span>
                    <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
                </a>`;
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        const menuToggleBtn = $('menuToggleBtn');
        const mobileNavDrawer = $('mobileNavDrawer');
        if (menuToggleBtn && mobileNavDrawer) {
            menuToggleBtn.addEventListener('click', () => {
                const isHidden = mobileNavDrawer.hasAttribute('hidden');
                if (isHidden) {
                    mobileNavDrawer.removeAttribute('hidden');
                    menuToggleBtn.setAttribute('aria-expanded', 'true');
                } else {
                    mobileNavDrawer.setAttribute('hidden', '');
                    menuToggleBtn.setAttribute('aria-expanded', 'false');
                }
            });

            mobileNavDrawer.querySelectorAll('a').forEach((link) => {
                link.addEventListener('click', () => {
                    if (link.dataset.openApis === 'true') {
                        const apiSec = $('apiSection');
                        if (apiSec) apiSec.removeAttribute('hidden');
                    }
                    mobileNavDrawer.setAttribute('hidden', '');
                    menuToggleBtn.setAttribute('aria-expanded', 'false');
                });
            });
        }

        const topApiNavBtn = $('topApiNavBtn');
        if (topApiNavBtn) {
            topApiNavBtn.addEventListener('click', () => {
                const apiSec = $('apiSection');
                if (apiSec) apiSec.removeAttribute('hidden');
            });
        }

        const learnMoreBtn = $('learnMoreBtn');
        const aboutExpanded = $('aboutExpanded');
        if (learnMoreBtn && aboutExpanded) {
            learnMoreBtn.addEventListener('click', () => {
                const isHidden = aboutExpanded.hasAttribute('hidden');
                if (isHidden) {
                    aboutExpanded.removeAttribute('hidden');
                    learnMoreBtn.setAttribute('aria-expanded', 'true');
                    learnMoreBtn.querySelector('span').textContent = 'Show Less';
                } else {
                    aboutExpanded.setAttribute('hidden', '');
                    learnMoreBtn.setAttribute('aria-expanded', 'false');
                    learnMoreBtn.querySelector('span').textContent = 'Learn More';
                }
            });
        }

        const allSkillsBtn = $('allSkillsBtn');
        const skillsList = $('skillsList');
        if (allSkillsBtn && skillsList) {
            allSkillsBtn.addEventListener('click', () => {
                const isHidden = skillsList.hasAttribute('hidden');
                if (isHidden) {
                    skillsList.removeAttribute('hidden');
                    allSkillsBtn.setAttribute('aria-expanded', 'true');
                    allSkillsBtn.querySelector('span').textContent = 'Core Skills';
                } else {
                    skillsList.setAttribute('hidden', '');
                    allSkillsBtn.setAttribute('aria-expanded', 'false');
                    allSkillsBtn.querySelector('span').textContent = 'All Skills';
                }
            });
        }

        const toggleAllProjects = () => {
            const wrap = $('allProjectsAndApisWrap');
            const apiSec = $('apiSection');
            const btn = $('viewAllProjectsBtn');
            if (!wrap) return;
            const isHidden = wrap.hasAttribute('hidden');
            if (isHidden) {
                wrap.removeAttribute('hidden');
                if (apiSec) apiSec.removeAttribute('hidden');
                if (btn) {
                    btn.setAttribute('aria-expanded', 'true');
                    btn.querySelector('span').textContent = 'Show Less';
                }
            } else {
                wrap.setAttribute('hidden', '');
                if (apiSec) apiSec.setAttribute('hidden', '');
                if (btn) {
                    btn.setAttribute('aria-expanded', 'false');
                    btn.querySelector('span').textContent = 'View All';
                }
            }
        };

        const viewAllProjectsBtn = $('viewAllProjectsBtn');
        const featuredProjectArrowBtn = $('featuredProjectArrowBtn');
        if (viewAllProjectsBtn) viewAllProjectsBtn.addEventListener('click', toggleAllProjects);
        if (featuredProjectArrowBtn) featuredProjectArrowBtn.addEventListener('click', toggleAllProjects);
    });
})();
