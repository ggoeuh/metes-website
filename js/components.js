// ── Page Hero ──

// pageHeroData는 data.js에서 로드됨

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
  if (typeof isEnabled !== 'undefined' && !isEnabled('ui.support_badge')) {
    el.style.display = 'none';
    return;
  }
  const badge = (typeof siteData !== 'undefined') ? siteOne('ui', 'badge') : { title: '지원 링크', desc: '바로가기' };
  el.innerHTML = `<a href="https://walla.my/a/metes_cohort4" target="_blank" class="support-badge"><span>${badge.title || ''}<br>${badge.desc || ''}</span></a>`;
}

function renderNav(activePage) {
  const lang = (typeof localStorage !== 'undefined' && localStorage.getItem('lang')) || 'kor';
  const langLabel = lang === 'eng' ? 'KOR' : 'ENG';
  const search = lang === 'eng' ? 'Type a keyword.' : '키워드를 입력해보세요.';
  // pageHeroData에서 nav 라벨 가져옴
  const getLabel = (page, fallback) => (typeof pageHeroData !== 'undefined' && pageHeroData[page] && pageHeroData[page].title) || fallback;
  const labels = {
    curriculum: getLabel('curriculum', 'Curriculum'),
    members: getLabel('members', 'Members'),
    forum: getLabel('forum', 'Article'),
    news: getLabel('news', 'News'),
    search,
    langLabel,
  };
  const navLinks = [
    { href: 'curriculum.html', label: labels.curriculum, page: 'curriculum' },
    { href: 'members.html', label: labels.members, page: 'members' },
    { href: 'index.html', label: labels.forum, page: 'forum' },
    { href: 'news.html', label: labels.news, page: 'news' },
  ].filter(l => typeof isEnabled === 'undefined' || isEnabled('page.' + l.page));

  if (activePage === 'search') {
    const query = new URLSearchParams(window.location.search).get('q') || '';
    document.getElementById('site-nav').innerHTML = `
      <a href="#" class="nav-back" id="search-back">&lt;</a>
      <div style="flex:1;"></div>
      <input type="text" class="nav-search-input open" placeholder="${labels.search}" value="${query}">
      <span class="nav-search" id="nav-search-btn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></span>
      <button class="btn-lang" id="btn-lang-toggle">${labels.langLabel}</button>`;
    return;
  }

  document.getElementById('site-nav').innerHTML = `
    <a href="home.html" class="logo" style="text-decoration:none;">Metes</a>
    <div class="nav-links">
      ${navLinks.map(l => `<a href="${l.href}" class="nav-link${l.page === activePage ? ' active-nav' : ''}" data-page="${l.page}">${l.label}</a>`).join('')}
      <div class="nav-indicator"></div>
    </div>
    <input type="text" class="nav-search-input" placeholder="${labels.search}">
    <span class="nav-search" id="nav-search-toggle"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></span>
    <button class="btn-lang" id="btn-lang-toggle">${labels.langLabel}</button>
    <button class="hamburger" id="hamburger-btn" aria-label="Menu">≡</button>`;

  // 모바일 메뉴 배경 (오렌지)
  const mobileCta = (typeof siteData !== 'undefined') ? siteOne('ui', 'mobile_cta') : { title: '지원', desc: '하기 →' };
  const backdrop = document.createElement('div');
  backdrop.className = 'mobile-menu-backdrop';
  backdrop.id = 'mobile-menu-backdrop';
  backdrop.innerHTML = `<a href="https://walla.my/a/metes_cohort4" target="_blank" class="mobile-menu-backdrop-cta">${mobileCta.title || ''}<br>${mobileCta.desc || ''}</a>`;
  document.body.appendChild(backdrop);

  // 모바일 메뉴 오버레이
  const overlay = document.createElement('div');
  overlay.className = 'mobile-menu';
  overlay.id = 'mobile-menu';
  overlay.innerHTML = `
    <div class="mobile-menu-top">
      <button class="btn-lang-mobile${lang === 'eng' ? ' active' : ''}" data-lang="eng">ENG</button>
      <button class="btn-lang-mobile${lang === 'kor' ? ' active' : ''}" data-lang="kor">KOR</button>
    </div>
    <div class="mobile-menu-links">
      ${navLinks.map(l => `<a href="${l.href}"${l.page === activePage ? ' class="active"' : ''}>${l.label}</a>`).join('')}
    </div>
    <div class="mobile-menu-footer">
      ${(typeof siteData !== 'undefined' ? siteAll('footer', 'inquiry').slice(1, 3) : []).map(l => `<a href="${l.desc}" target="_blank">${l.title}</a>`).join('') || `<a href="https://metes.stibee.com/" target="_blank">뉴스레터</a><a href="https://www.instagram.com/metes.institute/" target="_blank">Instagram</a>`}
    </div>`;
  document.body.appendChild(overlay);
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
  const programTitle = siteOne('footer', 'program_title').title || 'Program';
  const contentTitle = siteOne('footer', 'content_title').title || 'Contents';
  const inquiryTitle = siteOne('footer', 'inquiry_title').title || 'Inquiries';
  const programLinks = siteAll('footer', 'program');
  const contentLinks = siteAll('footer', 'content');
  const inquiryLinks = siteAll('footer', 'inquiry');
  const bottom = siteOne('footer', 'bottom');
  const legalLinks = siteAll('footer', 'legal');

  const linkHtml = (l) => {
    const url = l.desc || '#';
    const isExternal = url.startsWith('http');
    return `<a href="${url}"${isExternal ? ' target="_blank"' : ''}>${l.title}</a>`;
  };

  document.getElementById('site-footer').innerHTML = `
    <div class="footer-inner">
      <div class="footer-top">
        <div class="footer-logo">Metes</div>
        <div class="footer-links">
          <div class="footer-col">
            <span class="footer-col-title">${programTitle}</span>
            ${programLinks.map(linkHtml).join('')}
          </div>
          <div class="footer-col">
            <span class="footer-col-title">${contentTitle}</span>
            ${contentLinks.map(linkHtml).join('')}
          </div>
          <div class="footer-col">
            <span class="footer-col-title">${inquiryTitle}</span>
            ${inquiryLinks.map(linkHtml).join('')}
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="footer-bottom-left">
          <span>${bottom.title || ''}</span>
          ${bottom.desc ? `<a href="https://naver.me/GRo1DQan" target="_blank" class="footer-address" style="text-decoration:none;">${bottom.desc}</a>` : ''}
          ${bottom.extra1 ? `<a href="https://naver.me/5YoeSDvb" target="_blank" class="footer-address" style="text-decoration:none;">${bottom.extra1}</a>` : ''}
        </div>
        <div class="footer-legal">
          ${legalLinks.map(l => `<a href="${l.desc || '#'}">${l.title}</a>`).join('')}
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
      <div class="next-week-img-mobile">IMAGE</div>
      <a href="${event.link}" target="_blank" class="btn-apply">지금 바로 참여 신청하기</a>
    </div>
    <div class="next-week-img">IMAGE</div>`;
}

// ── data-text 자동 채우기 ──
function applyDataText() {
  if (typeof siteData === 'undefined') return;
  document.querySelectorAll('[data-text]').forEach(el => {
    const path = el.dataset.text;
    const parts = path.split('.');
    if (parts.length < 3) return;
    const [page, section, key] = parts;
    const r = siteOne(page, section);
    const text = r[key] || '';
    el.innerHTML = nl2br(text);
  });
}

// ── 커리큘럼 비용 ──
function renderCurriculumFees() {
  const el = document.getElementById('cur-fee-list');
  if (!el || typeof siteData === 'undefined') return;
  const fees = ['maker_fee', 'general_fee'].map(k => siteOne('curriculum', k));
  el.innerHTML = fees.map(f => `
    <div class="cur-fee-row">
      <div class="cur-fee-left">
        <div class="cur-fee-title">${f.title}</div>
        <div class="cur-fee-sub">${f.desc}</div>
      </div>
      <div class="cur-fee-right">
        <span class="cur-fee-amount">${f.extra1}</span>
        <span class="cur-fee-unit">${f.extra2}</span>
      </div>
    </div>
  `).join('');
}

// ── Home 페이지 렌더 ──
function fixDriveUrl(url) {
  if (!url) return '';
  // https://drive.google.com/uc?id=FILE_ID → https://lh3.googleusercontent.com/d/FILE_ID
  const match = url.match(/[?&]id=([^&]+)/) || url.match(/\/d\/([^/]+)/);
  if (match) return `https://lh3.googleusercontent.com/d/${match[1]}=w1000`;
  return url;
}

function nl2br(text) {
  return (text || '').replace(/\n/g, '<br>');
}

function renderHome() {
  if (typeof siteData === 'undefined') return;

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = nl2br(text || '');
  };

  // Hero
  const hero = siteOne('home', 'hero');
  setText('home-hero-title', hero.title);
  setText('home-hero-sub', hero.desc);

  // About
  const about = siteOne('home', 'about');
  setText('home-about-body', about.title);
  setText('home-about-quote', about.extra1);
  setText('home-about-body2', about.extra2);

  // Vision intro
  const visionIntro = siteOne('ui', 'vision');
  setText('home-vision-intro', visionIntro.title);

  // Support
  const support = siteOne('home', 'support');
  setText('home-support-body', support.title);

  // Vision grid
  const visionEl = document.getElementById('home-vision-grid');
  if (visionEl) {
    const items = ['item1', 'item2', 'item3'].map(k => siteOne('vision', k));
    visionEl.innerHTML = items.map(v => {
      const img = fixDriveUrl(v.img);
      return `
        <div class="home-vision-item">
          <div class="home-vision-icon"${img ? ` style="background-image:url('${img}');background-size:cover;background-position:center;"` : ''}></div>
          <p>${nl2br(v.title)}</p>
        </div>
      `;
    }).join('');
  }

  // Offer grid
  const offerEl = document.getElementById('home-offer-grid');
  if (offerEl) {
    const items = ['card1', 'card2', 'card3', 'card4'].map(k => siteOne('offer', k));
    offerEl.innerHTML = items.map(o => {
      const img = fixDriveUrl(o.img);
      return `
        <div class="home-offer-card">
          <div class="home-offer-img">${img ? `<img src="${img}" alt="" loading="lazy">` : ''}</div>
          <h3>${nl2br(o.title)}</h3>
          <p>${nl2br(o.desc)}</p>
        </div>
      `;
    }).join('');
  }

  // Contact grid
  const contactEl = document.getElementById('home-contact-grid');
  if (contactEl) {
    const items = ['email', 'newsletter', 'instagram'].map(k => siteOne('contact', k));
    contactEl.innerHTML = items.map(c => {
      const url = c.extra1 || '#';
      const isExt = url.startsWith('http');
      return `
        <a href="${url}"${isExt ? ' target="_blank"' : ''} class="home-contact-card">
          <span class="home-contact-label">${c.title}</span>
          <span class="home-contact-value">${c.desc}</span>
        </a>
      `;
    }).join('');
  }
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

function avatarStyle(imgUrl) {
  const img = fixDriveUrl(imgUrl);
  return img ? ` style="background-image:url('${img}');background-size:cover;background-position:center;"` : '';
}

function renderModerators(data) {
  const el = document.getElementById('moderators-content');
  if (!el) return;
  const all = [data.featured, ...data.sub].filter(m => m && (m.name || m.bio));
  el.innerHTML = `<div class="mem-card-grid">
    ${all.map(m => `
      <div class="mem-card-v">
        <div class="mem-avatar-v"${avatarStyle(m.img)}></div>
        <div class="mem-info">
          <div class="mem-name">${m.name}</div>
          <div class="mem-bio">${m.bio}</div>
        </div>
      </div>`).join('')}
  </div>`;
}

function renderMaesters(list) {
  const el = document.getElementById('maesters-content');
  if (!el) return;
  el.innerHTML = `<div class="mem-card-grid">
    ${list.map(m => `
      <div class="mem-card-v">
        <div class="mem-avatar-v"${avatarStyle(m.img)}></div>
        <div class="mem-info">
          <div class="mem-name">${m.name}</div>
          <div class="mem-bio-sm">${m.bio}</div>
          <div class="maester-session">${m.session}</div>
        </div>
      </div>`).join('')}
  </div>`;
}

function renderMakerCard(m) {
  return `<div class="maker-card">
    <div class="mem-avatar small"${avatarStyle(m.img)}></div>
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
    `<button class="pg-btn${i + 1 === activePage ? ' active-pg' : ''}">${i + 1}</button>`
  ).join('');
}

// ── 커리큘럼 컴포넌트 ──

function renderLearningBlocks(blocks) {
  const el = document.getElementById('learning-blocks');
  if (!el) return;
  const currentLB = curriculumData.currentCohort || '';

  el.innerHTML = `
    <div class="cur-lb-grid">
      ${blocks.map(b => `
        <div class="cur-lb-card">
          <span class="cur-lb-num">${b.num}</span>
          <h4>${b.title}</h4>
          <p>${b.desc}</p>
        </div>`).join('')}
    </div>
    <p class="cur-cohort-notice">현재는 <strong>${currentLB}</strong>가 진행 중입니다. *중간 합류를 원하실 경우, <a href="mailto:sera@metes.io">문의</a> 주세요.</p>`;
}

function renderSessionCards(tuesday, friday) {
  const el = document.getElementById('session-cards');
  if (!el) return;

  function renderCard(s) {
    const tags = s.tags ? s.tags.split('|').map(t => `<span class="tag">${t}</span>`).join('') : '';
    return `
    <div class="cur-session-card">
      <div class="cur-session-img"></div>
      <div class="cur-session-body">
        <div class="cur-session-top">
          <div class="cur-session-name"><span>${s.maester || 'METES Forum'}</span>${s.time.includes('오전') ? '<span class="cur-session-ampm">오전</span>' : s.time.includes('오후') ? '<span class="cur-session-ampm">오후</span>' : ''}</div>
          <div class="cur-session-tag">${s.session}</div>
        </div>
        <p class="cur-session-desc">${s.desc}</p>
        ${tags ? `<div class="cur-session-tags">${tags}</div>` : ''}
      </div>
    </div>`;
  }

  el.innerHTML = `<div class="cur-session-grid">
    <div class="cur-day-label">Tue</div>
    ${tuesday.map(renderCard).join('')}
    <div class="cur-day-label">Fri</div>
    ${renderCard(friday)}
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

    const firstBlockLabel = cohort.blocks[0] ? cohort.blocks[0].label : '';
    html += `
      <div class="cohort-section"${isLast ? ' style="border-bottom:none;"' : ''}>
        <div class="cohort-label">${cohort.name} <span class="cohort-block-label">${firstBlockLabel}</span></div>
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
