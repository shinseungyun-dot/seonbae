(function () {
  var COOKIE_NAME = 'seonbae_cookie_consent';
  var MAX_AGE = 180 * 24 * 60 * 60;

  function readChoice() {
    var prefix = COOKIE_NAME + '=';
    var item = document.cookie.split(';').map(function (part) { return part.trim(); }).find(function (part) { return part.indexOf(prefix) === 0; });
    if (!item) return null;
    try {
      var choice = JSON.parse(decodeURIComponent(item.slice(prefix.length)));
      return choice && choice.version === 1 ? choice : null;
    } catch (_) {
      return null;
    }
  }

  function writeChoice(choice) {
    var secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = COOKIE_NAME + '=' + encodeURIComponent(JSON.stringify(choice)) + '; Path=/; Max-Age=' + MAX_AGE + '; SameSite=Lax' + secure;
    window.dispatchEvent(new CustomEvent('seonbae:consent', { detail: choice }));
  }

  var root = document.querySelector('[data-cookie-consent]');
  var dialog = document.querySelector('[data-cookie-dialog]');
  var analytics = dialog && dialog.querySelector('[data-cookie-analytics]');
  var marketing = dialog && dialog.querySelector('[data-cookie-marketing]');

  function openSettings() {
    if (!dialog) return;
    var choice = readChoice();
    if (analytics) analytics.checked = Boolean(choice && choice.analytics);
    if (marketing) marketing.checked = Boolean(choice && choice.marketing);
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  function save(analyticsAllowed, marketingAllowed) {
    writeChoice({ version: 1, necessary: true, analytics: analyticsAllowed, marketing: marketingAllowed, updatedAt: new Date().toISOString() });
    if (root) root.hidden = true;
    if (dialog && dialog.open) dialog.close();
  }

  if (root) root.hidden = Boolean(readChoice());
  document.querySelector('[data-cookie-necessary]')?.addEventListener('click', function () { save(false, false); });
  document.querySelector('[data-cookie-allow-all]')?.addEventListener('click', function () { save(true, true); });
  document.querySelector('[data-cookie-customize]')?.addEventListener('click', openSettings);
  document.querySelector('[data-cookie-save]')?.addEventListener('click', function () { save(Boolean(analytics && analytics.checked), Boolean(marketing && marketing.checked)); });
  document.addEventListener('click', function (event) {
    var target = event.target instanceof Element ? event.target.closest('[data-cookie-settings]') : null;
    if (!target) return;
    event.preventDefault();
    openSettings();
  });
})();
