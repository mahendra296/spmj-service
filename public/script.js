(function () {
  'use strict';

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
