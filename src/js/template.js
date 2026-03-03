// ============================================================
// Card template — fetches from card-template.html (production artifact)
// ============================================================

let cardTemplate = '';
let exportTemplate = '';

export async function initTemplate() {
	const res = await fetch('card-template.html');
	exportTemplate = await res.text();
	// Strip score-animation bootstrap img (preview has its own watcher)
	cardTemplate = exportTemplate.replace(/\n?<img src="x"[^\n]*/, '');
	return cardTemplate;
}

export function getExportHTML() {
	return exportTemplate;
}

export function fillTemplate(tpl, m, idx, depth) {
	const map = {
		'upcomingDepth': depth,
		'mat': m.mat,
		'boutType': m.boutType,
		'boutNo': m.boutNo,
		'weight': m.weight,
		'w1Color': m.w1Color,
		'w1Seed': m.w1.seed,
		'w1FirstName': m.w1.first,
		'w1LastName': m.w1.last,
		'w1Team': m.w1.team.name,
		'w1TeamAbbr': m.w1.team.abbr,
		'w1Score': '<div class="wScore w1Score" id="w1Score_prev' + idx + '" data-value="' + m.w1.score + '"><span>' + m.w1.score + '</span></div>',
		'w2Color': m.w2Color,
		'w2Seed': m.w2.seed,
		'w2FirstName': m.w2.first,
		'w2LastName': m.w2.last,
		'w2Team': m.w2.team.name,
		'w2TeamAbbr': m.w2.team.abbr,
		'w2Score': '<div class="wScore w2Score" id="w2Score_prev' + idx + '" data-value="' + m.w2.score + '"><span>' + m.w2.score + '</span></div>',
		'periodName': '<span class="periodName" data-value="' + m.period + '"><span>' + m.period + '</span></span>',
		'clockTime': m.clock,
		'ridingTime': '<span class="ridingTime" data-value="' + m.ridingTime + '"' + (m.ridingTime !== '0:00' ? ' style="color:' + (Math.random() < 0.5 ? '#cc0000' : '#00802b') + '"' : '') + '>' + m.ridingTime + '</span>',
		'ondeck-boutNo': m.ondeck.boutNo,
		'ondeck-weight': m.ondeck.weight,
		'ondeck-w1FirstName': m.ondeck.w1.first,
		'ondeck-w1LastName': m.ondeck.w1.last,
		'ondeck-w1TeamAbbr': m.ondeck.w1.team.abbr,
		'ondeck-w2FirstName': m.ondeck.w2.first,
		'ondeck-w2LastName': m.ondeck.w2.last,
		'ondeck-w2TeamAbbr': m.ondeck.w2.team.abbr,
		'inhole-boutNo': m.inhole.boutNo,
		'inhole-weight': m.inhole.weight,
		'inhole-w1FirstName': m.inhole.w1.first,
		'inhole-w1LastName': m.inhole.w1.last,
		'inhole-w1TeamAbbr': m.inhole.w1.team.abbr,
		'inhole-w2FirstName': m.inhole.w2.first,
		'inhole-w2LastName': m.inhole.w2.last,
		'inhole-w2TeamAbbr': m.inhole.w2.team.abbr,
	};
	return tpl.replace(/\[([\w-]+?)(?::(\d+))?\]/g, function(full, name, len) {
		const val = map[name];
		if (val === undefined) return full;
		let str = '' + val;
		if (len) str = str.substring(0, parseInt(len, 10));
		return str;
	});
}
