/* Progressive enhancement only: every page works without this file. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  doc.classList.add('js');
  if (!reduce && 'IntersectionObserver' in window) doc.classList.add('motion');

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var raf = window.requestAnimationFrame || function (f) { return setTimeout(f, 16); };

  /* ---- header: light over the hero, solid after it, hides on scroll down ---- */
  var hdr = $('.hdr');
  var heroEl = $('.hero, .phead__media');
  var lastY = window.scrollY;
  var totop = $('.totop');
  var onScroll = function () {
    var y = window.scrollY;
    var limit = heroEl ? heroEl.offsetHeight - (hdr ? hdr.offsetHeight : 0) : 10;
    if (hdr) {
      hdr.classList.toggle('is-solid', y > limit);
      hdr.classList.toggle('is-hidden', y > lastY && y > limit + 200 && !doc.classList.contains('menu-open'));
    }
    if (totop) totop.classList.toggle('is-on', y > window.innerHeight * 1.2);
    lastY = y;
  };
  window.addEventListener('scroll', function () { raf(onScroll); }, { passive: true });
  onScroll();
  if (totop) totop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    var skip = $('#main'); if (skip) skip.focus({ preventScroll: true });
  });

  /* ---- full-screen menu ---- */
  var menu = $('#menu');
  var openBtn = $('.hdr__menu');
  if (menu && openBtn) {
    var closeBtn = $('.menu__close', menu);
    var setMenu = function (open) {
      menu.classList.toggle('is-open', open);
      menu.setAttribute('aria-hidden', String(!open));
      openBtn.setAttribute('aria-expanded', String(open));
      doc.classList.toggle('menu-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) closeBtn.focus(); else openBtn.focus();
    };
    // Without JS the button is a link to the footer navigation.
    openBtn.addEventListener('click', function (e) { e.preventDefault(); setMenu(true); });
    closeBtn.addEventListener('click', function () { setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (!menu.classList.contains('is-open')) return;
      if (e.key === 'Escape') setMenu(false);
      if (e.key === 'Tab') { // keep focus inside the open menu
        var f = $$('a, button', menu);
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---- reveal on scroll ---- */
  if (doc.classList.contains('motion')) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('[data-reveal]').forEach(function (el) { io.observe(el); });
  }

  /* ---- hero / page-head parallax ---- */
  var px = $('.hero__media img, .phead__media img');
  if (px && !reduce) {
    var movePx = function () {
      var y = window.scrollY;
      if (y < window.innerHeight * 1.2) px.style.transform = 'translate3d(0,' + (y * 0.18) + 'px,0)';
    };
    window.addEventListener('scroll', function () { raf(movePx); }, { passive: true });
  }

  /* ---- sticky colour list: the item in view sets the active row and colours ---- */
  $$('[data-stick]').forEach(function (sec) {
    var items = $$('.stick__item', sec);
    var links = $$('.rows a', sec);
    var strip = $('.stick__list', sec);
    var setActive = function (item) {
      if (!item) return;
      sec.style.setProperty('--sbg', item.getAttribute('data-bg'));
      sec.style.setProperty('--sfg', item.getAttribute('data-fg'));
      sec.style.setProperty('--bg', item.getAttribute('data-bg'));
      links.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + item.id;
        if (on) {
          a.setAttribute('aria-current', 'true');
          if (strip && strip.scrollWidth > strip.clientWidth) {
            strip.scrollTo({ left: a.parentNode.offsetLeft - 20, behavior: reduce ? 'auto' : 'smooth' });
          }
        } else a.removeAttribute('aria-current');
      });
    };
    if ('IntersectionObserver' in window) {
      var seen = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) setActive(e.target); });
      }, { rootMargin: '-45% 0px -50% 0px' });
      items.forEach(function (it) { seen.observe(it); });
    }
    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        var t = document.getElementById(a.getAttribute('href').slice(1));
        if (!t) return;
        e.preventDefault();
        t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        if (history.replaceState) history.replaceState(null, '', '#' + t.id);
        var h = $('h2, h3', t); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      });
    });
    setActive(items[0]);
  });

  /* ---- stacked panels: each panel slides in over the last as you scroll ---- */
  var stack = $('[data-stack]');
  if (stack && !reduce) {
    var panels = $$('.panel', stack);
    var wide = window.matchMedia('(min-width: 1000px)');
    var place = function () {
      if (!stack.classList.contains('is-live')) return;
      var r = stack.getBoundingClientRect();
      var span = stack.offsetHeight - window.innerHeight;
      var p = Math.min(Math.max(-r.top / span, 0), 1) * (panels.length - 1);
      panels.forEach(function (panel, i) {
        var t = i === 0 ? 0 : Math.min(Math.max(1 - (p - (i - 1)), 0), 1);
        panel.style.transform = 'translate3d(' + (t * 100) + '%,0,0)';
        panel.setAttribute('aria-hidden', String(t > 0.5));
        panel.inert = t > 0.5;
      });
    };
    var mode = function () {
      stack.classList.toggle('is-live', wide.matches);
      if (!wide.matches) panels.forEach(function (p) { p.style.transform = ''; p.removeAttribute('aria-hidden'); p.inert = false; });
      place();
    };
    (wide.addEventListener ? wide.addEventListener('change', mode) : wide.addListener(mode));
    window.addEventListener('scroll', function () { raf(place); }, { passive: true });
    window.addEventListener('resize', function () { raf(place); });
    mode();
  }

  /* ---- carousel: buttons and progress bar ---- */
  $$('[data-car]').forEach(function (car) {
    var track = $('.car__track', car);
    var bar = $('.car__bar i', car);
    var prev = $('[data-prev]', car);
    var next = $('[data-next]', car);
    var update = function () {
      var max = track.scrollWidth - track.clientWidth;
      var p = max > 0 ? track.scrollLeft / max : 0;
      if (bar) { var w = Math.max(track.clientWidth / track.scrollWidth, 0.12) * 100; bar.style.width = w + '%'; bar.style.left = (p * (100 - w)) + '%'; }
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max - 2;
    };
    var step = function (dir) {
      var card = $('.card', track);
      track.scrollBy({ left: dir * (card ? card.offsetWidth + 8 : 300), behavior: reduce ? 'auto' : 'smooth' });
    };
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });
    track.addEventListener('scroll', function () { raf(update); }, { passive: true });
    window.addEventListener('resize', update);
    var nav = $('.car__nav', car); if (nav) nav.hidden = false;
    update();
  });

  /* ---- filter chips (regions index, harvest calendar) ---- */
  $$('[data-filter-group]').forEach(function (group) {
    var target = document.getElementById(group.getAttribute('data-filter-group'));
    var buttons = $$('button', group);
    group.hidden = false;
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-filter');
        buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        $$('[data-tags]', target).forEach(function (el) {
          el.hidden = key !== 'all' && el.getAttribute('data-tags').split(' ').indexOf(key) === -1;
        });
      });
    });
  });

  /* ---- harvest calendar: mark this month ---- */
  var month = new Date().getMonth();
  $$('[data-cal] .cal__bar').forEach(function (bar) {
    var cell = bar.children[month];
    if (cell) cell.classList.add('now');
  });
  $$('[data-now-label]').forEach(function (el) { el.hidden = false; });

  /* ---- enquiry form ---- */
  var form = $('[data-enquiry]');
  if (form) {
    var params = new URLSearchParams(location.search);
    var journey = params.get('journey');
    if (journey) {
      var msg = $('#f-message', form);
      if (msg && !msg.value) msg.value = 'I’d like to talk about the sample journey “' + journey + '”.\n\n';
    }
    var region = params.get('region');
    if (region && window.CSS && CSS.escape) {
      var box = $('input[name="regions"][value="' + CSS.escape(region) + '"]', form);
      if (box) box.checked = true;
    }

    var setError = function (input, text) {
      var id = input.id + '-error';
      var el = document.getElementById(id);
      var described = (input.getAttribute('aria-describedby') || '').replace(id, '').trim();
      if (text) {
        if (!el) {
          el = document.createElement('p');
          el.className = 'error';
          el.id = id;
          (input.type === 'checkbox' ? input.parentNode : input).insertAdjacentElement('afterend', el);
        }
        el.textContent = text;
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', (described + ' ' + id).trim());
      } else {
        if (el) el.remove();
        input.removeAttribute('aria-invalid');
        if (described) input.setAttribute('aria-describedby', described); else input.removeAttribute('aria-describedby');
      }
    };

    form.setAttribute('novalidate', '');
    form.addEventListener('submit', function (e) {
      var first = null;
      $$('[required]', form).forEach(function (input) {
        var bad = input.type === 'checkbox' ? !input.checked : !input.value.trim();
        if (!bad && input.type === 'email') bad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
        var label = $('label[for="' + input.id + '"]', form);
        var name = label ? label.textContent.replace(/\s*\(.*\)\s*$/, '').trim() : 'This field';
        setError(input, bad ? (input.getAttribute('data-error') || (input.type === 'email' && input.value ? 'Enter an email address like name@example.com.' : name + ' is required.')) : '');
        if (bad && !first) first = input;
      });
      if (first) { e.preventDefault(); first.focus(); return; }
      if (form.getAttribute('data-mode') === 'mailto') {
        e.preventDefault();
        var data = new FormData(form);
        var lines = [];
        var seen = {};
        data.forEach(function (v, k) {
          if (k === 'consent' || k === '_gotcha') return;
          if (k in seen) { lines[seen[k]] += ', ' + v; return; }
          seen[k] = lines.length;
          lines.push(k + ': ' + v);
        });
        var subject = 'Journey enquiry from ' + (data.get('name') || 'the website');
        window.location.href = 'mailto:' + form.getAttribute('data-email') + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
        var status = document.getElementById('form-status');
        if (status) { status.hidden = false; status.focus(); }
      }
    });
  }
})();
