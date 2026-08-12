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

  function setMenu(open) {
    var trigger = document.querySelector('[data-auth-identity]');
    var menu = document.querySelector('[data-auth-menu]');
    if (!trigger || !menu) return;
    trigger.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
  }

  function render(session) {
    var authenticated = Boolean(session && session.authenticated);
    var lang = language();

    document.querySelectorAll('[data-auth-portal]').forEach(function (link) {
      link.classList.remove('auth-skeleton');
      link.removeAttribute('aria-busy');
      link.href = authenticated ? (session.destination || '/portal') : '/login';
      var label = link.querySelector('[data-auth-portal-label]');
      if (label) {
        label.textContent = authenticated
          ? (session.role === 'admin' ? (lang === 'ko' ? '관리자' : 'Admin') : (lang === 'ko' ? '포털' : 'Portal'))
          : (lang === 'ko' ? '로그인' : 'Log in');
      }
    });

    document.querySelectorAll('[data-auth-name]').forEach(function (node) {
      node.textContent = authenticated ? session.displayName : '';
    });

    document.querySelectorAll('[data-auth-cta]').forEach(function (node) {
      node.hidden = authenticated;
    });
    document.querySelectorAll('[data-auth-identity], [data-auth-identity-link], [data-auth-logout]').forEach(function (node) {
      node.hidden = !authenticated;
    });
    if (!authenticated) setMenu(false);
  }

  async function refresh() {
    var session = await sessionPromise;
    render(session);
    return session;
  }

  document.querySelectorAll('[data-auth-identity]').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      var menu = document.querySelector('[data-auth-menu]');
      setMenu(Boolean(menu && menu.hidden));
    });
  });

  document.addEventListener('click', function (event) {
    var menu = document.querySelector('[data-auth-menu]');
    var trigger = document.querySelector('[data-auth-identity]');
    if (!menu || menu.hidden) return;
    if (!menu.contains(event.target) && !trigger.contains(event.target)) setMenu(false);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') setMenu(false);
  });

  document.querySelectorAll('[data-auth-logout]').forEach(function (button) {
    button.addEventListener('click', async function () {
      button.disabled = true;
      try {
        var response = await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { Accept: 'application/json' },
        });
        var result = await response.json().catch(function () { return {}; });
        window.location.assign(result.destination || '/');
      } catch (error) {
        button.disabled = false;
      }
    });
  });

  document.querySelectorAll('[data-set-lang]').forEach(function (button) {
    button.addEventListener('click', function () {
      sessionPromise.then(render);
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
