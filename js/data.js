// ── Google Sheets CSV 연동 ──

const SHEET_BASE = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGLwxxiXmtN5aLVeGVZrRn068Ix7fEMAKDoOBV21GiAGw6fQgBn4yPHfzWbIvwu3nTNOE_uS7vmnAG/pub';
const SHEETS = {
  members:    `${SHEET_BASE}?gid=0&single=true&output=csv`,
  news:       `${SHEET_BASE}?gid=466223975&single=true&output=csv`,
  articles:   `${SHEET_BASE}?gid=636670025&single=true&output=csv`,
  curriculum: `${SHEET_BASE}?gid=1927098854&single=true&output=csv`,
  site:       `${SHEET_BASE}?gid=880266556&single=true&output=csv`,
};

// CSV 파서
function parseCSV(text) {
  const lines = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      lines.push(current); current = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      lines.push(current); current = '';
      lines.push('\n');
    } else {
      current += ch;
    }
  }
  if (current) lines.push(current);

  const rows = [];
  let row = [];
  for (const item of lines) {
    if (item === '\n') { if (row.length > 0) rows.push(row); row = []; }
    else { row.push(item); }
  }
  if (row.length > 0) rows.push(row);

  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1)
    .filter(r => r[0] && !r[0].startsWith('[예시]'))
    .map(r => {
      const obj = {};
      headers.forEach((h, i) => { obj[h.trim()] = (r[i] || '').trim(); });
      return obj;
    });
}

async function fetchSheet(url) {
  const res = await fetch(url);
  const text = await res.text();
  return parseCSV(text);
}

// ── 데이터 변환 ──

function transformMembers(rows) {
  const moderatorFeatured = rows.filter(r => r.type === 'moderator_featured')[0];
  const moderatorSub = rows.filter(r => r.type === 'moderator');
  const maesters = rows.filter(r => r.type === 'maester');
  const makers = rows.filter(r => r.type === 'maker');
  const makerPool = rows.filter(r => r.type === 'maker_pool');

  return {
    moderators: {
      featured: { name: moderatorFeatured?.name || '', bio: moderatorFeatured?.bio || '' },
      sub: moderatorSub.map(r => ({ name: r.name, bio: r.bio })),
    },
    maesters: maesters.map(r => ({ name: r.name, bio: r.bio, session: r.session })),
    lbMakers: makers.map(r => ({ name: r.name, tags: [r.tag1, r.tag2, r.tag3].filter(Boolean) })),
    makerPool: makerPool.map(r => ({ name: r.name, tags: [r.tag1, r.tag2, r.tag3].filter(Boolean) })),
  };
}

function transformArticles(rows) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Next Week: 오늘 이후 가장 가까운 날짜
  const futureRows = rows.filter(r => new Date(r.date) > today).sort((a, b) => new Date(a.date) - new Date(b.date));
  const nextWeekRow = futureRows[0] || null;

  // 과거 글들
  const pastRows = rows.filter(r => new Date(r.date) <= today);

  // Featured: 가장 최근 글
  const sorted = [...pastRows].sort((a, b) => new Date(b.date) - new Date(a.date));
  const featuredRow = sorted[0] || null;

  // 연도별 그룹화
  const years = [...new Set(rows.map(r => parseInt(r.year)))].sort((a, b) => b - a);
  const forumData = years.map(year => {
    const yearRows = pastRows.filter(r => parseInt(r.year) === year);
    const cohortNames = [...new Set(yearRows.map(r => r.cohort).filter(Boolean))];
    const cohorts = cohortNames.map(name => {
      const cohortRows = yearRows.filter(r => r.cohort === name);
      const blockNames = [...new Set(cohortRows.map(r => r.block).filter(Boolean))];
      const blocks = blockNames.map(label => ({
        label,
        cards: cohortRows.filter(r => r.block === label).map(r => ({
          num: parseInt(r.num), date: r.date, title: r.title,
          tags: r.tags || '', content: r.content || '',
          cohort: name, block: label,
        })),
      }));
      return { name, blocks };
    });
    return { year, cohorts, moreCards: [] };
  });

  function formatDate(d) {
    if (!d) return '';
    const parts = d.split('-');
    if (parts.length === 3) return `${parts[0]}/ ${parts[1]}/ ${parts[2]}`;
    return d;
  }

  const nextWeekEvent = nextWeekRow ? {
    title: nextWeekRow.title,
    desc: nextWeekRow.content ? nextWeekRow.content.split('||')[0].split('::')[0] : '',
    date: formatDate(nextWeekRow.date),
    location: nextWeekRow.location || '',
    link: 'https://walla.my/a/metes_cohort4',
  } : { title: '다음 세션을 준비 중입니다', desc: '', date: '', location: '', link: 'https://walla.my/a/metes_cohort4' };

  const featuredPost = featuredRow ? {
    num: parseInt(featuredRow.num),
    date: formatDate(featuredRow.date),
    title: featuredRow.title,
    desc: featuredRow.content ? featuredRow.content.split('||')[0].split('::')[1] || featuredRow.title : featuredRow.title,
    tags: featuredRow.tags ? featuredRow.tags.split('|') : [],
  } : { num: 0, date: '', title: '', desc: '', tags: [] };

  // 카드의 날짜도 포맷
  forumData.forEach(yd => {
    yd.cohorts.forEach(c => {
      c.blocks.forEach(b => {
        b.cards.forEach(card => { card.date = formatDate(card.date); });
      });
    });
  });

  return { forumData, nextWeekEvent, featuredPost };
}

function transformNews(rows) {
  const featuredRow = rows.find(r => r.type === 'featured');
  const listRows = rows.filter(r => r.type === 'list');

  const newsArticle = featuredRow ? {
    title: featuredRow.name,
    sectionTitle: featuredRow.section_title,
    qa: [
      { q: featuredRow.q1, a: featuredRow.a1 },
      { q: featuredRow.q2, a: featuredRow.a2 },
      { q: featuredRow.q3, a: featuredRow.a3 },
    ].filter(item => item.q),
  } : { title: '', sectionTitle: '', qa: [] };

  const newsList = listRows.map(r => ({ name: r.name, desc: r.desc }));

  return { newsArticle, newsList };
}

function transformCurriculum(rows) {
  const lbs = rows.filter(r => r.type === 'lb');
  const sessions = rows.filter(r => r.type === 'session');
  const infos = rows.filter(r => r.type === 'info');
  const currentCohort = infos.find(r => r.key === 'current_cohort');

  const tuesday = sessions.filter(r => r.value.includes('화요일')).map(r => ({
    session: r.key, time: r.value, maester: r.value2, desc: r.value3, hasPhoto: true,
  }));

  const fridayRow = sessions.find(r => r.value.includes('금요일'));
  const friday = fridayRow ? {
    session: fridayRow.key, time: fridayRow.value, desc: fridayRow.value3, hasPhoto: true,
  } : { session: '', time: '', desc: '', hasPhoto: true };

  return {
    learningBlocks: lbs.map(r => ({ num: r.key, title: r.value, desc: r.value2 })),
    tuesday,
    friday,
    currentCohort: currentCohort ? `${currentCohort.value}, ${currentCohort.value2}` : '',
  };
}

// ── 전역 변수 (기존 코드 호환) ──

let membersData = { moderators: { featured: {}, sub: [] }, maesters: [], lbMakers: [], makerPool: [] };
let forumData = [];
let nextWeekEvent = { title: '', desc: '', date: '', location: '', link: '#' };
let featuredPost = { num: 0, date: '', title: '', desc: '', tags: [] };
let newsArticle = { title: '', sectionTitle: '', qa: [] };
let newsList = [];
let curriculumData = { learningBlocks: [], tuesday: [], friday: {}, currentCohort: '' };

// ── 데이터 로드 ──

async function loadAllData() {
  const page = document.body.dataset.page || 'forum';
  const isArticle = window.location.pathname.includes('article.html');
  const fetches = [];

  // 페이지별 필요한 시트만 로드
  if (page === 'members') {
    fetches.push(fetchSheet(SHEETS.members).then(rows => { membersData = transformMembers(rows); }));
  } else if (page === 'forum' || isArticle) {
    fetches.push(fetchSheet(SHEETS.articles).then(rows => {
      const result = transformArticles(rows);
      forumData = result.forumData;
      nextWeekEvent = result.nextWeekEvent;
      featuredPost = result.featuredPost;
    }));
  } else if (page === 'news') {
    fetches.push(fetchSheet(SHEETS.news).then(rows => {
      const result = transformNews(rows);
      newsArticle = result.newsArticle;
      newsList = result.newsList;
    }));
  } else if (page === 'curriculum') {
    fetches.push(fetchSheet(SHEETS.curriculum).then(rows => { curriculumData = transformCurriculum(rows); }));
  } else if (page === 'search') {
    // 검색은 멤버 + 아티클 둘 다 필요
    fetches.push(fetchSheet(SHEETS.members).then(rows => { membersData = transformMembers(rows); }));
    fetches.push(fetchSheet(SHEETS.articles).then(rows => {
      const result = transformArticles(rows);
      forumData = result.forumData;
    }));
  }

  await Promise.all(fetches);
}
