// Runs before the page paints: applies the saved theme and text size, so there is no flash.
// Auto follows the sun, as on verbumdomini.ca: light from sunrise to sunset where the reader is, dark after.
// The place comes from the device's time zone alone (a table, or the zone's clock offset); nothing is sent anywhere.
(function () {
  var SUN_ZONES = {'Europe/Istanbul': [41, 29], 'Asia/Istanbul': [41, 29], 'Europe/London': [51.5, -0.1], 'Europe/Dublin': [53.3, -6.3], 'Europe/Berlin': [52.5, 13.4], 'Europe/Paris': [48.9, 2.4], 'Europe/Rome': [41.9, 12.5], 'Europe/Madrid': [40.4, -3.7], 'Europe/Amsterdam': [52.4, 4.9], 'Europe/Brussels': [50.8, 4.4], 'Europe/Vienna': [48.2, 16.4], 'Europe/Zurich': [47.4, 8.5], 'Europe/Stockholm': [59.3, 18.1], 'Europe/Oslo': [59.9, 10.8], 'Europe/Copenhagen': [55.7, 12.6], 'Europe/Warsaw': [52.2, 21], 'Europe/Athens': [38, 23.7], 'Europe/Lisbon': [38.7, -9.1], 'Europe/Moscow': [55.8, 37.6], 'Europe/Kiev': [50.5, 30.5], 'Europe/Kyiv': [50.5, 30.5], 'Asia/Nicosia': [35.2, 33.4], 'Europe/Nicosia': [35.2, 33.4], 'Asia/Beirut': [33.9, 35.5], 'Asia/Jerusalem': [31.8, 35.2], 'Asia/Baghdad': [33.3, 44.4], 'Asia/Tbilisi': [41.7, 44.8], 'Asia/Yerevan': [40.2, 44.5], 'Asia/Baku': [40.4, 49.9], 'Asia/Dubai': [25.2, 55.3], 'Asia/Tehran': [35.7, 51.4], 'America/New_York': [40.7, -74], 'America/Detroit': [42.3, -83], 'America/Chicago': [41.9, -87.6], 'America/Denver': [39.7, -105], 'America/Phoenix': [33.4, -112.1], 'America/Los_Angeles': [34.1, -118.2], 'America/Anchorage': [61.2, -149.9], 'Pacific/Honolulu': [21.3, -157.9], 'America/Toronto': [43.7, -79.4], 'America/Montreal': [45.5, -73.6], 'America/Halifax': [44.6, -63.6], 'America/St_Johns': [47.6, -52.7], 'America/Winnipeg': [49.9, -97.1], 'America/Regina': [50.4, -104.6], 'America/Edmonton': [53.5, -113.5], 'America/Vancouver': [49.3, -123.1], 'America/Mexico_City': [19.4, -99.1], 'America/Sao_Paulo': [-23.6, -46.6], 'America/Argentina/Buenos_Aires': [-34.6, -58.4], 'Australia/Sydney': [-33.9, 151.2], 'Australia/Melbourne': [-37.8, 145], 'Australia/Brisbane': [-27.5, 153], 'Australia/Adelaide': [-34.9, 138.6], 'Australia/Perth': [-31.9, 115.9], 'Australia/Hobart': [-42.9, 147.3], 'Australia/Darwin': [-12.5, 130.8], 'Pacific/Auckland': [-36.8, 174.8], 'Asia/Tokyo': [35.7, 139.7], 'Asia/Seoul': [37.6, 127], 'Asia/Shanghai': [31.2, 121.5], 'Asia/Hong_Kong': [22.3, 114.2], 'Asia/Singapore': [1.3, 103.8], 'Asia/Kolkata': [22.6, 77], 'Asia/Manila': [14.6, 121], 'Africa/Johannesburg': [-26.2, 28], 'Africa/Cairo': [30, 31.2], 'Africa/Lagos': [6.5, 3.4], 'Africa/Nairobi': [-1.3, 36.8]};
  function sunPlace(d) {
    var tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    if (SUN_ZONES[tz]) return SUN_ZONES[tz];
    var south = /^(Australia|Antarctica)\/|^Pacific\/(Auckland|Chatham|Fiji|Noumea|Tongatapu)|^America\/(Argentina|Sao_Paulo|Santiago|Montevideo|Asuncion|Lima|La_Paz)|^Africa\/(Johannesburg|Maputo|Harare|Lusaka|Windhoek|Gaborone)|^Indian\/(Mauritius|Reunion)/.test(tz);
    return [south ? -30 : 40, -d.getTimezoneOffset() / 4];
  }
  /* sunrise or sunset on the day of d, in minutes after local midnight (null: the sun does not rise or set that day) */
  function sunMin(d, p, rise) {
    var R = Math.PI / 180, N = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 864e5);
    var lh = p[1] / 15, t = N + ((rise ? 6 : 18) - lh) / 24, M = 0.9856 * t - 3.289;
    var L = (M + 1.916 * Math.sin(M * R) + 0.020 * Math.sin(2 * M * R) + 282.634 + 720) % 360;
    var RA = (Math.atan(0.91764 * Math.tan(L * R)) / R + 720) % 360;
    RA = (RA + Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90) / 15;
    var sinD = 0.39782 * Math.sin(L * R), cosD = Math.cos(Math.asin(sinD));
    var cosH = (Math.cos(90.833 * R) - sinD * Math.sin(p[0] * R)) / (cosD * Math.cos(p[0] * R));
    if (cosH > 1 || cosH < -1) return null;
    var H = (rise ? 360 - Math.acos(cosH) / R : Math.acos(cosH) / R) / 15;
    var UT = ((H + RA - 0.06571 * t - 6.622 - lh) % 24 + 24) % 24;
    return Math.round(((UT * 60 - d.getTimezoneOffset()) % 1440 + 1440) % 1440);
  }
  /* 'light' between today's sunrise and sunset, 'dark' otherwise */
  window.vdbSunTheme = function () {
    var d = new Date(), p = sunPlace(d), r = sunMin(d, p, true), s = sunMin(d, p, false);
    if (r == null || s == null || s <= r) { r = 420; s = 1140; }
    var m = d.getHours() * 60 + d.getMinutes();
    return m >= r && m < s ? 'light' : 'dark';
  };
})();

(function () {
  var d = document.documentElement, t = 'auto', f = '0';
  try { t = localStorage.getItem('vdb-theme') || 'auto'; f = localStorage.getItem('vdb-fs') || '0'; } catch (e) {}
  // The theme chosen on verbumdomini.ca (cookie vd-th on the parent domain, set by either site): dark is dark,
  // light keeps sepia if that is the blog's choice, system is auto (the sun)
  var m = /(?:^|; )vd-th=(light|dark|system)/.exec(document.cookie);
  if (m) {
    t = m[1] === 'system' ? 'auto' : m[1] === 'light' && t === 'sepia' ? 'sepia' : m[1];
    try { localStorage.setItem('vdb-theme', t); } catch (e) {}
  }
  d.setAttribute('data-theme', t === 'auto' ? window.vdbSunTheme() : t);
  d.setAttribute('data-fs', f);
  // Accessibility settings (blog.js), so the page paints with them
  try {
    var a = JSON.parse(localStorage.getItem('vdb-a11y') || '{}') || {};
    for (var k in a) if (a[k] && /^[a-z]+$/.test(k)) d.setAttribute('data-a11y-' + k, '1');
  } catch (e) {}
})();
