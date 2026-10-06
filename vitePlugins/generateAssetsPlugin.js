// vite-plugins/generateAssetsPlugin.js
import fs from 'fs-extra';
import path from 'path';
import less from 'less';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// The Foxhole theme is not vendored into ./themes — it ships inside the
// @gavmor/foxhole-styles package and is compiled straight out of node_modules.
// Package layout:  homebrewery/themes/{V3,fonts,assets}/...
const foxholeRoot = path.join(
	path.dirname(require.resolve('@gavmor/foxhole-styles/package.json')),
	'homebrewery'
);
const foxholeThemes = path.join(foxholeRoot, 'themes');

// Theme source roots, scanned in order. Each contributes its V3/ subdirectories.
// `lessPaths` are extra search roots handed to less so that a theme's
// cwd-relative `@import './themes/...'` resolves inside its own package.
const themeRoots = [
	{ dir: '.', lessPaths: [] },
	{ dir: foxholeRoot, lessPaths: [foxholeRoot] },
];

export function generateAssetsPlugin(isDev = false) {
	return {
		name : 'generate-assets',
		async buildStart() {
			const buildDir = path.resolve(process.cwd(), 'build');

			// Copy favicon
			await fs.copy('./client/homebrew/favicon.ico', `${buildDir}/assets/favicon.ico`);

			//Copy this image into multiple paths to avoid server spam where browser requests an image
			//at the wrong path, gets a 406, then in response requests broken-image which also fails. Error handler
			//used the wrong path for this image causing an infinite request loop. Should be able to remove
			//in some time once all users haver refreshed their browser
			await fs.copy('./client/icons/broken-image.jpg', `${buildDir}/edit/client/icons/broken-image.jpg`);
			await fs.copy('./client/icons/broken-image.jpg', `${buildDir}/new/client/icons/broken-image.jpg`);
			await fs.copy('./client/icons/broken-image.jpg', `${buildDir}/client/icons/broken-image.jpg`);

			// Copy shared styles/fonts
			const assets = fs.readdirSync('./shared/naturalcrit/styles');
			for (const file of assets) {
				await fs.copy(`./shared/naturalcrit/styles/${file}`, `${buildDir}/fonts/${file}`);
			}

			// Compile Legacy themes
			const themes = { Legacy: {}, V3: {} };
			const legacyDirs = fs.readdirSync('./themes/Legacy');
			for (const dir of legacyDirs) {
				const themeData = JSON.parse(fs.readFileSync(`./themes/Legacy/${dir}/settings.json`, 'utf-8'));
				themeData.path = dir;
				themes.Legacy[dir] = themeData;

				const src = `./themes/Legacy/${dir}/style.less`;
				const outputDir = `${buildDir}/themes/Legacy/${dir}/style.css`;
				const lessOutput = await less.render(fs.readFileSync(src, 'utf-8'), { compress: !isDev });
				await fs.outputFile(outputDir, lessOutput.css);
			}

			// Compile V3 themes from every root (repo-local plus installed packages)
			for (const root of themeRoots) {
				const v3Root = path.join(root.dir, 'themes', 'V3');
				const v3Dirs = fs.readdirSync(v3Root);
				for (const dir of v3Dirs) {
					const themeDir = path.join(v3Root, dir);
					const themeData = JSON.parse(fs.readFileSync(path.join(themeDir, 'settings.json'), 'utf-8'));
					themeData.path = dir;
					themes.V3[dir] = themeData;

					await fs.copy(
						path.join(themeDir, 'dropdownTexture.png'),
						`${buildDir}/themes/V3/${dir}/dropdownTexture.png`,
					);
					await fs.copy(
						path.join(themeDir, 'dropdownPreview.png'),
						`${buildDir}/themes/V3/${dir}/dropdownPreview.png`,
					);

					const src = path.join(themeDir, 'style.less');
					const outputDir = `${buildDir}/themes/V3/${dir}/style.css`;
					const lessOutput = await less.render(fs.readFileSync(src, 'utf-8'), {
						compress : !isDev,
						paths    : root.lessPaths,
					});
					await fs.outputFile(outputDir, lessOutput.css);
				}
			}

			// Write themes.json — keys sorted so output is stable regardless of
			// which root a theme was discovered in
			const sortKeys = (obj)=>Object.fromEntries(Object.entries(obj).sort(([a], [b])=>a.localeCompare(b)));
			const sortedThemes = { Legacy: sortKeys(themes.Legacy), V3: sortKeys(themes.V3) };
			await fs.outputFile('./themes/themes.json', JSON.stringify(sortedThemes, null, 2));

			// Copy fonts/assets/icons
			await fs.copy('./themes/fonts', `${buildDir}/fonts`);
			await fs.copy('./themes/assets', `${buildDir}/assets`);
			await fs.copy('./client/icons', `${buildDir}/icons`);

			// Foxhole ships its own webfonts and aged-paper plate alongside the theme
			await fs.copy(path.join(foxholeThemes, 'fonts'), `${buildDir}/fonts`);
			await fs.copy(path.join(foxholeThemes, 'assets'), `${buildDir}/assets`);
		},
	};
}
