(function () {
  var box = document.getElementById('ab-rows');
  if (!box) return;
  var B = 'assets/icons/brands/';
  // [name, file, mono(white one-color logo)]
  var rows = [
    [['Photoshop','photoshop'],['Illustrator','illustrator'],['InDesign','indesign'],['After Effects','after-effects'],['Premiere Pro','premiere'],['Audition','audition'],['Lightroom','lightroom']],
    [['Figma','figma'],['Blender','blender'],['DaVinci Resolve','davinci',1],['Telegram','telegram'],['Discord','discord'],['YouTube','youtube'],['GitHub','github',1]],
    [['Cinema 4D','cinema4d',1],['Canva','canva',1],['Notion','notion'],['VS Code','vscode'],['Obsidian','obsidian'],['Affinity Designer','affinity',1],['Krita','krita',1]]
  ];
  var cls = ['', 'rev', 'slow'];
  rows.forEach(function (row, i) {
    var html = '';
    for (var k = 0; k < 4; k++) row.forEach(function (a) {
      html += '<span class="ab-chip"><img' + (a[2] ? ' class="mono"' : '') + ' src="' + B + a[1] + '.svg" alt="">' + a[0] + '</span>';
    });
    var t = document.createElement('div');
    t.className = 'ab-track ' + cls[i];
    t.style.marginLeft = (i * -90) + 'px';
    t.innerHTML = html;
    box.appendChild(t);
  });
  var T = {
    ru: ['Мои <span>программы</span>', 'Использую самые популярные инструменты для дизайна, видео и звука — список постоянно пополняется'],
    en: ['My <span>apps</span>', 'The tools I use for design, video and sound — the list keeps growing']
  };
  function setLang(l) {
    var t = T[l] || T.en;
    document.getElementById('apps-title').innerHTML = t[0];
    document.getElementById('apps-intro').textContent = t[1];
  }
  setLang(document.documentElement.lang);
  document.addEventListener('kiki:language', function (e) { setLang(e.detail); });
})();
