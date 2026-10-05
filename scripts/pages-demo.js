// Prepares the vite build output for static hosting (e.g. GitHub Pages).
//
// 1. Rewrites root-absolute URLs the bundler leaves alone (theme CSS,
//    fetch('/api/...') strings) to the HB_BASE subpath.
// 2. Writes static /api/theme/:renderer/:id JSON stubs for every built-in
//    theme, replicating server/homebrew.api.js getThemeBundle's static branch.
// 3. Copies build/index.html -> build/404.html so client-side routes (e.g.
//    /new) resolve on hosts without SPA fallback rewrites.
// 4. Injects window.__DEMO_BREW__ (a sample Foxhole document) and a
//    / -> /new redirect into the served HTML.
//
// Run after `npm run build`:  HB_BASE=/homebrewery/ node scripts/pages-demo.js
import fs from 'fs';
import path from 'path';

const BUILD = path.resolve('build');
let BASE = process.env.HB_BASE || '/';
if(!BASE.endsWith('/')) BASE += '/';

const Themes = JSON.parse(fs.readFileSync('./themes/themes.json', 'utf-8'));

//--- 1. Rewrite root-absolute URLs missed by the bundler -------------------
const withBase = (s)=>s.replace(/(["'`\(\s])\/(api|themes|assets|fonts|icons|client|index)\//g,
	(match, q, dir)=>`${q}${BASE}${dir}/`);

const walk = (dir)=>{
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name);
		if(e.isDirectory()) walk(p);
		else if(/\.(js|css|html|json)$/.test(e.name) && !p.includes(`${path.sep}api${path.sep}`)) {
			const before = fs.readFileSync(p, 'utf-8');
			const after = withBase(before);
			if(after !== before) { fs.writeFileSync(p, after); console.log('rebased', path.relative(BUILD, p)); }
		}
	}
};
walk(BUILD);

//--- 2. Theme bundle stubs -------------------------------------------------
for (const [renderer, themes] of Object.entries(Themes)) {
	for (const [id, theme] of Object.entries(themes)) {
		const styles = [], snippets = [];
		let cur = id;
		while (cur) {
			snippets.push(`${renderer}_${cur}`);
			styles.push(`/* From Theme ${cur} */\n\n@import url("${BASE}themes/${renderer}/${cur}/style.css");`);
			cur = themes[cur].baseTheme;
		}
		const bundle = { styles: styles.reverse(), snippets: snippets.reverse(), name: theme.name ?? id };
		const out = path.join(BUILD, 'api', 'theme', renderer, id);
		fs.mkdirSync(path.dirname(out), { recursive: true });
		fs.writeFileSync(out, JSON.stringify(bundle));
		console.log('stubbed', `${BASE}api/theme/${renderer}/${id}`);
	}
}

//--- 3 + 4. SPA fallback + demo brew ---------------------------------------
const demoBrew = {
	title    : 'Requisition Order 141/TINE/0004',
	renderer : 'V3',
	theme    : 'Foxhole',
	text     : `{{masthead
# REQUISITION ORDER
}}

{{routing
FROM: SPEAKING WOODS COMMAND
TO: 56TH ARMOURED CORPS, QUARTERMASTER
RE: ONE (1) LIQUID TRANSPORT SHIP
}}

## PARTICULARS OF THE HULL

The Venchin Auto Corporation has lately put a faction-neutral liquid transport ship on the market, and the Corps has need of such a hull. The **Tummler by VAC** is unarmed and carries fifteen cargo slots with two top-deck transfer stations.

### Construction

Dry Dock assembly calls for eight Naval Hull Segments and fifteen Naval Shell Plating, ten MW of power, and four hours at the ways. The hull is not MPF-able.

| Item | Qty | Note |
|:--|:--|:--|
| Naval Hull Segment | 8 | keel and frames |
| Naval Shell Plating | 15 | belt and deck |
| Power | 10 MW | continuous |

> Quartermaster's note: record each stockpile's litre capacity from the commissioned hull's gauges. Do not estimate.

{{stamp
APPROVED
}}

---

\\page

## SECOND PAGE

The editor is live: type on the left, watch the Foxhole theme render on the right. Your work is kept in this browser's local storage. Cloud saving is unavailable in this static demo.
`
};

const baseNoSlash = BASE.replace(/\/$/, '');
const inject = `<script>window.__DEMO_BREW__=${JSON.stringify(demoBrew)};` +
	`if(window.location.pathname==='${baseNoSlash}/'||window.location.pathname==='${baseNoSlash}')` +
	`window.location.replace('${baseNoSlash}/new');</script>`;

for (const file of ['index.html', '404.html']) {
	const p = path.join(BUILD, file);
	let html = fs.readFileSync(path.join(BUILD, 'index.html'), 'utf-8');
	html = html.replace('<head>', ()=>{
		return `<head>\n${inject}`;
	});
	fs.writeFileSync(p, html);
	console.log('wrote', file);
}
