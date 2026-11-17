import { renderDashboard } from './features/dashboard.js';
import { renderProjects, renderProject } from './features/projects.js';
import { renderIdeas } from './features/ideas.js';
import { renderBuilds } from './features/builds.js';
import { renderTests } from './features/testLogs.js';
import { renderParts } from './features/parts.js';
import { renderReferences } from './features/references.js';
import { renderSearch } from './features/search.js';
import { renderSettings } from './features/settings.js';
import { renderAIWorkspace } from './features/aiWorkspace.js';
import { empty } from './ui.js';

const PAGES = {
  '': renderDashboard,
  'projects': renderProjects,
  'ideas': renderIdeas,
  'builds': renderBuilds,
  'tests': renderTests,
  'parts': renderParts,
  'references': renderReferences,
  'settings': renderSettings
};

export async function renderRoute() {
  const hash = location.hash.slice(1) || '/';
  const [path, query] = hash.split('?');
  const params = Object.fromEntries(new URLSearchParams(query));
  const parts = path.split('/').filter(Boolean);
  const view = document.getElementById('view');
  view.innerHTML = '';

  document.querySelectorAll('.nav a').forEach((link) => {
    link.classList.toggle('active', link.dataset.route === `/${parts[0] || ''}`);
  });

  if (parts[0] === 'project') {
    await renderProject(view, { id: parts[1], tab: params.tab || 'overview' });
  } else if (parts[0] === 'search') {
    await renderSearch(view, params);
  } else if (parts[0] === 'ai') {
    await renderAIWorkspace(view, params);
  } else {
    const page = PAGES[parts[0] || ''];
    if (page) {
      await page(view);
    } else {
      view.append(empty('Page not found.'));
    }
  }

  window.scrollTo(0, 0);
}
