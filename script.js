/* ============================================================
   Nisa & Mahmud Feyzullah — Nişan Daveti
   script.js  (Vanilla JavaScript, bağımlılık yok)

   1) Etkinlik yapılandırması
   2) Sinematik açılış perdesi
   3) Sürüklenen yaprak parçacıkları (canvas)
   4) Canlı geri sayım (Europe/Istanbul)
   5) Takvime ekleme (.ics)
   6) Scroll reveal animasyonları
   ============================================================ */

(function () {
  "use strict";

  /* ---- DEĞİŞTİRİLEBİLİR ETKİNLİK BİLGİLERİ ---- */
  var CONFIG = {
    targetISO: "2026-08-29T19:00:00+03:00",
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
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============================================================
     2) SİNEMATİK AÇILIŞ PERDESİ
     ============================================================ */
  var veil = document.getElementById("veil");

  function openHero() {
    document.body.classList.remove("veil-open");
    document.body.classList.add("is-ready");
  }

  if (prefersReduced || !veil) {
    // Hareket azaltma: perde yok, doğrudan içerik
    if (veil) { veil.remove(); }
    document.body.classList.add("is-ready");
  } else {
    document.body.classList.add("veil-open");
    // Perde: giriş animasyonu bittikten sonra yukarı kalkar
    window.setTimeout(function () {
      veil.classList.add("is-lifted");
      openHero();
    }, 2400);
    // Perde geçişi bitince DOM'dan kaldır (erişim/performans)
    veil.addEventListener("transitionend", function (e) {
      if (e.propertyName === "transform") { veil.remove(); }
    });
  }

  /* ============================================================
     3) SÜRÜKLENEN YAPRAK PARÇACIKLARI (canvas)
     Az sayıda, yumuşak, çok yavaş — sakin sinematik atmosfer.
     ============================================================ */
  (function petals() {
    var canvas = document.getElementById("petals");
    if (!canvas || prefersReduced) { if (canvas) canvas.remove(); return; }

    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;
    var COLORS = ["rgba(215,166,173,", "rgba(152,166,143,", "rgba(185,120,130,"];
    var parts = [];

    function resize() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makePetal(y) {
      return {
        x: Math.random() * W,
        y: y != null ? y : Math.random() * H,
        r: 5 + Math.random() * 9,            // boyut
        vy: 0.12 + Math.random() * 0.28,     // düşme hızı (yavaş)
        sway: 0.4 + Math.random() * 0.8,     // salınım genliği
        phase: Math.random() * Math.PI * 2,
        drift: 0.002 + Math.random() * 0.004,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.006,
        alpha: 0.10 + Math.random() * 0.16,
        color: COLORS[(Math.random() * COLORS.length) | 0]
      };
    }

    function seed() {
      // Ekran boyutuna göre az sayıda parçacık (performans)
      var count = Math.max(9, Math.min(20, Math.round(W / 70)));
      parts = [];
      for (var i = 0; i < count; i++) { parts.push(makePetal()); }
    }

    function drawPetal(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot + Math.sin(p.phase) * 0.3);
      ctx.beginPath();
      // Yumuşak yaprak/petal formu
      ctx.moveTo(0, -p.r);
      ctx.quadraticCurveTo(p.r * 0.9, -p.r * 0.2, 0, p.r);
      ctx.quadraticCurveTo(-p.r * 0.9, -p.r * 0.2, 0, -p.r);
      ctx.fillStyle = p.color + p.alpha + ")";
      ctx.fill();
      ctx.restore();
    }

    var running = true;
    function frame() {
      if (!running) { return; }
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.phase += p.drift * 16;
        p.y += p.vy;
        p.x += Math.sin(p.phase) * p.sway * 0.4;
        p.rot += p.vr;
        if (p.y - p.r > H) {         // alttan çıkınca üstten geri gir
          p.y = -p.r * 2; p.x = Math.random() * W;
        }
        drawPetal(p);
      }
      requestAnimationFrame(frame);
    }

    // Sekme arka plandayken animasyonu durdur (pil/performans)
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { running = false; }
      else if (!running) { running = true; requestAnimationFrame(frame); }
    });

    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () { resize(); seed(); }, 200);
    });

    resize(); seed(); requestAnimationFrame(frame);
  })();

  /* ============================================================
     4) CANLI GERİ SAYIM
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
  var timerId = null, lastDayValue = null;

  function pad(n, len) { var s = String(n); while (s.length < (len || 2)) { s = "0" + s; } return s; }
  function setNum(node, value) { if (node && node.textContent !== value) { node.textContent = value; } }

  function renderCountdown() {
    var diff = target - Date.now();
    if (diff <= 0) {
      if (el.grid) { el.grid.hidden = true; }
      if (el.done) { el.done.hidden = false; }
      if (el.sr)   { el.sr.textContent = "Etkinlik günü geldi."; }
      if (timerId) { clearInterval(timerId); timerId = null; }
      return;
    }
    var t = Math.floor(diff / 1000);
    var days  = Math.floor(t / 86400);
    var hours = Math.floor((t % 86400) / 3600);
    var mins  = Math.floor((t % 3600) / 60);
    var secs  = t % 60;
    setNum(el.days,  pad(days, 3));
    setNum(el.hours, pad(hours));
    setNum(el.mins,  pad(mins));
    setNum(el.secs,  pad(secs));
    if (el.sr && days !== lastDayValue) {
      lastDayValue = days;
      el.sr.textContent =
        "Etkinliğe kalan süre: " + days + " gün, " + hours + " saat, " + mins + " dakika.";
    }
  }
  function startCountdown() { renderCountdown(); if (!timerId) { timerId = setInterval(renderCountdown, 1000); } }
  document.addEventListener("visibilitychange", function () { if (!document.hidden) { renderCountdown(); } });
  startCountdown();

  /* ============================================================
     5) TAKVİME EKLEME (.ics)
     ============================================================ */
  function pad2(n) { return n < 10 ? "0" + n : "" + n; }
  function icsTimestamp(date) {
    return (
      date.getUTCFullYear() + pad2(date.getUTCMonth() + 1) + pad2(date.getUTCDate()) + "T" +
      pad2(date.getUTCHours()) + pad2(date.getUTCMinutes()) + pad2(date.getUTCSeconds()) + "Z"
    );
  }
  function icsEscape(text) {
    return String(text).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  }
  function buildICS() {
    var c = CONFIG.ics;
    var desc = c.description + " Konum: " + c.mapUrl;
    var lines = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Nisan Daveti//TR",
      "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:nisa-mahmud-feyzullah-2026@nisan-daveti",
      "DTSTAMP:" + icsTimestamp(new Date()),
      "DTSTART:" + c.startUTC, "DTEND:" + c.endUTC,
      "SUMMARY:" + icsEscape(c.title),
      "LOCATION:" + icsEscape(c.location),
      "DESCRIPTION:" + icsEscape(desc),
      "URL:" + c.mapUrl, "STATUS:CONFIRMED", "TRANSP:OPAQUE",
      "END:VEVENT", "END:VCALENDAR"
    ];
    return lines.join("\r\n");
  }
  function downloadICS() {
    var blob = new Blob([buildICS()], { type: "text/calendar;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = CONFIG.ics.filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }
  var icsBtn = document.getElementById("ics-btn");
  if (icsBtn) { icsBtn.addEventListener("click", downloadICS); }

  /* ============================================================
     6) SCROLL REVEAL
     ============================================================ */
  var revealEls = document.querySelectorAll(".reveal");
  if (prefersReduced || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (node) { node.classList.add("is-visible"); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (node) { observer.observe(node); });
  }
})();
