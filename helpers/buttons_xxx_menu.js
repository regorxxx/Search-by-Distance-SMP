'use strict';
//17/03/25

/* exported settingsMenu */

/* global buttonsBar:readable, showButtonReadme:readable */

include('helpers_xxx.js');
/* global MF_GRAYED:readable */
include('helpers_xxx_prototypes.js');
/* global isFunction:readable */
include('helpers_xxx_properties.js');
/* global overwriteProperties:readable, checkProperty:readable, */
include('menu_xxx.js');
/* global _menu:readable */

/**
 * Returns a settings menu object for a parent button object which allows to set any properties associated.
 *
 * @function
 * @name settingsMenu
 * @kind function
 * @param {object} parent - button context
 * @param {boolean} bShowValues? - show value along the menu entry
 * @param {any[]} readmeFiles? - list of files to show on readme submenu
 * @param {{[key:string]:{input:string, popup:string, bHide:boolean}}} entrySettings? - Where key matches the ones at parent.buttonsProperties. Every time such setting is changed, popup will appear.
 * @param {{[key:string]:(value, key:string) => void}} callbacks? - Where key matches the ones at parent.buttonsProperties. Every time such setting is changed, callback will fire (after changing the setting).
 * @param {(menu:_menu, parent:parent) => void} extraEntries? - Function which could append additional menu entries between the list of properties and the 'Restore defaults...' entry.
 * @param {{parentName:string}} options? - Additional settings.
 * @returns {_menu}
 */
function settingsMenu(parent, bShowValues = false, readmeFiles = [], entrySettings = {}, callbacks = {}, extraEntries = null, options = { parentName: '' }) {
	if (extraEntries && !isFunction(extraEntries)) { throw new Error('settingsMenu: extraEntries is not a function'); }
	const menu = new _menu();
	const properties = parent.buttonsProperties;
	const parentName = options.parentName || (isFunction(parent.text) ? parent.text(parent) : parent.text);
	// Menu
	menu.newEntry({ entryText: 'Configure button:', func: null, flags: MF_GRAYED });
	menu.newSeparator();
	{
		const options = Object.keys(properties);
		options.forEach((key) => {
			const keySettings = entrySettings && Object.hasOwn(entrySettings, key) ? entrySettings[key] : {};
			if (keySettings.bHide) { return; }
			if (keySettings.bSep) { menu.newSeparator(); }
			const value = properties[key][1];
			const type = typeof value;
			const entryText = properties[key][0].replace(/[A-z]*\d*_*\d*\./, '') + (bShowValues && type !== 'boolean' ? '\t[' + (type === 'string' && value.length > 10 ? value.slice(0, 10) + '...' : value) + ']' : '');
			const desc = keySettings.input || '';
			menu.newEntry({
				entryText, func: () => {
					let input;
					switch (type) {
						case 'object': {
							try { input = JSON.parse(utils.InputBox(window.ID, desc || 'Enter JSON value:', parentName, JSON.stringify(value), true)); }
							catch (e) { return; } // eslint-disable-line no-unused-vars
							if (!input) { fb.ShowPopupMessage('Value must be a JSON object.', parentName); return; }
							break;
						}
						case 'number': {
							try { input = Number(utils.InputBox(window.ID, desc || 'Enter number:', parentName, value, true)); }
							catch (e) { return; } // eslint-disable-line no-unused-vars
							if (isNaN(input)) { fb.ShowPopupMessage('Value must be a number.', parentName); return; }
							break;
						}
						case 'string': {
							try { input = utils.InputBox(window.ID, desc || 'Enter value:', parentName, value, true); }
							catch (e) { return; } // eslint-disable-line no-unused-vars
							break;
						}
						case 'boolean': {
							input = !value;
							break;
						}
					}
					if (value === input) { return; }
					if (!checkProperty(properties[key], input)) { return; } // Apply properties check which should be personalized for input value
					properties[key][1] = (type === 'object' ? JSON.stringify(input) : input);
					overwriteProperties(properties); // Updates panel
					if (Object.hasOwn(keySettings, 'popup')) {
						if (type !== 'boolean' || (type === 'boolean' && input)) {
							fb.ShowPopupMessage(keySettings.popup, parentName);
						}
					}
					if (key === 'bIconMode') {
						parent.bIconMode = input;
						window.Repaint();
					}
					if (callbacks) {
						if (Object.hasOwn(callbacks, key)) {
							callbacks[key](input, key);
						} else if (Object.hasOwn(callbacks, '*')) {
							callbacks['*'](input, key);
						}
					}
				}
			});
			if (type === 'boolean') {
				menu.newCheckMenu(void (0), entryText, void (0), () => { return value; });
			}
		});
	}
	if (extraEntries) { extraEntries(menu, this); }
	menu.newSeparator();
	menu.newEntry({
		entryText: 'Restore defaults...', func: () => {
			const options = Object.keys(properties);
			options.forEach((key) => { properties[key][1] = properties[key][3]; });
			overwriteProperties(properties); // Updates panel
			// Fire callbacks since value changing may affect other parts of code which need refreshing
			if (callbacks) {
				options.forEach((key) => {
					if (Object.hasOwn(callbacks, key)) {
						callbacks[key](properties[key][1], key);
					} else if (Object.hasOwn(callbacks, '*')) {
						callbacks['*'](properties[key][1], key);
					}
				});
			}
		}
	});
	if (buttonsBar.readmeList) {
		menu.newSeparator();
		if (readmeFiles.length > 1) {
			const menuName = menu.newMenu('Readmes');
			readmeFiles.forEach((name) => {
				if (Object.hasOwn(buttonsBar.readmeList, name)) {
					menu.newEntry({ menuName, entryText: name.replace('buttons_', ''), func: () => showButtonReadme(name) });
				}
			});
		} else {
			menu.newEntry({ entryText: 'Readme...', func: () => showButtonReadme(readmeFiles[0]) });
		}
	}
	return menu;
}