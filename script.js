// OMDb API configuration
const API_KEY = "44245c2e"; // Provided key
const BASE_URL = "https://www.omdbapi.com/";

// DOM elements
const loaderOverlay = document.getElementById("global-loader");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const searchResultsContainer = document.getElementById("search-results");
const noResultsMessage = document.getElementById("no-results");
const searchResultsSection = document.getElementById("search-results-section");

const myListGrid = document.getElementById("mylist-grid");
const myListEmptyMessage = document.getElementById("mylist-empty");
const myListSection = document.getElementById("mylist-section");

const navHome = document.getElementById("nav-home");
const navMovies = document.getElementById("nav-movies");
const navTV = document.getElementById("nav-tv");
const navMyList = document.getElementById("nav-mylist");
const navLinks = document.querySelectorAll(".nav-links a");

const MY_LIST_KEY = "myList";
let activeRequests = 0;

// Loader helpers
function showLoader() {
  activeRequests += 1;
  loaderOverlay.classList.remove("hidden");
}

function hideLoader() {
  activeRequests = Math.max(0, activeRequests - 1);
  if (activeRequests === 0) {
    loaderOverlay.classList.add("hidden");
  }
}

// LocalStorage helpers for My List
function getMyList() {
  try {
    const raw = localStorage.getItem(MY_LIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMyList(list) {
  localStorage.setItem(MY_LIST_KEY, JSON.stringify(list));
}

function addToMyList(movie) {
  const list = getMyList();
  if (!movie || !movie.imdbID) return;

  const alreadyExists = list.some((item) => item.imdbID === movie.imdbID);
  if (alreadyExists) return;

  const toSave = {
    imdbID: movie.imdbID,
    Title: movie.Title,
    Year: movie.Year,
    Poster: movie.Poster,
    Type: movie.Type,
  };

  list.push(toSave);
  saveMyList(list);
}

// Fetch movies by search term (used by search bar and Home)
async function fetchMoviesBySearch(query, page = 1) {
  if (!query) return [];

  const url = `${BASE_URL}?apikey=${API_KEY}&s=${encodeURIComponent(
    query
  )}&page=${page}`;

  showLoader();
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.Response === "True" && Array.isArray(data.Search)) {
      return data.Search;
    }
    return [];
  } catch (err) {
    console.error("Error fetching movies:", err);
    return [];
  } finally {
    hideLoader();
  }
}

// Fetch generic movie listing (Movies tab)
async function fetchMoviesListing() {
  const url = `${BASE_URL}?apikey=${API_KEY}&s=movie&type=movie`;

  showLoader();
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.Response === "True" && Array.isArray(data.Search)) {
      return data.Search;
    }
    return [];
  } catch (err) {
    console.error("Error fetching movies listing:", err);
    return [];
  } finally {
    hideLoader();
  }
}

// Fetch TV series (TV Shows tab)
async function fetchTVSeries() {
  const url = `${BASE_URL}?apikey=${API_KEY}&s=series&type=series`;

  showLoader();
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.Response === "True" && Array.isArray(data.Search)) {
      return data.Search;
    }
    return [];
  } catch (err) {
    console.error("Error fetching TV series:", err);
    return [];
  } finally {
    hideLoader();
  }
}

// Create a movie card element
function createMovieCard(movie, options = {}) {
  const { Poster, Title, Year, Type } = movie;
  const { showAddButton = true } = options;

  const card = document.createElement("div");
  card.className = "movie-card";

  const img = document.createElement("img");
  img.src =
    Poster && Poster !== "N/A"
      ? Poster
      : "https://via.placeholder.com/300x450?text=No+Image";
  img.alt = Title || "Movie poster";

  const info = document.createElement("div");
  info.className = "movie-info";

  const titleEl = document.createElement("div");
  titleEl.className = "movie-title";
  titleEl.textContent = Title || "Unknown";

  const metaEl = document.createElement("div");
  metaEl.className = "movie-meta";
  const yearText = Year && Year !== "N/A" ? Year : "Year N/A";
  const typeText = Type ? Type.toUpperCase() : "UNKNOWN";
  metaEl.textContent = `${yearText} • ${typeText}`;

  info.appendChild(titleEl);
  info.appendChild(metaEl);

  if (showAddButton) {
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.textContent = "+ My List";
    addBtn.className = "add-to-list-btn";
    addBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      addToMyList(movie);
    });
    info.appendChild(addBtn);
  }

  card.appendChild(img);
  card.appendChild(info);

  return card;
}

// Populate a specific row with a query (used for Home)
async function populateRowWithQuery(rowElement, query) {
  const cardsContainer = rowElement.querySelector(".movie-cards");
  if (!cardsContainer) return;

  cardsContainer.innerHTML = "";

  const movies = await fetchMoviesBySearch(query);

  if (!movies.length) {
    const msg = document.createElement("p");
    msg.className = "no-results";
    msg.textContent = "No movies found.";
    cardsContainer.appendChild(msg);
    return;
  }

  movies.forEach((movie) => {
    const card = createMovieCard(movie);
    cardsContainer.appendChild(card);
  });
}

// Clear all movie rows
function clearAllMovieRows() {
  const rows = document.querySelectorAll(".movie-row .movie-cards");
  rows.forEach((container) => {
    container.innerHTML = "";
  });
}

// Distribute a list of items across all movie rows
function distributeItemsAcrossRows(items) {
  const rows = Array.from(document.querySelectorAll(".movie-row"));
  if (!rows.length) return;

  const total = items.length;
  const chunkSize = Math.ceil(total / rows.length) || total;

  rows.forEach((row, index) => {
    const cardsContainer = row.querySelector(".movie-cards");
    if (!cardsContainer) return;

    const start = index * chunkSize;
    const end = start + chunkSize;
    const slice = items.slice(start, end);

    cardsContainer.innerHTML = "";

    if (!slice.length) {
      const msg = document.createElement("p");
      msg.className = "no-results";
      msg.textContent = "No items found.";
      cardsContainer.appendChild(msg);
      return;
    }

    slice.forEach((movie) => {
      const card = createMovieCard(movie);
      cardsContainer.appendChild(card);
    });
  });
}

// Render search results in grid
function renderSearchResults(movies) {
  searchResultsContainer.innerHTML = "";

  if (!movies.length) {
    noResultsMessage.classList.remove("hidden");
    return;
  }

  noResultsMessage.classList.add("hidden");

  movies.forEach((movie) => {
    const card = createMovieCard(movie);
    searchResultsContainer.appendChild(card);
  });
}

// Handle search submit
async function handleSearch(event) {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (!query) {
    searchResultsContainer.innerHTML = "";
    noResultsMessage.textContent = "Please enter a search term.";
    noResultsMessage.classList.remove("hidden");
    return;
  }

  noResultsMessage.classList.add("hidden");
  searchResultsContainer.innerHTML = "";

  const movies = await fetchMoviesBySearch(query);

  if (!movies.length) {
    noResultsMessage.textContent = "No results found.";
  } else {
    noResultsMessage.textContent = "No results found."; // fallback text
  }

  renderSearchResults(movies);

  // Scroll to search results on smaller screens
  searchResultsSection.scrollIntoView({ behavior: "smooth" });
}

// My List rendering
function renderMyList() {
  const list = getMyList();
  myListGrid.innerHTML = "";

  if (!list.length) {
    myListEmptyMessage.classList.remove("hidden");
    return;
  }

  myListEmptyMessage.classList.add("hidden");

  list.forEach((item) => {
    const card = createMovieCard(item, { showAddButton: false });
    myListGrid.appendChild(card);
  });
}

// Navbar helpers
function setActiveNav(activeElement) {
  navLinks.forEach((link) => link.classList.remove("active"));
  if (activeElement) {
    activeElement.classList.add("active");
  }
}

// Home view: default movie sections
async function loadHome() {
  setActiveNav(navHome);
  clearAllMovieRows();

  const sections = [
    { id: "trending", query: "avengers" },
    { id: "toprated", query: "matrix" },
    { id: "tvshows", query: "action" },
    { id: "comedy", query: "comedy" },
  ];

  // Load all sections in parallel for faster loading
  const promises = sections.map(async ({ id, query }) => {
    const section = document.getElementById(id);
    if (!section) return;
    const row = section.querySelector(".movie-row");
    if (!row) return;
    return populateRowWithQuery(row, query);
  });

  await Promise.all(promises);

  const hero = document.getElementById("hero");
  if (hero) {
    hero.scrollIntoView({ behavior: "smooth" });
  }
}

// Movies view: generic movies listing
async function loadMovies() {
  setActiveNav(navMovies);
  clearAllMovieRows();

  const movies = await fetchMoviesListing();
  if (!movies.length) {
    distributeItemsAcrossRows([]);
    return;
  }

  distributeItemsAcrossRows(movies);
}

// TV Shows view: series listing
async function loadTVShows() {
  setActiveNav(navTV);
  clearAllMovieRows();

  const series = await fetchTVSeries();
  if (!series.length) {
    distributeItemsAcrossRows([]);
    return;
  }

  distributeItemsAcrossRows(series);
}

// My List view: localStorage-backed watchlist
function loadMyList() {
  setActiveNav(navMyList);
  clearAllMovieRows();
  renderMyList();
  myListSection.scrollIntoView({ behavior: "smooth" });
}

// Initialize rows on page load
async function init() {
  // Load home content without blocking page render
  loadHome().catch(err => {
    console.error('Error loading home content:', err);
  });
}

// Event listeners
document.addEventListener("DOMContentLoaded", init);
searchForm.addEventListener("submit", handleSearch);

if (navHome) {
  navHome.addEventListener("click", (e) => {
    e.preventDefault();
    loadHome();
  });
}

if (navMovies) {
  navMovies.addEventListener("click", (e) => {
    e.preventDefault();
    loadMovies();
  });
}

if (navTV) {
  navTV.addEventListener("click", (e) => {
    e.preventDefault();
    loadTVShows();
  });
}

if (navMyList) {
  navMyList.addEventListener("click", (e) => {
    e.preventDefault();
    loadMyList();
  });
}

