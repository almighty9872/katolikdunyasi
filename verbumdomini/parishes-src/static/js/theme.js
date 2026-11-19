/* Runs before the page paints. The theme is shared with verbumdomini.ca and the blog through the cookie vd-th
   on the parent domain (light, dark or system); "system" leaves data-theme off so app.css follows the device.
   The widget (embed/today.html) takes ?theme=light|dark from the page that frames it instead. */
(function () {
  var d = document.documentElement, q = /[?&]theme=(light|dark)\b/.exec(location.search);
  var m = /(?:^|; )vd-th=(light|dark|system)/.exec(document.cookie), t = q ? q[1] : m ? m[1] : 'system';
  if (t === 'light' || t === 'dark') d.setAttribute('data-theme', t);
})();
