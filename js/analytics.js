/**
 * Carregamento condicional do Meta Pixel e do Google Analytics 4.
 * Os IDs são lidos de config.js — nada é carregado enquanto os campos
 * META_PIXEL_ID / GA4_MEASUREMENT_ID estiverem vazios.
 * Este arquivo deve ser incluído DEPOIS de config.js.
 */
(function () {
  "use strict";
  var CFG = window.SITE_CONFIG || {};

  /* ---------------- Meta Pixel ---------------- */
  if (CFG.META_PIXEL_ID) {
    /* eslint-disable */
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    /* eslint-enable */
    fbq("init", CFG.META_PIXEL_ID);
    fbq("track", "PageView");
  }

  /* ---------------- Google Analytics 4 ---------------- */
  if (CFG.GA4_MEASUREMENT_ID) {
    var gaScript = document.createElement("script");
    gaScript.async = true;
    gaScript.src = "https://www.googletagmanager.com/gtag/js?id=" + CFG.GA4_MEASUREMENT_ID;
    document.head.appendChild(gaScript);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      dataLayer.push(arguments);
    };
    gtag("js", new Date());
    gtag("config", CFG.GA4_MEASUREMENT_ID);
  }
})();
