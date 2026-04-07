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

    const perPage = 8;
    const totalPages = Math.max(1, Math.ceil(newsList.length / perPage));
    let currentNewsPage = 1;

    function showNewsPage(page) {
      currentNewsPage = page;
      const start = (page - 1) * perPage;
      const pageItems = newsList.slice(start, start + perPage);
      renderNewsGrid(pageItems);
      renderPagination(totalPages, page);

      // 페이지네이션 이벤트 재바인딩
      document.querySelectorAll('.pg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const num = parseInt(btn.textContent);
          showNewsPage(num);
        });
      });

      // CTA 위치 조정: 첫 번째 카드 하단에 맞춤
      const newsCards = document.querySelectorAll('#news-grid .news-card');
      const firstCard = newsCards[0];
      const cta = document.querySelector('.news-cta');
      const grid = document.querySelector('#news-grid');
      if (firstCard && cta && grid) {
        const cardBottom = grid.offsetTop + firstCard.offsetTop + firstCard.offsetHeight;
        cta.style.top = (cardBottom - cta.offsetHeight) + 'px';
      }
    }

    showNewsPage(1);
  }

  // Curriculum 페이지
  if (currentPage === 'curriculum') {
    renderLearningBlocks(curriculumData.learningBlocks);
    renderSessionCards(curriculumData.tuesday, curriculumData.friday);
  }

  // Search 페이지
  if (currentPage === 'search') {
    const query = new URLSearchParams(window.location.search).get('q') || '';
    if (query) renderSearchResults(query);
  }

  // 렌더링 완료 후 스크롤 애니메이션 초기화
  setTimeout(initScrollReveal, 50);

}

// 홈 등 데이터 블록 밖 페이지도 커버
if (currentPage === 'home') {
  setTimeout(initScrollReveal, 50);
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

// ── 스크롤 애니메이션 ──
function initScrollReveal() {
  // 섹션들에 scroll-reveal 클래스 추가
  const selectors = [
    '.mem-section', '.cur-section', '.news-layout', '.news-list-layout',
    '.forum-hero', '.next-week-inner', '.cohort-section', '.archive-section',
    '.home-about', '.home-section', '.home-offer-card', '.mem-card-v',
    '.cur-session-card', '.cur-lb-card', '.cur-fee-row',
    '.article-detail', '.article-related',
  ];
  document.querySelectorAll(selectors.join(',')).forEach((el, i) => {
    el.classList.add('scroll-reveal');
    el.style.transitionDelay = `${Math.min(i % 6, 3) * 0.1}s`;
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  const elements = document.querySelectorAll('.scroll-reveal');

  elements.forEach((el, i) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      el.style.transitionDelay = `${i * 0.15}s`;
      setTimeout(() => el.classList.add('visible'), 100);
    } else {
      observer.observe(el);
    }
  });
}
