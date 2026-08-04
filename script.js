/* ============================================================
   Nisa & Mahmud Feyzullah — Nişan Daveti
   script.js — zarf açılışı + geri sayım + takvim
   ============================================================ */
(function () {
  "use strict";

  /* ---- DEĞİŞTİRİLEBİLİR ETKİNLİK BİLGİLERİ ---- */
  var CONFIG = {
    targetISO: "2026-08-29T19:00:00+03:00",
    // Katılım bildirimi için Google Apps Script "Web uygulaması" /exec URL'si.
    // Boş bırakılırsa "Katılım Bildir" butonu gizlenir.
    rsvpEndpoint: "https://script.google.com/macros/s/AKfycbxD6_mEdSCVlre2oaHx2h2WuG9deIVvT9WWvkztpakjLkOC9k7OWVTJbjLe6UeOqQxwvw/exec",
    ics: {
      title:    "Nisa & Mahmud Feyzullah Nişan Töreni",
      startUTC: "20260829T160000Z", // 29 Ağustos 2026 19.00 TRT
      endUTC:   "20260829T200000Z", // 29 Ağustos 2026 23.00 TRT
      location: "Bahçem Lounge",
      mapUrl:   "https://maps.app.goo.gl/74moU6DSwXH2Yefm8?g_st=ic",
      description: "Nisa Korkmaz ve Mahmud Feyzullah Engin'in nişan töreni.",
      filename: "nisa-mahmud-feyzullah-nisan.ics"
    }
  };

  var prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============================================================
     ZARF AÇILIŞI
     ============================================================ */
  var body = document.body;
  var intro = document.getElementById("intro");
  var env = document.getElementById("env");
  var card = document.getElementById("card");
  var opened = false;

  function openEnvelope() {
    if (opened) { return; }
    opened = true;
    body.classList.remove("is-sealed");
    body.classList.add("is-open");
    if (card) { card.setAttribute("aria-hidden", "false"); }
    // Animasyon bitince zarfı DOM'dan kaldır
    window.setTimeout(function () { if (intro) { intro.remove(); } }, 2000);
  }

  if (prefersReduced || !intro || !env) {
    // Hareket azaltma: doğrudan kart
    body.classList.remove("is-sealed");
    body.classList.add("is-ready");
    if (intro) { intro.remove(); }
    if (card) { card.setAttribute("aria-hidden", "false"); }
  } else {
    env.addEventListener("click", openEnvelope);
    env.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEnvelope(); }
    });
    // Zarfın herhangi bir yerine dokunmak da açar
    intro.addEventListener("click", function (e) {
      if (e.target !== env && !env.contains(e.target)) { openEnvelope(); }
    });
  }

  /* ============================================================
     CANLI GERİ SAYIM (Europe/Istanbul)
     ============================================================ */
  var target = new Date(CONFIG.targetISO).getTime();
  var el = {
    days:  document.getElementById("cd-days"),
    hours: document.getElementById("cd-hours"),
    mins:  document.getElementById("cd-mins"),
    secs:  document.getElementById("cd-secs"),
    grid:  document.getElementById("countdown"),
    done:  document.getElementById("countdown-done"),
    sr:    document.getElementById("cd-sr")
  };
  var timerId = null, lastDay = null;

  function pad(n, len) { var s = String(n); while (s.length < (len || 2)) { s = "0" + s; } return s; }
  function setNum(node, v) { if (node && node.textContent !== v) { node.textContent = v; } }

  function render() {
    var diff = target - Date.now();
    if (diff <= 0) {
      if (el.grid) { el.grid.hidden = true; }
      if (el.done) { el.done.hidden = false; }
      if (el.sr)   { el.sr.textContent = "Etkinlik günü geldi."; }
      if (timerId) { clearInterval(timerId); timerId = null; }
      return;
    }
    var t = Math.floor(diff / 1000);
    var d = Math.floor(t / 86400);
    var h = Math.floor((t % 86400) / 3600);
    var m = Math.floor((t % 3600) / 60);
    var s = t % 60;
    setNum(el.days, pad(d, 3));
    setNum(el.hours, pad(h));
    setNum(el.mins, pad(m));
    setNum(el.secs, pad(s));
    if (el.sr && d !== lastDay) {
      lastDay = d;
      el.sr.textContent = "Etkinliğe kalan süre: " + d + " gün, " + h + " saat, " + m + " dakika.";
    }
  }
  function start() { render(); if (!timerId) { timerId = setInterval(render, 1000); } }
  document.addEventListener("visibilitychange", function () { if (!document.hidden) { render(); } });
  start();

  /* ============================================================
     TAKVİME EKLEME (.ics)
     ============================================================ */
  function pad2(n) { return n < 10 ? "0" + n : "" + n; }
  function ts(date) {
    return date.getUTCFullYear() + pad2(date.getUTCMonth() + 1) + pad2(date.getUTCDate()) + "T" +
           pad2(date.getUTCHours()) + pad2(date.getUTCMinutes()) + pad2(date.getUTCSeconds()) + "Z";
  }
  function esc(t) { return String(t).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n"); }
  function buildICS() {
    var c = CONFIG.ics;
    var desc = c.description + " Konum: " + c.mapUrl;
    return [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Nisan Daveti//TR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
      "BEGIN:VEVENT", "UID:nisa-mahmud-feyzullah-2026@nisan-daveti", "DTSTAMP:" + ts(new Date()),
      "DTSTART:" + c.startUTC, "DTEND:" + c.endUTC, "SUMMARY:" + esc(c.title),
      "LOCATION:" + esc(c.location), "DESCRIPTION:" + esc(desc), "URL:" + c.mapUrl,
      "STATUS:CONFIRMED", "TRANSP:OPAQUE", "END:VEVENT", "END:VCALENDAR"
    ].join("\r\n");
  }
  var icsBtn = document.getElementById("ics-btn");
  if (icsBtn) {
    icsBtn.addEventListener("click", function () {
      var blob = new Blob([buildICS()], { type: "text/calendar;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url; a.download = CONFIG.ics.filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    });
  }

  /* ============================================================
     KATILIM BİLDİRME (RSVP)
     Google Apps Script (Sheets) uç noktasına no-cors POST.
     ============================================================ */
  var rsvpOpen  = document.getElementById("rsvp-open");
  var modal     = document.getElementById("rsvp-modal");
  var form      = document.getElementById("rsvp-form");
  var thanks    = document.getElementById("rsvp-thanks");
  var msg       = document.getElementById("rsvp-msg");
  var submitBtn = document.getElementById("rsvp-submit");
  var lastFocus = null;

  // Uç nokta tanımlıysa butonu göster
  if (rsvpOpen && CONFIG.rsvpEndpoint) { rsvpOpen.hidden = false; }

  function openModal() {
    if (!modal) { return; }
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    var first = modal.querySelector("input, textarea, button");
    if (first) { first.focus(); }
    document.addEventListener("keydown", onKey);
  }
  function closeModal() {
    if (!modal) { return; }
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    document.removeEventListener("keydown", onKey);
    if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
  }
  function onKey(e) { if (e.key === "Escape") { closeModal(); } }

  if (rsvpOpen) { rsvpOpen.addEventListener("click", openModal); }
  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target.hasAttribute && e.target.closest("[data-close]")) { closeModal(); }
    });
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      msg.textContent = "";
      var data = new FormData(form);
      var ad = (data.get("ad") || "").toString().trim();
      var durum = data.get("durum");
      if (!ad) { msg.textContent = "Lütfen ad soyad yazın."; return; }
      if (!durum) { msg.textContent = "Lütfen katılım durumunu seçin."; return; }

      submitBtn.disabled = true;
      submitBtn.textContent = "Gönderiliyor…";

      var params = new URLSearchParams();
      params.append("ad", ad);
      params.append("durum", durum);
      params.append("kisi", (data.get("kisi") || "1").toString());
      params.append("not", (data.get("not") || "").toString());
      params.append("kaynak", "davet.fngn.com.tr");

      fetch(CONFIG.rsvpEndpoint, { method: "POST", mode: "no-cors", body: params })
        .then(function () {
          form.hidden = true;
          if (thanks) { thanks.hidden = false; }
        })
        .catch(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = "Gönder";
          msg.textContent = "Bağlantı hatası. Lütfen tekrar deneyin.";
        });
    });
  }
})();
