// ============================================================
// Score change detection and animation triggers
// ============================================================

const state = { scores: {}, ready: false, doc: null };
let intervalId = null;

function trigger(scoreEl, delta) {
	const doc = state.doc;
	const row = scoreEl.closest('.wrestler-row');
	const box = scoreEl.closest('.score-box');
	if (!row || !box || box.classList.contains('score-blast')) return;

	box.classList.add('score-blast');

	const ring = doc.createElement('div');
	ring.className = 'score-ring';
	box.appendChild(ring);

	const d = doc.createElement('div');
	d.className = 'delta-overlay';
	d.textContent = '+' + delta;
	row.appendChild(d);
	requestAnimationFrame(() => d.classList.add('animate'));

	setTimeout(() => row.classList.add('row-highlight'), 60);

	setTimeout(() => {
		box.classList.remove('score-blast');
		row.classList.remove('row-highlight');
		if (d.parentNode) d.parentNode.removeChild(d);
		if (ring.parentNode) ring.parentNode.removeChild(ring);
	}, 1400);
}

function poll() {
	const els = state.doc.querySelectorAll('.wScore');
	for (let i = 0; i < els.length; i++) {
		const el = els[i];
		const id = el.id;
		if (!id) continue;
		const val = parseInt(el.getAttribute('data-value'), 10) || 0;
		const prev = state.scores[id];
		if (state.ready && prev !== undefined && val > prev) trigger(el, val - prev);
		state.scores[id] = val;
	}
}

export function initScoreAnimation(doc) {
	if (intervalId) return;
	state.doc = doc || document;
	state.scores = {};
	state.ready = false;
	setTimeout(() => { state.ready = true; }, 3000);
	intervalId = setInterval(poll, 250);
}

export function resetScoreRegistry() {
	state.scores = {};
}
