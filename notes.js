 let gridSize = 3;
    let selectedAlbums = [];
    let currentSlideIndex = 1;

    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const albumGrid = document.getElementById('albumGrid');
    const gridStatus = document.getElementById('gridStatus');
    const downloadBtn = document.getElementById('downloadBtn');
    const carouselTrack = document.getElementById('carouselTrack');

    function selectGridSize(size) {
      gridSize = size;
      const maxAlbums = gridSize * gridSize;
      selectedAlbums = selectedAlbums.slice(0, maxAlbums);
      
      const slides = document.querySelectorAll('.carousel-slide');
      slides.forEach(function(slide) {
        slide.classList.remove('active');
        if (parseInt(slide.getAttribute('data-size')) === size) {
          slide.classList.add('active');
        }
      });
      
      renderGrid();
    }

    function changeSlide(direction) {
      const slides = document.querySelectorAll('.carousel-slide');
      currentSlideIndex = currentSlideIndex + direction;
      
      if (currentSlideIndex < 0) {
        currentSlideIndex = slides.length - 1;
      } else if (currentSlideIndex >= slides.length) {
        currentSlideIndex = 0;
      }
      
      const slideWidth = slides[0].offsetWidth + 16;
      carouselTrack.scrollLeft = currentSlideIndex * slideWidth;
    }

    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        searchAlbums();
      }
    });

    async function searchAlbums() {
      const term = searchInput.value.trim();
      if (!term) return;

      searchResults.innerHTML = '<p style="color: white;">Searching...</p>';

      try {
        const response = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=album&limit=10`
        );
        const data = await response.json();
        displaySearchResults(data.results || []);
      } catch (error) {
        searchResults.innerHTML = '<p style="color: white;">Search failed. Please try again.</p>';
      }
    }

    function displaySearchResults(results) {
      if (results.length === 0) {
        searchResults.innerHTML = '<p style="color: white;">No results found.</p>';
        return;
      }

      searchResults.innerHTML = '';
      results.forEach(function(album) {
        const div = document.createElement('div');
        div.className = 'album-result';
        div.innerHTML = '<img src="' + album.artworkUrl100 + '" alt="' + album.collectionName + '"><p>' + album.collectionName + '</p>';
        div.onclick = function() { addAlbum(album); };
        searchResults.appendChild(div);
      });
    }

    function addAlbum(album) {
      const maxAlbums = gridSize * gridSize;
      if (selectedAlbums.length >= maxAlbums) return;

      selectedAlbums.push({
        id: album.collectionId,
        image: album.artworkUrl100.replace('100x100', '600x600'),
        title: album.collectionName,
        artist: album.artistName
      });

      renderGrid();
    }

    function removeAlbum(index) {
      selectedAlbums.splice(index, 1);
      renderGrid();
    }

    function renderGrid() {
      const maxAlbums = gridSize * gridSize;
      albumGrid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
      albumGrid.innerHTML = '';

      for (let i = 0; i < maxAlbums; i++) {
        const slot = document.createElement('div');
        slot.className = 'grid-slot';

        if (selectedAlbums[i]) {
          const album = selectedAlbums[i];
          slot.innerHTML = '<img src="' + album.image + '" alt="' + album.title + '"><button class="remove-btn" onclick="removeAlbum(' + i + ')">×</button>';
        } else {
          slot.classList.add('empty');
          slot.textContent = '+';
        }

        albumGrid.appendChild(slot);
      }

      gridStatus.textContent = 'Your Grid (' + selectedAlbums.length + '/' + maxAlbums + ')';
      
      if (selectedAlbums.length === maxAlbums) {
        downloadBtn.classList.remove('hidden');
      } else {
        downloadBtn.classList.add('hidden');
      }
    }

    function downloadGrid() {
      const canvas = document.createElement('canvas');
      const size = 600;
      const totalSize = size * gridSize;
      canvas.width = totalSize;
      canvas.height = totalSize;
      const ctx = canvas.getContext('2d');

      let loadedImages = 0;
      const images = [];

      selectedAlbums.forEach((album, index) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          images[index] = img;
          loadedImages++;
          
          if (loadedImages === selectedAlbums.length) {
            images.forEach((img, idx) => {
              const row = Math.floor(idx / gridSize);
              const col = idx % gridSize;
              ctx.drawImage(img, col * size, row * size, size, size);
            });
            
            const link = document.createElement('a');
            link.download = `album-grid-${gridSize}x${gridSize}.png`;
            link.href = canvas.toDataURL();
            link.click();
          }
        };
        img.src = album.image;
      });
    }

    // Initialize grid
    renderGrid();