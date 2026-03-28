// ── 초기화 & 이벤트 바인딩 ──

const currentPage = document.body.dataset.page || 'forum';
const isArticleDetail = window.location.pathname.includes('article.html');

// 공통 UI (데이터 불필요)
if (!isArticleDetail) {
  renderSupportBadge();
  renderNav(currentPage);
  renderPageHero(currentPage);
}
renderFooter();

// 검색 & 네비게이터 (데이터 불필요)
initSearch();
initNavIndicator();

// ── 페이지별 렌더링 ──
{
  // Article 상세 페이지
  if (currentPage === 'forum' && isArticleDetail) {
    const articleId = new URLSearchParams(window.location.search).get('id');
    if (articleId) {
      const allCards = forumData.flatMap(y =>
        y.cohorts.flatMap(c =>
          c.blocks.flatMap(b =>
            b.cards.map(card => ({ ...card, cohort: c.name, block: b.label }))
          )
        )
      );
      const article = allCards.find(c => String(c.num) === articleId);
      if (article) {
        renderArticleDetail(article);
        const articleTags = article.tags ? article.tags.split('|') : [];
        const related = allCards.filter(c => {
          if (c === article || !c.tags) return false;
          const cTags = c.tags.split('|');
          return articleTags.some(t => cTags.includes(t));
        }).slice(0, 3);
        if (related.length > 0) renderRelatedArticles(related);
      }
    }
  }

  // Forum 페이지
  if (currentPage === 'forum' && !isArticleDetail) {
    renderFeaturedPost(featuredPost);
    renderNextWeek(nextWeekEvent);

    let activeYear = forumData.length > 0 ? forumData[0].year : 2026;
    const years = forumData.map(d => d.year);
    renderYearTabs(years, activeYear);

    document.querySelectorAll('.year-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.year-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeYear = parseInt(tab.textContent);
        const data = forumData.find(d => d.year === activeYear);
        if (data) renderArchive(data);
      });
    });

    const initialData = forumData.find(d => d.year === activeYear);
    if (initialData) renderArchive(initialData);
  }

  // Members 페이지
  if (currentPage === 'members') {
    renderModerators(membersData.moderators);
    renderMaesters(membersData.maesters);
    renderMakersGrid(membersData.lbMakers, 'lb-makers-content');
    renderMakersGrid(membersData.makerPool, 'maker-pool-content');
  }

  // News 페이지
  if (currentPage === 'news') {
    renderNewsArticle(newsArticle);
    renderNewsGrid(newsList);
    renderPagination(3, 1);

    document.querySelectorAll('.pg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pg-btn').forEach(b => b.classList.remove('active-pg'));
        btn.classList.add('active-pg');
      });
    });

    const cards = document.querySelectorAll('#news-grid .news-card');
    const cta = document.querySelector('.news-cta');
    const gridContainer = document.querySelector('.news-list-left');
    if (cards.length >= 3 && cta && gridContainer) {
      const gridTop = gridContainer.getBoundingClientRect().top;
      const secondRowTop = cards[2].getBoundingClientRect().top;
      cta.style.top = (secondRowTop - gridTop) + 'px';
    }
  }

  // Curriculum 페이지
  if (currentPage === 'curriculum') {
    renderLearningBlocks(curriculumData.learningBlocks);
    renderTuesdaySessions(curriculumData.tuesday);
    renderFridaySession(curriculumData.friday);
  }

  // Search 페이지
  if (currentPage === 'search') {
    const query = new URLSearchParams(window.location.search).get('q') || '';
    if (query) renderSearchResults(query);
  }

}

// ── 검색 기능 ──
function initSearch() {
  const toggle = document.getElementById('nav-search-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const input = document.querySelector('.nav-search-input');
      if (input) {
        input.classList.toggle('open');
        if (input.classList.contains('open')) input.focus();
      }
    });
  }

  document.querySelectorAll('.nav-search-input').forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        window.location.href = `search.html?q=${encodeURIComponent(input.value.trim())}`;
      }
    });
  });

  const searchBtn = document.getElementById('nav-search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const input = document.querySelector('.nav-search-input');
      if (input && input.value.trim()) {
        window.location.href = `search.html?q=${encodeURIComponent(input.value.trim())}`;
      }
    });
  }

  const backBtn = document.getElementById('search-back');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const input = document.querySelector('.nav-search-input');
      if (input) {
        input.classList.remove('open');
        setTimeout(() => history.back(), 300);
      } else {
        history.back();
      }
    });
  }
}

function initNavIndicator() {
  const container = document.querySelector('.nav-links');
  const indicator = document.querySelector('.nav-indicator');
  const activeLink = document.querySelector('.nav-link.active-nav');
  if (!container || !indicator) return;

  function moveIndicator(el) {
    indicator.style.left = (el.offsetLeft) + 'px';
    indicator.style.width = el.offsetWidth + 'px';
  }

  if (activeLink) { moveIndicator(activeLink); }
  else { indicator.style.width = '0'; }

  container.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('mouseenter', () => moveIndicator(link));
    link.addEventListener('mouseleave', () => {
      if (activeLink) moveIndicator(activeLink);
      else indicator.style.width = '0';
    });
    link.addEventListener('click', (e) => {
      e.preventDefault();
      moveIndicator(link);
      const href = link.getAttribute('href');
      if (href && href !== '#') {
        setTimeout(() => window.location.href = href, 300);
      }
    });
  });
}
