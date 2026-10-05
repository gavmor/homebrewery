/**
 * Materialize the Foxhole theme from the foxhole-styles npm dependency
 * (gavmor/foxhole-styles) into ./themes/. The theme files are NOT
 * committed to this repo — they are vendored from the canonical source
 * on every build (prebuild) and dev-server start (prestart).
 *
 * Source layout in foxhole-styles:  homebrewery/themes/{V3,fonts,assets}/...
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG  = path.join(__dirname, '..', 'node_modules', 'foxhole-styles', 'homebrewery', 'themes');
const DEST = path.join(__dirname, '..', 'themes');

const COPIES = [
	['V3', 'Foxhole'],
	['fonts', 'Foxhole'],
	['assets', 'foxholePlate.png']
];

const copyDir = (src, dest)=>{
	fs.rmSync(dest, { recursive: true, force: true });
	fs.mkdirSync(path.dirname(dest), { recursive: true });
	fs.cpSync(src, dest, { recursive: true });
};

if(!fs.existsSync(PKG)) {
	console.error('sync-foxhole-styles: foxhole-styles package not found at node_modules/foxhole-styles.');
	console.error('Run `npm install` first.');
	process.exit(1);
}

for(const [dir, name] of COPIES) {
	const src  = path.join(PKG, dir, name);
	const dest = path.join(DEST, dir, name);
	if(!fs.existsSync(src)) {
		console.error(`sync-foxhole-styles: missing ${src} in foxhole-styles package.`);
		process.exit(1);
	}
	if(fs.statSync(src).isDirectory()) copyDir(src, dest);
	else {
		fs.mkdirSync(path.dirname(dest), { recursive: true });
		fs.copyFileSync(src, dest);
	}
	console.log(`sync-foxhole-styles: ${dir}/${name} -> themes/${dir}/${name}`);
}
