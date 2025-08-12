'use strict';
//11/08/25

include('..\\..\\helpers\\menu_xxx.js');
include('..\\..\\helpers\\helpers_xxx.js');
include('..\\..\\helpers\\helpers_xxx_file.js');

/* exported choosePresetMenu */

/* global testRecipe:readable, searchByDistance:readable, music_graph_descriptors:readable, sbd:readable, searchByDistance:readable */

include('..\\..\\helpers\\menu_xxx.js');
/* global _menu:readable */
include('..\\..\\helpers\\helpers_xxx.js');
/* global MF_GRAYED:readable */
include('..\\..\\helpers\\buttons_xxx.js');
/* global showButtonReadme:readable */
include('..\\..\\helpers\\helpers_xxx_file.js');
/* global utf8:readable, _explorer:readable, _jsonParseFileCheck:readable, _parseAttrFile:readable, findRecursiveFile:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global _p:readable */

const presetMenu = new _menu();

function choosePresetMenu(parent) {
	presetMenu.clear(true); // Reset on every call
	const properties = parent.buttonsProperties;
	const tags = JSON.parse(parent.buttonsProperties.tags[1]);
	const defArgs = { tags, bRandomPick: true, bHarmonicMixDoublePass: true, properties: parent.buttonsProperties };
	const recipes = findRecursiveFile('*.json', [sbd.recipesPath])
		.map((path) => {
			// Omit hidden files
			const attr = _parseAttrFile(path);
			if (attr && attr.Hidden) { return null; }
			path = path.replace(fb.ProfilePath, '.\\profile\\');
			const recipe = _jsonParseFileCheck(path, 'Recipe json', sbd.name, utf8);
			if (!recipe) { return null; }
			if (!testRecipe({ json: recipe, baseTags: JSON.parse(properties.tags[1]) }).valid) { return null; }
			const name = Object.hasOwn(recipe, 'name')
				? recipe.name
				: utils.SplitFilePath(path)[1];
			return { name, path, ...recipe };
		}).filter(Boolean);
	presetMenu.newEntry({ entryText: 'Select settings for search:', flags: MF_GRAYED });
	presetMenu.newSeparator();
	[
		{ // Random mix with only nearest tracks
			entryText: 'Nearest tracks', args: () => {
				tags.genre.weight = 15; tags.style.weight = 10; tags.mood.weight = 5; tags.key.weight = 10; tags.date.weight = 25; tags.bpm.weight = 5;
				tags.date.range = 15; tags.bpm.range = 25;
				tags.dynGenre.weight = 25; tags.dynGenre.range = 1;
				return { ...defArgs, minScoreFilter: 65, scoreFilter: 70, graphDistance: music_graph_descriptors.intra_supergenre / 2 };
			}
		},
		{ // Random mix a bit varied on styles (but similar genre), most tracks within a decade
			entryText: 'Similar tracks', args: () => { // Random mix with only nearest tracks
				tags.genre.weight = 15; tags.style.weight = 10; tags.mood.weight = 5; tags.key.weight = 5; tags.date.weight = 25; tags.bpm.weight = 5;
				tags.date.range = 15; tags.bpm.range = 25;
				tags.dynGenre.weight = 10; tags.dynGenre.range = 1;
				return { ...defArgs, minScoreFilter: 55, scoreFilter: 60, graphDistance: music_graph_descriptors.cluster };
			}
		},
		{ // Random mix even more varied on styles/genres, most tracks within a decade
			entryText: 'Similar genres', args: () => { // Random mix with only nearest tracks
				tags.genre.weight = 0; tags.style.weight = 5; tags.mood.weight = 15; tags.key.weight = 10; tags.date.weight = 25; tags.bpm.weight = 5;
				tags.date.range = 15; tags.bpm.range = 25;
				tags.dynGenre.weight = 10; tags.dynGenre.range = 2;
				return { ...defArgs, minScoreFilter: 55, scoreFilter: 60, graphDistance: music_graph_descriptors.intra_supergenre * 3 / 2 };
			}
		},
		{ // Random mix with different genres but same mood from any date
			entryText: 'Similar mood', args: () => { // Random mix with only nearest tracks
				tags.genre.weight = 0; tags.style.weight = 5; tags.mood.weight = 15; tags.key.weight = 10; tags.date.weight = 0; tags.bpm.weight = 5;
				tags.date.range = 0; tags.bpm.range = 25;
				tags.dynGenre.weight = 5; tags.dynGenre.range = 4;
				return { ...defArgs, minScoreFilter: 45, scoreFilter: 50, graphDistance: music_graph_descriptors.intra_supergenre * 4 };
			}
		}
	].forEach((opt) => {
		presetMenu.newEntry({
			entryText: opt.entryText, func: () => searchByDistance(opt.args())
		});
	});
	presetMenu.newSeparator();
	{
		const menuName = presetMenu.newMenu('Other recipes');
		presetMenu.newEntry({ menuName, entryText: 'Can be edited at JSON files:', flags: MF_GRAYED });
		presetMenu.newSeparator(menuName);
		recipes.forEach((recipe) => {
			const entryText = recipe.name + '\t' + _p(recipe.method);
			presetMenu.newEntry({
				menuName, entryText, func: () => {
					searchByDistance({ properties, recipe: recipe.path, parent });
				}
			});
		});
		presetMenu.newSeparator(menuName);
		presetMenu.newEntry({
			menuName, entryText: 'Open recipes folder...', func: () => _explorer(sbd.recipesPath)
		});
		presetMenu.newSeparator(menuName);
		presetMenu.newEntry({ menuName, entryText: 'Readme...', func: () => showButtonReadme(sbd.readmes.recipes) });
	}
	return presetMenu;
}