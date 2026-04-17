#!/usr/bin/env node

// Google Sheets → data.js 동기화 스크립트 (한/영)
// 사용법: node sync.js

const https = require('https');
const fs = require('fs');
const path = require('path');

const SHEET_BASE = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGLwxxiXmtN5aLVeGVZrRn068Ix7fEMAKDoOBV21GiAGw6fQgBn4yPHfzWbIvwu3nTNOE_uS7vmnAG/pub';

const SHEETS = {
  kor: {
    site:       `${SHEET_BASE}?gid=880266556&single=true&output=csv`,
    members:    `${SHEET_BASE}?gid=0&single=true&output=csv`,
    news:       `${SHEET_BASE}?gid=466223975&single=true&output=csv`,
    articles:   `${SHEET_BASE}?gid=636670025&single=true&output=csv`,
    curriculum: `${SHEET_BASE}?gid=1927098854&single=true&output=csv`,
  },
  eng: {
    site:       `${SHEET_BASE}?gid=555351381&single=true&output=csv`,
    members:    `${SHEET_BASE}?gid=111990366&single=true&output=csv`,
    news:       `${SHEET_BASE}?gid=1133512063&single=true&output=csv`,
    articles:   `${SHEET_BASE}?gid=189461007&single=true&output=csv`,
    curriculum: `${SHEET_BASE}?gid=799776214&single=true&output=csv`,
  },
  control: `${SHEET_BASE}?gid=1977322232&single=true&output=csv`,
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
    .filter(r => r[0] && !r[0].startsWith('[예시]') && !r[0].startsWith('[Example]'))
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
  const ma = rows.filter(r => r.type === 'maester' || r.type === 'miester');
  const mk = rows.filter(r => r.type === 'maker');
  const mp = rows.filter(r => r.type === 'maker_pool');
  const tagsOf = (r) => [r.tag1, r.tag2, r.tag3].filter(Boolean);
  const cohortsOf = (r) => ((r.session || '').match(/Cohort\s*(\d+)/gi) || []).map(m => m.match(/\d+/)[0]);
  return {
    moderators: {
      featured: { name: mf?.name || '', bio: mf?.bio || '', img: mf?.img || '', tags: mf ? tagsOf(mf) : [] },
      sub: ms.map(r => ({ name: r.name, bio: r.bio, img: r.img || '', tags: tagsOf(r) })),
    },
    maesters: ma.map(r => ({ name: r.name, bio: r.bio, session: r.session, img: r.img || '', tags: tagsOf(r), cohorts: cohortsOf(r) })),
    lbMakers: mk.map(r => ({ name: r.name, tags: tagsOf(r), img: r.img || '', cohorts: cohortsOf(r) })),
    makerPool: mp.map(r => ({ name: r.name, tags: tagsOf(r), img: r.img || '', cohorts: cohortsOf(r) })),
  };
}

function transformArticles(rows, lang) {
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

  const defaultNextTitle = lang === 'eng' ? 'Next session is being prepared' : '다음 세션을 준비 중입니다';
  const nextWeekEvent = nextWeekRow ? {
    title: nextWeekRow.title,
    desc: nextWeekRow.content ? nextWeekRow.content.split('||')[0].split('::')[0] : '',
    date: formatDate(nextWeekRow.date),
    location: nextWeekRow.location || '',
    link: 'https://walla.my/a/metes_cohort4',
  } : { title: defaultNextTitle, desc: '', date: '', location: '', link: 'https://walla.my/a/metes_cohort4' };

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

function transformCurriculum(rows, lang) {
  const lbs = rows.filter(r => r.type === 'lb');
  const sessions = rows.filter(r => r.type === 'session');
  const infos = rows.filter(r => r.type === 'info');
  const cc = infos.find(r => r.key === 'current_cohort');

  const isTue = (v) => v && (v.includes('화요일') || /tue/i.test(v));
  const isFri = (v) => v && (v.includes('금요일') || /fri/i.test(v));

  const tuesday = sessions.filter(r => isTue(r.value)).map(r => ({
    session: r.key, time: r.value, maester: r.value2, desc: r.value3, tags: r.tags || '', img: r.img || '', hasPhoto: true,
  }));
  const fridayRow = sessions.find(r => isFri(r.value));

  return {
    learningBlocks: lbs.map(r => ({ num: r.key, title: r.value, desc: r.value2 })),
    tuesday,
    friday: fridayRow ? { session: fridayRow.key, time: fridayRow.value, desc: fridayRow.value3, tags: fridayRow.tags || '', img: fridayRow.img || '', hasPhoto: true }
      : { session: '', time: '', desc: '', tags: '', img: '', hasPhoto: true },
    currentCohort: cc ? `${cc.value}, ${cc.value2}` : '',
  };
}

function transformSite(rows, lang) {
  // Group rows by page > section (multiple rows per section possible)
  const siteData = {};
  rows.forEach(r => {
    if (!r.page || !r.section) return;
    if (!siteData[r.page]) siteData[r.page] = {};
    if (!siteData[r.page][r.section]) siteData[r.page][r.section] = [];
    siteData[r.page][r.section].push({
      title: r.title || '',
      desc: r.desc || '',
      extra1: r.extra1 || '',
      extra2: r.extra2 || '',
      img: r.img || '',
    });
  });

  // pageHeroData (from page=hero)
  const pageHeroData = {};
  const heroSections = (siteData.hero) ? Object.keys(siteData.hero) : [];
  heroSections.forEach(section => {
    const r = siteData.hero[section][0] || {};
    pageHeroData[section] = { title: r.title || '', desc: r.desc || '' };
  });

  return { siteData, pageHeroData };
}

async function buildLang(lang) {
  const sheets = SHEETS[lang];
  const [membersCSV, articlesCSV, newsCSV, curriculumCSV, siteCSV] = await Promise.all([
    fetch(sheets.members),
    fetch(sheets.articles),
    fetch(sheets.news),
    fetch(sheets.curriculum),
    fetch(sheets.site),
  ]);

  const membersData = transformMembers(parseCSV(membersCSV));
  const { forumData, nextWeekEvent, featuredPost } = transformArticles(parseCSV(articlesCSV), lang);
  const { newsArticle, newsList } = transformNews(parseCSV(newsCSV));
  const curriculumData = transformCurriculum(parseCSV(curriculumCSV), lang);
  const { siteData, pageHeroData } = transformSite(parseCSV(siteCSV), lang);

  return {
    membersData, forumData, nextWeekEvent, featuredPost,
    newsArticle, newsList, curriculumData, siteData, pageHeroData,
  };
}

function transformControl(rows) {
  const map = {};
  rows.forEach(r => {
    if (!r.key) return;
    const v = String(r.enabled || '').trim().toUpperCase();
    map[r.key] = !(v === 'FALSE' || v === '0' || v === 'NO');
  });
  return map;
}

async function main() {
  console.log('📡 Google Sheets에서 데이터를 가져오는 중 (한/영)...');

  const [kor, eng, controlCSV] = await Promise.all([
    buildLang('kor'),
    buildLang('eng'),
    fetch(SHEETS.control),
  ]);
  const controlMap = transformControl(parseCSV(controlCSV));

  const output = `// ── 자동 생성 파일 (node sync.js) ──
// 마지막 동기화: ${new Date().toLocaleString('ko-KR')}

const dataByLang = {
  kor: ${JSON.stringify(kor, null, 2)},
  eng: ${JSON.stringify(eng, null, 2)}
};

const controlMap = ${JSON.stringify(controlMap, null, 2)};
function isEnabled(key) {
  return controlMap[key] !== false;
}

const currentLang = (typeof localStorage !== 'undefined' && localStorage.getItem('lang')) || 'kor';
const _data = dataByLang[currentLang] || dataByLang.kor;

const membersData = _data.membersData;
const forumData = _data.forumData;
const nextWeekEvent = _data.nextWeekEvent;
const featuredPost = _data.featuredPost;
const newsArticle = _data.newsArticle;
const newsList = _data.newsList;
const curriculumData = _data.curriculumData;
const siteData = _data.siteData;
const pageHeroData = _data.pageHeroData;

// helper for accessing site text
function siteOne(page, section) {
  return (siteData && siteData[page] && siteData[page][section] && siteData[page][section][0]) || {};
}
function siteAll(page, section) {
  return (siteData && siteData[page] && siteData[page][section]) || [];
}
`;

  fs.writeFileSync(path.join(__dirname, 'js', 'data.js'), output, 'utf8');
  console.log('✅ js/data.js 동기화 완료!');
}

main().catch(e => { console.error('❌ 에러:', e.message); process.exit(1); });
