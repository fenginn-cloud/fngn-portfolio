/* ============================================================
   Nisa & Mahmud Feyzullah — Nişan Daveti
   script.js — zarf açılışı + geri sayım + takvim
   ============================================================ */
(function () {
  "use strict";

  /* ---- DEĞİŞTİRİLEBİLİR ETKİNLİK BİLGİLERİ ---- */
  var CONFIG = {
    // Katılım bildirimi için Google Apps Script "Web uygulaması" /exec URL'si.
    // Boş bırakılırsa "Katılım Bildir" butonu gizlenir.
    rsvpEndpoint: "https://script.google.com/macros/s/AKfycbxD6_mEdSCVlre2oaHx2h2WuG9deIVvT9WWvkztpakjLkOC9k7OWVTJbjLe6UeOqQxwvw/exec",
    // Google'dan bağımsız ikinci kayıt (yedek): Formspree
    formspreeEndpoint: "https://formspree.io/f/mnngygyy",
    ics: {
      title:    "Nisa & Mahmud Feyzullah Nişan Töreni",
      startUTC: "20260829T163000Z", // 29 Ağustos 2026 19.30 TRT
      endUTC:   "20260829T200000Z", // 29 Ağustos 2026 23.00 TRT
      location: "Bahçe'm Event, Gölbaşı",
      mapUrl:   "https://maps.app.goo.gl/1Pt2jgpVTAWeJ5qx9?g_st=ic",
      description: "Nisa Korkmaz ve Mahmud Feyzullah Engin'in nişan töreni.",
      filename: "nisa-mahmud-feyzullah-nisan.ics"
    }
  };

  var prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============================================================
     PERDE AÇILIŞI + AÇILIŞ SESİ
     ============================================================ */
  var body = document.body;
  var intro = document.getElementById("intro");
  var card = document.getElementById("card");
  var opened = false;

  // Yumuşak açılış çıngırağı (Web Audio — dosya gerekmez, dokunuşla tetiklenir)
  function playChime() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { return; }
      var ctx = new AC();
      var now = ctx.currentTime;
      var notes = [587.33, 783.99, 1046.5]; // D5 · G5 · C6 — havadar, zarif
      var master = ctx.createGain();
      master.gain.value = 0.16;
      master.connect(ctx.destination);
      notes.forEach(function (f, i) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = f;
        var t = now + i * 0.14;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(1, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
        o.connect(g); g.connect(master);
        o.start(t); o.stop(t + 1.6);
      });
      setTimeout(function () { try { ctx.close(); } catch (e) {} }, 2200);
    } catch (e) { /* ses engellenirse sorun değil */ }
  }

  function openCurtain() {
    if (opened) { return; }
    opened = true;
    playChime();
    body.classList.remove("is-sealed");
    body.classList.add("is-open");
    if (card) { card.setAttribute("aria-hidden", "false"); }
    // Perde animasyonu bitince katmanı DOM'dan kaldır
    window.setTimeout(function () { if (intro) { intro.remove(); } }, 1500);
  }

  if (prefersReduced || !intro) {
    body.classList.remove("is-sealed");
    body.classList.add("is-ready");
    if (intro) { intro.remove(); }
    if (card) { card.setAttribute("aria-hidden", "false"); }
  } else {
    intro.addEventListener("click", openCurtain);
    intro.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openCurtain(); }
    });
  }

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

      // Katılım aynı anda İKİ bağımsız yere gönderilir:
      // 1) Google Apps Script (tablo + e-posta) — opak (no-cors)
      // 2) Formspree (Google'dan bağımsız yedek pano + e-posta)
      var sends = [];
      if (CONFIG.rsvpEndpoint) {
        sends.push(fetch(CONFIG.rsvpEndpoint, { method: "POST", mode: "no-cors", body: params }));
      }
      if (CONFIG.formspreeEndpoint) {
        sends.push(fetch(CONFIG.formspreeEndpoint, {
          method: "POST",
          headers: { "Accept": "application/json" },
          body: params
        }));
      }

      Promise.allSettled(sends).then(function (results) {
        var anyOk = results.some(function (r) { return r.status === "fulfilled"; });
        if (anyOk) {
          form.hidden = true;
          if (thanks) { thanks.hidden = false; }
        } else {
          submitBtn.disabled = false;
          submitBtn.textContent = "Gönder";
          msg.textContent = "Bağlantı hatası. Lütfen tekrar deneyin.";
        }
      });
    });
  }
})();
