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
      )}&entity=album&limit=10`
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

    div.innerHTML = `
      <img src="${album.artworkUrl100}" alt="${album.collectionName}">
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

// Use 300x300 instead of 600x600
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
function downloadGrid() {
  const grid = document.getElementById("albumGrid");

  if (!grid || grid.children.length === 0) {
    alert("No albums in the grid to download!");
    return;
  }

  // Use html2canvas to render the grid
  html2canvas(grid, {
    backgroundColor: "#1a1a1a", // optional: background color
    scale: 2 // increase resolution
  }).then(canvas => {
    const link = document.createElement('a');
    link.download = `album-grid-${gridCols}x${gridRows}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }).catch(err => {
    console.error("Failed to generate image:", err);
    alert("Failed to download grid. Try again.");
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


// effet carroussel 

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
