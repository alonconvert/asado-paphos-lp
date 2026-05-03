// ASADO Express Paphos — scroll motion (GSAP + ScrollTrigger via CDN)
// Gates everything on prefers-reduced-motion. Falls back to CSS reveal if GSAP fails to load.

(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fallbackReveal() {
    // No GSAP / reduced motion → use IntersectionObserver to trigger CSS class
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-revealed'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
    );
    document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
  }

  function setupHeader() {
    const header = document.getElementById('site-header');
    if (!header) return;
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 30);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function setupGSAP() {
    if (!window.gsap || !window.ScrollTrigger) {
      fallbackReveal();
      return;
    }
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);

    // 1. Hero parallax — gentle Ken-Burns + downward drift
    const heroPhoto = document.querySelector('.hero-photo img');
    if (heroPhoto) {
      gsap.to(heroPhoto, {
        scale: 1.12,
        yPercent: 6,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6,
        },
      });
    }

    // 2. Hero content fade on scroll-out
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
      gsap.to(heroContent, {
        opacity: 0,
        y: -40,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom 60%',
          scrub: 0.6,
        },
      });
    }

    // 3. Reveal-on-scroll for cards + sections — immediateRender:false so cards
    // stay visible until ScrollTrigger fires (covers SSR/print/fullPage screenshots).
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          immediateRender: false,
          scrollTrigger: {
            trigger: el,
            start: 'top 92%',
            toggleActions: 'play none none none',
          },
          onComplete: () => el.classList.add('is-revealed'),
        }
      );
    });

    // 4. Section title soft entry
    document.querySelectorAll('.menu-header h2, .visit-info h2, .story-text h2').forEach((title) => {
      gsap.fromTo(
        title,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          immediateRender: false,
          scrollTrigger: { trigger: title, start: 'top 92%' },
        }
      );
    });
  }

  function setupYouTube() {
    const modal = document.getElementById('yt-modal');
    const frame = document.getElementById('yt-modal-frame');
    if (!modal || !frame) return;
    const closeBtn = modal.querySelector('.yt-modal-close');

    function open(videoId) {
      frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
    }
    function close() {
      modal.hidden = true;
      frame.innerHTML = '';
      document.body.style.overflow = '';
    }

    document.querySelectorAll('[data-yt-play]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        open(btn.getAttribute('data-yt-play'));
      });
    });
    document.querySelectorAll('[data-yt-launch]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const fallback = document.querySelector('[data-yt-play]');
        if (fallback) open(fallback.getAttribute('data-yt-play'));
      });
    });
    closeBtn?.addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });
  }

  function init() {
    setupHeader();
    setupYouTube();
    if (reduced) {
      fallbackReveal();
      return;
    }
    // GSAP CDN scripts use `defer` — by the time DOMContentLoaded fires they're loaded.
    setupGSAP();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
