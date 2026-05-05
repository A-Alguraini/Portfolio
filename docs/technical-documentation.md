# Technical Documentation (Assignment 4)

## Architecture
- **HTML**: Single index.html with About, Projects, Project Detail, and Contact sections. Projects render from <template id="projectItemTemplate"> and the GitHub feed uses <template id="repoTemplate">.
- **CSS**: css/styles.css defines design tokens, responsive layout, focus styles, chips, project cards, case-study detail sections, gallery grids, toast, reveal transitions, stats, and feed cards.
- **JavaScript**: js/script.js handles state, project normalization, hash routing, project detail rendering, GitHub API integration, form validation, and notifications.

## State
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

Helper utilities:
- slugify + normalizeProjects ensure every project has an id, difficulty, brief, role, tools, highlights, and gallery fallback.
- persistPins writes the pinned set back to localStorage.

## Rendering & Interaction
1. **Init**: set year, apply theme, set greeting, init navigation/hash routing, reveal observer, contact form handler, GitHub observer, and filter controls.
2. **Data**: loadProjects() fetches assets/projects.json. On error, it shows a message + Retry and uses a minimal fallback list.
3. **Filters**: buildTags() collects unique tags; applyFilters() combines query + active tag chips + difficulty select + optional pinned-only mode + sort (title/date) while keeping pinned items ahead of the rest.
4. **Cards**: renderProjects() clones the template per item, fills title/date/summary/role/difficulty, renders tags, handles the pin button (aria-pressed + localStorage persistence), and opens a case study at #project/{id}.
5. **Project detail**: renderProjectDetail() fills the brief, impact, role, timeline, tools, highlights, hero image, and gallery from the project JSON.
6. **Stats**: updateStats() surfaces total vs. visible projects, pinned count, active tag filters, and difficulty selection.
7. **GitHub feed**: IntersectionObserver triggers fetchGitHubRepos() once the feed enters the viewport. A Refresh button retries manually. The API call hits https://api.github.com/users/A-Alguraini/repos?sort=updated&per_page=6, maps the response, and renders repo cards with stars, language, and relative updated time.

## Accessibility
- Landmarks: header / nav / main / footer.
- Status areas use role="status" with aria-live="polite" for projects, contact form, GitHub feed, and toast.
- Visible focus rings; chips, pin buttons, navigation tabs, and project-open buttons are keyboard-operable.
- All images include descriptive alt text; thumbnails use imageAlt from JSON.
- Feed links open in a new tab with rel="noopener".

## Error, Loading, and Empty States
- Loading: "Loading projects..." while fetching.
- Error: network failure message with a Retry button.
- Empty: "No projects found." when filters match nothing.
- All status messages are announced via aria-live.

## Animations
- On-scroll reveal uses IntersectionObserver with threshold 0.12. When an element becomes visible, .visible is added and the observer unobserves it.
- Reduced-motion users skip animations via prefers-reduced-motion media query.

## Performance
- CSS preload to improve first paint.
- Thumbnails have explicit width/height and loading="lazy" to reduce CLS.
- Project/feed cards use content-visibility + contain-intrinsic-size to reserve space before rendering.
- GitHub fetch waits for viewport visibility and uses AbortController for timeouts.
- K-Park and Guroosh images are curated from project PDFs into web-ready files instead of loading full reports.
- Minimal JS/CSS; no third-party libraries.

## Compatibility
- Chrome (Desktop): OK
- Edge (Desktop): OK
- Firefox (Desktop): OK
- iOS Safari: OK (tap targets >= 44px)
- Android Chrome: OK (lazy images work as expected)

## Data Format (assets/projects.json)
{
  "projects": [
    {
      "id": "k-park",
      "title": "K-Park Campus Parking System",
      "date": "2024-11-01",
      "summary": "A campus parking product concept for KFUPM.",
      "details": "Requirements analysis, UML modeling, and mobile prototype screens.",
      "brief": "Longer case-study overview.",
      "role": "Software engineering case study",
      "duration": "SWE206 project",
      "impact": "Mapped a complete parking journey.",
      "tags": ["product design", "mobile UI", "UML", "campus"],
      "difficulty": "advanced",
      "tools": ["Requirements analysis", "UML diagrams", "Mobile prototyping"],
      "highlights": ["Defined requirements", "Modeled workflows", "Designed prototype screens"],
      "image": "assets/images/kpark/kpark-dashboard.png",
      "imageAlt": "K-Park mobile dashboard",
      "gallery": [
        {
          "src": "assets/images/kpark/kpark-dashboard.png",
          "alt": "K-Park dashboard",
          "caption": "Dashboard screen."
        }
      ]
    }
  ]
}

## Future Work
- Persist filters in the URL for shareable filtered views.
- Add downloadable resume or CV.
- Add pagination or "Load more" for a larger project archive.
- Replace Formspree with a custom serverless contact endpoint if needed.
- Add offline cache for GitHub feed if rate-limited.
