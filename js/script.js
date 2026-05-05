const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const GH_USER = 'A-Alguraini';
const GH_ENDPOINT = `https://api.github.com/users/${GH_USER}/repos?sort=updated&per_page=6`;
const TAB_IDS = new Set(['about', 'projects', 'contact']);

const state = {
  projects: [],
  filtered: [],
  tags: new Set(),
  activeTags: new Set(),
  sort: 'title',
  query: '',
  difficulty: 'any',
  onlyPinned: false,
  pinned: new Set(load('pinnedProjects', [])),
  github: { repos: [], loaded: false, loading: false, error: '' }
};

let toastTimer;
let revealObserver;

function save(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function slugify(input) {
  const base = (input || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (base) return base;
  return String(Date.now());
}

function titleCase(input) {
  return (input || '')
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function normalizeProjects(arr) {
  return (arr || []).map((item, idx) => {
    const id = item.id || slugify(`${item.title || 'project'}-${idx}`);
    const image = item.image || '';
    return {
      ...item,
      id,
      title: item.title || 'Untitled Project',
      date: item.date || new Date().toISOString(),
      summary: item.summary || '',
      details: item.details || '',
      brief: item.brief || item.details || item.summary || '',
      role: item.role || 'Project work',
      duration: item.duration || 'Independent project',
      impact: item.impact || item.details || item.summary || '',
      tags: Array.isArray(item.tags) ? item.tags : [],
      tools: Array.isArray(item.tools) ? item.tools : [],
      highlights: Array.isArray(item.highlights) ? item.highlights : [],
      difficulty: (item.difficulty || 'intermediate').toLowerCase(),
      image,
      imageAlt: item.imageAlt || `${item.title || 'Project'} preview`,
      gallery: Array.isArray(item.gallery) && item.gallery.length
        ? item.gallery
        : image
          ? [{ src: image, alt: item.imageAlt || `${item.title || 'Project'} preview`, caption: item.summary || item.title || 'Project preview' }]
          : []
    };
  });
}

function persistPins() {
  save('pinnedProjects', [...state.pinned]);
}

function prunePinnedProjects() {
  const validIds = new Set(state.projects.map(project => project.id));
  const before = state.pinned.size;
  state.pinned = new Set([...state.pinned].filter(id => validIds.has(id)));
  if (state.pinned.size !== before) {
    persistPins();
  }
}

function setGreeting() {
  const target = $('#greeting');
  if (!target) return;
  const hour = new Date().getHours();
  const part = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  target.textContent = `${part}. I build useful, human-centered software.`;
}

function applyTheme() {
  const theme = load('theme', 'light');
  document.body.classList.remove('light', 'dark');
  document.body.classList.add(theme);
  const btn = $('#themeToggle');
  if (btn) {
    btn.textContent = theme === 'dark' ? 'Light' : 'Dark';
    btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
  }
}

function toggleTheme() {
  const theme = document.body.classList.contains('dark') ? 'light' : 'dark';
  save('theme', theme);
  applyTheme();
  toast(`${titleCase(theme)} theme enabled`);
}

function setActivePanel(id) {
  const target = $(`#${id}`);
  if (!target) return;

  $$('.panel').forEach(panel => {
    const isActive = panel === target;
    panel.classList.toggle('active', isActive);
    panel.setAttribute('aria-hidden', String(!isActive));
  });

  const activeTab = id === 'projectDetail' ? 'projects' : id;
  $$('.tab').forEach(btn => {
    const isActive = btn.dataset.tab === activeTab;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });

  if (id !== 'projectDetail') {
    document.title = 'A. Alguraini | Software Engineering Portfolio';
  }

  initReveal();
}

function initNavigation() {
  $$('[data-tab]').forEach(control => {
    control.addEventListener('click', () => {
      const id = control.dataset.tab;
      if (TAB_IDS.has(id)) {
        navigateTo(id);
      }
    });
  });

  $('#backToProjects')?.addEventListener('click', () => {
    navigateTo('projects');
  });

  window.addEventListener('hashchange', handleRoute);
  window.addEventListener('popstate', handleRoute);
}

function navigateTo(route) {
  history.pushState(null, '', `#${route}`);
  handleRoute();
}

function scrollToTop() {
  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  });
}

function handleRoute() {
  const route = decodeURIComponent(window.location.hash.replace(/^#/, ''));
  if (route.startsWith('project/')) {
    openProject(route.slice('project/'.length), false);
    return;
  }

  if (TAB_IDS.has(route)) {
    setActivePanel(route);
    scrollToTop();
    return;
  }

  setActivePanel('about');
}

function initReveal() {
  if (!('IntersectionObserver' in window)) {
    $$('.reveal').forEach(el => el.classList.add('visible'));
    return;
  }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      }
    }, { threshold: 0.12 });
  }

  $$('.reveal:not(.visible)').forEach(el => revealObserver.observe(el));
}

function toast(msg) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

async function loadProjects() {
  const status = $('#status');
  if (status) status.textContent = 'Loading projects...';

  try {
    const res = await fetch('assets/projects.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    state.projects = normalizeProjects(data.projects);
    if (status) status.textContent = '';
  } catch {
    state.projects = normalizeProjects([
      {
        id: 'fallback-portfolio',
        title: 'Portfolio Project',
        date: '2025-10-15',
        summary: 'Local fallback project shown when project data cannot be loaded.',
        details: 'The portfolio can still render if the JSON request fails.',
        tags: ['web', 'javascript'],
        difficulty: 'intermediate'
      }
    ]);
    if (status) {
      status.innerHTML = 'Project data could not load. <button id="retryBtn" class="btn-outline" type="button">Retry</button>';
      $('#retryBtn')?.addEventListener('click', () => loadProjects());
    }
  }

  prunePinnedProjects();
  buildTags();
  applyFilters();
  renderProjects();
  handleRoute();
}

function buildTags() {
  state.tags = new Set();
  state.projects.forEach(project => {
    (project.tags || []).forEach(tag => state.tags.add(tag));
  });

  const wrap = $('#tagFilters');
  if (!wrap) return;
  wrap.innerHTML = '';

  [...state.tags].sort().forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.type = 'button';
    btn.textContent = tag;
    btn.setAttribute('aria-pressed', String(state.activeTags.has(tag)));
    btn.addEventListener('click', () => {
      if (state.activeTags.has(tag)) {
        state.activeTags.delete(tag);
      } else {
        state.activeTags.add(tag);
      }
      btn.classList.toggle('active', state.activeTags.has(tag));
      btn.setAttribute('aria-pressed', String(state.activeTags.has(tag)));
      applyFilters();
      renderProjects();
    });
    wrap.appendChild(btn);
  });
}

function applyFilters() {
  const q = state.query.toLowerCase();
  const filtered = state.projects.filter(project => {
    const searchable = [
      project.title,
      project.summary,
      project.details,
      project.brief,
      project.role,
      project.impact,
      (project.tags || []).join(' '),
      (project.tools || []).join(' '),
      (project.highlights || []).join(' ')
    ].join(' ').toLowerCase();

    const matchesQuery = searchable.includes(q);
    const matchesTag = state.activeTags.size === 0 || (project.tags || []).some(tag => state.activeTags.has(tag));
    const matchesDifficulty = state.difficulty === 'any' || project.difficulty === state.difficulty;
    const matchesPin = !state.onlyPinned || state.pinned.has(project.id);

    return matchesQuery && matchesTag && matchesDifficulty && matchesPin;
  });

  filtered.sort((a, b) => {
    if (!state.onlyPinned) {
      const pinWeight = Number(state.pinned.has(b.id)) - Number(state.pinned.has(a.id));
      if (pinWeight !== 0) return pinWeight;
    }
    if (state.sort === 'date') return new Date(b.date) - new Date(a.date);
    return a.title.localeCompare(b.title);
  });

  state.filtered = filtered;
  updateStats();
}

function updateStats() {
  const stats = $('#projectStats');
  if (!stats) return;

  const items = [
    `${state.filtered.length} of ${state.projects.length} projects`,
    `${state.pinned.size} pinned`,
    `${state.activeTags.size} tag filters`,
    state.difficulty === 'any' ? 'All levels' : titleCase(state.difficulty)
  ];

  stats.innerHTML = '';
  items.forEach(item => {
    const span = document.createElement('span');
    span.textContent = item;
    stats.appendChild(span);
  });
}

function renderProjects() {
  const list = $('#projectList');
  const status = $('#status');
  if (!list) return;

  list.innerHTML = '';

  if (state.filtered.length === 0) {
    if (status) status.textContent = 'No projects found.';
    return;
  }

  if (status) status.textContent = '';
  const tpl = $('#projectItemTemplate');

  state.filtered.forEach(project => {
    const node = tpl.content.cloneNode(true);
    const item = node.querySelector('.project-card');
    item.classList.toggle('is-pinned', state.pinned.has(project.id));
    item.addEventListener('click', event => {
      if (event.target.closest('button, a, input, select, textarea')) return;
      openProject(project.id);
    });

    const img = node.querySelector('.thumb');
    if (project.image) {
      img.src = project.image;
      img.alt = project.imageAlt;
    } else {
      img.hidden = true;
    }

    node.querySelector('.title').textContent = project.title;
    node.querySelector('.date').textContent = formatDate(project.date);
    node.querySelector('.summary').textContent = project.summary;
    node.querySelector('.difficulty').textContent = titleCase(project.difficulty);
    node.querySelector('.role').textContent = project.role;

    const tagWrap = node.querySelector('.tags');
    renderPills(tagWrap, project.tags, 'tag');

    const pinBtn = node.querySelector('.pin');
    pinBtn.setAttribute('aria-pressed', String(state.pinned.has(project.id)));
    pinBtn.textContent = state.pinned.has(project.id) ? 'Pinned' : 'Pin';
    pinBtn.addEventListener('click', event => {
      event.stopPropagation();
      if (state.pinned.has(project.id)) {
        state.pinned.delete(project.id);
      } else {
        state.pinned.add(project.id);
      }
      persistPins();
      applyFilters();
      renderProjects();
    });

    node.querySelector('.project-open').addEventListener('click', event => {
      event.stopPropagation();
      openProject(project.id);
    });

    list.appendChild(node);
  });

  initReveal();
}

function renderPills(container, values, className) {
  if (!container) return;
  container.innerHTML = '';
  (values || []).forEach(value => {
    const span = document.createElement('span');
    span.className = className;
    span.textContent = value;
    container.appendChild(span);
  });
}

function openProject(id, shouldPush = true) {
  if (shouldPush) {
    navigateTo(`project/${encodeURIComponent(id)}`);
    return;
  }

  const project = state.projects.find(item => item.id === id);
  if (!project) {
    toast('Project not found');
    setActivePanel('projects');
    return;
  }

  renderProjectDetail(project);
  setActivePanel('projectDetail');
  document.title = `${project.title} | A. Alguraini`;
  scrollToTop();
}

function renderProjectDetail(project) {
  $('#detailEyebrow').textContent = `${formatDate(project.date)} case study`;
  $('#detailTitle').textContent = project.title;
  $('#detailSummary').textContent = project.details || project.summary;
  $('#detailRole').textContent = project.role;
  $('#detailDuration').textContent = project.duration;
  $('#detailDifficulty').textContent = titleCase(project.difficulty);
  $('#detailBrief').textContent = project.brief;
  $('#detailImpact').textContent = project.impact;

  const heroImage = $('#detailHeroImage');
  heroImage.src = project.image || project.gallery[0]?.src || '';
  heroImage.alt = project.imageAlt || project.gallery[0]?.alt || `${project.title} image`;

  renderPills($('#detailTags'), project.tags, 'tag');
  renderPills($('#detailTools'), project.tools, 'tool');

  const highlights = $('#detailHighlights');
  highlights.innerHTML = '';
  const items = project.highlights.length ? project.highlights : [project.details || project.summary];
  items.forEach(text => {
    const li = document.createElement('li');
    li.textContent = text;
    highlights.appendChild(li);
  });

  const gallery = $('#detailGallery');
  gallery.innerHTML = '';
  project.gallery.forEach(image => {
    const figure = document.createElement('figure');
    figure.className = 'gallery-item';

    const img = document.createElement('img');
    img.src = image.src;
    img.alt = image.alt || `${project.title} screenshot`;
    img.loading = 'lazy';
    figure.appendChild(img);

    const caption = document.createElement('figcaption');
    caption.textContent = image.caption || project.title;
    figure.appendChild(caption);

    gallery.appendChild(figure);
  });
}

function initForm() {
  const form = $('#contactForm');
  if (!form) return;

  const status = $('#formStatus');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    status.textContent = '';

    const name = $('#name').value.trim();
    const email = $('#email').value.trim();
    const message = $('#message').value.trim();

    let ok = true;
    ok = setError('#name', name.length >= 2 ? '' : 'Please enter at least 2 characters.') && ok;
    ok = setError('#email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Please enter a valid email.') && ok;
    ok = setError('#message', message.length >= 10 ? '' : 'Message should be at least 10 characters.') && ok;
    if (!ok) {
      toast('Please fix the highlighted fields');
      return;
    }

    const sendBtn = $('#sendBtn');
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';
    try {
      const res = await fetch('https://formspree.io/f/meoyrvyv', {
        method: 'POST',
        body: JSON.stringify({ name, email, message }),
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error('Network error');
      toast('Message sent');
      status.textContent = 'Thanks. I will get back to you soon.';
      form.reset();
    } catch {
      status.textContent = 'Failed to send. Please try again.';
      toast('Send failed');
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send Message';
    }
  });

  function setError(sel, msg) {
    const input = $(sel);
    const small = input.parentElement.querySelector('.error');
    small.textContent = msg;
    return msg === '';
  }
}

function initControls() {
  $('#searchInput')?.addEventListener('input', event => {
    state.query = event.target.value;
    applyFilters();
    renderProjects();
  });

  $('#sortSelect')?.addEventListener('change', event => {
    state.sort = event.target.value;
    applyFilters();
    renderProjects();
  });

  $('#difficultySelect')?.addEventListener('change', event => {
    state.difficulty = event.target.value;
    applyFilters();
    renderProjects();
  });

  const pinnedBtn = $('#pinnedToggle');
  pinnedBtn?.addEventListener('click', () => {
    state.onlyPinned = !state.onlyPinned;
    pinnedBtn.setAttribute('aria-pressed', String(state.onlyPinned));
    pinnedBtn.textContent = state.onlyPinned ? 'Showing pinned' : 'Show pinned only';
    applyFilters();
    renderProjects();
  });

  $('#reloadBtn')?.addEventListener('click', () => loadProjects());
}

function observeGitHubFeed() {
  const feed = $('#githubFeed');
  if (!feed) return;

  setGitHubStatus('Repository feed loads when visible.');

  if (!('IntersectionObserver' in window)) {
    fetchGitHubRepos();
  } else {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        fetchGitHubRepos();
        observer.disconnect();
      }
    }, { threshold: 0.2 });
    observer.observe(feed);
  }

  $('#githubRefresh')?.addEventListener('click', () => fetchGitHubRepos(true));
}

async function fetchGitHubRepos(force = false) {
  if (state.github.loading) return;
  if (state.github.loaded && !force) return;

  state.github.loading = true;
  setGitHubStatus('Loading repositories...');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(GH_ENDPOINT, {
      signal: controller.signal,
      headers: { 'Accept': 'application/vnd.github+json' }
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error('Request failed');

    const data = await res.json();
    state.github.repos = (data || []).map(repo => ({
      id: repo.id,
      name: repo.name,
      url: repo.html_url,
      description: repo.description || 'No description yet.',
      stars: repo.stargazers_count,
      language: repo.language || 'n/a',
      updated: repo.pushed_at
    })).slice(0, 6);

    state.github.loaded = true;
    state.github.error = '';
    renderGitHubRepos();
    setGitHubStatus('GitHub feed updated.');
  } catch {
    state.github.loaded = false;
    state.github.error = 'Unable to load GitHub data. Try again later.';
    setGitHubStatus(state.github.error);
  } finally {
    state.github.loading = false;
  }
}

function renderGitHubRepos() {
  const list = $('#githubList');
  if (!list) return;

  list.innerHTML = '';
  if (state.github.repos.length === 0) {
    const item = document.createElement('li');
    item.className = 'feed-card';
    item.textContent = 'No repositories found.';
    list.appendChild(item);
    return;
  }

  const tpl = $('#repoTemplate');
  state.github.repos.forEach(repo => {
    const node = tpl.content.cloneNode(true);
    node.querySelector('.repo-name').textContent = repo.name;
    node.querySelector('.repo-stars').textContent = `${repo.stars} stars`;
    node.querySelector('.repo-desc').textContent = repo.description;
    node.querySelector('.repo-lang').textContent = repo.language;
    node.querySelector('.repo-updated').textContent = formatRelativeTime(repo.updated);
    const link = node.querySelector('.repo-link');
    link.href = repo.url;
    link.textContent = 'Open repo';
    list.appendChild(node);
  });
}

function setGitHubStatus(msg) {
  const el = $('#githubStatus');
  if (el) el.textContent = msg;
}

function formatDate(value) {
  const date = new Date(value);
  if (!isFinite(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatRelativeTime(value) {
  const ts = new Date(value).getTime();
  if (!isFinite(ts)) return '';
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

document.addEventListener('DOMContentLoaded', () => {
  $('#year').textContent = new Date().getFullYear();
  setGreeting();
  applyTheme();
  $('#themeToggle')?.addEventListener('click', toggleTheme);
  initNavigation();
  initReveal();
  initForm();
  initControls();
  observeGitHubFeed();
  loadProjects();
});
