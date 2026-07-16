(function () {
  var app = document.getElementById('app');
  var LESSONS = window.LESSONS || [];
  var activeKeyHandler = null;

  function clearKeyHandler() {
    if (activeKeyHandler) {
      document.removeEventListener('keydown', activeKeyHandler);
      activeKeyHandler = null;
    }
  }

  function byId(id) {
    return LESSONS.find(function (l) { return l.id === id; });
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function render() {
    var hash = location.hash.replace(/^#\/?/, '');
    if (hash.startsWith('EP')) {
      var lesson = byId(hash);
      if (lesson) return renderEpisode(lesson);
    }
    renderHome();
  }

  function renderHome() {
    clearKeyHandler();
    // 외단열 시스템 = 시공 순서(층)대로: 단열재 → 메쉬·부자재 → 마감 바름재
    var groups = [
      { label: '① 단열재 — 바탕 단열층', desc: 'EP1~3', eps: [1, 2, 3] },
      { label: '② 메쉬 · 부자재 — 보강층', desc: 'EP4~5', eps: [4, 5] },
      { label: '③ 마감 바름재 — 피니시층', desc: 'EP6~10', eps: [6, 7, 8, 9, 10] },
    ];
    var epNum = function (l) { return parseInt(l.id.replace(/\D/g, ''), 10); };
    var html = '<div class="home"><div class="home-title">외단열 시공 A to Z</div>' +
      '<div class="home-sub">단열재부터 마감 바름재까지, 시공 순서대로 (전 10강)</div>';
    groups.forEach(function (g) {
      var items = LESSONS.filter(function (l) { return g.eps.indexOf(epNum(l)) !== -1; });
      html += '<div class="series-heading">' + escapeHtml(g.label) + ' <span class="series-range">' + escapeHtml(g.desc) + '</span></div><div class="tile-list">';
      items.forEach(function (l) {
        var thumb = l.cards[0] ? l.cards[0].img : '';
        html += '' +
          '<button class="tile" data-go="' + l.id + '">' +
            '<img class="tile-thumb" src="' + thumb + '" alt="">' +
            '<div>' +
              '<div class="tile-num">' + l.id + '</div>' +
              '<div class="tile-title">' + escapeHtml(l.title) + '</div>' +
            '</div>' +
          '</button>';
      });
      html += '</div>';
    });
    html += '</div>';
    app.innerHTML = html;
    app.querySelectorAll('[data-go]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        location.hash = '#/' + btn.getAttribute('data-go');
      });
    });
  }

  // 셀프체크 = 2카드: ① 질문만  ② 질문+정답
  function quizCards(quiz) {
    var q = (quiz && quiz.questions) || [];
    var a = (quiz && quiz.answers) || [];
    if (!q.length) return [];
    var qList = q.map(function (x, i) {
      return '<li><span class="q-num">Q' + (i + 1) + '.</span> ' + escapeHtml(x) + '</li>';
    }).join('');
    var qaList = q.map(function (x, i) {
      return '<li>' +
        '<div class="qa-q"><span class="q-num">Q' + (i + 1) + '.</span> ' + escapeHtml(x) + '</div>' +
        '<div class="qa-a"><span class="a-num">A.</span> ' + escapeHtml(a[i] || '') + '</div>' +
      '</li>';
    }).join('');
    return [
      '<section class="card quiz-card"><div class="card-text">' +
        '<h2 class="card-heading">셀프 체크</h2>' +
        '<ul class="quiz-q">' + qList + '</ul>' +
        '<div class="quiz-hint">넘겨서 정답 확인 →</div>' +
      '</div></section>',
      '<section class="card quiz-card"><div class="card-text">' +
        '<h2 class="card-heading">셀프 체크 · 정답</h2>' +
        '<ul class="quiz-qa">' + qaList + '</ul>' +
      '</div></section>'
    ];
  }

  function renderEpisode(lesson) {
    clearKeyHandler();
    var slides = lesson.cards.map(function (c) {
      return '' +
        '<section class="card">' +
          '<div class="card-media"><img src="' + c.img + '" alt=""></div>' +
          '<div class="card-text">' +
            '<h2 class="card-heading">' + escapeHtml(c.heading) + '</h2>' +
            '<div class="card-body">' + c.body + '</div>' +
          '</div>' +
        '</section>';
    });
    slides.push(
      '<section class="card summary-card">' +
        '<div class="card-text">' +
          '<h2 class="card-heading">한 줄 정리</h2>' +
          '<div class="summary-box">' + escapeHtml(lesson.summary) + '</div>' +
        '</div>' +
      '</section>'
    );
    quizCards(lesson.quiz).forEach(function (s) { slides.push(s); });
    var total = slides.length;

    app.innerHTML = '' +
      '<div class="episode-view">' +
        '<header class="topbar">' +
          '<button class="back-btn" id="backBtn" aria-label="홈으로">←</button>' +
          '<div class="topbar-title">' + escapeHtml(lesson.title) + '</div>' +
          '<div class="counter" id="counter">1 / ' + total + '</div>' +
        '</header>' +
        '<div class="deck-wrap">' +
          '<button class="arrow arrow-left" id="prevBtn" aria-label="이전 카드">‹</button>' +
          '<div class="deck" id="deck">' + slides.join('') + '</div>' +
          '<button class="arrow arrow-right" id="nextBtn" aria-label="다음 카드">›</button>' +
        '</div>' +
        '<footer class="bottombar">' +
          '<div class="progress"><div class="progress-fill" id="progressFill"></div></div>' +
          '<div class="dots" id="dots"></div>' +
        '</footer>' +
      '</div>';

    var deck = document.getElementById('deck');
    var counter = document.getElementById('counter');
    var progressFill = document.getElementById('progressFill');
    var dotsWrap = document.getElementById('dots');
    var cardEls = deck.querySelectorAll('.card');

    for (var i = 0; i < total; i++) {
      var dot = document.createElement('button');
      dot.className = 'dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', (i + 1) + '번 카드로 이동');
      dot.dataset.index = i;
      dotsWrap.appendChild(dot);
    }
    var dotEls = dotsWrap.querySelectorAll('.dot');

    var current = 0;
    function goTo(index) {
      index = Math.max(0, Math.min(total - 1, index));
      cardEls[index].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
    function setActive(index) {
      current = index;
      counter.textContent = (index + 1) + ' / ' + total;
      progressFill.style.width = ((index + 1) / total * 100) + '%';
      dotEls.forEach(function (d, i) { d.classList.toggle('active', i === index); });
      var prevBtn = document.getElementById('prevBtn');
      var nextBtn = document.getElementById('nextBtn');
      prevBtn.disabled = index === 0;
      nextBtn.disabled = index === total - 1;
    }

    var ticking = false;
    deck.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var idx = Math.round(deck.scrollLeft / deck.clientWidth);
        idx = Math.max(0, Math.min(total - 1, idx));
        if (idx !== current) setActive(idx);
        ticking = false;
      });
    });

    dotEls.forEach(function (d) {
      d.addEventListener('click', function () { goTo(Number(d.dataset.index)); });
    });
    document.getElementById('prevBtn').addEventListener('click', function () { goTo(current - 1); });
    document.getElementById('nextBtn').addEventListener('click', function () { goTo(current + 1); });
    document.getElementById('backBtn').addEventListener('click', function () { location.hash = '#/'; });

    activeKeyHandler = function (e) {
      if (e.key === 'ArrowRight') goTo(current + 1);
      else if (e.key === 'ArrowLeft') goTo(current - 1);
    };
    document.addEventListener('keydown', activeKeyHandler);

    setActive(0);
  }

  window.addEventListener('hashchange', render);
  render();
})();
