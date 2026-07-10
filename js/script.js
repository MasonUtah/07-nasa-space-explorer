// Find our date picker inputs and the button on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesButton = document.getElementById('getImages');
const gallery = document.getElementById('gallery');
const modal = document.createElement('div');
modal.className = 'modal-overlay';
modal.setAttribute('aria-hidden', 'true');
document.body.appendChild(modal);
const loader = document.createElement('div');
loader.className = 'loader-overlay';
loader.innerHTML = `
  <div class="loader-spinner" aria-hidden="true"></div>
  <div class="loader-text">Loading space images…</div>
`;
document.body.appendChild(loader);

// Put your NASA API key here
const apiKey = 'edqo96rwPl1yl6accAhA8GsglQLudzhE5nJJvr2z';
const imageCache = new Map();

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

function closeModal() {
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = '';
  document.body.style.overflow = '';
}

function showLoader(text) {
  if (text) loader.querySelector('.loader-text').textContent = text;
  loader.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function hideLoader() {
  loader.classList.remove('show');
  document.body.style.overflow = '';
}

function openModal(mediaType, mediaUrl, title, date, description) {
  let mediaContent = '';
  const resolvedUrl = decodeURIComponent(mediaUrl);

  if (mediaType === 'image') {
    mediaContent = `<img src="${resolvedUrl}" alt="${title}" class="modal-media-image" />`;
  } else if (mediaType === 'video') {
    if (resolvedUrl.includes('youtube.com') || resolvedUrl.includes('youtu.be')) {
      const embedUrl = resolvedUrl
        .replace('https://www.youtube.com/watch?v=', 'https://www.youtube.com/embed/')
        .replace('https://youtube.com/watch?v=', 'https://www.youtube.com/embed/')
        .replace('https://youtu.be/', 'https://www.youtube.com/embed/');

      mediaContent = `
        <iframe
          src="${embedUrl}"
          title="${title}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      `;
    } else {
      mediaContent = `
        <video controls autoplay playsinline class="modal-media-video">
          <source src="${resolvedUrl}" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      `;
    }
  }

  modal.innerHTML = `
    <div class="modal-content">
      <button class="modal-close" type="button" aria-label="Close preview">×</button>
      <h2>${title}</h2>
      <p class="media-date">${date || 'Date unknown'}</p>
      ${mediaContent}
      <p class="modal-description">${description || ''}</p>
    </div>
  `;

  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

modal.addEventListener('click', (event) => {
  if (event.target.closest('.modal-close')) {
    closeModal();
  } else if (event.target === modal) {
    closeModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModal();
  }
});

function showLoadingState() {
  gallery.innerHTML = `
    <div class="placeholder">
      <div class="placeholder-icon">☄️</div>
      <p>Loading amazing space images...</p>
    </div>
  `;
}

function showError(message) {
  gallery.innerHTML = `
    <div class="placeholder">
      <div class="placeholder-icon">⚠️</div>
      <p>${message}</p>
    </div>
  `;
}

function renderResults(data) {
  gallery.innerHTML = '';

  data.forEach((item) => {
    gallery.appendChild(createGalleryCard(item));
  });
}

function createGalleryCard(item) {
  const card = document.createElement('article');
  card.className = 'gallery-item';

  const title = item.title || 'NASA Space Image';
  const description = item.explanation || 'No description available.';
  const dateText = item.date ? `Date: ${item.date}` : 'Date: Unknown';

  if (item.media_type === 'image') {
    const imageUrl = item.url || item.hdurl;
    card.innerHTML = `
      <div class="media-trigger" role="button" tabindex="0" data-media-type="image" data-media-url="${encodeURIComponent(imageUrl)}" data-media-title="${encodeURIComponent(title)}" data-media-date="${encodeURIComponent(item.date || '')}" data-media-desc="${encodeURIComponent(description)}">
        <img src="${imageUrl}" alt="${title}" loading="lazy" decoding="async" />
      </div>
      <h2>${title}</h2>
      <p class="media-date">${dateText}</p>
      <p>${description}</p>
    `;
  } else if (item.media_type === 'video') {
    const videoUrl = item.url || '';
    const thumbnailUrl = item.thumbnail_url || '';
    const isEmbedUrl = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');

    let mediaMarkup = `
      <video controls preload="metadata" playsinline poster="${thumbnailUrl}">
        <source src="${videoUrl}" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    `;

    if (isEmbedUrl) {
      const embedUrl = videoUrl
        .replace('https://www.youtube.com/watch?v=', 'https://www.youtube.com/embed/')
        .replace('https://youtube.com/watch?v=', 'https://www.youtube.com/embed/')
        .replace('https://youtu.be/', 'https://www.youtube.com/embed/');

      mediaMarkup = `
        <iframe
          src="${embedUrl}"
          title="${title}"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      `;
    }

    card.innerHTML = `
      <div class="media-trigger" role="button" tabindex="0" data-media-type="video" data-media-url="${encodeURIComponent(videoUrl)}" data-media-title="${encodeURIComponent(title)}" data-media-date="${encodeURIComponent(item.date || '')}" data-media-desc="${encodeURIComponent(description)}">
        ${mediaMarkup}
      </div>
      <h2>${title}</h2>
      <p class="media-date">${dateText}</p>
      <p>${description}</p>
    `;
  } else {
    card.innerHTML = `
      <div class="media-placeholder">🎥</div>
      <h2>${title}</h2>
      <p class="media-date">${dateText}</p>
      <p>${description}</p>
      <a href="${item.url}" target="_blank" rel="noopener noreferrer">Open media</a>
    `;
  }

  const trigger = card.querySelector('.media-trigger');

  if (trigger) {
    trigger.addEventListener('click', () => {
      const mediaType = trigger.dataset.mediaType;
      const mediaUrl = trigger.dataset.mediaUrl ? decodeURIComponent(trigger.dataset.mediaUrl) : '';
      const mediaTitle = trigger.dataset.mediaTitle ? decodeURIComponent(trigger.dataset.mediaTitle) : title;
      const mediaDate = trigger.dataset.mediaDate ? decodeURIComponent(trigger.dataset.mediaDate) : '';
      const mediaDesc = trigger.dataset.mediaDesc ? decodeURIComponent(trigger.dataset.mediaDesc) : description;
      openModal(mediaType, mediaUrl, mediaTitle, mediaDate, mediaDesc);
    });

    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const mediaType = trigger.dataset.mediaType;
        const mediaUrl = trigger.dataset.mediaUrl ? decodeURIComponent(trigger.dataset.mediaUrl) : '';
        const mediaTitle = trigger.dataset.mediaTitle ? decodeURIComponent(trigger.dataset.mediaTitle) : title;
        const mediaDate = trigger.dataset.mediaDate ? decodeURIComponent(trigger.dataset.mediaDate) : '';
        const mediaDesc = trigger.dataset.mediaDesc ? decodeURIComponent(trigger.dataset.mediaDesc) : description;
        openModal(mediaType, mediaUrl, mediaTitle, mediaDate, mediaDesc);
      }
    });
  }

  return card;
}

async function fetchSpaceImages(startDate, endDate) {
  const cacheKey = `${startDate}-${endDate}`;

  if (imageCache.has(cacheKey)) {
    renderResults(imageCache.get(cacheKey));
    return;
  }

  showLoadingState();

  // Show full-screen loader while switching date ranges
  showLoader('Loading images for selected dates...');

  const apiUrl = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&start_date=${startDate}&end_date=${endDate}`;

  try {
    const response = await fetch(apiUrl, { cache: 'default' });

    if (!response.ok) {
      throw new Error('The NASA API is not available right now. Please try again later.');
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      showError('No images were found for that date range.');
      return;
    }

    imageCache.set(cacheKey, data);
    renderResults(data);
  } catch (error) {
    showError(error.message || 'Something went wrong. Please try again.');
  } finally {
    // Hide loader no matter what
    hideLoader();
  }
}

getImagesButton.addEventListener('click', () => {
  const startDate = startInput.value;
  const endDate = endInput.value;

  if (!startDate || !endDate) {
    showError('Please choose both dates first.');
    return;
  }

  if (startDate > endDate) {
    showError('The start date must be before or equal to the end date.');
    return;
  }

  fetchSpaceImages(startDate, endDate);
});

// Load the default date range when the page first opens
fetchSpaceImages(startInput.value, endInput.value);
