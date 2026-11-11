/* Imóveis Marcos Pereira
   IntersectionObserver para tudo que revela, nenhum loop permanente. */
(function () {
  "use strict";

  // WhatsApp da imobiliária (mesmo número do telefone fixo, confirmado)
  var WA = "551122530711";

  var root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var waLink = function (msg) { return "https://wa.me/" + WA + "?text=" + encodeURIComponent(msg); };

  // entrada do hero
  // rAF não dispara em aba de fundo; o timeout garante que o hero nunca fica escondido
  var ready = function () {
    root.classList.add("is-ready");
    var h1 = $(".hero h1");
    if (h1) h1.classList.add("is-in");
  };
  requestAnimationFrame(ready);
  setTimeout(ready, 400);

  // ano no rodapé
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // links prontos para o WhatsApp
  $$("[data-wa]").forEach(function (a) {
    a.href = waLink(a.getAttribute("data-wa"));
    a.target = "_blank";
    a.rel = "noopener";
  });

  // reveal: uma vez por elemento, depois desconecta
  var targets = $$(".mask, .clip, [data-journey]").filter(function (el) { return !el.closest(".hero"); });
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.1 });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add("is-in"); });
  }

  // nav sólida, barra de progresso e barra fixa do celular
  var nav = $("[data-nav]");
  var bar = $("[data-progress]");
  var dock = $("[data-dock]");
  var contato = $("#contato");
  var heroForm = $(".hero form");
  var docH = 1;
  var measure = function () { docH = Math.max(1, document.documentElement.scrollHeight - window.innerHeight); };
  var ticking = false;
  var update = function () {
    ticking = false;
    var y = window.scrollY;
    nav.classList.toggle("is-solid", y > 12);
    bar.style.transform = "scaleX(" + Math.min(1, y / docH) + ")";
  };
  measure(); update();
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener("resize", function () { measure(); update(); });
  window.addEventListener("load", measure);

  // a barra fixa aparece depois do formulário do hero e some na seção de contato
  if (dock && "IntersectionObserver" in window) {
    var heroGone = false, atContact = false;
    var setDock = function () { dock.classList.toggle("is-on", heroGone && !atContact); };
    new IntersectionObserver(function (e) { heroGone = !e[0].isIntersecting && e[0].boundingClientRect.top < 0; setDock(); }).observe(heroForm);
    new IntersectionObserver(function (e) { atContact = e[0].isIntersecting; setDock(); }).observe(contato);
  }

  // setas do carrossel de tipos
  var track = $("[data-track]");
  $$(".arrow").forEach(function (b) {
    b.addEventListener("click", function () {
      var card = track.firstElementChild;
      var step = card ? card.getBoundingClientRect().width + 20 : 300;
      track.scrollBy({ left: step * Number(b.getAttribute("data-dir")), behavior: reduce ? "auto" : "smooth" });
    });
  });

  // máscara de telefone
  $$('input[type="tel"]').forEach(function (inp) {
    inp.addEventListener("input", function () {
      var d = inp.value.replace(/\D/g, "").slice(0, 11);
      var out = d;
      if (d.length > 2) out = "(" + d.slice(0, 2) + ") " + d.slice(2);
      if (d.length > 7) out = "(" + d.slice(0, 2) + ") " + d.slice(2, d.length - 4) + "-" + d.slice(-4);
      inp.value = out;
      inp.removeAttribute("aria-invalid");
    });
  });
  $$("[data-form] input[name=nome]").forEach(function (inp) {
    inp.addEventListener("input", function () { inp.removeAttribute("aria-invalid"); });
  });

  // formulários: monta a mensagem e abre o WhatsApp
  $$("[data-form]").forEach(function (form) {
    var err = $(".form__err", form);
    var done = $(".form__done", form);
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var nome = form.nome.value.trim();
      var cel = form.cel.value.replace(/\D/g, "");
      var problems = [];
      form.nome.toggleAttribute("aria-invalid", nome.length < 2);
      form.cel.toggleAttribute("aria-invalid", cel.length < 10);
      if (nome.length < 2) problems.push("seu nome");
      if (cel.length < 10) problems.push("o WhatsApp com DDD");
      if (problems.length) {
        err.textContent = "Faltou preencher " + problems.join(" e ") + ".";
        err.hidden = false;
        (nome.length < 2 ? form.nome : form.cel).focus();
        return;
      }
      err.hidden = true;

      var quero = (form.querySelector("input[name=quero]:checked") || {}).value || "falar com vocês";
      var linhas = ["Olá! Meu nome é " + nome + " e vim pelo site.", "Quero " + quero + "."];
      if (form.tipo && form.tipo.value) linhas.push("Tipo de imóvel: " + form.tipo.value + ".");
      if (form.msg && form.msg.value.trim()) linhas.push(form.msg.value.trim());
      linhas.push("Meu WhatsApp: " + form.cel.value);
      var url = waLink(linhas.join("\n"));

      $("[data-open]", done).href = url;
      form.classList.add("is-sent");
      done.hidden = false;
      window.open(url, "_blank", "noopener");
    });
  });
})();
