const hookRegionSorter = () => {
    const regionSelect = document.getElementById('region-filter');
    if (regionSelect) {
        regionSelect.addEventListener('change', () => {
            const selectedRegion = regionSelect.value;
            const url = new URL(window.location.href);

            if (selectedRegion && selectedRegion !== 'all') {
                url.searchParams.set('region', selectedRegion);
            } else {
                url.searchParams.delete('region');
            }
            
            window.location.href = url.toString();
        });
    }
};

const hookSeasonSorter = () => {
    const seasonSelect = document.getElementById('season-filter');
    if (seasonSelect) {
        seasonSelect.addEventListener('change', () => {
            const selectedSeason = seasonSelect.value;
            const url = new URL(window.location.href);

            if (selectedSeason && selectedSeason !== 'all') {
                url.searchParams.set('season', selectedSeason);
            } else {
                url.searchParams.delete('season');
            }
            
            window.location.href = url.toString();
        });
    }
};

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

// Adds one <option> per unique value and selects the one from the URL query.
// Options from a previous render are removed first (the "all" option stays).
const fillFilterOptions = (selectEl, values, selectedValue) => {
    if (!selectEl) {
        return;
    }

    selectEl.querySelectorAll('option:not([value="all"])').forEach((option) => option.remove());

    [...new Set(values.filter(Boolean))].sort().forEach((value) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = capitalize(value);
        option.selected = value === selectedValue;
        selectEl.appendChild(option);
    });
};

/* =========================================================================
 * Trip list (/trips) - loaded from /api/trips, 10 trips per page
 * ========================================================================= */

const TRIPS_PER_PAGE = 10;

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

const loadTripsPage = async () => {
    const listEl = document.getElementById('trips-list');
    const templateEl = document.getElementById('trip-card-template');
    const loadingEl = document.getElementById('trips-loading');
    const errorEl = document.getElementById('trips-error');

    // The page and limit live in the URL (/trips?page=2) so a page can be
    // bookmarked and the Back button works. The API validates them.
    const params = new URLSearchParams(window.location.search);
    const apiParams = new URLSearchParams({
        page: params.get('page') || '1',
        limit: params.get('limit') || String(TRIPS_PER_PAGE)
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
            throw new Error((payload.details || []).join('. ') || 'Invalid page requested.');
        }
        if (!response.ok) {
            throw new Error('Unable to load trips right now. Please try again in a moment.');
        }

        const trips = payload.trips || [];

        // Until PR 2 moves filtering to the API, the region/season selects
        // only filter the trips on the current page.
        const region = params.get('region');
        const season = params.get('season');

        fillFilterOptions(document.getElementById('region-filter'), trips.map((trip) => trip.region), region);
        fillFilterOptions(document.getElementById('season-filter'), trips.map((trip) => trip.bestSeason), season);

        const visibleTrips = trips.filter((trip) =>
            (!region || trip.region === region) && (!season || trip.bestSeason === season)
        );

        const fragment = document.createDocumentFragment();
        visibleTrips.forEach((trip) => fragment.appendChild(buildTripCard(templateEl, trip)));
        listEl.replaceChildren(fragment);

        renderTripPagination(payload.pagination);

        if (visibleTrips.length === 0 && errorEl) {
            errorEl.hidden = false;
            errorEl.textContent = trips.length === 0 && payload.pagination.totalItems > 0
                ? 'There are no trips on this page.'
                : 'No trips match the selected filters.';
        }
    } catch (error) {
        console.error(error);
        listEl.replaceChildren();
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

// Moves to another page without reloading: update the URL, then fetch again.
const goToTripsPage = (page) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', String(page));
    window.history.pushState({}, '', url);
    loadTripsPage();
    document.getElementById('trips-list').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const hookTripsList = () => {
    const listEl = document.getElementById('trips-list');
    const templateEl = document.getElementById('trip-card-template');
    const navEl = document.getElementById('trips-pagination');

    if (!listEl || !templateEl) {
        return;
    }

    document.getElementById('trips-prev')?.addEventListener('click', () => {
        goToTripsPage(Number(navEl.dataset.page) - 1);
    });
    document.getElementById('trips-next')?.addEventListener('click', () => {
        goToTripsPage(Number(navEl.dataset.page) + 1);
    });

    // Browser Back/Forward changes the URL, so load the page it points to.
    window.addEventListener('popstate', loadTripsPage);

    loadTripsPage();
};

document.addEventListener('DOMContentLoaded', () => {
    hookRegionSorter();
    hookSeasonSorter();
    hookTrainsCatalog();
    hookTripsList();
});