# Abdulaziz Alguraini Portfolio

A professional software engineering portfolio for Abdulaziz Alguraini, a KFUPM Software Engineering student concentrating in Artificial Intelligence and Machine Learning. The site highlights selected project case studies with searchable project cards, dedicated detail pages, curated project screenshots, responsive layouts, and a lightweight GitHub feed.

## Live Demo

Live Demo: https://a-alguraini.github.io/assignment-4/

Repository: https://github.com/A-Alguraini/assignment-4

## Featured Projects

### K-Park Campus Parking System

K-Park is a campus parking system concept for KFUPM. The case study presents requirements analysis, UML modeling, and prototype screens for users, administrators, security staff, and accessibility parking flows.

### Guroosh Personal Finance Platform

Guroosh is a full-stack personal finance management platform built as a SWE363 final project. It combines expense tracking, investment monitoring, Zakat calculation, financial advisor workflows, admin oversight, role-based access, and dashboard analytics.

## Features

- Professional About section focused on software engineering strengths.
- Clickable project cards that open dedicated case-study pages.
- Project data stored in `assets/projects.json` for easier updates.
- K-Park and Guroosh galleries with curated screenshots from project reports.
- Search, sorting, tag filters, difficulty filter, and pinned project support.
- Dark and light theme toggle with localStorage persistence.
- Lazy-loaded GitHub repository feed with manual refresh.
- Contact form with client-side validation and status messages.
- Responsive design for desktop and mobile screens.
- Accessibility basics: semantic landmarks, keyboard controls, focus states, alt text, and aria-live status regions.

## Tech Stack

- HTML5
- CSS3
- JavaScript
- GitHub API
- Local JSON project data

## Run Locally

1. Clone the repository:

```bash
git clone https://github.com/A-Alguraini/assignment-4.git
```

2. Open the project folder:

```bash
cd assignment-4
```

3. Start a local server:

```bash
python -m http.server 5500
```

4. Open:

```text
http://127.0.0.1:5500
```

Opening `index.html` directly also works for most static content, but a local server is recommended because project data is fetched from JSON.

## Project Structure

```text
assignment-4/
  index.html
  css/
    styles.css
  js/
    script.js
  assets/
    projects.json
    images/
      kpark/
      guroosh/
      gradpic2022.jpg
  docs/
    technical-documentation.md
    ai-usage-report.md
  presentation/
    slides.pdf
    demo-video.mkv
```

## Project Data

Each project in `assets/projects.json` supports:

- `id`, `title`, `date`, `summary`, and `details`
- `brief`, `role`, `duration`, and `impact`
- `tags`, `difficulty`, `tools`, and `highlights`
- `image`, `imageAlt`, and `gallery`

This keeps the portfolio maintainable: adding a new case study mostly means adding assets and a JSON entry.

## Deployment

Deploy with GitHub Pages:

1. Go to repository Settings.
2. Open Pages.
3. Set source to the `main` branch and root folder.
4. Save and wait for the Pages URL to update.

## Notes

The Guroosh and K-Park case-study images were curated from the provided project PDF reports and optimized into web-ready assets. Temporary extraction files are not required for the live site.
