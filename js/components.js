// ── Page Hero ──

const pageHeroData = {
  curriculum: { title: 'Curriculum', desc: 'METES는 매주 2일, 세션이 운영됩니다.<br>1 Cohort = 4 Learning Block = 총 40주 과정' },
  members: { title: 'Members', desc: 'METES를 이끌어가는 모더레이터, 마에스터, 그리고 메이커들을 소개합니다.' },
  forum: { title: 'Article', desc: '각 분야의 마에스터를 초청하여 나눈 인사이트를 아티클로 정리합니다.' },
  news: { title: 'News', desc: 'METES 출신 창업가들의 이야기를 전합니다.' },
};

function renderPageHero(page) {
  const el = document.getElementById('page-hero');
  if (!el) return;
  const data = pageHeroData[page];
  if (!data) return;
  const ctaHtml = data.cta ? `<a href="${data.cta.href}" target="_blank" class="btn-apply" style="margin-top:24px;">${data.cta.label}</a>` : '';
  el.innerHTML = `<h1 class="page-hero-title">${data.title}</h1><p class="page-hero-desc">${data.desc}</p>${ctaHtml}`;
}

// ── Nav & Footer ──

function renderSupportBadge() {
  const el = document.getElementById('support-badge');
  if (!el) return;
  el.innerHTML = '<a href="https://walla.my/a/metes_cohort4" target="_blank" class="support-badge"><span>지원 링크<br>바로가기<br>→</span></a>';
}

function renderNav(activePage) {
  const navLinks = [
    { href: 'curriculum.html', label: '커리큘럼', page: 'curriculum' },
    { href: 'members.html', label: '멤버', page: 'members' },
    { href: 'index.html', label: '아티클', page: 'forum' },
    { href: 'news.html', label: '소식지', page: 'news' },
  ];

  if (activePage === 'search') {
    const query = new URLSearchParams(window.location.search).get('q') || '';
    document.getElementById('site-nav').innerHTML = `
      <a href="#" class="nav-back" id="search-back">&lt;</a>
      <div style="flex:1;"></div>
      <input type="text" class="nav-search-input open" placeholder="키워드를 입력해보세요." value="${query}">
      <span class="nav-search" id="nav-search-btn">🔍</span>
      <button class="btn-lang">ENG</button>`;
    return;
  }

  document.getElementById('site-nav').innerHTML = `
    <a href="home.html" class="logo" style="text-decoration:none;">Metes</a>
    <div class="nav-links">
      ${navLinks.map(l => `<a href="${l.href}" class="nav-link${l.page === activePage ? ' active-nav' : ''}" data-page="${l.page}">${l.label}</a>`).join('')}
      <div class="nav-indicator"></div>
    </div>
    <input type="text" class="nav-search-input" placeholder="키워드를 입력해보세요.">
    <span class="nav-search" id="nav-search-toggle">🔍</span>
    <button class="btn-lang">ENG</button>`;
}

function renderSearchResults(query) {
  const allMembers = [...membersData.lbMakers, ...membersData.makerPool];
  const matchedMembers = allMembers.filter(m =>
    m.tags.some(t => t.includes(query)) || m.name.includes(query)
  );

  const allCards = forumData.flatMap(y =>
    y.cohorts.flatMap(c => c.blocks.flatMap(b => b.cards))
  ).concat(forumData.flatMap(y => y.moreCards || []));
  const matchedCards = allCards.filter(c =>
    c.title.includes(query) || (c.tags && c.tags.some(t => t.includes(query)))
  );

  const totalResults = matchedMembers.length + matchedCards.length;

  // 헤더
  const header = document.getElementById('search-header');
  if (header) {
    header.innerHTML = `
      <div class="search-query">' ${query} '</div>
      <div class="search-count">검색 결과 ${totalResults}건</div>`;
  }

  // Member 결과
  const memberEl = document.getElementById('search-members');
  if (memberEl) {
    if (matchedMembers.length > 0) {
      memberEl.innerHTML = `<div class="makers-grid">${matchedMembers.map(renderMakerCard).join('')}</div>`;
    } else {
      memberEl.innerHTML = '<p style="color:#999;">검색 결과가 없습니다.</p>';
    }
  }

  // Article 결과
  const articleEl = document.getElementById('search-articles');
  if (articleEl) {
    if (matchedCards.length > 0) {
      articleEl.innerHTML = `<div class="card-grid">${matchedCards.map(renderCard).join('')}</div>`;
    } else {
      articleEl.innerHTML = '<p style="color:#999;">검색 결과가 없습니다.</p>';
    }
  }
}

function renderFooter() {
  document.getElementById('site-footer').innerHTML = `
    <div class="footer-inner">
      <div class="footer-top">
        <div class="footer-logo">Metes</div>
        <div class="footer-links">
          <div class="footer-col">
            <span class="footer-col-title">프로그램</span>
            <a href="curriculum.html">커리큘럼</a>
            <a href="members.html">멤버</a>
            <a href="curriculum.html">코호트 일정</a>
          </div>
          <div class="footer-col">
            <span class="footer-col-title">콘텐츠</span>
            <a href="index.html">아티클</a>
            <a href="news.html">소식지</a>
            <a href="index.html">Maester Forum</a>
          </div>
          <div class="footer-col">
            <span class="footer-col-title">문의</span>
            <a href="https://walla.my/a/metes_cohort4" target="_blank">지원하기</a>
            <a href="https://metes.stibee.com/" target="_blank">뉴스레터</a>
            <a href="https://www.instagram.com/metes.institute/" target="_blank">Instagram</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="footer-bottom-left">
          <span>© 2025 Metes. All rights reserved.</span>
          <a href="https://naver.me/GRo1DQan" target="_blank" class="footer-address" style="text-decoration:none;">서울 종로구 우정국로2길 22 3층</a>
          <a href="https://naver.me/5YoeSDvb" target="_blank" class="footer-address" style="text-decoration:none;">서울 강남구 언주로 734</a>
        </div>
        <div class="footer-legal">
          <a href="#">개인정보처리방침</a>
          <a href="#">이용약관</a>
        </div>
      </div>
    </div>`;
}

// ── Next Week ──

function renderNextWeek(event) {
  const el = document.getElementById('next-week-content');
  if (!el) return;
  el.innerHTML = `
    <div>
      <h3>Next Week</h3>
    </div>
    <div class="next-week-content">
      <h2>${event.title}</h2>
      <p>${event.desc}<br><strong>${event.date}, ${event.location}</strong>에서 진행됩니다.</p>
      <a href="${event.link}" target="_blank" class="btn-apply">지금 바로 참여 신청하기</a>
    </div>
    <div class="next-week-img">IMAGE</div>`;
}

// ── 연도 탭 ──

function renderYearTabs(years, activeYear) {
  const el = document.getElementById('year-tabs');
  if (!el) return;
  el.innerHTML = years.map(y =>
    `<button class="year-tab${y === activeYear ? ' active' : ''}">${y}</button>`
  ).join('');
}

// ── 멤버 컴포넌트 ──

function renderMemberCard(m, size) {
  return `<div class="mem-avatar ${size}"></div>
    <div class="mem-info">
      <div class="mem-name">${m.name}</div>
      <div class="mem-bio">${m.bio}</div>
    </div>`;
}

function renderModerators(data) {
  const el = document.getElementById('moderators-content');
  if (!el) return;
  el.innerHTML = `
    <div class="mod-featured">${renderMemberCard(data.featured, 'large')}</div>
    <div class="mod-row">
      ${data.sub.map(m => `<div class="mem-card-h">${renderMemberCard(m, 'small')}</div>`).join('')}
    </div>`;
}

function renderMaesters(list) {
  const el = document.getElementById('maesters-content');
  if (!el) return;
  el.innerHTML = `<div style="border-top: 1px solid #ccc; padding-top: 20px;">
    <div class="maester-grid">
      ${list.map(m => `
        <div class="maester-card">
          <div class="mem-avatar small"></div>
          <div class="mem-info">
            <div class="mem-name">${m.name}</div>
            <div class="mem-bio-sm">${m.bio}</div>
            <div class="maester-session">${m.session}</div>
          </div>
        </div>`).join('')}
    </div></div>`;
}

function renderMakerCard(m) {
  return `<div class="maker-card">
    <div class="mem-avatar small"></div>
    <div class="mem-info">
      <div class="mem-name">${m.name}</div>
      <div class="maker-tags">${m.tags.map(t => `<span class="mtag">${t}</span>`).join('')}</div>
    </div>
  </div>`;
}

function renderMakersGrid(list, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `<div class="makers-grid">${list.map(renderMakerCard).join('')}</div>`;
}

// ── 뉴스 컴포넌트 ──

function renderNewsArticle(article) {
  const el = document.getElementById('news-article-content');
  if (!el) return;
  el.innerHTML = `
    <div class="news-article-title">${article.title}</div>
    <hr class="news-article-divider">
    <div class="news-hero-img"></div>
    <h3 class="news-section-title">${article.sectionTitle}</h3>
    ${article.qa.map(item => `
      <div class="news-qa">
        <h4 class="news-q">${item.q}</h4>
        <p class="news-a">${item.a}</p>
      </div>`).join('')}`;
}

function renderNewsCard(item) {
  return `<div class="news-card">
    <div class="news-card-img"></div>
    <div class="news-card-name">${item.name}</div>
    <div class="news-card-desc">${item.desc}</div>
  </div>`;
}

function renderNewsGrid(list) {
  const el = document.getElementById('news-grid');
  if (!el) return;
  el.innerHTML = list.map(renderNewsCard).join('');
}

function renderPagination(totalPages, activePage) {
  const el = document.getElementById('news-pagination');
  if (!el) return;
  el.innerHTML = Array.from({ length: totalPages }, (_, i) =>
    `<button class="pg-btn${i + 1 === activePage ? ' active-pg' : ''}" style="${i + 1 === activePage ? '' : 'background:#fff;border:none;outline:none;box-shadow:none;'}">${i + 1}</button>`
  ).join('');
}

// ── 커리큘럼 컴포넌트 ──

function renderLearningBlocks(blocks) {
  const el = document.getElementById('learning-blocks');
  if (!el) return;
  el.innerHTML = `
    <div class="cur-lb-grid">${blocks.map(b => `
      <div class="cur-lb-card">
        <span class="cur-lb-num">${b.num}</span>
        <h4>'${b.title}'</h4>
        <p>${b.desc}</p>
      </div>`).join('')}</div>
    <p class="cur-cohort-notice">현재는 <strong>Cohort 4, Learning Block 2</strong>가 진행 중입니다. *중간 합류를 원하실 경우, <a href="mailto:sera@metes.io">문의</a> 주세요.</p>`;
}

function renderTuesdaySessions(sessions) {
  const el = document.getElementById('tuesday-sessions');
  if (!el) return;
  el.innerHTML = sessions.map((s, i) => `
    <div class="cur-card${i > 0 ? ' cur-card-mt' : ''}">
      ${s.hasPhoto ? '<div class="cur-photo"></div>' : ''}
      <div class="cur-info">
        <div class="cur-session-label">${s.session}</div>
        <div class="cur-maester">${s.maester}</div>
        <div class="cur-time">${s.time}</div>
        <p class="cur-desc">${s.desc}</p>
      </div>
    </div>`).join('');
}

function renderFridaySession(session) {
  const el = document.getElementById('friday-session');
  if (!el) return;
  el.innerHTML = `
    <div class="cur-card">
      <div class="cur-photo"></div>
      <div class="cur-info">
        <div class="cur-session-label">${session.session}</div>
        <div class="cur-time">${session.time}</div>
        <p class="cur-desc">${session.desc}</p>
      </div>
    </div>`;
}

// ── 아티클 상세 ──

function renderArticleDetail(article) {
  // 좌측 번호만
  const metaEl = document.getElementById('article-meta-left');
  if (metaEl) {
    metaEl.innerHTML = `<div class="article-num"><span>#</span> ${article.num}</div>`;
  }

  // 우측 본문
  const contentEl = document.getElementById('article-content');
  if (!contentEl) return;

  const tagsHtml = article.tags
    ? article.tags.split('|').map(t => `<span class="tag">${t}</span>`).join('')
    : '';

  const contentHtml = article.content
    ? article.content.split('||').map(block => {
        const [topic, desc] = block.split('::');
        return `<div class="article-section"><h3>${topic}</h3><p>${desc || ''}</p></div>`;
      }).join('')
    : '';

  contentEl.innerHTML = `
    <div class="article-title-row">
      <h2 class="article-title">${article.title}</h2>
      <span class="article-date">${article.date}</span>
    </div>
    <div class="article-hero-img"></div>
    ${contentHtml}
    ${tagsHtml ? `<div class="article-tags">${tagsHtml}</div>` : ''}`;
}

function renderRelatedArticles(articles) {
  const el = document.getElementById('related-articles');
  if (!el) return;
  el.innerHTML = `<div class="card-grid">${articles.map(renderCard).join('')}</div>`;
}

// ── 재사용 템플릿 (포럼) ──

function renderFeaturedPost(post) {
  const container = document.getElementById('featured-post');
  if (!container) return;

  container.innerHTML = `
    <div class="post-meta">
      <div class="post-num"><span>#</span> ${post.num}</div>
      <div class="post-date">${post.date}</div>
    </div>
    <div class="post-body">
      <div class="post-img">${post.img ? `<img src="${post.img}" alt="${post.title}">` : 'IMAGE'}</div>
      <div class="post-content">
        <h2>${post.title}</h2>
        <p>${post.desc}</p>
        <div class="tag-row">
          ${post.tags.map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
      </div>
    </div>`;
}

function renderCard(card) {
  return `
    <a href="article.html?id=${card.num}" class="card" style="text-decoration:none;color:inherit;">
      <div class="card-thumb">${card.img ? `<img src="${card.img}" alt="${card.title}">` : 'IMAGE'}</div>
      <div class="card-meta">
        <span class="card-num">#${card.num}</span>
        <span class="card-date">${card.date}</span>
      </div>
      <div class="card-title">${card.title}</div>
    </a>`;
}

function renderArchive(yearData) {
  const container = document.getElementById('archive-content');
  if (!container) return;

  let html = '';

  yearData.cohorts.forEach((cohort, ci) => {
    const isLast = ci === yearData.cohorts.length - 1;
    const blocksHtml = cohort.blocks.map((block, i) => {
      const divider = i > 0 ? '<hr class="block-divider">' : '';
      return `${divider}
        <div class="block-label">${block.label}</div>
        <div class="card-grid">
          ${block.cards.map(renderCard).join('')}
        </div>`;
    }).join('');

    html += `
      <div class="cohort-section"${isLast ? ' style="border-bottom:none;"' : ''}>
        <div class="cohort-label">${cohort.name}</div>
        <div class="cohort-content">${blocksHtml}</div>
      </div>`;
  });

  if (yearData.moreCards && yearData.moreCards.length > 0) {
    html += `
      <div class="cohort-section" style="border:none; padding-top:0;">
        <div class="bottom-cta">
          <h2>인사이트를<br>여러분의 <em>것으로!</em></h2>
        </div>
        <div>
          <div class="card-grid">
            ${yearData.moreCards.map(renderCard).join('')}
          </div>
        </div>
      </div>`;
  }

  container.innerHTML = html;
}
