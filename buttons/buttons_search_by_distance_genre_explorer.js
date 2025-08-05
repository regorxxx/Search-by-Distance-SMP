'use strict';
//01/08/25

/* global menu_panelProperties:readable */
include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable, MK_SHIFT:readable, VK_SHIFT:readable, VK_CONTROL:readable, globTags:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable, _gr:readable, _scale:readable, _gdiFont:readable, ThemedButton:readable, chars:readable */
include('..\\helpers\\helpers_xxx_input.js');
/* global Input:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable, overwriteProperties:readable */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable, isJSON:readable */
include('..\\helpers\\helpers_xxx_tags.js');
/* global _b:readable, _t:readable */
include('..\\helpers\\buttons_xxx_menu.js');
/* global settingsMenu:readable */
include('..\\helpers\\menu_xxx_extras.js');
/* global _createSubMenuEditEntries:readable */
include('..\\main\\search_by_distance\\search_by_distance.js'); // Load after buttons_xxx.js so properties are only set once
/* global sbd:readable */
include('helpers\\buttons_sbd_explorer_menu.js');
/* global graphInfoMenu:readable */
var version = sbd.version; // NOSONAR [shared on files]

try { window.DefineScript('Search by Distance Genre explorer Button', { author: 'regorxxx', version, features: { drag_n_drop: false } }); } catch (e) { /* May be loaded along other buttons */ } // eslint-disable-line no-unused-vars

var prefix = 'sbd'; // NOSONAR [shared on files]
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { // NOSONAR [shared on files]
	bIconMode: ['Icon-only mode', false, { func: isBoolean }, false],
	entries: ['Info entries', JSON.stringify([
		{
			name: 'By Genre',
			tf: [...new Set([globTags.genre, 'GENRE', 'ARTIST GENRE LAST.FM', 'ARTIST GENRE ALLMUSIC', 'ALBUM GENRE LAST.FM', 'ALBUM GENRE ALLMUSIC', 'ALBUM GENRE WIKIPEDIA', 'ARTIST GENRE WIKIPEDIA'])]
		},
		{
			name: 'By Style',
			tf: [...new Set([globTags.style, 'STYLE'])]
		},
	]), { func: isJSON }],
};
newButtonsProperties.entries.push(newButtonsProperties.entries[1]);
newButtonsProperties = { ...newButtonsProperties }; // Add default properties at the beginning to be sure they work
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0); // And retrieve
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Search by Distance Genre explorer': new ThemedButton({
		coordinates: { x: 0, y: 0, w: _gr.CalcTextWidth('Genre explorer', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22 },
		text: 'Genre explorer',
		func: function (mask) {
			if (mask === MK_SHIFT) {
				const menu = settingsMenu(
					this, true, ['buttons_search_by_distance_genre_explorer.js'],
					{
						entries: { bHide: true }
					},
					void (0),
					(menu) => {
						menu.newSeparator();
						_createSubMenuEditEntries(menu, void (0), {
							name: 'Genre explorer',
							list: JSON.parse(this.buttonsProperties.entries[1]),
							defaults: JSON.parse(this.buttonsProperties.entries[3]),
							input: () => {
								const entry = {
									tf: Input.json('array strings', '',
										'Enter tag names:\n\n' +
										'Ex:\n' + JSON.stringify([globTags.genre, 'ALBUM GENRE WIKIPEDIA'])
										, 'Genre explorer', JSON.stringify([globTags.genre, 'ALBUM GENRE WIKIPEDIA']), void (0), true
									),
								};
								if (!entry.tf) { return; }
								return entry;
							},
							bNumbered: true,
							onBtnUp: (entries) => {
								this.buttonsProperties.entries[1] = JSON.stringify(entries);
								overwriteProperties(this.buttonsProperties);
							}
						});
					}
				);
				menu.btn_up(this.currX, this.currY + this.currH);
			} else {
				graphInfoMenu.bind(this)().btn_up(this.currX, this.currY + this.currH);
			}
		},
		description: buttonTooltipSbdCustom,
		prefix, buttonsProperties: newButtonsProperties,
		icon: chars.sitemap,
		update: { scriptName: 'Search-by-Distance-SMP', version }
	})
});

// Helper
function buttonTooltipSbdCustom() {
	const properties = this.buttonsProperties;
	const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
	let info = 'Genre/style exploration within your library:\n';
	const sel = fb.GetFocusItem();
	if (sel) {
		const entries = JSON.parse(properties.entries[1]);
		let tfo = fb.TitleFormat(
			entries.map((entry) => {
				return '$puts(info,' + entry.tf.map((tag, i) => _b((i ? '\\, ' : '') + _t(tag))).join('') + ')' +
					entry.name + ':\t$ifgreater($len($get(info)),50,$cut($get(info),50)...,$get(info))';
			}).join('$crlf()')
		);
		info += tfo.EvalWithMetadb(sel);
	} else { info += 'No track selected'; }
	info += '\n-----------------------------------------------------';
	// Modifiers
	const bShift = utils.IsKeyPressed(VK_SHIFT);
	const bControl = utils.IsKeyPressed(VK_CONTROL);
	if (bShift && !bControl || bInfo) { info += '\n(Shift + L. Click for config)'; }
	return info;
}