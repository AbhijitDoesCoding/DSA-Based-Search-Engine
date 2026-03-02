// Global elements
const searchForm = document.getElementById("search-form");
const queryInput = document.getElementById("query-input");
const resultsDiv = document.getElementById("results");
const resultsMeta = document.getElementById("results-meta");
const spinner = document.getElementById("spinner");
const themeToggle = document.getElementById("theme-toggle");
const platformFilter = document.getElementById("platform-filter");
const sortBy = document.getElementById("sort-by");
const recentSearchesDiv = document.getElementById("recent-searches");
const loadMoreBtn = document.getElementById("load-more-btn");

// Constants
const THEME_KEY = "dsa_search_theme";
const HISTORY_KEY = "dsa_search_history";
const RESULTS_PER_PAGE = 15;

// State
let allResults = [];
let currentPage = 1;

/**
 * Escapes HTML characters to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Platform logos mapping
 */
function getPlatformLogo(platform) {
  const p = platform.toLowerCase();
  if (p.includes("leetcode")) return "leetcode.png";
  if (p.includes("codeforces")) return "codeforces.png";
  if (p.includes("cses")) return "cses.png";
  if (p.includes("atcoder")) return "atcoder.jpeg";
  return "codeforces.png"; // default
}

/**
 * Theme Management
 */
function toggleTheme() {
  const isDark = document.body.classList.toggle("dark");
  themeToggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const isDark = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
  if (isDark) {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀️ Light Mode";
  }
}

/**
 * History Management
 */
function saveToHistory(query) {
  let history = getHistory();
  history = [query, ...history.filter(q => q !== query)].slice(0, 5);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  renderHistory();
}

function getHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function renderHistory() {
  const history = getHistory();
  if (history.length === 0) {
    recentSearchesDiv.innerHTML = "";
    return;
  }

  recentSearchesDiv.innerHTML = history
    .map(q => `<button class="recent-chip" data-query="${q.replace(/"/g, '&quot;')}">${escapeHtml(q)}</button>`)
    .join("");
}

/**
 * Result Rendering
 */
function renderResults() {
  let filtered = [...allResults];

  // Filter by platform
  const pVal = platformFilter.value;
  if (pVal !== "all") {
    filtered = filtered.filter(r => r.platform === pVal);
  }

  // Sort
  const sVal = sortBy.value;
  if (sVal === "title-asc") {
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sVal === "title-desc") {
    filtered.sort((a, b) => b.title.localeCompare(a.title));
  } else if (sVal === "relevance") {
    filtered.sort((a, b) => parseFloat(b.score || 0) - parseFloat(a.score || 0));
  }

  // Pagination Logic
  const totalCount = filtered.length;
  const visibleCount = Math.min(currentPage * RESULTS_PER_PAGE, totalCount);
  const paginatedResults = filtered.slice(0, visibleCount);

  resultsMeta.classList.remove("hidden");
  resultsMeta.textContent = `Showing ${visibleCount} of ${totalCount} matching problems`;

  const resumeBoost = document.getElementById("resume-boost");
  if (totalCount > 0) {
    resumeBoost.classList.remove("hidden");
  } else {
    resumeBoost.classList.add("hidden");
  }

  // Load More Button Visibility
  if (visibleCount < totalCount) {
    loadMoreBtn.classList.remove("hidden");
  } else {
    loadMoreBtn.classList.add("hidden");
  }

  if (totalCount === 0) {
    resultsDiv.innerHTML = `<div class="no-results">No problems found matching your criteria.</div>`;
    return;
  }

  resultsDiv.innerHTML = paginatedResults.map((p, idx) => `
    <article class="card ${idx === 0 && sortBy.value === "relevance" ? 'featured' : ''}">
      <div class="card-header">
        <img src="assets/logos/${getPlatformLogo(p.platform)}" alt="${p.platform}" class="platform-logo">
        <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="card-title">
          ${escapeHtml(p.title)}
        </a>
      </div>
      <div class="platform-tag">
        <span>Source: <strong>${p.platform}</strong></span>
        ${p.score ? `<span class="score-tag">Match: ${(parseFloat(p.score) * 100).toFixed(1)}%</span>` : ""}
      </div>
    </article>
  `).join("");
}

function updatePlatformFilter(results) {
  const platforms = [...new Set(results.map(r => r.platform))].sort();
  const current = platformFilter.value;
  
  platformFilter.innerHTML = `<option value="all">All Platforms</option>` + 
    platforms.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("");
    
  if (platforms.includes(current)) {
    platformFilter.value = current;
  }
}

/**
 * Event Handlers
 */
searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = queryInput.value.trim();
  if (!query) return;

  // UI state
  spinner.classList.remove("hidden");
  resultsDiv.innerHTML = "";
  resultsMeta.classList.add("hidden");
  
  saveToHistory(query);

  try {
    console.log(`Sending search request for: ${query}`);
    const response = await fetch("/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || `Server error: ${response.status}`);
    }

    const data = await response.json();
    allResults = data.results || [];
    currentPage = 1; // Reset pagination
    
    updatePlatformFilter(allResults);
    renderResults();
  } catch (err) {
    console.error("Search failed:", err);
    resultsDiv.innerHTML = `<div class="error-msg">⚠️ ${escapeHtml(err.message)}</div>`;
  } finally {
    spinner.classList.add("hidden");
  }
});

// Filters
platformFilter.addEventListener("change", renderResults);
sortBy.addEventListener("change", renderResults);

// Theme toggle
themeToggle.addEventListener("click", toggleTheme);

// Load More
loadMoreBtn.addEventListener("click", () => {
  currentPage++;
  renderResults();
});

// History clicks
recentSearchesDiv.addEventListener("click", (e) => {
  if (e.target.classList.contains("recent-chip")) {
    queryInput.value = e.target.dataset.query;
    searchForm.requestSubmit();
  }
});

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement !== queryInput) {
    e.preventDefault();
    queryInput.focus();
  }
});

// Initialization
initTheme();
renderHistory();
console.log("DSA Search Client Initialized");
