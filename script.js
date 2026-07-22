/* ============================================================
   Nisa & Mahmud Feyzullah — Nişan Daveti
   script.js  (Vanilla JavaScript, bağımlılık yok)

   Bu dosyada:
   1) Etkinlik yapılandırması (tarih, saat, isim, mekân)
   2) Canlı geri sayım (Europe/Istanbul)
   3) Takvime ekleme (.ics üretimi)
   4) Reveal animasyonları (IntersectionObserver)
   ============================================================ */

(function () {
  "use strict";

  /* ---- DEĞİŞTİRİLEBİLİR ETKİNLİK BİLGİLERİ ----
     Tarih, saat, isim ve mekânı buradan güncelleyin. */
  var CONFIG = {
    // Geri sayım hedefi — Türkiye saati (+03:00) sabit ofset ile
    targetISO:  "2026-08-29T19:00:00+03:00",
    // Takvim (.ics) bilgileri — UTC karşılıkları (19.00 ve 23.00 TRT = 16.00 / 20.00 UTC)
    ics: {
      title:      "Nisa & Mahmud Feyzullah Nişan Töreni",
      startUTC:   "20260829T160000Z", // 29 Ağustos 2026 19.00 TRT
      endUTC:     "20260829T200000Z", // 29 Ağustos 2026 23.00 TRT
      location:   "Bahçem Lounge",
      mapUrl:     "https://maps.app.goo.gl/74moU6DSwXH2Yefm8?g_st=ic",
      description:
        "Nisa Korkmaz ve Mahmud Feyzullah Engin'in nişan töreni.",
      filename:   "nisa-mahmud-feyzullah-nisan.ics"
    }
  };

  /* ============================================================
     1) CANLI GERİ SAYIM
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

  var timerId = null;
  var lastDayValue = null;

  function pad(n, len) {
    var s = String(n);
    while (s.length < (len || 2)) { s = "0" + s; }
    return s;
  }

  function setNum(node, value) {
    if (node.textContent !== value) {
      node.textContent = value;
    }
  }

  function renderCountdown() {
    // Cihaz saat dilimi fark etmeksizin doğru: karşılaştırma mutlak zaman (epoch) üzerinden
    var diff = target - Date.now();

    if (diff <= 0) {
      // Tarih geçti — sayaç yerine karşılama mesajı
      if (el.grid) { el.grid.hidden = true; }
      if (el.done) { el.done.hidden = false; }
      if (el.sr)   { el.sr.textContent = "Etkinlik günü geldi."; }
      if (timerId) { clearInterval(timerId); timerId = null; }
      return;
    }

    var totalSec = Math.floor(diff / 1000);
    var days  = Math.floor(totalSec / 86400);
    var hours = Math.floor((totalSec % 86400) / 3600);
    var mins  = Math.floor((totalSec % 3600) / 60);
    var secs  = totalSec % 60;

    setNum(el.days,  pad(days, 3));
    setNum(el.hours, pad(hours));
    setNum(el.mins,  pad(mins));
    setNum(el.secs,  pad(secs));

    // Ekran okuyucu için — dakikada bir kez okunabilir özet
    if (el.sr && days !== lastDayValue) {
      lastDayValue = days;
      el.sr.textContent =
        "Etkinliğe kalan süre: " + days + " gün, " + hours +
        " saat, " + mins + " dakika.";
    }
  }

  function startCountdown() {
    renderCountdown();
    if (!timerId) {
      timerId = setInterval(renderCountdown, 1000);
    }
  }

  // Sekme yeniden görünür olunca zamanı anında güncelle
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) { renderCountdown(); }
  });

  startCountdown();

  /* ============================================================
     2) TAKVİME EKLEME (.ics)
     ============================================================ */
  function pad2(n) { return n < 10 ? "0" + n : "" + n; }

  function icsTimestamp(date) {
    return (
      date.getUTCFullYear() +
      pad2(date.getUTCMonth() + 1) +
      pad2(date.getUTCDate()) + "T" +
      pad2(date.getUTCHours()) +
      pad2(date.getUTCMinutes()) +
      pad2(date.getUTCSeconds()) + "Z"
    );
  }

  // ICS metninde satır sonu ve virgül gibi karakterleri kaçış
  function icsEscape(text) {
    return String(text)
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  }

  function buildICS() {
    var c = CONFIG.ics;
    var desc = c.description + " Konum: " + c.mapUrl;
    var uid  = "nisa-mahmud-feyzullah-2026@nisan-daveti";

    // CRLF satır sonları — iPhone/Google/Outlook uyumu için önemli
    var lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Nisan Daveti//TR",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:" + uid,
      "DTSTAMP:" + icsTimestamp(new Date()),
      "DTSTART:" + c.startUTC,
      "DTEND:" + c.endUTC,
      "SUMMARY:" + icsEscape(c.title),
      "LOCATION:" + icsEscape(c.location),
      "DESCRIPTION:" + icsEscape(desc),
      "URL:" + c.mapUrl,
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "END:VEVENT",
      "END:VCALENDAR"
    ];
    return lines.join("\r\n");
  }

  function downloadICS() {
    var blob = new Blob([buildICS()], { type: "text/calendar;charset=utf-8" });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement("a");
    a.href = url;
    a.download = CONFIG.ics.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Belleği serbest bırak
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  var icsBtn = document.getElementById("ics-btn");
  if (icsBtn) {
    icsBtn.addEventListener("click", downloadICS);
  }

  /* ============================================================
     3) REVEAL ANİMASYONLARI
     ============================================================ */
  var prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var revealEls = document.querySelectorAll(".reveal");

  if (prefersReduced || !("IntersectionObserver" in window)) {
    // Hareket azaltma veya destek yoksa: her şey doğrudan görünür
    revealEls.forEach(function (node) { node.classList.add("is-visible"); });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach(function (node) { observer.observe(node); });
  }
})();
