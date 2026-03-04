// ============================================================
// Main application — preview environment
// ============================================================

import { randomizeData } from './data.js';
import { initTemplate, getExportHTML, fillTemplate } from './template.js';
import { initScoreAnimation, resetScoreRegistry } from './score-animation.js';

// --- State ---
let mockMatches = [];
let CARD_TEMPLATE = '';
let EXPORT_CSS = '';

// --- DOM refs ---
const $ = (id) => document.getElementById(id);

// Iframe refs (populated after load)
let iframeEl, innerDoc, innerRoot;

function waitForIframe() {
	return new Promise(resolve => {
		iframeEl = $('previewFrame');
		if (iframeEl.contentDocument && iframeEl.contentDocument.readyState === 'complete') {
			resolve();
		} else {
			iframeEl.addEventListener('load', resolve, { once: true });
		}
	});
}

// --- Toast ---
let toastTimer;
function showToast(msg, type) {
	const el = $('toast');
	clearTimeout(toastTimer);
	el.textContent = msg;
	el.className = 'toast ' + type;
	requestAnimationFrame(() => el.classList.add('show'));
	toastTimer = setTimeout(() => el.classList.remove('show'), 2000);
}

// --- Render ---
function renderMats() {
	const count = Math.max(1, Math.min(8, parseInt($('matCount').value) || 1));
	const cols = Math.max(1, Math.min(4, parseInt($('colCount').value) || 1));
	const depth = Math.max(0, Math.min(2, parseInt($('upcomingDepth').value) || 0));
	const frame = innerDoc.getElementById('matAssignDisplayFrame');
	const rows = Math.ceil(count / cols);

	frame.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
	frame.style.gridTemplateRows = 'repeat(' + rows + ', auto)';
	innerRoot.style.setProperty('--columns', cols);
	innerRoot.style.setProperty('--rows', rows);
	innerRoot.style.setProperty('--upcoming-bars', depth);
	innerRoot.style.setProperty('--font-size', parseInt($('fontSize').value) || 16);
	innerRoot.style.setProperty('--valign', $('valign').value);
	const teamFrame = innerDoc.getElementById('teamFrame');
	frame.innerHTML = '';

	for (let i = 0; i < count; i++) {
		frame.innerHTML += fillTemplate(CARD_TEMPLATE, mockMatches[i], i, depth);
	}
	if (teamFrame) innerDoc.body.appendChild(teamFrame); // restore

	// Derive row count from rendered cards / columns and stamp each card
	frame.querySelectorAll('.outer-frame').forEach(function(el) {
		el.dataset.rows = rows;
	});

	// Reset score registry so first poll stores current values without animating
	resetScoreRegistry();
	saveSettings();
}

// --- Simulate Score ---
function simulateScore() {
	const count = parseInt($('matCount').value);
	const matIdx = Math.floor(Math.random() * count);
	const w = Math.random() < 0.5 ? 'w1' : 'w2';
	const id = w + 'Score_prev' + matIdx;
	const el = innerDoc.getElementById(id);
	if (!el) return;
	const current = parseInt(el.getAttribute('data-value'), 10) || 0;
	const delta = Math.floor(Math.random() * 3) + 1;
	const newScore = current + delta;
	el.innerHTML = '<span>' + newScore + '</span>';
	el.setAttribute('data-value', '' + newScore);
}

// --- Team Scores Marquee ---
// Replicates the production DOM structure from receivedTeamScores() in the JSP.
const TEAM_SCORES_HTML = '<table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-weight:bold;font-size:16px;border:1px black solid;color:white;"><tr><td><marquee truespeed="" scrollamount="100" scrolldelay="1000" direction="left">Team Scores: 1. Rocket 99.0&nbsp;&nbsp;&nbsp;&nbsp;2. Magma 85.0&nbsp;&nbsp;&nbsp;&nbsp;3. Aqua 73.0&nbsp;&nbsp;&nbsp;&nbsp;4. Plasma 66.0&nbsp;&nbsp;&nbsp;&nbsp;5. Galactic 55.5&nbsp;&nbsp;&nbsp;&nbsp;6. Dim Sun 44.0&nbsp;&nbsp;&nbsp;&nbsp;7. Debonairs 42.0&nbsp;&nbsp;&nbsp;&nbsp;8. Go-Rock Squad 32.5&nbsp;&nbsp;&nbsp;&nbsp;9. Great Rocket (gr) 31.5&nbsp;&nbsp;&nbsp;&nbsp;10. Flare 30.0&nbsp;&nbsp;&nbsp;&nbsp;</marquee></td></tr></table>';

// Parse raw marquee text into structured spans for CSS targeting.
// Extracts the "Team Scores:" prefix into a fixed label element
// positioned outside the marquee so entries scroll behind it.
function parseMarqueeScores(marqueeEl) {
	const text = marqueeEl.textContent;
	const pm = text.match(/^(.*?:\s*)/);
	const prefix = pm ? pm[1].trim().replace(/:$/, '') : '';
	const rest = text.slice(pm ? pm[0].length : 0);
	const entries = rest.split(/[\s\u00a0]{4,}/).filter(e => e.trim());

	let html = '';
	for (const entry of entries) {
		const m = entry.trim().match(/^(\d+)\.\s+(.*?)\s+(\d+(?:\.\d+)?)\s*$/);
		if (m) {
			html += '<span class="ts-entry">'
				+ '<span class="ts-rank">' + m[1] + '.</span> '
				+ '<span class="ts-team">' + m[2] + '</span> '
				+ '<span class="ts-score">' + m[3] + '</span>'
				+ '</span>';
		}
	}
	marqueeEl.innerHTML = html;

	// Create fixed label as a direct child of .marquee-frame
	const frame = marqueeEl.closest('.marquee-frame');
	if (frame && !frame.querySelector('.ts-frame-label')) {
		const label = innerDoc.createElement('div');
		label.className = 'ts-frame-label';
		label.textContent = prefix;
		frame.insertBefore(label, frame.firstChild);
	}
}

function initTeamScores() {
	const frame = innerDoc.createElement('div');
	frame.id = 'teamFrame';
	frame.className = 'marquee-frame';
	frame.style.cssText = 'bottom:0;font-size:16px;display:none;';
	frame.innerHTML = TEAM_SCORES_HTML;
	parseMarqueeScores(frame.querySelector('marquee'));
	innerDoc.body.appendChild(frame);
}

function toggleTeamScores() {
	const checked = $('teamScores').checked;
	const frame = innerDoc.getElementById('teamFrame');
	if (frame) {
		frame.style.display = checked ? '' : 'none';
	}
	saveSettings();
}

// --- Simulate Production Redraw ---
// Mimics assignedMatchesReady(): replaces innerHTML, then stamps data-rows
// on next frame (mirrors the <img onerror> immediate stamp in production).
function simulateRedraw() {
	const count = Math.max(1, Math.min(8, parseInt($('matCount').value) || 1));
	const cols = Math.max(1, Math.min(4, parseInt($('colCount').value) || 1));
	const depth = Math.max(0, Math.min(2, parseInt($('upcomingDepth').value) || 0));
	const frame = innerDoc.getElementById('matAssignDisplayFrame');
	const rows = Math.ceil(count / cols);

	// Rebuild innerHTML just like production — no data-rows yet
	const teamFrame = innerDoc.getElementById('teamFrame');
	frame.innerHTML = '';
	for (let i = 0; i < count; i++) {
		frame.innerHTML += fillTemplate(CARD_TEMPLATE, mockMatches[i], i, depth);
	}
	if (teamFrame) innerDoc.body.appendChild(teamFrame); // restore

	// Stamp data-rows on next frame (production onerror fires before paint)
	requestAnimationFrame(() => {
		frame.querySelectorAll('.outer-frame').forEach(el => {
			el.dataset.rows = rows;
		});
	});

	resetScoreRegistry();
}

// --- Export ---
async function exportFile(type) {
	const label = type.toUpperCase();
	try {
		if (type === 'css' && !EXPORT_CSS) {
			showToast('CSS export unavailable — copy styles.css directly', 'error');
			return;
		}
		let text = type === 'html' ? getExportHTML() : EXPORT_CSS;
		// Bake in preview-controlled values that aren't production data fields
		if (type === 'html') {
			const depth = parseInt($('upcomingDepth').value) || 0;
			text = text.replace('[upcomingDepth]', depth);
			text = text.replace('[valign]', $('valign').value);
		}
		if (type === 'css') {
			text = text.replace('--columns: 1;', '--columns: [columns];');
			text = text.replace('--font-size: 16;', '--font-size: [fontSize];');
		}
		await navigator.clipboard.writeText(text);
		showToast(label + ' copied to clipboard', 'success');
	} catch (e) {
		console.error('Export failed:', e);
		showToast('Failed to copy ' + label, 'error');
	}
}

// --- Settings Persistence ---
const SETTINGS_KEY = 'matDisplayPreviewSettings';
const DEFAULTS = { mats: 4, columns: 2, upcoming: 2, fontSize: 16, valign: 'center', screen: 'fill' };

function saveSettings() {
	try {
		localStorage.setItem(SETTINGS_KEY, JSON.stringify({
			mats: parseInt($('matCount').value) || DEFAULTS.mats,
			columns: parseInt($('colCount').value) || DEFAULTS.columns,
			upcoming: parseInt($('upcomingDepth').value),
			fontSize: parseInt($('fontSize').value) || DEFAULTS.fontSize,
			valign: $('valign').value,
			screen: $('aspectRatio').value,
			teamScores: $('teamScores').checked,
		}));
	} catch (e) { /* localStorage may be unavailable */ }
}

function loadSettings() {
	try {
		const raw = localStorage.getItem(SETTINGS_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch (e) { return null; }
}

function resetSettings() {
	try { localStorage.removeItem(SETTINGS_KEY); } catch (e) { /* noop */ }
	$('matCount').value = DEFAULTS.mats;
	$('colCount').value = DEFAULTS.columns;
	$('upcomingDepth').value = DEFAULTS.upcoming;
	$('fontSize').value = DEFAULTS.fontSize;
	$('valign').value = DEFAULTS.valign;
	$('aspectRatio').value = DEFAULTS.screen;
	$('teamScores').checked = false;
	toggleTeamScores();
	renderMats();
	applyAspectRatio();
	showToast('Settings reset', 'success');
}

// --- Safe Area / Aspect Ratio ---
function applyAspectRatio() {
	const label = $('safeAreaLabel');
	const ratio = $('aspectRatio').value;

	if (ratio === 'fill') {
		iframeEl.classList.remove('safe-area-active');
		label.classList.remove('visible');
		saveSettings();
		return;
	}

	const parts = ratio.split(':');
	iframeEl.style.setProperty('--ar-w', parts[0]);
	iframeEl.style.setProperty('--ar-h', parts[1]);
	iframeEl.classList.add('safe-area-active');

	requestAnimationFrame(() => {
		const rect = iframeEl.getBoundingClientRect();
		label.textContent = ratio + '  \u2022  ' + Math.round(rect.width) + ' \u00d7 ' + Math.round(rect.height) + 'px';
		label.classList.add('visible');
	});
	saveSettings();
}

function updateSafeAreaLabel() {
	if ($('aspectRatio').value === 'fill') return;
	const label = $('safeAreaLabel');
	const ratio = $('aspectRatio').value;
	const rect = iframeEl.getBoundingClientRect();
	label.textContent = ratio + '  \u2022  ' + Math.round(rect.width) + ' \u00d7 ' + Math.round(rect.height) + 'px';
}

// --- Init ---
async function init() {
	// Fetch production template and CSS in parallel with iframe load
	const [template] = await Promise.all([
		initTemplate(),
		fetch('styles.css').then(r => r.text()).then(css => { EXPORT_CSS = css; }).catch(() => {}),
		waitForIframe(),
	]);
	CARD_TEMPLATE = template;

	// Iframe is loaded — grab references
	innerDoc = iframeEl.contentDocument;
	innerRoot = innerDoc.documentElement;

	// Restore saved settings
	const saved = loadSettings();
	if (saved) {
		$('matCount').value = saved.mats;
		$('colCount').value = saved.columns;
		if (saved.upcoming !== undefined) $('upcomingDepth').value = saved.upcoming;
		if (saved.fontSize !== undefined) $('fontSize').value = saved.fontSize;
		if (saved.valign) $('valign').value = saved.valign;
		$('aspectRatio').value = saved.screen;
		if (saved.teamScores) $('teamScores').checked = true;
	}

	// Create team scores marquee inside iframe (hidden by default)
	initTeamScores();
	toggleTeamScores();

	// Generate data and render
	mockMatches = randomizeData();
	renderMats();
	applyAspectRatio();

	// Start score animation watcher (pass iframe document)
	initScoreAnimation(innerDoc);

	// --- Wire up event listeners ---
	const onRender = () => renderMats();

	$('matCount').addEventListener('input', onRender);
	$('colCount').addEventListener('input', onRender);
	$('upcomingDepth').addEventListener('input', onRender);
	$('fontSize').addEventListener('input', onRender);
	$('valign').addEventListener('change', onRender);
	$('aspectRatio').addEventListener('change', applyAspectRatio);

	$('btnRandomize').addEventListener('click', () => {
		mockMatches = randomizeData();
		renderMats();
	});
	$('teamScores').addEventListener('change', toggleTeamScores);
	$('btnSimulate').addEventListener('click', simulateScore);
	$('btnRedraw').addEventListener('click', simulateRedraw);
	$('btnExportHTML').addEventListener('click', () => exportFile('html'));
	$('btnExportCSS').addEventListener('click', () => exportFile('css'));
	$('btnReset').addEventListener('click', resetSettings);

	window.addEventListener('resize', updateSafeAreaLabel);
}

init();
