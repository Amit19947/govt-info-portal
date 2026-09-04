/* ===================================================================
   app.js  —  GovtInfo Portal: Jobs & Schemes (with pagination)
   =================================================================== */

const $ = (id) => document.getElementById(id);
const unique = (arr) => [...new Set(arr.filter(Boolean))].sort();

const JOBS_PER_PAGE    = 9;
const SCHEMES_PER_PAGE = 9;

let jobsPage    = 1;
let schemesPage = 1;

// ── Helpers ──────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function daysLeft(iso) {
  if (!iso) return null;
  return Math.ceil((new Date(iso + "T00:00:00") - new Date()) / 86400000);
}

function statusBadge(status) {
  const map = {
    open:   ["badge-open",   "🟢 Open"],
    closed: ["badge-closed", "🔴 Closed"],
    soon:   ["badge-soon",   "🟡 Opening Soon"]
  };
  const [cls, label] = map[status] || ["badge-soon", status];
  return `<span class="badge ${cls}">${label}</span>`;
}

function typeBadge(type) {
  return type === "Central"
    ? `<span class="badge badge-central">🏛 Central</span>`
    : `<span class="badge badge-state">🏙 State</span>`;
}

function categoryBadge(cat) {
  const classes = {
    Welfare: "badge-welfare", Financial: "badge-financial", Education: "badge-education",
    Health: "badge-health",   Employment: "badge-employment", Housing: "badge-housing",
    Agriculture: "badge-agriculture", Women: "badge-women"
  };
  return `<span class="badge ${classes[cat] || "badge-welfare"}">${cat}</span>`;
}

function fillSelect(selectEl, options) {
  options.forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt; o.textContent = opt;
    selectEl.appendChild(o);
  });
}

function animateCounter(el, target, duration = 800) {
  let start = 0;
  const step = target / (duration / 16);
  const tick = () => {
    start = Math.min(start + step, target);
    el.textContent = Math.round(start).toLocaleString("en-IN");
    if (start < target) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ── Pagination helper ────────────────────────────────────────────────
function renderPagination(containerId, currentPage, totalItems, perPage, onPageChange) {
  const container = $(containerId);
  const totalPages = Math.ceil(totalItems / perPage);
  if (totalPages <= 1) { container.innerHTML = ""; return; }

  const start = (currentPage - 1) * perPage + 1;
  const end   = Math.min(currentPage * perPage, totalItems);

  let pages = [];
  // Always show first, last, current ± 2
  const near = new Set([1, totalPages]);
  for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) near.add(i);
  const sorted = [...near].sort((a, b) => a - b);

  let html = `<div class="pagination">`;
  html += `<span class="page-info">Showing ${start}–${end} of ${totalItems}</span>`;
  html += `<div class="page-btns">`;
  html += `<button class="page-btn" ${currentPage === 1 ? "disabled" : ""} data-page="${currentPage - 1}">‹ Prev</button>`;

  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) html += `<span class="page-ellipsis">…</span>`;
    html += `<button class="page-btn ${p === currentPage ? "active" : ""}" data-page="${p}">${p}</button>`;
    prev = p;
  }

  html += `<button class="page-btn" ${currentPage === totalPages ? "disabled" : ""} data-page="${currentPage + 1}">Next ›</button>`;
  html += `</div></div>`;

  container.innerHTML = html;
  container.querySelectorAll(".page-btn:not([disabled])").forEach((btn) => {
    btn.addEventListener("click", () => {
      onPageChange(parseInt(btn.dataset.page));
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

// ── Modal ─────────────────────────────────────────────────────────────
const overlay   = $("modal-overlay");
const modalBody = $("modal-body");

function openModal(html) {
  modalBody.innerHTML = html;
  overlay.hidden = false;
  document.body.style.overflow = "hidden";
}
function closeModal() {
  overlay.hidden = true;
  document.body.style.overflow = "";
}
$("modal-close").addEventListener("click", closeModal);
overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

// ══════════════════════════════════════════════════════════════════════
//  JOBS MODULE
// ══════════════════════════════════════════════════════════════════════
function initJobs() {
  // Use ALL_STATES list for the state dropdown
  fillSelect($("jobs-state"), ALL_STATES);
  fillSelect($("jobs-sector"), unique(JOBS.map((j) => j.sector)));
  fillSelect($("jobs-qualify"), unique(JOBS.map((j) => j.qualification)));

  updateJobsStats(JOBS);
  renderJobs();

  $("jobs-search").addEventListener("input",  () => { jobsPage = 1; renderJobs(); });
  $("jobs-sector").addEventListener("change", () => { jobsPage = 1; renderJobs(); });
  $("jobs-state").addEventListener("change",  () => { jobsPage = 1; renderJobs(); });
  $("jobs-qualify").addEventListener("change",() => { jobsPage = 1; renderJobs(); });
  $("jobs-clear").addEventListener("click", () => {
    $("jobs-search").value = "";
    $("jobs-sector").value = "";
    $("jobs-state").value  = "";
    $("jobs-qualify").value = "";
    jobsPage = 1;
    renderJobs();
  });
}

function updateJobsStats(list) {
  const totalVacancies = JOBS.reduce((s, j) => s + j.vacancies, 0);
  animateCounter($("jobs-total"),    JOBS.length);
  animateCounter($("jobs-open"),     JOBS.filter((j) => j.status === "open").length);
  animateCounter($("jobs-sectors"),  unique(JOBS.map((j) => j.sector)).length);
  animateCounter($("jobs-vacancies"),totalVacancies);
}

function getFilteredJobs() {
  const q      = $("jobs-search").value.toLowerCase().trim();
  const sector = $("jobs-sector").value;
  const state  = $("jobs-state").value;
  const qual   = $("jobs-qualify").value;

  return JOBS.filter((j) => {
    if (q      && !`${j.title} ${j.org} ${j.description}`.toLowerCase().includes(q)) return false;
    if (sector && j.sector !== sector)          return false;
    if (state  && j.state  !== state)           return false;
    if (qual   && j.qualification !== qual)     return false;
    return true;
  });
}

function renderJobs() {
  const filtered = getFilteredJobs();
  const grid     = $("jobs-grid");
  const empty    = $("jobs-empty");

  if (!filtered.length) {
    grid.innerHTML = "";
    $("jobs-pagination").innerHTML = "";
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  const totalPages = Math.ceil(filtered.length / JOBS_PER_PAGE);
  if (jobsPage > totalPages) jobsPage = totalPages;

  const pageItems = filtered.slice((jobsPage - 1) * JOBS_PER_PAGE, jobsPage * JOBS_PER_PAGE);
  grid.innerHTML  = pageItems.map(jobCard).join("");

  renderPagination("jobs-pagination", jobsPage, filtered.length, JOBS_PER_PAGE, (p) => {
    jobsPage = p; renderJobs();
  });

  // Click handlers
  grid.querySelectorAll(".job-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.classList.contains("btn-apply")) return;
      const job = JOBS.find((j) => j.id === card.dataset.id);
      openModal(jobModalHTML(job));
    });
  });
  grid.querySelectorAll(".btn-apply").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const job = JOBS.find((j) => j.id === btn.closest(".job-card").dataset.id);
      window.open(job.link, "_blank");
    });
  });
}

function jobCard(job) {
  const dl = daysLeft(job.lastDate);
  const deadlineText = job.status === "closed"
    ? "Applications Closed"
    : dl !== null && dl >= 0
      ? `<span>${dl} day${dl !== 1 ? "s" : ""} left</span>`
      : "Deadline Passed";

  return `
  <div class="job-card" data-id="${job.id}" tabindex="0" role="button" aria-label="View details for ${job.title}">
    <div class="job-card-header">
      <div class="job-title">${job.title}</div>
      ${statusBadge(job.status)}
    </div>
    <div class="job-org">🏢 ${job.org}</div>
    <div class="job-meta">
      <span class="meta-pill">📂 ${job.sector}</span>
      <span class="meta-pill">🎓 ${job.qualification}</span>
      <span class="meta-pill">📍 ${job.state}</span>
      <span class="meta-pill">👤 ${job.vacancies.toLocaleString("en-IN")} posts</span>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;">${typeBadge(job.type)}</div>
    <div class="job-footer">
      <div class="deadline">Last Date: ${deadlineText ? deadlineText : formatDate(job.lastDate)}</div>
      <button class="btn-apply" ${job.status === "closed" ? "disabled style='opacity:.5;cursor:not-allowed'" : ""}>
        ${job.status === "closed" ? "Closed" : "Apply →"}
      </button>
    </div>
  </div>`;
}

function jobModalHTML(job) {
  const dl = daysLeft(job.lastDate);
  return `
  <div class="modal-header">
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
      ${statusBadge(job.status)} ${typeBadge(job.type)}
    </div>
    <div class="modal-title">${job.title}</div>
    <div class="modal-org">🏢 ${job.org}</div>
  </div>
  <div class="modal-section">
    <div class="modal-section-title">Overview</div>
    <p style="font-size:13px;color:#374151;line-height:1.6;">${job.description}</p>
  </div>
  <div class="modal-section">
    <div class="modal-section-title">Key Details</div>
    <div class="modal-row"><span class="modal-key">📂 Sector</span><span class="modal-val">${job.sector}</span></div>
    <div class="modal-row"><span class="modal-key">📍 State/Region</span><span class="modal-val">${job.state}</span></div>
    <div class="modal-row"><span class="modal-key">👤 Vacancies</span><span class="modal-val">${job.vacancies.toLocaleString("en-IN")}</span></div>
    <div class="modal-row"><span class="modal-key">💰 Pay Scale</span><span class="modal-val">${job.salary}</span></div>
    <div class="modal-row"><span class="modal-key">🎓 Qualification</span><span class="modal-val">${job.qualification}</span></div>
    <div class="modal-row"><span class="modal-key">🎂 Age Limit</span><span class="modal-val">${job.age}</span></div>
    <div class="modal-row"><span class="modal-key">📅 Last Date</span>
      <span class="modal-val" style="color:${dl !== null && dl >= 0 ? "#dc2626" : "inherit"}">
        ${formatDate(job.lastDate)}${dl !== null && dl >= 0 ? ` (${dl} days left)` : ""}
      </span>
    </div>
  </div>
  <div class="modal-section">
    <div class="modal-section-title">Requirements</div>
    <ul style="padding-left:18px;font-size:13px;color:#374151;line-height:2;">
      ${job.requirements.map((r) => `<li>${r}</li>`).join("")}
    </ul>
  </div>
  <div class="modal-section">
    <div class="modal-section-title">Selection Process</div>
    <p style="font-size:13px;color:#374151;">${job.selectionProcess}</p>
  </div>
  <div class="modal-btn-row">
    <button class="btn-primary" onclick="window.open('${job.link}','_blank')">Apply Online →</button>
    <button class="btn-secondary" onclick="window.open('${job.link}','_blank')">Official Website</button>
  </div>`;
}

// ══════════════════════════════════════════════════════════════════════
//  SCHEMES MODULE
// ══════════════════════════════════════════════════════════════════════
function initSchemes() {
  fillSelect($("schemes-ministry"),   unique(SCHEMES.map((s) => s.ministry)));
  fillSelect($("schemes-category"),   unique(SCHEMES.map((s) => s.category)));
  fillSelect($("schemes-beneficiary"),unique(SCHEMES.map((s) => s.beneficiary)));

  animateCounter($("schemes-total"),   SCHEMES.length);
  animateCounter($("schemes-active"),  SCHEMES.filter((s) => s.status === "active").length);
  animateCounter($("schemes-central"), SCHEMES.filter((s) => s.type === "Central").length);
  animateCounter($("schemes-state"),   SCHEMES.filter((s) => s.type === "State").length);

  renderSchemes();

  $("schemes-search").addEventListener("input",       () => { schemesPage = 1; renderSchemes(); });
  $("schemes-ministry").addEventListener("change",    () => { schemesPage = 1; renderSchemes(); });
  $("schemes-category").addEventListener("change",    () => { schemesPage = 1; renderSchemes(); });
  $("schemes-beneficiary").addEventListener("change", () => { schemesPage = 1; renderSchemes(); });
  $("schemes-clear").addEventListener("click", () => {
    $("schemes-search").value      = "";
    $("schemes-ministry").value    = "";
    $("schemes-category").value    = "";
    $("schemes-beneficiary").value = "";
    schemesPage = 1;
    renderSchemes();
  });
}

function getFilteredSchemes() {
  const q           = $("schemes-search").value.toLowerCase().trim();
  const ministry    = $("schemes-ministry").value;
  const category    = $("schemes-category").value;
  const beneficiary = $("schemes-beneficiary").value;

  return SCHEMES.filter((s) => {
    if (q           && !`${s.name} ${s.ministry} ${s.benefit} ${s.description}`.toLowerCase().includes(q)) return false;
    if (ministry    && s.ministry    !== ministry)    return false;
    if (category    && s.category    !== category)    return false;
    if (beneficiary && s.beneficiary !== beneficiary) return false;
    return true;
  });
}

function renderSchemes() {
  const filtered = getFilteredSchemes();
  const grid     = $("schemes-grid");
  const empty    = $("schemes-empty");

  if (!filtered.length) {
    grid.innerHTML = "";
    $("schemes-pagination").innerHTML = "";
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  const totalPages = Math.ceil(filtered.length / SCHEMES_PER_PAGE);
  if (schemesPage > totalPages) schemesPage = totalPages;

  const pageItems = filtered.slice((schemesPage - 1) * SCHEMES_PER_PAGE, schemesPage * SCHEMES_PER_PAGE);
  grid.innerHTML  = pageItems.map(schemeCard).join("");

  renderPagination("schemes-pagination", schemesPage, filtered.length, SCHEMES_PER_PAGE, (p) => {
    schemesPage = p; renderSchemes();
  });

  grid.querySelectorAll(".scheme-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.classList.contains("btn-scheme")) return;
      const scheme = SCHEMES.find((s) => s.id === card.dataset.id);
      openModal(schemeModalHTML(scheme));
    });
  });
  grid.querySelectorAll(".btn-scheme").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const scheme = SCHEMES.find((s) => s.id === btn.closest(".scheme-card").dataset.id);
      window.open(scheme.link, "_blank");
    });
  });
}

function schemeCard(scheme) {
  return `
  <div class="scheme-card" data-id="${scheme.id}" tabindex="0" role="button" aria-label="View details for ${scheme.name}">
    <div style="display:flex;align-items:center;gap:12px;">
      <div class="scheme-icon">${scheme.icon}</div>
      <div>
        <div class="scheme-title">${scheme.name}</div>
        <div class="scheme-ministry">🏛 ${scheme.ministry}</div>
      </div>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;">
      ${categoryBadge(scheme.category)}
      ${typeBadge(scheme.type)}
      <span class="badge badge-open">✓ Active</span>
    </div>
    <div class="scheme-benefit">${scheme.benefit}</div>
    <div class="scheme-footer">
      <span style="font-size:11px;color:#57606a;">👤 ${scheme.beneficiary} &nbsp;|&nbsp; Since ${scheme.launchedYear}</span>
      <button class="btn-scheme">Apply →</button>
    </div>
  </div>`;
}

function schemeModalHTML(scheme) {
  return `
  <div class="modal-header">
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
      ${categoryBadge(scheme.category)} ${typeBadge(scheme.type)}
    </div>
    <div style="font-size:32px;margin-bottom:4px;">${scheme.icon}</div>
    <div class="modal-title">${scheme.name}</div>
    <div class="modal-org">🏛 ${scheme.ministry} &nbsp;|&nbsp; Launched: ${scheme.launchedYear}</div>
  </div>
  <div class="modal-section">
    <div class="modal-section-title">About</div>
    <p style="font-size:13px;color:#374151;line-height:1.6;">${scheme.description}</p>
  </div>
  <div class="modal-section">
    <div class="modal-section-title">Key Benefit</div>
    <p style="font-size:13px;color:#374151;line-height:1.6;">${scheme.benefit}</p>
  </div>
  <div class="modal-section">
    <div class="modal-section-title">Eligibility</div>
    <p style="font-size:13px;color:#374151;line-height:1.6;">${scheme.eligibility}</p>
  </div>
  <div class="modal-section">
    <div class="modal-section-title">How to Apply</div>
    <p style="font-size:13px;color:#374151;line-height:1.6;">${scheme.howToApply}</p>
  </div>
  <div class="modal-section">
    <div class="modal-section-title">Beneficiary</div>
    <p style="font-size:13px;color:#374151;">${scheme.beneficiary}</p>
  </div>
  <div class="modal-btn-row">
    <button class="btn-primary" onclick="window.open('${scheme.link}','_blank')">Apply / Know More →</button>
    <button class="btn-secondary" onclick="window.open('${scheme.link}','_blank')">Official Website</button>
  </div>`;
}

// ══════════════════════════════════════════════════════════════════════
//  TAB NAVIGATION
// ══════════════════════════════════════════════════════════════════════
document.querySelectorAll(".nav-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.tab;
    document.querySelectorAll(".nav-tab").forEach((t) => {
      t.classList.toggle("active", t.dataset.tab === target);
      t.setAttribute("aria-selected", t.dataset.tab === target ? "true" : "false");
    });
    document.querySelectorAll(".tab-section").forEach((s) => {
      s.classList.toggle("active", s.id === `section-${target}`);
    });
    if (target === "jobs")    updateJobsStats();
    if (target === "schemes") {
      animateCounter($("schemes-total"),   SCHEMES.length);
      animateCounter($("schemes-active"),  SCHEMES.filter((s) => s.status === "active").length);
      animateCounter($("schemes-central"), SCHEMES.filter((s) => s.type === "Central").length);
      animateCounter($("schemes-state"),   SCHEMES.filter((s) => s.type === "State").length);
    }
  });
});

// ── Boot ─────────────────────────────────────────────────────────────
initJobs();
initSchemes();
