# GovtInfo Portal — Jobs & Schemes

A fast, responsive, zero-dependency web portal to explore the latest Indian Central & State Government job openings and welfare schemes.

---

## Features

- **Government Jobs Directory**:
  - Live search across job title, organization, and keywords.
  - Multi-attribute filtering by Sector, State/UT, and Minimum Qualification.
  - Interactive job modal with key details: vacancies, pay scale, age criteria, requirements, and selection process.
  - Direct links to official recruitment portals.
  - Client-side pagination and animated metric counters.

- **Welfare Schemes Directory**:
  - Search schemes by name, ministry, and benefits.
  - Filters for Ministry, Category (Welfare, Financial, Health, Education, Agriculture, etc.), and Beneficiary type.
  - Detail modals outlining eligibility criteria, benefits, and application guidelines.

- **Lightweight & Fast**:
  - Zero external build dependencies or libraries.
  - Fully responsive design (mobile, tablet, desktop).
  - Clean vanilla JavaScript (ES6+) and modern CSS Grid/Flexbox styling.

---

## Project Structure

```
govt-portal/
├── index.html        # Main HTML entry point
├── README.md         # Project documentation
└── src/
    ├── app.js        # Core application logic, filtering, modal handling, pagination
    ├── data.js       # Dataset for jobs, schemes, and states
    └── style.css     # Responsive layout, components, animations, and theming
```

---

## Getting Started

### Local Development

No package manager or build step is required. You can run the portal using any static file server or simply open the HTML file:

#### Option 1: Direct in Browser
Double-click [`index.html`](index.html) or open it directly in any modern browser.

#### Option 2: Using a Local HTTP Server (Recommended)
Using Python 3:
```bash
python3 -m http.server 8000
```
Then visit `http://localhost:8000` in your web browser.

Using Node.js (`npx serve` or `npx http-server`):
```bash
npx serve .
```

---

## Deployment

Since the portal consists entirely of static assets (`index.html`, `src/`), it can be deployed directly to any static hosting provider without configuration.

### GitHub Pages
1. Push the repository to GitHub.
2. Go to **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
4. Select `main` (or `master`) branch and root folder `/`, then click **Save**.

### Vercel / Netlify / Cloudflare Pages
- Connect the Git repository or drag-and-drop the project folder.
- **Build Command**: *(Leave empty)*
- **Output Directory**: `.` *(Root directory)*

### Nginx / Apache / S3
Copy `index.html` and the `src/` folder to your web server document root directory.

---

## Browser Compatibility

- Google Chrome (latest)
- Mozilla Firefox (latest)
- Apple Safari (latest)
- Microsoft Edge (latest)

---

## Disclaimer

Data presented in this application is indicative and intended for demonstration and information discovery. Users should always verify official notices on corresponding government websites (`india.gov.in`, official PSCs, and ministry portals).

---

## License

MIT License. Feel free to use and customize for your own projects.
