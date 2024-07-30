'use strict';
//30/07/24

/* exported createButtonsMenu */

/* global buttonsPath:readable, buttonsBar:readable, barProperties:readable, buttonStates:readable, buttonSizeCheck:readable,moveButton:readable, */

include('..\\..\\helpers\\menu_xxx.js');
/* global _menu:readable */
include('..\\..\\helpers\\helpers_xxx.js');
/* global folders:readable, MF_GRAYED:readable, MF_STRING:readable, VK_CONTROL:readable, VK_SHIFT:readable, popup:readable, globSettings:readable, checkUpdate:readable */
include('..\\..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable, overwriteProperties:readable, getPropertiesPairs:readable, deleteProperties:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global require:readable, capitalizeAll:readable, round:readable, _p:readable, capitalize:readable, _b:readable */
include('..\\..\\helpers\\helpers_xxx_file.js');
/* global findRecursivefile:readable, _open:readable, _isFile:readable, utf8:readable, _save:readable, _jsonParseFileCheck:readable, _isFolder:readable, _createFolder:readable, WshShell:readable, _explorer:readable */
include('..\\..\\helpers\\helpers_xxx_UI.js');
/* global RGBA:readable, toRGB:readable */
include('..\\..\\helpers\\helpers_xxx_input.js');
/* global Input:readable */
include('..\\..\\helpers-external\\namethatcolor\\ntc.js');
/* global ntc:readable */
const Chroma = require('..\\helpers-external\\chroma.js\\chroma-ultra-light.min'); // Relative to helpers folder

function createButtonsMenu(name) {
	const menu = new _menu();
	menu.clear(true); // Reset on every call
	const files = findRecursivefile('*.js', [folders.xxx + 'buttons']).filter((path) => { return !path.split('\\').pop().startsWith('_'); });
	const readmeList = _isFile(folders.xxx + 'helpers\\readme\\buttons_list.json') ? _jsonParseFileCheck(folders.xxx + 'helpers\\readme\\buttons_list.json', 'Readme list', window.Name, utf8) : null;
	// Header
	menu.newEntry({ entryText: 'Toolbar configuration:', func: null, flags: MF_GRAYED });
	menu.newEntry({ entryText: 'sep' });
	if (!_isFolder(folders.data)) { _createFolder(folders.data); }
	const notAllowedDup = new Set(['buttons_playlist_tools.js', 'buttons_playlist_history.js', 'buttons_playlist_tools_macros.js', 'buttons_playlist_tools_pool.js', 'buttons_device_priority.js', 'buttons_tags_save_tags.js', 'buttons_tags_fingerprint_chromaprint.js', 'buttons_tags_fingerprint_fooid.js', 'buttons_search_fingerprint_chromaprint.js', 'buttons_search_fingerprint_chromaprint_fast.js', 'buttons_search_fingerprint_fooid.js', 'buttons_fingerprint_tools.js', 'buttons_listenbrainz_tools.js', 'buttons_device_selector.js', 'buttons_playlist_history.js', 'buttons_lastfm_tools.js', 'buttons_utils_autobackup.js']);
	const requirePlaylistTools = new Set(['buttons_playlist_tools_macros.js', 'buttons_playlist_tools_macro_custom.js', 'buttons_playlist_tools_pool.js', 'buttons_playlist_tools_submenu_custom.js']);
	const subCategories = ['_fingerprint_', '_listenbrainz_', '_search_by_distance', '_search_', '_tags_', '_playlist_tools', '_playlist_', '_stats_', '_device_', '_lastfm_', '_utils_', '_others_']; // By order of priority if it matches multiple strings
	const buttonsPathNames = new Set(buttonsPath.map((path) => { return path.split('\\').pop(); }));
	function isAllowed(fileName) { return !notAllowedDup.has(fileName) || !buttonsPathNames.has(fileName); }
	function isAllowedV2(fileName) { return !requirePlaylistTools.has(fileName) || buttonsPathNames.has('buttons_playlist_tools.js'); }
	function parseSubMenuFolder(s) {
		return (s === '_playlist_tools'
			? 'Playlist Tools'
			: s === '_search_by_distance'
				? 'Search by Distance'
				: s === '_device_'
					? 'Output Devices'
					: s === '_lastfm_'
						? 'Last.fm'
						: capitalizeAll(s.replace(/_/g, '').trim())
		);
	}
	{
		const subMenu = menu.newMenu('Add buttons');
		files.forEach((path) => {
			const fileName = path.split('\\').pop();
			let entryText = path.split('\\').pop() + (isAllowed(fileName) ? (isAllowedV2(fileName) ? '' : '\t(Playlist Tools)') : '\t(1 allowed)');
			let subMenuFolder = subCategories.find((folder) => { return entryText.indexOf(folder) !== -1; }) || 'Others';
			if (subMenuFolder && subMenuFolder.length) {
				subMenuFolder = parseSubMenuFolder(subMenuFolder);
				subMenuFolder = menu.findOrNewMenu(subMenuFolder, subMenu);
			}
			entryText = entryText.replace('buttons_', '').replace('others_', '');
			menu.newEntry({
				menuName: subMenuFolder, entryText, func: () => {
					buttonsPath.push(path);
					const fileNames = buttonsPath.map((path) => { return path.split('\\').pop(); });
					_save(folders.data + name + '.json', JSON.stringify(fileNames, null, '\t'));
					if (readmeList) {
						const readmeFile = Object.hasOwn(readmeList, fileName) ? readmeList[fileName] : '';
						const readme = readmeFile.length ? _open(folders.xxx + 'helpers\\readme\\' + readmeFile, utf8) : '';
						if (readme.length) { fb.ShowPopupMessage(readme, readmeFile); }
					}
					window.Reload();
				}, flags: isAllowed(fileName) && isAllowedV2(fileName) ? MF_STRING : MF_GRAYED
			});
		});
	}
	{
		const subMenu = menu.newMenu('Remove buttons');
		buttonsPath.forEach((path, idx) => {
			menu.newEntry({
				menuName: subMenu, entryText: path.split('\\').pop() + '\t(' + (idx + 1) + ')', func: () => {
					// Remove button
					buttonsPath.splice(idx, 1);
					// Remove properties
					// Since properties have a prefix according to their loading order when there are multiple instances of the same
					// script, removing a button when there a other 'clones' means the other buttons will get their properties names
					// shifted by one. They need to be adjusted or buttons at greater indexes will inherit properties from lower ones!
					const properties = buttonsBar.list[idx];
					if (properties) { deleteProperties(properties); } // Delete current position
					// Retrieves Id
					const keys = properties ? Object.keys(properties) : [];
					if (keys.length) {
						const prefix = properties[Object.keys(properties)[0]][0].split('_')[0];
						const currentId = prefix.slice(0, prefix.length - 1);
						let currentIdNumber = Number(prefix[prefix.length - 1]);
						buttonsBar.list.splice(idx, 1); // Deletes from the list
						// Rewrite other Ids starting at the current number
						buttonsBar.list.forEach((oldProperties, newIdx) => {
							if (newIdx >= idx) {
								const oldKeys = oldProperties ? Object.keys(oldProperties) : [];
								if (oldKeys.length) {
									const oldPrefix = oldProperties[oldKeys[0]][0].split('_')[0];
									const oldId = oldPrefix.slice(0, oldPrefix.length - 1);
									if (oldId === currentId) {
										const backup = getPropertiesPairs(oldProperties, '', 0, false); // First refresh from panel
										deleteProperties(oldProperties); // Delete it at panel
										for (const key in backup) { // Update Id
											if (!Object.hasOwn(backup, key)) { continue; }
											backup[key][0] = backup[key][0].replace(oldPrefix, oldId + currentIdNumber);
										}
										setProperties(backup, '', 0, false, true); // And restore at new position
										currentIdNumber++;
									}
								}
							}
						});
					}
					// Save and reload
					const fileNames = buttonsPath.map((path) => { return path.split('\\').pop(); });
					_save(folders.data + name + '.json', JSON.stringify(fileNames, null, '\t'));
					window.Reload();
				}
			});
		});
	}
	{
		const subMenu = menu.newMenu('Change buttons position');
		menu.newEntry({ menuName: subMenu, entryText: 'Can also be moved pressing R. Click:', flags: MF_GRAYED });
		menu.newEntry({ menuName: subMenu, entryText: 'sep' });
		buttonsPath.forEach((path, idx) => {
			menu.newEntry({
				menuName: subMenu, entryText: path.split('\\').pop() + '\t(' + (idx + 1) + ')', func: () => {
					const input = Input.number('int positive', idx + 1, 'Enter new position:\n(1 - ' + buttonsPath.length + ')', 'Buttons bar', buttonsPath.length, [n => n > 0 && n <= buttonsPath.length]);
					if (input === null) { return; }
					moveButton(buttonsBar.listKeys[idx][0], buttonsBar.listKeys[input - 1][0]);
				}, flags: buttonsPath.length > 1 ? MF_STRING : MF_GRAYED
			});
		});
	}
	menu.newEntry({ entryText: 'sep' });
	menu.newEntry({
		entryText: 'Restore all buttons', func: () => {
			const answer = WshShell.Popup('This will maintain the current layout but delete any customized setting on all buttons. Are you sure?', 0, 'Toolbar', popup.question + popup.yes_no);
			if (answer === popup.yes) {
				// Remove all properties and reload
				buttonsBar.list.forEach((properties) => { deleteProperties(properties); });
				window.Reload();
			}
		}
	});
	menu.newEntry({ entryText: 'sep' });
	{
		const menuName = menu.newMenu('Colors');
		const getColorName = (val) => {
			return (val !== -1 ? (ntc.name(Chroma(val).hex())[1] || '').toString() || 'unknown' : '-none-');
		}; // From statistics
		menu.newEntry({ menuName, entryText: 'UI colors: (Ctrl + Click to reset)', flags: MF_GRAYED });
		menu.newEntry({ menuName, entryText: 'sep' });
		menu.newEntry({
			menuName, entryText: 'Set custom bar color...' + '\t[' + getColorName(barProperties.toolbarColor[1]) + ']', func: () => {
				if (utils.IsKeyPressed(VK_CONTROL)) {
					buttonsBar.config.bToolbar = false; // buttons_xxx.js
					barProperties.toolbarColor[1] = buttonsBar.config.toolbarColor = barProperties.toolbarColor[3];
				} else {
					barProperties.toolbarColor[1] = utils.ColourPicker(window.ID, barProperties.toolbarColor[1]);
					buttonsBar.config.bToolbar = true; // buttons_xxx.js
					buttonsBar.config.toolbarColor = barProperties.toolbarColor[1]; // buttons_xxx.js
				}
				overwriteProperties(barProperties);
				window.Repaint();
			}
		});
		menu.newEntry({
			menuName, entryText: 'Set custom button color...' + '\t[' + getColorName(barProperties.buttonColor[1]) + ']', func: () => {
				if (utils.IsKeyPressed(VK_CONTROL)) {
					barProperties.buttonColor[1] = buttonsBar.config.buttonColor = buttonsBar.config.default.buttonColor;
				} else {
					barProperties.buttonColor[1] = utils.ColourPicker(window.ID, barProperties.buttonColor[1]);
					buttonsBar.config.buttonColor = barProperties.buttonColor[1]; // buttons_xxx.js
				}
				overwriteProperties(barProperties);
				window.Repaint();
			}, flags: !barProperties.bBgButtons[1] ? MF_STRING : MF_GRAYED
		});
		menu.newEntry({
			menuName, entryText: 'Set custom text color...' + '\t[' + getColorName(barProperties.textColor[1]) + ']', func: () => {
				if (utils.IsKeyPressed(VK_CONTROL)) {
					barProperties.textColor[1] = buttonsBar.config.textColor = buttonsBar.config.default.buttonColor;
				} else {
					barProperties.textColor[1] = utils.ColourPicker(window.ID, barProperties.textColor[1]);
					buttonsBar.config.textColor = barProperties.textColor[1]; // buttons_xxx.js
				}
				overwriteProperties(barProperties);
				window.Repaint();
			}
		});
		menu.newEntry({ menuName, entryText: 'sep' });
		menu.newEntry({
			menuName, entryText: 'Set custom hover color...' + '\t[' + getColorName(barProperties.hoverColor[1]) + ']', func: () => {
				if (utils.IsKeyPressed(VK_CONTROL)) {
					barProperties.hoverColor[1] = buttonsBar.config.hoverColor = buttonsBar.config.default.hoverColor;
				} else if (utils.IsKeyPressed(VK_SHIFT)) {
					barProperties.hoverColor[1] = buttonsBar.config.hoverColor = -1;
				} else {
					barProperties.hoverColor[1] = utils.ColourPicker(window.ID, barProperties.hoverColor[1]);
					buttonsBar.config.hoverColor = barProperties.hoverColor[1]; // buttons_xxx.js
				}
				overwriteProperties(barProperties);
				window.Repaint();
			}, flags: !barProperties.bBgButtons[1] && !barProperties.bDynHoverColor[1] ? MF_STRING : MF_GRAYED
		});
		menu.newEntry({
			menuName, entryText: 'Use dynamic hover color', func: () => {
				buttonsBar.config.bDynHoverColor = barProperties.bDynHoverColor[1] = !barProperties.bDynHoverColor[1]; // buttons_xxx.js
				overwriteProperties(barProperties);
				window.Repaint();
			}, flags: !barProperties.bBgButtons[1] ? MF_STRING : MF_GRAYED
		});
		menu.newCheckMenuLast(() => barProperties.bDynHoverColor[1]);
		menu.newEntry({
			menuName, entryText: 'Use hover color gradient', func: () => {
				buttonsBar.config.bHoverGrad = barProperties.bHoverGrad[1] = !barProperties.bHoverGrad[1]; // buttons_xxx.js
				overwriteProperties(barProperties);
				window.Repaint();
			}, flags: !barProperties.bBgButtons[1] && (barProperties.hoverColor[1] !== -1 || barProperties.bDynHoverColor[1]) ? MF_STRING : MF_GRAYED
		});
		menu.newCheckMenuLast(() => barProperties.bHoverGrad[1]);
		menu.newEntry({
			menuName, entryText: 'Use buttons\' borders on hover', func: () => {
				buttonsBar.config.bBorders = barProperties.bBorders[1] = !barProperties.bBorders[1];
				overwriteProperties(barProperties);
				window.Repaint();
			}, flags: !barProperties.bBgButtons[1] ? MF_STRING : MF_GRAYED
		});
		menu.newCheckMenuLast(() => barProperties.bBorders[1]);
		menu.newEntry({ menuName, entryText: 'sep' });
		menu.newEntry({
			menuName, entryText: 'Set active button color...' + '\t[' + getColorName(barProperties.activeColor[1]) + ']', func: () => {
				if (utils.IsKeyPressed(VK_CONTROL)) {
					barProperties.activeColor[1] = buttonsBar.config.activeColor = buttonsBar.config.default.activeColor;
				} else {
					barProperties.activeColor[1] = utils.ColourPicker(window.ID, barProperties.activeColor[1]);
					buttonsBar.config.activeColor = barProperties.activeColor[1]; // buttons_xxx.js
				}
				overwriteProperties(barProperties);
				window.Repaint();
			}
		});
		menu.newEntry({
			menuName, entryText: 'Set animation button colors...', func: () => {
				if (utils.IsKeyPressed(VK_CONTROL)) {
					barProperties.animationColors[1] = JSON.stringify(buttonsBar.config.default.animationColors);
					buttonsBar.config.animationColors = buttonsBar.config.default.animationColors;
				} else {
					let colors = JSON.parse(barProperties.animationColors[1]);
					colors = [RGBA(...toRGB(utils.ColourPicker(window.ID, colors[0])), 50), RGBA(...toRGB(utils.ColourPicker(window.ID, colors[1])), 30)];
					barProperties.animationColors[1] = JSON.stringify(colors);
					buttonsBar.config.animationColors = colors; // buttons_xxx.js
				}
				overwriteProperties(barProperties);
				window.Repaint(); // Note existing animations will use the previous colors, since the (default) colors are applied per animation once before firing
			}
		});
		menu.newEntry({ menuName, entryText: 'sep' });
		menu.newEntry({
			menuName, entryText: 'Set transparency...' + '\t[' + buttonsBar.config.toolbarTransparency + ']', func: () => {
				if (utils.IsKeyPressed(VK_CONTROL)) {
					barProperties.transparency[1] = buttonsBar.config.toolbarTransparency = buttonsBar.config.default.toolbarTransparency;
				} else {
					const input = Input.number('int positive', buttonsBar.config.toolbarTransparency, 'Enter value:\n0 is transparent, 100 is opaque.\n(0 to 100)', 'Buttons bar', 50, [n => n <= 100]);
					if (input === null) { return; }
					barProperties.transparency[1] = buttonsBar.config.toolbarTransparency = input;
				}
				overwriteProperties(barProperties);
				window.Repaint();
			}, flags: !barProperties.bBgButtons[1] ? MF_STRING : MF_GRAYED
		});
		menu.newEntry({ menuName, entryText: 'sep' });
		menu.newEntry({
			menuName, entryText: 'Use themed buttons', func: () => {
				barProperties.bBgButtons[1] = !barProperties.bBgButtons[1];
				if (buttonsBar.useThemeManager) {
					let gTheme;
					try { gTheme = window.CreateThemeManager('Button'); } catch (e) { gTheme = null; }
					if (!gTheme) {
						buttonsBar.config.bUseThemeManager = false;
						console.popup('Buttons: window.CreateThemeManager(\'Button\') failed, using non-themed buttons', 'Toolbar');
					}
				}
				overwriteProperties(barProperties);
				buttonsBar.config.partAndStateID = barProperties.bBgButtons[1] ? 1 : 6; // buttons_xxx.js
				window.Repaint();
			}
		});
		menu.newCheckMenuLast(() => barProperties.bBgButtons[1]);
		menu.newEntry({ menuName, entryText: 'sep' });
		menu.newEntry({
			menuName, entryText: 'Reset all configuration...', func: () => {
				barProperties.toolbarColor[1] = -1;
				barProperties.buttonColor[1] = -1;
				buttonsBar.config.toolbarColor = buttonsBar.config.default.toolbarColor;
				buttonsBar.config.buttonColor = buttonsBar.config.default.buttonColor;
				barProperties.transparency[1] = buttonsBar.config.toolbarTransparency = buttonsBar.config.default.toolbarTransparency;
				barProperties.textColor[1] = buttonsBar.config.textColor = buttonsBar.config.default.textColor;
				barProperties.activeColor[1] = buttonsBar.config.activeColor = buttonsBar.config.default.activeColor;
				barProperties.animationColors[1] = JSON.stringify(buttonsBar.config.default.animationColors);
				buttonsBar.config.animationColors = buttonsBar.config.default.animationColors;
				buttonsBar.config.bToolbar = buttonsBar.config.default.bToolbar;
				overwriteProperties(barProperties);
				window.Repaint();
			}
		});
	}
	{
		const menuName = menu.newMenu('Size and placement');
		const orientation = barProperties.orientation[1].toLowerCase();
		menu.newEntry({ menuName, entryText: 'UI placement: (Ctrl + Click to reset)', flags: MF_GRAYED });
		menu.newEntry({ menuName, entryText: 'sep' });
		menu.newEntry({
			menuName, entryText: 'Set scale...' + '\t[' + round(buttonsBar.config.scale, 2) + ']', func: () => {
				let input;
				if (utils.IsKeyPressed(VK_CONTROL)) {
					input = buttonsBar.config.default.scale;
				} else {
					input = Input.number('real positive', buttonsBar.config.scale, 'Enter value:\n(real number > 0)', 'Buttons bar', 0.8, [n => n > 0 && n < Infinity]);
					if (input === null) { return; }
				}
				barProperties.scale[1] = buttonsBar.config.scale = input; // buttons_xxx.js
				const bApplyAll = WshShell.Popup('Also apply to text and icons?', 0, 'Buttons bar', popup.question + popup.yes_no) === popup.yes;
				if (bApplyAll) {
					barProperties.iconScale[1] = buttonsBar.config.iconScale = buttonsBar.config.scale;
					barProperties.textScale[1] = buttonsBar.config.textScale = buttonsBar.config.scale;
				}
				overwriteProperties(barProperties);
				window.Reload();
			}
		});
		menu.newEntry({
			menuName, entryText: 'Set text scale...' + '\t[' + round(buttonsBar.config.textScale, 2) + ']', func: () => {
				let input;
				if (utils.IsKeyPressed(VK_CONTROL)) {
					input = buttonsBar.config.default.textScale;
				} else {
					input = Input.number('real positive', buttonsBar.config.textScale, 'Enter value:\n(real number > 0)', 'Buttons bar', 0.8, [n => n > 0 && n < Infinity]);
					if (input === null) { return; }
				}
				for (let key in buttonsBar.buttons) {
					if (!Object.hasOwn(buttonsBar.buttons, key)) { continue; }
					buttonsBar.buttons[key].changeTextScale(input);
				}
				barProperties.textScale[1] = buttonsBar.config.textScale = input;
				overwriteProperties(barProperties);
				window.Repaint();
				buttonSizeCheck();
			}
			, flags: buttonsBar.config.bIconMode ? MF_GRAYED : MF_STRING
		});
		menu.newEntry({
			menuName, entryText: 'Set icon scale...' + '\t[' + round(buttonsBar.config.iconScale, 2) + ']', func: () => {
				let input;
				if (utils.IsKeyPressed(VK_CONTROL)) {
					input = buttonsBar.config.default.iconScale;
				} else {
					input = Input.number('real positive', buttonsBar.config.iconScale, 'Enter value:\n(real number > 0)', 'Buttons bar', 0.8, [n => n > 0 && n < Infinity]);
					if (input === null) { return; }
				}
				barProperties.iconScale[1] = buttonsBar.config.iconScale = input;
				overwriteProperties(barProperties);
				window.Reload();
			}
		});
		menu.newEntry({ menuName, entryText: 'sep' });
		menu.newEntry({
			menuName, entryText: 'Set button offset...' + '\t[' + Object.values(buttonsBar.config.offset.button) + ']', func: () => {
				let input;
				if (utils.IsKeyPressed(VK_CONTROL)) {
					input = buttonsBar.config.default.offset.button;
				} else {
					input = Input.json('object', buttonsBar.config.offset.button, 'Enter values:\n(integer finite numbers)', 'Buttons bar', '{"x": 4, "y" : 6}', [v => Number.isFinite(v) && Number.isInteger(v)]);
					if (input === null) { return; }
				}
				buttonsBar.config.offset.button = input; // buttons_xxx.js
				barProperties.offset[1] = JSON.stringify(buttonsBar.config.offset);
				overwriteProperties(barProperties);
				window.Repaint();
			}
		});
		menu.newEntry({
			menuName, entryText: 'Set text offset...' + '\t[' + Object.values(buttonsBar.config.offset.text) + ']', func: () => {
				let input;
				if (utils.IsKeyPressed(VK_CONTROL)) {
					input = buttonsBar.config.default.offset.text;
				} else {
					input = Input.json('object', buttonsBar.config.offset.text, 'Enter values:\n(integer finite numbers)', 'Buttons bar', '{"x": 4, "y" : 6}', [v => Number.isFinite(v) && Number.isInteger(v)]);
					if (input === null) { return; }
				}
				buttonsBar.config.offset.text = input; // buttons_xxx.js
				barProperties.offset[1] = JSON.stringify(buttonsBar.config.offset);
				overwriteProperties(barProperties);
				window.Repaint();
			}
			, flags: buttonsBar.config.bIconMode ? MF_GRAYED : MF_STRING
		});
		menu.newEntry({
			menuName, entryText: 'Set icon offset...' + '\t[' + Object.values(buttonsBar.config.offset.icon) + ']', func: () => {
				let input;
				if (utils.IsKeyPressed(VK_CONTROL)) {
					input = buttonsBar.config.default.offset.icon;
				} else {
					input = Input.json('object', buttonsBar.config.offset.icon, 'Enter values:\n(integer finite numbers)', 'Buttons bar', '{"x": 4, "y" : 6}', [v => Number.isFinite(v) && Number.isInteger(v)]);
					if (input === null) { return; }
				}
				buttonsBar.config.offset.icon = input; // buttons_xxx.js
				barProperties.offset[1] = JSON.stringify(buttonsBar.config.offset);
				overwriteProperties(barProperties);
				window.Repaint();
			}
		});
		menu.newEntry({ menuName, entryText: 'sep' });
		{
			const currPos = buttonsBar.config.bIconMode
				? buttonsBar.config.textPosition === 'top'
					? 'bottom'
					: buttonsBar.config.textPosition.replace('bottom', 'top').replace(/left|right/, 'center')
				: buttonsBar.config.textPosition;
			const subMenuName = menu.newMenu(
				buttonsBar.config.bIconMode
					? 'Icon position...' + '\t' + _b(capitalize(currPos))
					: 'Text position...' + '\t' + _b(capitalize(currPos))
				, menuName);
			const options = buttonsBar.config.bIconMode ? ['top', 'bottom', 'center'] : ['top', 'bottom', 'left', 'right'];
			options.forEach((o) => {
				const pos = buttonsBar.config.bIconMode
					? o === 'top' ? 'bottom' : o.replace('bottom', 'top')
					: o;
				menu.newEntry({
					menuName: subMenuName, entryText: capitalize(pos), func: () => {
						buttonsBar.config.textPosition = barProperties.textPosition[1] = o.replace('center', 'right');
						overwriteProperties(barProperties);
						window.Reload();
					}
				});
			});
			menu.newCheckMenuLast(() => {
				return options.indexOf(
					buttonsBar.config.bIconMode
						? buttonsBar.config.textPosition.replace(/left|right/, 'center')
						: buttonsBar.config.textPosition
				);
			}, options.length);
		}
		menu.newEntry({ menuName, entryText: 'sep' });
		menu.newEntry({
			menuName, entryText: 'Reflow buttons according to ' + (orientation === 'x' ? 'width' : 'height'), func: () => {
				buttonsBar.config.bReflow = barProperties.bReflow[1] = !barProperties.bReflow[1];
				overwriteProperties(barProperties);
				window.Repaint();
			}
		});
		menu.newCheckMenuLast(() => barProperties.bReflow[1]);
		menu.newEntry({
			menuName, entryText: 'Normalize buttons ' + (buttonsBar.config.bReflow ? 'size' : (orientation === 'x' ? 'height' : 'width')), func: () => {
				buttonsBar.config.bAlignSize = barProperties.bAlignSize[1] = !barProperties.bAlignSize[1];
				overwriteProperties(barProperties);
				window.Repaint();
			}, flags: barProperties.bFullSize[1] ? MF_GRAYED : MF_STRING
		});
		menu.newCheckMenuLast(() => barProperties.bAlignSize[1]);
		menu.newEntry({
			menuName, entryText: 'Full size buttons', func: () => {
				buttonsBar.config.bFullSize = barProperties.bFullSize[1] = !barProperties.bFullSize[1];
				overwriteProperties(barProperties);
				if (!buttonsBar.config.bFullSize) {
					for (let key in buttonsBar.buttons) {
						buttonsBar.buttons[key].currH = buttonsBar.buttons[key].h;
					}
				}
				window.Repaint();
			}
		});
		menu.newCheckMenuLast(() => barProperties.bFullSize[1]);
	}
	{
		const menuName = menu.newMenu('Other UI settings');
		menu.newEntry({
			menuName, entryText: 'Show properties IDs on tooltip', func: () => {
				buttonsBar.config.bShowID = barProperties.bShowId[1] = !barProperties.bShowId[1];
				overwriteProperties(barProperties);
			}
		});
		menu.newCheckMenuLast(() => barProperties.bShowId[1]);
		menu.newEntry({ menuName, entryText: 'sep' });
		const orientation = barProperties.orientation[1].toLowerCase();
		menu.newEntry({
			menuName, entryText: 'Toolbar orientation \t[' + orientation.toUpperCase() + ']', func: () => {
				buttonsBar.config.orientation = barProperties.orientation[1] = orientation === 'x' ? 'y' : 'x';
				overwriteProperties(barProperties);
				window.Reload();
			}
		});
		{
			const subMenu = menu.newMenu('Icons-only mode', menuName);
			menu.newEntry({
				menuName: subMenu, entryText: 'Force for all buttons', func: () => {
					buttonsBar.config.bIconMode = barProperties.bIconMode[1] = !barProperties.bIconMode[1];
					overwriteProperties(barProperties);
					// When normalizing size, sizers are dynamically calculated on paint... so need to force it
					if (buttonsBar.config.bAlignSize) {
						buttonsBar.config.bAlignSize = false; // buttons_xxx.js
						window.Repaint(true);
						buttonsBar.config.bAlignSize = true; // buttons_xxx.js
					}
					window.Repaint(true);
				}
			});
			menu.newCheckMenuLast(() => buttonsBar.config.bIconMode);
			menu.newEntry({
				menuName: subMenu, entryText: 'Expand on mouse over' + (buttonsBar.config.orientation === 'y' ? '\t[Y]' : ''), func: () => {
					buttonsBar.config.bIconModeExpand = barProperties.bIconModeExpand[1] = !barProperties.bIconModeExpand[1];
					overwriteProperties(barProperties);
					window.Repaint();
				}, flags: buttonsBar.config.orientation === 'x' ? MF_STRING : MF_GRAYED
			});
			menu.newCheckMenuLast(() => buttonsBar.config.bIconModeExpand);
			menu.newEntry({ menuName: subMenu, entryText: 'sep' });
			buttonsBar.listKeys.forEach((arrKeys, idx) => {
				if (arrKeys.some((key) => Object.hasOwn(buttonsBar.buttons[key], 'bIconMode'))) {
					const bHeadless = arrKeys.every((key) => buttonsBar.buttons[key].state === buttonStates.hide);
					const entryText = buttonsPath[idx].split('\\').pop() + '\t' + (bHeadless ? ' [headless] ' : '') + _p(idx + 1);
					menu.newEntry({
						menuName: subMenu, entryText, func: () => {
							let cache;
							for (let key of arrKeys) {
								const button = buttonsBar.buttons[key];
								const properties = button.buttonsProperties;
								if (Object.hasOwn(properties, 'bIconMode')) {
									// A single button file may have multiple buttons sharing the same properties or not
									if (JSON.stringify(cache) !== JSON.stringify(properties)) {
										properties.bIconMode[1] = !properties.bIconMode[1];
										overwriteProperties(properties);
										cache = properties;
									}
									button.bIconMode = properties.bIconMode[1];
								}
							}
							window.Repaint();
						}, flags: buttonsBar.config.bIconMode || bHeadless ? MF_GRAYED : MF_STRING
					});
					menu.newCheckMenuLast(() => arrKeys.some((key) => buttonsBar.buttons[key].bIconMode));
				}
			});
			menu.newEntry({ menuName: subMenu, entryText: 'sep' });
			menu.newEntry({
				menuName: subMenu, entryText: 'Restore every button', func: () => {
					buttonsBar.listKeys.forEach((arrKeys) => {
						if (arrKeys.some((key) => Object.hasOwn(buttonsBar.buttons[key], 'bIconMode'))) {
							for (let key of arrKeys) {
								const button = buttonsBar.buttons[key];
								const properties = button.buttonsProperties;
								if (Object.hasOwn(properties, 'bIconMode')) {
									properties.bIconMode[1] = false;
									overwriteProperties(properties);
									button.bIconMode = false;
								}
							}
						}
					});
					window.Repaint();
				}, flags: buttonsBar.config.bIconMode ? MF_GRAYED : MF_STRING
			});
		}
		menu.newEntry({ menuName, entryText: 'sep' });
		{
			const keys = buttonsBar.listKeys.map((arr) => arr.filter((key) => Object.hasOwn(buttonsBar.buttons[key].buttonsProperties, 'bHeadlessMode'))).flat(Infinity).filter(Boolean);
			const checkHeadless = () => keys.every((key) => !Object.hasOwn(buttonsBar.buttons[key], 'bHeadlessMode') || buttonsBar.buttons[key].isHeadlessMode());
			const subMenu = menu.newMenu('Headless mode' + (keys.length ? '' : '\t[none]'), menuName, keys.length ? MF_STRING : MF_GRAYED);
			menu.newEntry({
				menuName: subMenu, entryText: 'Enable for all buttons', func: () => {
					buttonsBar.listKeys.forEach((arrKeys) => {
						if (arrKeys.some((key) => Object.hasOwn(buttonsBar.buttons[key].buttonsProperties, 'bHeadlessMode'))) {
							for (let key of arrKeys) {
								const button = buttonsBar.buttons[key];
								const properties = button.buttonsProperties;
								if (Object.hasOwn(properties, 'bHeadlessMode')) {
									button.bHeadlessMode = properties.bHeadlessMode[1] = true;
									overwriteProperties(properties);
								}
							}
						}
					});
					window.Repaint(true);
				}, flags: checkHeadless() ? MF_GRAYED : MF_STRING
			});
			menu.newCheckMenuLast(checkHeadless);
			menu.newEntry({ menuName: subMenu, entryText: 'sep' });
			buttonsBar.listKeys.forEach((arrKeys, idx) => {
				if (arrKeys.some((key) => Object.hasOwn(buttonsBar.buttons[key].buttonsProperties, 'bHeadlessMode'))) {
					const entryText = buttonsPath[idx].split('\\').pop() + '\t(' + (idx + 1) + ')';
					menu.newEntry({
						menuName: subMenu, entryText, func: () => {
							let cache;
							for (let key of arrKeys) {
								const button = buttonsBar.buttons[key];
								const properties = button.buttonsProperties;
								if (Object.hasOwn(properties, 'bHeadlessMode')) {
									// A single button file may have multiple buttons sharing the same properties or not
									if (JSON.stringify(cache) !== JSON.stringify(properties)) {
										properties.bHeadlessMode[1] = !properties.bHeadlessMode[1];
										overwriteProperties(properties);
										cache = properties;
									}
									button.bHeadlessMode = properties.bHeadlessMode[1];
								}
							}
							window.Repaint(true);
						}, flags: buttonsBar.config.bIconMode ? MF_GRAYED : MF_STRING
					});
					menu.newCheckMenuLast(() => { return arrKeys.every((key) => !Object.hasOwn(buttonsBar.buttons[key], 'bHeadlessMode') || buttonsBar.buttons[key].isHeadlessMode()); });
				}
			});
			menu.newEntry({ menuName: subMenu, entryText: 'sep' });
			menu.newEntry({
				menuName: subMenu, entryText: 'Restore every button', func: () => {
					buttonsBar.listKeys.forEach((arrKeys) => {
						if (arrKeys.some((key) => Object.hasOwn(buttonsBar.buttons[key].buttonsProperties, 'bHeadlessMode'))) {
							for (let key of arrKeys) {
								const button = buttonsBar.buttons[key];
								const properties = button.buttonsProperties;
								if (Object.hasOwn(properties, 'bHeadlessMode')) {
									button.bHeadlessMode = properties.bHeadlessMode[1] = false;
									overwriteProperties(properties);
								}
							}
						}
					});
					window.Repaint(true);
				}, flags: buttonsBar.config.bIconMode ? MF_GRAYED : MF_STRING
			});
		}
	}
	menu.newEntry({ entryText: 'sep' });
	{
		const subMenu = menu.newMenu('Other settings');
		menu.newEntry({
			menuName: subMenu, entryText: 'Asynchronous loading (startup)', func: () => {
				barProperties.bLoadAsync[1] = !barProperties.bLoadAsync[1];
				overwriteProperties(barProperties);
			}
		});
		menu.newCheckMenuLast(() => barProperties.bLoadAsync[1]);
	}
	menu.newEntry({ entryText: 'sep' });
	{
		const subMenu = menu.newMenu('Updates');
		menu.newEntry({
			menuName: subMenu, entryText: 'Automatically check for updates', func: () => {
				barProperties.bAutoUpdateCheck[1] = !barProperties.bAutoUpdateCheck[1];
				overwriteProperties(barProperties);
				if (barProperties.bAutoUpdateCheck[1]) {
					if (typeof checkUpdate === 'undefined') { include('helpers\\helpers_xxx_web_update.js'); }
					const args = buttonsBar.getUpdateList().map((btn) => {
						return {
							...(btn.scriptName ? { scriptName: btn.scriptName } : {}),
							...(btn.repository ? { repository: btn.repository } : {}),
							...(btn.version ? { version: btn.version } : {}), // If there is no version, it's retrieved from the toolbar version
							bDownload: globSettings.bAutoUpdateDownload, bOpenWeb: globSettings.bAutoUpdateOpenWeb, bDisableWarning: false
						};
					});
					Promise.serial(args, checkUpdate);
				}
			}
		});
		menu.newCheckMenuLast(() => barProperties.bAutoUpdateCheck[1]);
		menu.newEntry({ menuName: subMenu, entryText: 'sep' });
		menu.newEntry({
			menuName: subMenu, entryText: 'Check for updates...', func: () => {
				if (typeof checkUpdate === 'undefined') { include('helpers\\helpers_xxx_web_update.js'); }
				const args = buttonsBar.getUpdateList().map((btn) => {
					return {
						...(btn.scriptName ? { scriptName: btn.scriptName } : {}),
						...(btn.repository ? { repository: btn.repository } : {}),
						...(btn.version ? { version: btn.version } : {}), // If there is no version, it's retrieved from the toolbar version
						bDownload: globSettings.bAutoUpdateDownload, bOpenWeb: globSettings.bAutoUpdateOpenWeb, bDisableWarning: false
					};
				});
				Promise.serial(args, checkUpdate).then((results) => {
					if (results.every((result) => !result)) { fb.ShowPopupMessage('No updates found.', window.Name); }
				});
			}
		});
	}
	menu.newEntry({ entryText: 'sep' });
	{
		const subMenu = menu.newMenu('Readmes');
		menu.newEntry({
			menuName: subMenu, entryText: 'Toolbar', func: () => {
				const readmePath = folders.xxx + 'helpers\\readme\\toolbar.txt';
				const readme = _open(readmePath, utf8);
				if (readme.length) { fb.ShowPopupMessage(readme, 'Toolbar'); }
			}
		});
		if (readmeList) {
			// Add additional readmes
			readmeList['Global settings'] = 'global_settings.txt';
			readmeList['Tagging requisites'] = 'tags_structure.txt';
			readmeList['Tags sources'] = 'tags_sources.txt';
			readmeList['Other tags notes'] = 'tags_notes.txt';
			readmeList['Global tag remapping'] = 'tags_global_remap.txt';
			if (Object.hasOwn(readmeList, 'buttons_search_quicksearch.js')) { readmeList['Dynamic queries'] = 'dynamic_query.txt'; }
			// Process
			menu.newEntry({ menuName: subMenu, entryText: 'sep' });
			Object.keys(readmeList).forEach((fileName) => {
				const readmeFile = Object.hasOwn(readmeList, fileName) ? readmeList[fileName] : '';
				if (!readmeFile.length || !_isFile(folders.xxx + 'helpers\\readme\\' + readmeFile)) { return; }
				let subMenuFolder = subCategories.find((folder) => { return fileName.indexOf(folder) !== -1; }) || 'Others';
				subMenuFolder = parseSubMenuFolder(subMenuFolder);
				subMenuFolder = menu.findOrNewMenu(subMenuFolder, subMenu);
				const entryText = fileName.replace('buttons_', '');
				menu.newEntry({
					menuName: subMenuFolder, entryText, func: () => {
						if (_isFile(folders.xxx + 'helpers\\readme\\' + readmeFile)) {
							fb.ShowPopupMessage(_open(folders.xxx + 'helpers\\readme\\' + readmeFile, utf8), readmeFile);
						}
					}
				});
			});
		}
	}
	menu.newEntry({ entryText: 'sep' });
	menu.newEntry({
		entryText: 'Open buttons folder...', func: () => {
			_explorer(folders.xxx + 'buttons');
		}
	});
	return menu;
}