const hookTrainsCatalog = async () => {
    const listEl = document.getElementById('trains-list');
    const templateEl = document.getElementById('train-card-template');
    const loadingEl = document.getElementById('trains-loading');
    const errorEl = document.getElementById('trains-error');

    if (!listEl || !templateEl) {
        return;
    }

    try {
        const response = await fetch('/api/trains');
        if (!response.ok) {
            throw new Error(`Failed to load trains (${response.status})`);
        }

        const payload = await response.json();
        const trains = payload.trains || [];
        const fragment = document.createDocumentFragment();

        trains.forEach((train) => {
            const card = templateEl.content.cloneNode(true);
            const imageEl = card.querySelector('[data-field="image"]');

            imageEl.src = train.imageUrl;
            imageEl.alt = train.imageAlt || `${train.name} train`;

            card.querySelector('[data-field="name"]').textContent = train.name;
            card.querySelector('[data-field="operator"]').textContent = train.operator;
            card.querySelector('[data-field="type"]').textContent = train.type;
            card.querySelector('[data-field="speed"]').textContent = `${train.maxSpeedKmh} km/h`;
            card.querySelector('[data-field="seats"]').textContent = `${train.capacity} seats`;
            card.querySelector('[data-field="power"]').textContent = train.powerSource;
            card.querySelector('[data-field="description"]').textContent = train.description;
            card.querySelector('[data-field="best-for"]').textContent = train.bestFor;

            fragment.appendChild(card);
        });

        listEl.replaceChildren(fragment);
        if (loadingEl) {
            loadingEl.hidden = true;
        }
    } catch (error) {
        if (loadingEl) {
            loadingEl.hidden = true;
        }
        if (errorEl) {
            errorEl.hidden = false;
            errorEl.textContent = 'Unable to load trains right now. Please try again in a moment.';
        }
    }
};

const capitalize = (text = '') => text.charAt(0).toUpperCase() + text.slice(1);

// Adds one <option> per value (in the order the API sends them) and selects
// the one from the URL. Options from a previous render are removed first.
const fillFilterOptions = (selectEl, values, selectedValue) => {
    if (!selectEl) {
        return;
    }

    selectEl.querySelectorAll('option:not([value="all"])').forEach((option) => option.remove());

    values.forEach((value) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = capitalize(value);
        selectEl.appendChild(option);
    });

    selectEl.value = values.includes(selectedValue) ? selectedValue : 'all';
};

/* =========================================================================
 * Trip list (/trips) - loaded from /api/trips, 10 trips per page
 * ========================================================================= */

const TRIPS_PER_PAGE = 10;

// Query params the /trips page passes straight through to /api/trips.
const TRIP_QUERY_PARAMS = ['region', 'season', 'q', 'page', 'limit'];

// Fills one trip card from the <template> in trips/list.ejs.
const buildTripCard = (templateEl, trip) => {
    const card = templateEl.content.cloneNode(true);

    card.querySelector('.route-card').classList.add(trip.region);
    card.querySelector('[data-field="name"]').textContent = trip.name;
    card.querySelector('[data-field="region"]').textContent = trip.region;
    card.querySelector('[data-field="start-station"]').textContent = trip.startStation;
    card.querySelector('[data-field="end-station"]').textContent = trip.endStation;
    card.querySelector('[data-field="duration"]').textContent = trip.duration;
    card.querySelector('[data-field="distance"]').textContent = `${trip.distance}km`;
    card.querySelector('[data-field="description"]').textContent = trip.description;
    card.querySelector('[data-field="details-link"]').href = `/trips/${encodeURIComponent(trip.id)}`;

    const seasonEl = card.querySelector('[data-field="season"]');
    seasonEl.classList.add(`season-${trip.bestSeason}`);
    seasonEl.textContent = `Best in ${trip.bestSeason}`;

    const highlightsEl = card.querySelector('[data-field="highlights"]');
    (trip.highlights || []).forEach((highlight) => {
        const tag = document.createElement('span');
        tag.className = 'highlight-tag';
        tag.textContent = highlight;
        highlightsEl.appendChild(tag);
    });

    return card;
};

// Shows "Page X of Y" and enables Previous/Next using the API's pagination metadata.
const renderTripPagination = (pagination) => {
    const navEl = document.getElementById('trips-pagination');
    const summaryEl = document.getElementById('trips-summary');
    if (!navEl) {
        return;
    }

    const { page, limit, totalItems, totalPages, hasNextPage, hasPrevPage } = pagination;

    if (summaryEl) {
        const first = (page - 1) * limit + 1;
        const last = Math.min(page * limit, totalItems);
        summaryEl.textContent = first <= totalItems
            ? `Showing ${first}-${last} of ${totalItems} trips`
            : '';
    }

    // Hide the controls when everything fits on one page.
    navEl.hidden = totalPages <= 1 && page === 1;
    document.getElementById('trips-page-status').textContent = `Page ${page} of ${Math.max(totalPages, 1)}`;
    document.getElementById('trips-prev').disabled = !hasPrevPage;
    document.getElementById('trips-next').disabled = !hasNextPage;
    navEl.dataset.page = String(page);
};

// Puts the filters the API applied back into the dropdowns and search box,
// so the form always matches the results on screen.
const renderTripFilters = (filters, filterOptions) => {
    fillFilterOptions(document.getElementById('region-filter'), filterOptions.regions, filters.region);
    fillFilterOptions(document.getElementById('season-filter'), filterOptions.seasons, filters.season);

    const keywordEl = document.getElementById('trip-keyword');
    if (keywordEl) {
        keywordEl.value = filters.q || '';
    }
};

const loadTripsPage = async () => {
    const listEl = document.getElementById('trips-list');
    const templateEl = document.getElementById('trip-card-template');
    const loadingEl = document.getElementById('trips-loading');
    const errorEl = document.getElementById('trips-error');

    // Filters and page live in the URL (/trips?region=kansai&q=gorge&page=2)
    // so a search can be bookmarked and the Back button works.
    // The API validates every value.
    const params = new URLSearchParams(window.location.search);
    const apiParams = new URLSearchParams({ limit: String(TRIPS_PER_PAGE) });
    TRIP_QUERY_PARAMS.forEach((name) => {
        if (params.has(name)) {
            apiParams.set(name, params.get(name));
        }
    });

    if (loadingEl) {
        loadingEl.hidden = false;
    }
    if (errorEl) {
        errorEl.hidden = true;
    }

    try {
        const response = await fetch(`/api/trips?${apiParams}`);
        const payload = await response.json();

        if (response.status === 400) {
            throw new Error((payload.details || []).join('. ') || 'Invalid search.');
        }
        if (!response.ok) {
            throw new Error('Unable to load trips right now. Please try again in a moment.');
        }

        const trips = payload.trips || [];

        const fragment = document.createDocumentFragment();
        trips.forEach((trip) => fragment.appendChild(buildTripCard(templateEl, trip)));
        listEl.replaceChildren(fragment);

        renderTripFilters(payload.filters, payload.filterOptions);
        renderTripPagination(payload.pagination);

        if (trips.length === 0 && errorEl) {
            errorEl.hidden = false;
            errorEl.textContent = payload.pagination.totalItems > 0
                ? 'There are no trips on this page.'
                : 'No trips match your search. Try a different keyword or filter.';
        }
    } catch (error) {
        console.error(error);
        listEl.replaceChildren();
        document.getElementById('trips-pagination').hidden = true;
        document.getElementById('trips-summary').textContent = '';
        if (errorEl) {
            errorEl.hidden = false;
            errorEl.textContent = error.message;
        }
    } finally {
        if (loadingEl) {
            loadingEl.hidden = true;
        }
    }
};

// Updates the URL without reloading the page, then fetches the new results.
// Changing a filter or keyword starts again at page 1.
const updateTripsQuery = (changes, { resetPage = true } = {}) => {
    const url = new URL(window.location.href);

    Object.entries(changes).forEach(([name, value]) => {
        if (value && value !== 'all') {
            url.searchParams.set(name, value);
        } else {
            url.searchParams.delete(name);
        }
    });
    if (resetPage) {
        url.searchParams.delete('page');
    }

    window.history.pushState({}, '', url);
    loadTripsPage();
};

const goToTripsPage = (page) => {
    updateTripsQuery({ page: String(page) }, { resetPage: false });
    document.getElementById('trips-list').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const hookTripsList = () => {
    const listEl = document.getElementById('trips-list');
    const templateEl = document.getElementById('trip-card-template');
    const navEl = document.getElementById('trips-pagination');

    if (!listEl || !templateEl) {
        return;
    }

    document.getElementById('region-filter')?.addEventListener('change', (event) => {
        updateTripsQuery({ region: event.target.value });
    });
    document.getElementById('season-filter')?.addEventListener('change', (event) => {
        updateTripsQuery({ season: event.target.value });
    });
    document.getElementById('trip-search')?.addEventListener('submit', (event) => {
        event.preventDefault();
        updateTripsQuery({ q: document.getElementById('trip-keyword').value.trim() });
    });

    document.getElementById('trips-prev')?.addEventListener('click', () => {
        goToTripsPage(Number(navEl.dataset.page) - 1);
    });
    document.getElementById('trips-next')?.addEventListener('click', () => {
        goToTripsPage(Number(navEl.dataset.page) + 1);
    });

    // Browser Back/Forward changes the URL, so load the results it points to.
    window.addEventListener('popstate', loadTripsPage);

    loadTripsPage();
};

document.addEventListener('DOMContentLoaded', () => {
    hookTrainsCatalog();
    hookTripsList();
});
