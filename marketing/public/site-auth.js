(function () {
  var sessionPromise = window.__seonbaeSessionPromise || fetch('/api/auth/session', {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  }).then(function (response) {
    return response.ok ? response.json() : { authenticated: false };
  }).catch(function () {
    return { authenticated: false };
  });

  function language() {
    return document.documentElement.dataset.lang === 'en' ? 'en' : 'ko';
  }

  function render(session) {
    var authenticated = Boolean(session && session.authenticated);
    var lang = language();

    document.querySelectorAll('[data-auth-primary]').forEach(function (link) {
      link.classList.remove('auth-pending');
      link.removeAttribute('aria-busy');
      link.removeAttribute('aria-hidden');
      link.removeAttribute('tabindex');
      link.href = authenticated ? (session.destination || '/portal') : '/login';
      var label = link.querySelector('[data-auth-primary-label]');
      if (label) label.textContent = authenticated
        ? (session.role === 'admin'
          ? (lang === 'ko' ? '관리자' : 'Admin')
          : (lang === 'ko' ? '포털' : 'Portal'))
        : (lang === 'ko' ? '로그인' : 'Log in');
    });
  }

  async function refresh() {
    var session = await sessionPromise;
    render(session);
    return session;
  }

  document.querySelectorAll('[data-set-lang]').forEach(function (button) {
    button.addEventListener('click', function () {
      sessionPromise.then(function (session) {
        window.requestAnimationFrame(function () { render(session); });
      });
    });
  });

  window.addEventListener('pageshow', function (event) {
    if (!event.persisted) return;
    sessionPromise = fetch('/api/auth/session', {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    }).then(function (response) {
      return response.ok ? response.json() : { authenticated: false };
    });
    refresh();
  });

  refresh();
})();
