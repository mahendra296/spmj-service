(function () {
  'use strict';

  /* ---------- Colour mode (light / dark) ----------
     partials/theme-init.ejs has already applied the stored theme to <html>;
     this only handles switching it afterwards. */
  (function themeSwitcher() {
    const STORAGE_KEY = 'spmj-theme';
    const buttons = document.querySelectorAll('[data-theme-toggle]');
    if (!buttons.length) return;

    const root = document.documentElement;

    const apply = (theme) => {
      root.setAttribute('data-theme', theme);
      const next = theme === 'dark' ? 'light' : 'dark';
      // The hover tooltip is drawn from aria-label, so this is the only label.
      buttons.forEach((btn) => {
        btn.setAttribute('aria-label', 'Switch to ' + next + ' mode');
      });
    };

    apply(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* storage blocked */ }
        apply(next);
      });
    });
  })();

  const toggle = document.querySelector('.nav-toggle');
  const header = document.querySelector('.site-header');

  if (toggle && header) {
    const setOpen = (open) => {
      header.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    toggle.addEventListener('click', () => {
      setOpen(!header.classList.contains('nav-open'));
    });

    // Close the menu when a link inside it is followed.
    header.querySelectorAll('.primary-nav a, .nav-actions a').forEach((link) => {
      link.addEventListener('click', () => setOpen(false));
    });

    // Reset the menu when resizing back up to the desktop layout.
    window.addEventListener('resize', () => {
      if (window.innerWidth > 720) setOpen(false);
    }, { passive: true });
  }

  if (header) {
    const onScroll = () => {
      if (window.scrollY > 8) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.service-card, .value-card, .stat-card, .testimonial, .story-card, .price-card, .process li')
      .forEach((el) => observer.observe(el));
  }

  /* ---------- Auto-submitting forms (page-size selector) ---------- */
  document.querySelectorAll('form[data-autosubmit] select').forEach((select) => {
    select.addEventListener('change', () => select.form.submit());
  });

  /* ---------- Gallery lightbox (album pages) ---------- */
  (function lightbox() {
    const openers = Array.from(document.querySelectorAll('[data-lightbox-src]'));
    if (!openers.length) return;

    const overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.hidden = true;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML =
      '<button type="button" class="lightbox-btn lightbox-close" aria-label="Close">&times;</button>' +
      '<button type="button" class="lightbox-btn lightbox-prev" aria-label="Previous photo">&#8249;</button>' +
      '<img alt="" />' +
      '<button type="button" class="lightbox-btn lightbox-next" aria-label="Next photo">&#8250;</button>' +
      '<p class="lightbox-caption"></p>';
    document.body.appendChild(overlay);

    const img = overlay.querySelector('img');
    const caption = overlay.querySelector('.lightbox-caption');
    const prevBtn = overlay.querySelector('.lightbox-prev');
    const nextBtn = overlay.querySelector('.lightbox-next');
    const single = openers.length < 2;
    prevBtn.hidden = single;
    nextBtn.hidden = single;
    let index = 0;

    const show = (i) => {
      index = (i + openers.length) % openers.length;
      const opener = openers[index];
      img.src = opener.dataset.lightboxSrc;
      const text = opener.dataset.lightboxCaption || '';
      caption.textContent = text;
      img.alt = text;
    };

    const open = (i) => {
      show(i);
      overlay.hidden = false;
      document.body.style.overflow = 'hidden';
    };

    const close = () => {
      overlay.hidden = true;
      img.src = '';
      document.body.style.overflow = '';
      openers[index].focus();
    };

    openers.forEach((opener, i) => {
      opener.addEventListener('click', () => open(i));
    });

    overlay.querySelector('.lightbox-close').addEventListener('click', close);
    prevBtn.addEventListener('click', () => show(index - 1));
    nextBtn.addEventListener('click', () => show(index + 1));
    // Clicking the backdrop (but not the photo or a button) closes it.
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    document.addEventListener('keydown', (e) => {
      if (overlay.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight' && !single) show(index + 1);
      else if (e.key === 'ArrowLeft' && !single) show(index - 1);
    });
  })();

  /* ---------- Admin: how many files the album picker has queued ---------- */
  (function filePickCount() {
    const input = document.getElementById('mediaFiles');
    const label = document.getElementById('filePickCount');
    if (!input || !label) return;
    input.addEventListener('change', () => {
      const n = input.files.length;
      label.textContent = n ? n + (n === 1 ? ' file selected' : ' files selected') : '';
    });
  })();

  /* ---------- Image slider ---------- */
  const slider = document.querySelector('.slider');
  if (slider) {
    const slides = Array.from(slider.querySelectorAll('.slide'));
    const dotsContainer = slider.querySelector('.slider-dots');
    const prevBtn = slider.querySelector('.slider-arrow.prev');
    const nextBtn = slider.querySelector('.slider-arrow.next');
    const progressBar = slider.querySelector('.slider-progress .bar');
    const INTERVAL = 5000;
    const TICK = 50;
    let current = 0;
    let elapsed = 0;
    let timer;
    let paused = false;

    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'slider-dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      dot.addEventListener('click', () => { goTo(i); resetTimer(); });
      dotsContainer.appendChild(dot);
    });
    const dots = Array.from(dotsContainer.children);

    function goTo(i) {
      slides[current].classList.remove('is-active');
      dots[current].classList.remove('is-active');
      current = (i + slides.length) % slides.length;
      slides[current].classList.add('is-active');
      dots[current].classList.add('is-active');
      elapsed = 0;
      updateProgress();
    }

    function updateProgress() {
      if (progressBar) {
        progressBar.style.width = ((elapsed / INTERVAL) * 100) + '%';
      }
    }

    function tick() {
      if (paused) return;
      elapsed += TICK;
      updateProgress();
      if (elapsed >= INTERVAL) {
        goTo(current + 1);
      }
    }

    function start() {
      stop();
      timer = setInterval(tick, TICK);
    }
    function stop() { if (timer) clearInterval(timer); }
    function resetTimer() { elapsed = 0; updateProgress(); start(); }

    nextBtn.addEventListener('click', () => { goTo(current + 1); resetTimer(); });
    prevBtn.addEventListener('click', () => { goTo(current - 1); resetTimer(); });

    slider.addEventListener('mouseenter', () => { paused = true; });
    slider.addEventListener('mouseleave', () => { paused = false; });

    document.addEventListener('visibilitychange', () => {
      paused = document.hidden;
    });

    let touchStartX = null;
    slider.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    slider.addEventListener('touchend', (e) => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) {
        if (dx < 0) goTo(current + 1);
        else goTo(current - 1);
        resetTimer();
      }
      touchStartX = null;
    });

    start();
  }
})();
