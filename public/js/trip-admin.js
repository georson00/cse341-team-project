const container = document.querySelector('#trips-container');
const statusEl = document.querySelector('#trip-admin-status');
const createForm = document.querySelector('#create-trip-form');
const itemTpl = document.querySelector('#trip-item-template');
const editTpl = document.querySelector('#trip-edit-template');

let tripsById = new Map();

function renderTrips() {
  const fragment = document.createDocumentFragment();

  for (const trip of tripsById.values()) {
    const clone = itemTpl.content.cloneNode(true);
    const article = clone.querySelector('.trip-item');
    article.dataset.tripId = trip._id;
    article.querySelector('.trip-title').textContent = trip.name || 'Untitled Trip';

    const routeParts = [trip.startStation, trip.endStation].filter(Boolean);
    article.querySelector('.trip-route').textContent = routeParts.length
      ? `Route: ${routeParts.join(' -> ')}`
      : 'Route: Not specified';

    article.querySelector('.trip-duration').textContent = trip.duration
      ? `Duration: ${trip.duration}`
      : 'Duration: N/A';

    article.querySelector('.trip-description').textContent = trip.description || '';

    const highlights = Array.isArray(trip.highlights) ? trip.highlights : [];
    article.querySelector('.trip-highlights').textContent = highlights.length
      ? `Highlights: ${highlights.join(', ')}`
      : '';

    fragment.append(clone);
  }

  container.replaceChildren(fragment);
}

async function parseErrorMessage(response, fallback) {
  try {
    const data = await response.json();
    return data?.message || fallback;
  } catch {
    return fallback;
  }
}

async function loadTrips() {
  try {
    const res = await fetch('/api/trips');
    if (res.status === 401) {
      window.location.href = '/login';
      return;
    }
    if (res.status === 403) {
      statusEl.textContent = 'Access denied: admin role required.';
      return;
    }
    if (!res.ok) {
      statusEl.textContent = await parseErrorMessage(res, 'Failed to load trips.');
      return;
    }

    const trips = await res.json();
    tripsById = new Map(trips.map((t) => [t._id, t]));
    renderTrips();
  } catch {
    statusEl.textContent = 'Network error loading trips.';
  }
}

createForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(createForm);
  const payload = Object.fromEntries(formData.entries());

  try {
    const res = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      statusEl.textContent = await parseErrorMessage(res, 'Failed to create trip.');
      return;
    }

    const created = await res.json();
    tripsById.set(created._id, created);
    renderTrips();
    createForm.reset();
    statusEl.textContent = 'Trip created.';
  } catch {
    statusEl.textContent = 'Network error creating trip.';
  }
});

container?.addEventListener('click', async (event) => {
  const actionBtn = event.target.closest('button[data-action]');
  if (!actionBtn) return;

  const host = actionBtn.closest('.trip-item, .trip-edit-form');
  const tripId = host?.dataset.tripId;
  const trip = tripsById.get(tripId);
  if (!trip) return;

  if (actionBtn.dataset.action === 'edit') {
    const editClone = editTpl.content.cloneNode(true);
    const form = editClone.querySelector('form');
    form.dataset.tripId = tripId;

    form.elements.name.value = trip.name || '';
    form.elements.startStation.value = trip.startStation || '';
    form.elements.endStation.value = trip.endStation || '';
    form.elements.duration.value = trip.duration || '';
    form.elements.description.value = trip.description || '';
    form.elements.highlights.value = Array.isArray(trip.highlights)
      ? trip.highlights.join(', ')
      : '';

    form.addEventListener('submit', async (submitEvent) => {
      submitEvent.preventDefault();
      const payload = Object.fromEntries(new FormData(form).entries());

      try {
        const putRes = await fetch(`/api/trips/${encodeURIComponent(tripId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!putRes.ok) {
          statusEl.textContent = await parseErrorMessage(putRes, 'Failed to update trip.');
          return;
        }

        const updated = await putRes.json();
        tripsById.set(updated._id, updated);
        renderTrips();
        statusEl.textContent = 'Trip updated.';
      } catch {
        statusEl.textContent = 'Network error updating trip.';
      }
    });

    host.replaceWith(editClone);
  } else if (actionBtn.dataset.action === 'cancel') {
    renderTrips();
  } else if (actionBtn.dataset.action === 'delete') {
    try {
      const delRes = await fetch(`/api/trips/${encodeURIComponent(tripId)}`, {
        method: 'DELETE',
      });

      if (!delRes.ok) {
        statusEl.textContent = await parseErrorMessage(delRes, 'Failed to delete trip.');
        return;
      }

      tripsById.delete(tripId);
      renderTrips();
      statusEl.textContent = 'Trip deleted.';
    } catch {
      statusEl.textContent = 'Network error deleting trip.';
    }
  }
});

loadTrips();
