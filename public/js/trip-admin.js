const container = document.querySelector('#trips-container');
const statusEl = document.querySelector('#trip-admin-status');
const itemTpl = document.querySelector('#trip-item-template');
const editTpl = document.querySelector('#trip-edit-template');

let tripsById = new Map();

function formatStation(trip) {
  const st = trip.station || trip.originStation;
  if (!st) return 'Station: Unassigned';
  return `Station: ${typeof st === 'object' ? (st.name || st.title || st._id) : st}`;
}

function formatSchedule(trip) {
  const sc = trip.schedule;
  if (!sc) return 'Schedule: Unassigned';
  return `Schedule: ${typeof sc === 'object' ? (sc.label || sc.name || sc.departureTime || sc._id) : sc}`;
}

function renderTrips() {
  const fragment = document.createDocumentFragment();

  for (const trip of tripsById.values()) {
    const clone = itemTpl.content.cloneNode(true);
    const article = clone.querySelector('.trip-item');
    article.dataset.tripId = trip._id;
    article.querySelector('.trip-title').textContent = trip.name || trip.code || `Trip ${trip._id}`;
    article.querySelector('.trip-station').textContent = formatStation(trip);
    article.querySelector('.trip-schedule').textContent = formatSchedule(trip);
    fragment.append(clone);
  }

  container.replaceChildren(fragment);
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
      statusEl.textContent = 'Failed to load trips.';
      return;
    }

    const trips = await res.json();
    tripsById = new Map(trips.map((t) => [t._id, t]));
    renderTrips();
  } catch {
    statusEl.textContent = 'Network error loading trips.';
  }
}

container.addEventListener('click', async (event) => {
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

    const currentStationId = typeof trip.station === 'object' ? trip.station?._id : trip.station;
    const currentScheduleId = typeof trip.schedule === 'object' ? trip.schedule?._id : trip.schedule;
    if (currentStationId && form.elements.station) {
      form.elements.station.value = currentStationId;
    }
    if (currentScheduleId && form.elements.schedule) {
      form.elements.schedule.value = currentScheduleId;
    }

    form.addEventListener('submit', async (submitEvent) => {
      submitEvent.preventDefault();
      const payload = {};
      if (form.elements.station.value) payload.station = form.elements.station.value;
      if (form.elements.schedule.value) payload.schedule = form.elements.schedule.value;

      try {
        const putRes = await fetch(`/api/trips/${encodeURIComponent(tripId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!putRes.ok) {
          let errMessage = 'Failed to update trip.';
          try {
            const err = await putRes.json();
            if (err?.message) errMessage = err.message;
          } catch {
            // Ignore non-JSON error body
          }
          statusEl.textContent = errMessage;
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
        let errMessage = 'Failed to delete trip.';
        try {
          const err = await delRes.json();
          if (err?.message) errMessage = err.message;
        } catch {
          // Ignore non-JSON error body
        }
        statusEl.textContent = errMessage;
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
