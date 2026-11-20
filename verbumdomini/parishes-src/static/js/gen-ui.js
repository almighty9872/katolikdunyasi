/* Print Studio: the template and size lists as pill buttons. The <select> elements stay the source of truth for gen.js;
   a pill sets its select and sends the same change event, and the pills follow the selects after every change. */
(function () {
  var form = document.getElementById('g'); if (!form) return;
  var groups = ['g-tpl', 'g-fmt'].map(function (id) {
    var sel = document.getElementById(id), lab = sel.closest('label'), g = document.createElement('div');
    g.className = 'pp-pills g-pills'; g.setAttribute('role', 'group'); g.setAttribute('aria-label', lab.firstChild.textContent.trim());
    g.innerHTML = [].map.call(sel.options, function (o) {
      return '<button type="button" data-v="' + o.value + '" aria-pressed="false">' + o.textContent.replace(/\s*\(.*\)$/, '') + '<small>' + (/\((.*)\)$/.exec(o.textContent) || ['', ''])[1] + '</small></button>';
    }).join('');
    lab.classList.add('g-sel'); lab.after(g);
    g.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b || sel.value === b.getAttribute('data-v')) return;
      sel.value = b.getAttribute('data-v'); sel.dispatchEvent(new Event('change', { bubbles: true })); sel.dispatchEvent(new Event('input', { bubbles: true }));
    });
    return [sel, g];
  });
  function sync() { groups.forEach(function (x) { [].forEach.call(x[1].children, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === x[0].value)); }); }); }
  form.addEventListener('change', sync); document.addEventListener('pp-gen-ready', sync); sync();
})();
