// ============================================================
// Mock data constants and match generation
// ============================================================

export const TEAMS = [
	{ name: 'Penn State', abbr: 'PSU', color: '#002855' },
	{ name: 'Iowa', abbr: 'IOWA', color: '#FFCD00' },
	{ name: 'Michigan', abbr: 'MICH', color: '#00274C' },
	{ name: 'Ohio State', abbr: 'OSU', color: '#BB0000' },
	{ name: 'Cornell', abbr: 'COR', color: '#B31B1B' },
	{ name: 'Oklahoma State', abbr: 'OKST', color: '#FF6600' },
	{ name: 'Minnesota', abbr: 'MINN', color: '#7A0019' },
	{ name: 'Arizona State', abbr: 'ASU', color: '#8C1D40' },
	{ name: 'NC State', abbr: 'NCST', color: '#CC0000' },
	{ name: 'Missouri', abbr: 'MIZZ', color: '#F1B82D' },
	{ name: 'Nebraska', abbr: 'NEB', color: '#E41C38' },
	{ name: 'Virginia Tech', abbr: 'VT', color: '#660000' },
	{ name: 'Rutgers', abbr: 'RUT', color: '#CC0033' },
	{ name: 'Wisconsin', abbr: 'WIS', color: '#C5050C' },
	{ name: 'Northern Iowa', abbr: 'UNI', color: '#4B116F' },
	{ name: 'Princeton', abbr: 'PRIN', color: '#EE7F2D' },
];

const FIRST_NAMES = ['Spencer', 'Carter', 'Aaron', 'Yianni', 'Kyle', 'Gable', 'Sammy', 'David', 'Roman', 'Mason', 'Jason', 'Vito', 'Levi', 'Mitchell', 'Shane', 'Nick', 'Patrick', 'Keegan', 'Max', 'Zain', 'Bryce', 'Daton', 'Jordan'];
const LAST_NAMES = ['Lee', 'Starocci', 'Brooks', 'Diakomihalis', 'Snyder', 'Steveson', 'Sasso', 'Carr', 'Bravo-Young', 'Parris', 'Nolf', 'Arujau', 'Haines', 'Finesilver', 'Griffith', 'Suriano', 'Glory', "O'Connor", 'Dean', 'Retherford', 'Marinelli', 'Fix', 'Burroughs'];
const WEIGHTS = [125, 133, 141, 149, 157, 165, 174, 184, 197, 285];
const BOUT_TYPES = ['Championship Quarterfinal', 'Consolation Round 3', 'Semifinal', 'Championship 1st Place', 'Consolation Semifinal', 'Round of 16'];
const PERIODS = ['Period 1', 'Period 2', 'Period 3', 'Overtime 1', 'Overtime 2', 'Overtime 3'];
const CLOCKS = ['3:00', '2:47', '1:33', '0:58', '2:00', '0:12', '1:15'];
const RIDING_TIMES = ['0:00', '0:32', '1:05', '0:48', '1:22', '0:15'];

function pick(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

function pickTwo(arr) {
	const a = Math.floor(Math.random() * arr.length);
	let b;
	do { b = Math.floor(Math.random() * arr.length); } while (b === a);
	return [arr[a], arr[b]];
}

export function randomizeData() {
	const w2Code = Math.random() < 0.5 ? '#330099' : '#006600';
	const matches = [];
	for (let i = 0; i < 8; i++) {
		const [t1, t2] = pickTwo(TEAMS);
		const [t3, t4] = pickTwo(TEAMS);
		const [t5, t6] = pickTwo(TEAMS);
		const weight = WEIGHTS[i % WEIGHTS.length];
		const ondeckWeight = WEIGHTS[(i + 1) % WEIGHTS.length];
		const inholeWeight = WEIGHTS[(i + 2) % WEIGHTS.length];
		const swapped = Math.random() < 0.5;
		matches.push({
			mat: `Mat ${i + 1}`,
			boutType: pick(BOUT_TYPES),
			boutNo: `${100 + i * 3 + Math.floor(Math.random() * 3)}`,
			weight: `${weight}`,
			w1Color: swapped ? w2Code : '#CC0000',
			w2Color: swapped ? '#CC0000' : w2Code,
			w1: { first: pick(FIRST_NAMES), last: pick(LAST_NAMES), team: t1, seed: Math.floor(Math.random() * 16) + 1, score: Math.floor(Math.random() * 12) },
			w2: { first: pick(FIRST_NAMES), last: pick(LAST_NAMES), team: t2, seed: Math.floor(Math.random() * 16) + 1, score: Math.floor(Math.random() * 12) },
			period: pick(PERIODS),
			clock: pick(CLOCKS),
			ridingTime: pick(RIDING_TIMES),
			ondeck: {
				boutNo: `${200 + i * 2}`,
				weight: `${ondeckWeight}`,
				w1: { first: pick(FIRST_NAMES), last: pick(LAST_NAMES), team: t3 },
				w2: { first: pick(FIRST_NAMES), last: pick(LAST_NAMES), team: t4 },
			},
			inhole: {
				boutNo: `${300 + i * 2}`,
				weight: `${inholeWeight}`,
				w1: { first: pick(FIRST_NAMES), last: pick(LAST_NAMES), team: t5 },
				w2: { first: pick(FIRST_NAMES), last: pick(LAST_NAMES), team: t6 },
			},
		});
	}
	return matches;
}
