#!/usr/bin/env node

// Google Sheets → data.js 동기화 스크립트
// 사용법: node sync.js

const https = require('https');
const fs = require('fs');
const path = require('path');

const SHEET_BASE = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGLwxxiXmtN5aLVeGVZrRn068Ix7fEMAKDoOBV21GiAGw6fQgBn4yPHfzWbIvwu3nTNOE_uS7vmnAG/pub';
const SHEETS = {
  members:    `${SHEET_BASE}?gid=0&single=true&output=csv`,
  news:       `${SHEET_BASE}?gid=466223975&single=true&output=csv`,
  articles:   `${SHEET_BASE}?gid=636670025&single=true&output=csv`,
  curriculum: `${SHEET_BASE}?gid=1927098854&single=true&output=csv`,
  site:       `${SHEET_BASE}?gid=880266556&single=true&output=csv`,
};

function fetch(url) {
  return new Promise((resolve, reject) => {
    const get = (u) => {
      https.get(u, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
          return get(res.headers.location);
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    };
    get(url);
  });
}

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

function formatDate(d) {
  if (!d) return '';
  const parts = d.split('-');
  if (parts.length === 3) return `${parts[0]}/ ${parts[1]}/ ${parts[2]}`;
  return d;
}

function transformMembers(rows) {
  const mf = rows.filter(r => r.type === 'moderator_featured')[0];
  const ms = rows.filter(r => r.type === 'moderator');
  const ma = rows.filter(r => r.type === 'maester');
  const mk = rows.filter(r => r.type === 'maker');
  const mp = rows.filter(r => r.type === 'maker_pool');
  return {
    moderators: {
      featured: { name: mf?.name || '', bio: mf?.bio || '', img: mf?.img || '' },
      sub: ms.map(r => ({ name: r.name, bio: r.bio, img: r.img || '' })),
    },
    maesters: ma.map(r => ({ name: r.name, bio: r.bio, session: r.session, img: r.img || '' })),
    lbMakers: mk.map(r => ({ name: r.name, tags: [r.tag1, r.tag2, r.tag3].filter(Boolean), img: r.img || '' })),
    makerPool: mp.map(r => ({ name: r.name, tags: [r.tag1, r.tag2, r.tag3].filter(Boolean), img: r.img || '' })),
  };
}

function transformArticles(rows) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futureRows = rows.filter(r => new Date(r.date) > today).sort((a, b) => new Date(a.date) - new Date(b.date));
  const nextWeekRow = futureRows[0] || null;
  const pastRows = rows.filter(r => new Date(r.date) <= today);
  const sorted = [...pastRows].sort((a, b) => new Date(b.date) - new Date(a.date));
  const featuredRow = sorted[0] || null;

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
          num: parseInt(r.num), date: formatDate(r.date), title: r.title,
          tags: r.tags || '', content: r.content || '', img: r.img || '',
        })),
      }));
      return { name, blocks };
    });
    return { year, cohorts, moreCards: [] };
  });

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

  return { forumData, nextWeekEvent, featuredPost };
}

function transformNews(rows) {
  const fr = rows.find(r => r.type === 'featured');
  const lr = rows.filter(r => r.type === 'list');
  return {
    newsArticle: fr ? {
      title: fr.name,
      sectionTitle: fr.section_title,
      qa: [
        { q: fr.q1, a: fr.a1 },
        { q: fr.q2, a: fr.a2 },
        { q: fr.q3, a: fr.a3 },
      ].filter(item => item.q),
    } : { title: '', sectionTitle: '', qa: [] },
    newsList: lr.map(r => ({ name: r.name, desc: r.desc, img: r.img || '' })),
  };
}

function transformCurriculum(rows) {
  const lbs = rows.filter(r => r.type === 'lb');
  const sessions = rows.filter(r => r.type === 'session');
  const infos = rows.filter(r => r.type === 'info');
  const cc = infos.find(r => r.key === 'current_cohort');

  const tuesday = sessions.filter(r => r.value.includes('화요일')).map(r => ({
    session: r.key, time: r.value, maester: r.value2, desc: r.value3, tags: r.tags || '', img: r.img || '', hasPhoto: true,
  }));
  const fridayRow = sessions.find(r => r.value.includes('금요일'));

  return {
    learningBlocks: lbs.map(r => ({ num: r.key, title: r.value, desc: r.value2 })),
    tuesday,
    friday: fridayRow ? { session: fridayRow.key, time: fridayRow.value, desc: fridayRow.value3, tags: fridayRow.tags || '', img: fridayRow.img || '', hasPhoto: true }
      : { session: '', time: '', desc: '', tags: '', img: '', hasPhoto: true },
    currentCohort: cc ? `${cc.value}, ${cc.value2}` : '',
  };
}

function transformSite(rows) {
  const homeRows = rows.filter(r => r.page === 'home');
  const heroRows = rows.filter(r => r.page === 'hero');

  // Home data
  const get = (section, key) => {
    const r = homeRows.find(r => r.section === section && r.key === key);
    return r ? r.value_ko : '';
  };
  const getImg = (section, key) => {
    const r = homeRows.find(r => r.section === section && r.key === key);
    return r && r.img ? r.img : '';
  };

  const homeData = {
    hero: { sub: get('hero', 'sub'), title: get('hero', 'title') },
    about: { body: get('about', 'body'), quote: get('about', 'quote'), body2: get('about', 'body2') },
    vision: [
      { text: get('vision', 'item1'), img: getImg('vision', 'item1') },
      { text: get('vision', 'item2'), img: getImg('vision', 'item2') },
      { text: get('vision', 'item3'), img: getImg('vision', 'item3') },
    ],
    offer: [
      { title: get('offer', 'card1_title'), desc: get('offer', 'card1_desc'), img: getImg('offer', 'card1_title') },
      { title: get('offer', 'card2_title'), desc: get('offer', 'card2_desc'), img: getImg('offer', 'card2_title') },
      { title: get('offer', 'card3_title'), desc: get('offer', 'card3_desc'), img: getImg('offer', 'card3_title') },
      { title: get('offer', 'card4_title'), desc: get('offer', 'card4_desc'), img: getImg('offer', 'card4_title') },
    ],
    support: { body: get('support', 'body') },
    contact: {
      email: get('contact', 'email'),
      newsletter: get('contact', 'newsletter'),
      instagram: get('contact', 'instagram'),
    },
  };

  // Page hero data
  const pageHeroData = {};
  const heroPages = [...new Set(heroRows.map(r => r.section))];
  heroPages.forEach(page => {
    const titleRow = heroRows.find(r => r.section === page && r.key === 'title');
    const descRow = heroRows.find(r => r.section === page && r.key === 'desc');
    pageHeroData[page] = {
      title: titleRow ? titleRow.value_ko : '',
      desc: descRow ? descRow.value_ko : '',
    };
  });

  return { homeData, pageHeroData };
}

async function main() {
  console.log('📡 Google Sheets에서 데이터를 가져오는 중...');

  const [membersCSV, articlesCSV, newsCSV, curriculumCSV, siteCSV] = await Promise.all([
    fetch(SHEETS.members),
    fetch(SHEETS.articles),
    fetch(SHEETS.news),
    fetch(SHEETS.curriculum),
    fetch(SHEETS.site),
  ]);

  const membersData = transformMembers(parseCSV(membersCSV));
  const { forumData, nextWeekEvent, featuredPost } = transformArticles(parseCSV(articlesCSV));
  const { newsArticle, newsList } = transformNews(parseCSV(newsCSV));
  const curriculumData = transformCurriculum(parseCSV(curriculumCSV));
  const { homeData, pageHeroData } = transformSite(parseCSV(siteCSV));

  const output = `// ── 자동 생성 파일 (node sync.js) ──
// 마지막 동기화: ${new Date().toLocaleString('ko-KR')}

const membersData = ${JSON.stringify(membersData, null, 2)};

const forumData = ${JSON.stringify(forumData, null, 2)};

const nextWeekEvent = ${JSON.stringify(nextWeekEvent, null, 2)};

const featuredPost = ${JSON.stringify(featuredPost, null, 2)};

const newsArticle = ${JSON.stringify(newsArticle, null, 2)};

const newsList = ${JSON.stringify(newsList, null, 2)};

const curriculumData = ${JSON.stringify(curriculumData, null, 2)};

const homeData = ${JSON.stringify(homeData, null, 2)};

const pageHeroData = ${JSON.stringify(pageHeroData, null, 2)};
`;

  fs.writeFileSync(path.join(__dirname, 'js', 'data.js'), output, 'utf8');
  console.log('✅ js/data.js 동기화 완료!');
}

main().catch(e => { console.error('❌ 에러:', e.message); process.exit(1); });
