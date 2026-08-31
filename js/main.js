/**
 * Script principal do site — navegação suave, animações discretas,
 * aplicação do link de checkout central e disparo de eventos de conversão
 * (estrutura preparada para Meta Pixel / Google Analytics).
 */
(function () {
  "use strict";

  var CFG = window.SITE_CONFIG || {};

  /* ---------------------------------------------------------------
   * 1) Aplica o link de checkout central em todos os botões de compra
   * ------------------------------------------------------------- */
  function applyCheckoutLinks() {
    var buttons = document.querySelectorAll("[data-checkout-btn]");
    buttons.forEach(function (btn) {
      if (CFG.CHECKOUT_URL) {
        btn.setAttribute("href", CFG.CHECKOUT_URL);
      }
      btn.addEventListener("click", function () {
        trackConversionEvent(btn.getAttribute("data-cta-label") || "CTA");
      });
    });
  }

  /* ---------------------------------------------------------------
   * 2) Eventos de conversão — preparado para Meta Pixel e GA4
   * ------------------------------------------------------------- */
  function trackConversionEvent(label) {
    // Meta Pixel
    if (typeof fbq === "function") {
      fbq("track", "InitiateCheckout", { content_name: label });
    }
    // Google Analytics 4
    if (typeof gtag === "function") {
      gtag("event", "begin_checkout", { item_name: label });
    }
    // Sempre loga no console para depuração em ambiente de teste
    console.log("[conversion event] CTA clicado:", label);
  }
  window.trackConversionEvent = trackConversionEvent;

  /* ---------------------------------------------------------------
   * 3) Navegação suave entre seções (âncoras internas)
   * ------------------------------------------------------------- */
  function enableSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function (e) {
        var targetId = link.getAttribute("href");
        if (targetId.length < 2) return;
        var target = document.querySelector(targetId);
        if (!target) return;
        e.preventDefault();
        var headerOffset = 76;
        var top =
          target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top: top, behavior: "smooth" });
      });
    });
  }

  /* ---------------------------------------------------------------
   * 4) Animações discretas de entrada (reveal on scroll)
   * ------------------------------------------------------------- */
  function enableRevealAnimations() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window) || items.length === 0) {
      items.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    items.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ---------------------------------------------------------------
   * 5) Header com sombra ao rolar + barra fixa de CTA mobile
   * ------------------------------------------------------------- */
  function enableHeaderScrollState() {
    var header = document.querySelector(".site-header");
    var stickyBar = document.querySelector(".mobile-sticky-cta");
    if (!header) return;
    var onScroll = function () {
      var scrolled = window.scrollY > 12;
      header.classList.toggle("is-scrolled", scrolled);
      if (stickyBar) {
        stickyBar.classList.toggle("is-visible", window.scrollY > 420);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------------------------
   * 6) Formulário de captura de leads (checklist-gratis.html)
   * ------------------------------------------------------------- */
  function enableLeadForm() {
    var form = document.querySelector("#lead-form");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var nome = form.querySelector("#lead-nome").value.trim();
      var email = form.querySelector("#lead-email").value.trim();
      var feedback = form.querySelector(".form-feedback");
      var submitBtn = form.querySelector('button[type="submit"]');

      if (!nome || !email) {
        showFeedback(feedback, "Preencha nome e e-mail para continuar.", true);
        return;
      }

      var payload = {
        nome: nome,
        email: email,
        origem: "checklist-gratis",
        data: new Date().toISOString(),
      };

      submitBtn.disabled = true;
      submitBtn.textContent = "Enviando...";

      // Estrutura preparada para integração futura (ex.: e-mail marketing, WhatsApp, planilha).
      // Caso um webhook seja configurado em config.js, os dados são enviados para lá.
      var sendPromise;
      if (CFG.LEAD_WEBHOOK_URL) {
        sendPromise = fetch(CFG.LEAD_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch(function (err) {
          console.warn("Falha ao enviar lead para o webhook:", err);
        });
      } else {
        // Fallback local até a integração ser configurada.
        try {
          var leads = JSON.parse(localStorage.getItem("leads_checklist_gratis") || "[]");
          leads.push(payload);
          localStorage.setItem("leads_checklist_gratis", JSON.stringify(leads));
        } catch (err) {
          /* localStorage indisponível — ignora silenciosamente */
        }
        sendPromise = Promise.resolve();
      }

      sendPromise.finally(function () {
        if (typeof fbq === "function") {
          fbq("track", "Lead", { content_name: "checklist-gratis" });
        }
        if (typeof gtag === "function") {
          gtag("event", "generate_lead", { item_name: "checklist-gratis" });
        }
        submitBtn.disabled = false;
        submitBtn.textContent = "QUERO MEU CHECKLIST GRÁTIS";
        form.reset();
        showFeedback(
          feedback,
          "Prontinho, " + nome.split(" ")[0] + "! Em breve você recebe o checklist no e-mail informado.",
          false
        );
      });
    });
  }

  function showFeedback(el, message, isError) {
    if (!el) return;
    el.textContent = message;
    el.classList.toggle("is-error", !!isError);
    el.classList.add("is-visible");
  }

  /* ---------------------------------------------------------------
   * 7) Menu mobile (abre/fecha) — usado apenas se presente na página
   * ------------------------------------------------------------- */
  function enableMobileMenu() {
    var toggle = document.querySelector(".menu-toggle");
    var menu = document.querySelector(".site-nav");
    if (!toggle || !menu) return;
    toggle.addEventListener("click", function () {
      var isOpen = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyCheckoutLinks();
    enableSmoothScroll();
    enableRevealAnimations();
    enableHeaderScrollState();
    enableLeadForm();
    enableMobileMenu();
  });
})();
