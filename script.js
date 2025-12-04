/* ===========================
   GLOBAL STATE
=========================== */

let gridCols = 3;
let gridRows = 3;

let selectedAlbums = [];
let currentSlideIndex = 0;

/* ===========================
   DOM ELEMENTS
=========================== */

const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const albumGrid = document.getElementById("albumGrid");
const gridStatus = document.getElementById("gridStatus");
const downloadBtn = document.getElementById("downloadBtn");
const carouselTrack = document.getElementById("carouselTrack");

/* ===========================
   GRID SIZE SELECTION (CAROUSEL)
=========================== */

function selectGridSize(cols, rows, clickedSlide) {
  gridCols = cols;
  gridRows = rows;

  const maxAlbums = gridCols * gridRows;

  selectedAlbums = selectedAlbums.slice(0, maxAlbums);

  // update slide highlighting
  document.querySelectorAll(".carousel-slide").forEach(slide =>
    slide.classList.remove("active")
  );

  if (clickedSlide) clickedSlide.classList.add("active");

  renderGrid();
}

function changeSlide(direction) {
  const slides = document.querySelectorAll(".carousel-slide");
  currentSlideIndex += direction;

  if (currentSlideIndex < 0) currentSlideIndex = slides.length - 1;
  if (currentSlideIndex >= slides.length) currentSlideIndex = 0;

  const slideWidth = slides[0].offsetWidth + 16;
  carouselTrack.scrollLeft = currentSlideIndex * slideWidth;
}


/* ===========================
   SEARCH
=========================== */

searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchAlbums();
});

async function searchAlbums() {
  const term = searchInput.value.trim();
  if (!term) return;

  searchResults.innerHTML = `<p style="color:white">Searching...</p>`;

  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(
        term
      )}&entity=album&limit=15`
    );

    const data = await response.json();
    displaySearchResults(data.results || []);
  } catch {
    searchResults.innerHTML = `<p style="color:white">Search failed. Please try again.</p>`;
  }
}

function displaySearchResults(results) {
  if (results.length === 0) {
    searchResults.innerHTML = `<p style="color:white">No results found.</p>`;
    return;
  }

  searchResults.innerHTML = "";

  results.forEach((album) => {
    const div = document.createElement("div");
    div.className = "album-result";

    const highResArt = album.artworkUrl100.replace("100x100", "600x600");

    div.innerHTML = `
      <img src="${highResArt}" alt="${album.collectionName}">
      <p>${album.collectionName}</p>
    `;

    div.onclick = () => addAlbum(album);
    searchResults.appendChild(div);
  });
}


/* ===========================
   ALBUM MANAGEMENT
=========================== */

function addAlbum(album) {
  const maxAlbums = gridCols * gridRows;
  if (selectedAlbums.length >= maxAlbums) return;


selectedAlbums.push({
    id: album.collectionId,
    image: album.artworkUrl100.replace("100x100", "300x300"), 
    title: album.collectionName,
    artist: album.artistName,
});


  renderGrid();
}

function removeAlbum(index) {
  selectedAlbums.splice(index, 1);
  renderGrid();
}

/* ===========================
   RENDER GRID
=========================== */

function renderGrid() {
  const maxAlbums = gridCols * gridRows;

  albumGrid.style.gridTemplateColumns = `repeat(${gridCols}, 1fr)`;
  albumGrid.innerHTML = "";

  for (let i = 0; i < maxAlbums; i++) {
    const slot = document.createElement("div");
    slot.className = "grid-slot";

    if (selectedAlbums[i]) {
      const album = selectedAlbums[i];

      slot.innerHTML = `
        <img src="${album.image}" alt="${album.title}">
        <button class="remove-btn" onclick="removeAlbum(${i})">×</button>
      `;
    } else {
      slot.classList.add("empty");
      slot.textContent = "+";
    }

    albumGrid.appendChild(slot);
  }

  gridStatus.textContent = `Your Grid (${selectedAlbums.length}/${maxAlbums})`;

  if (selectedAlbums.length === maxAlbums) {
    downloadBtn.classList.remove("hidden");
  } else {
    downloadBtn.classList.add("hidden");
  }
}

/* ===========================
   DOWNLOAD GRID (ANY ASPECT RATIO)
=========================== */

async function downloadGrid() {
  const canvas = document.createElement("canvas");
  const cellSize = 300; // matches album image size
  canvas.width = cellSize * gridCols;
  canvas.height = cellSize * gridRows;
  const ctx = canvas.getContext("2d");

  const images = [];

  for (let i = 0; i < selectedAlbums.length; i++) {
    const album = selectedAlbums[i];
    try {
      const response = await fetch(album.image);
      const blob = await response.blob();
      const img = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = URL.createObjectURL(blob);
      });
     
      images.push(img);
    } catch (e) {
      console.warn("Failed to load image:", album.image);
      images.push(null);
    }
  }

  
  images.forEach((img, idx) => {
    const col = idx % gridCols;
    const row = Math.floor(idx / gridCols);
    if (img) {
      ctx.drawImage(img, col * cellSize, row * cellSize, cellSize, cellSize);
    }
    else {
      ctx.fillStyle = "#333";
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
    }
  });


    canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `album-grid-${gridCols}x${gridRows}.png`;
    link.click();
    URL.revokeObjectURL(url);
  });
}


/* ===========================
   INITIALIZE
=========================== */

renderGrid();

/* ===========================
   AUTO-GENERATE CAROUSEL PREVIEWS
=========================== */

function generateCarouselPreviews() {
  const slides = document.querySelectorAll(".carousel-slide");

  slides.forEach(slide => {
    const cols = parseInt(slide.getAttribute("data-cols"));
    const rows = parseInt(slide.getAttribute("data-rows"));

    if (!cols || !rows) return;

    // Create the preview container
    const preview = document.createElement("div");
    preview.className = "grid-preview";

    // Apply CSS variables
    preview.style.setProperty("--cols", cols);
    preview.style.setProperty("--rows", rows);

    // Add the correct number of preview cells
    const totalCells = cols * rows;
    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement("div");
      cell.className = "preview-cell";
      preview.appendChild(cell);
    }

    // Remove any existing preview (in case of re-init)
    const oldPreview = slide.querySelector(".grid-preview");
    if (oldPreview) oldPreview.remove();

    // Insert new preview above the label
    slide.insertBefore(preview, slide.firstChild);
  });
}

generateCarouselPreviews();


// effet carrousel 

const carousel = document.getElementById("carouselTrack");

let isDown = false;
let startX;
let scrollLeft;

carousel.addEventListener("mousedown", (e) => {
  isDown = true;
  carousel.classList.add("dragging");
  startX = e.pageX - carousel.offsetLeft;
  scrollLeft = carousel.scrollLeft;
});

carousel.addEventListener("mouseleave", () => {
  isDown = false;
  carousel.classList.remove("dragging");
});

carousel.addEventListener("mouseup", () => {
  isDown = false;
  carousel.classList.remove("dragging");
});

carousel.addEventListener("mousemove", (e) => {
  if (!isDown) return;
  e.preventDefault();
  const x = e.pageX - carousel.offsetLeft;
  const walk = (x - startX) * 1; // scroll-fast factor, increase for faster drag
  carousel.scrollLeft = scrollLeft - walk;
});

/////
// effet toggle
const banner = document.getElementById('toggleBanner');
const content = document.getElementById('carouselContainer');
let expanded = false;

// Toggle accordion
banner.addEventListener('click', () => {
  expanded = !expanded;
  if (expanded) {
    content.style.maxHeight = content.scrollHeight + "px";
    banner.textContent = "Top Trending Albums ▲";
  } else {
    content.style.maxHeight = "0";
    banner.textContent = "Top Trending Albums ▼";
  }
});

async function loadTopAlbums(country = "us") {
  const url = `https://itunes.apple.com/${country}/rss/topalbums/limit=50/json`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    let results = data.feed?.entry || [];

    // REMOVE EPs & Soundtracks
    results = results.filter(album => {
      const title = album["im:name"].label.toLowerCase();
      const category = album.category.attributes.label.toLowerCase();

      return !(title.includes(" ep") || title.endsWith("ep") || category.includes("soundtrack") || title.includes("soundtrack"));
    });

    const container = document.getElementById("albumCarousel");
    container.innerHTML = "";

    // Duplicate list for infinite scroll
    const fullList = [...results, ...results];

    fullList.forEach(album => {
      const name = album["im:name"].label;
      const artist = album["im:artist"].label;
      const image = album["im:image"][2].label;
      const link = album.link.attributes.href;

      const item = document.createElement("div");
      item.className = "album";

      item.innerHTML = `
        <a href="${link}" target="_blank">
          <img src="${image}" alt="${name}">
          <div class="info">
            <p>${name}</p>
            <small>${artist}</small>
          </div>
        </a>
      `;

      container.appendChild(item);
    });

  } catch (error) {
    console.error("ERROR:", error);
  }
}

loadTopAlbums();

document.getElementById("countrySelector").addEventListener("change", (e) => {
  loadTopAlbums(e.target.value);
});

// effet selector 

const select = document.getElementById("countrySelector");
const textColors = ["var(--darkred)", "var(--yellow)"];
const bgColors   = ["var(--yellow)", "var(--darkred)"];

for(let i = 0; i < select.options.length; i++){
    select.options[i].style.color = textColors[i % textColors.length];
    select.options[i].style.backgroundColor = bgColors[i % bgColors.length];
}

////
