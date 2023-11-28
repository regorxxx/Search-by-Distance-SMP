'use strict';
//28/11/23

include('menu_xxx.js');
include('helpers_xxx_properties.js')
include('helpers_xxx_file.js');

function settingsMenu(parent, bShowValues = false, readmeFiles = [], popups = {}, callbacks = {}, extraEntries = null) {
	/*
		parent:			button context
		bShowValues:	show value along the menu entry
		readmeFiles:	list of files to show on readme submenu
		popups:			{key: text}, where key matches the ones at parent.buttonsProperties. Everytime such setting is changed, popup will appear.
		callbacks: 		{key: text}, where key matches the ones at parent.buttonsProperties. Everytime such setting is changed, callback will fire (after changing the setting).
		extraEntries:	function which could append additional menu entries between the list of properties and the 'Restore defaults...' entry.
	*/
	if (extraEntries && !isFunction(extraEntries)) {throw new Error('settingsMenu: extraEntries is not a function');}
	const menu = new _menu();
	const properties = parent.buttonsProperties;
	const parentName = isFunction(parent.text) ? parent.text(parent) : parent.text;
	const readmeList = readmeFiles.length && _isFile(folders.xxx + 'helpers\\readme\\buttons_list.json') ? _jsonParseFileCheck(folders.xxx + 'helpers\\readme\\buttons_list.json', 'Readme list', window.Name, utf8) : null;
	// Menu
	menu.newEntry({entryText: 'Configurate button:', func: null, flags: MF_GRAYED});
	menu.newEntry({entryText: 'sep'});
	{
		const options = Object.keys(properties);
		options.forEach((key) => {
			const value = properties[key][1];
			const type = typeof value;
			const entryText = properties[key][0].replace(/[a-zA-Z]*[0-9]*_*[0-9]*\./,'') + (bShowValues && type !== 'boolean' ? '\t[' + (type === 'string' && value.length > 10 ? value.slice(0,10) + '...' : value) + ']' : '');
			const desc = popups && popups.hasOwnProperty(key) ? popups[key].input || '' : '';
			menu.newEntry({entryText, func: () => {
				let input;
				switch (type) {
					case 'object': {
						try {input = JSON.parse(utils.InputBox(window.ID, desc || 'Enter JSON value:', parentName, JSON.stringify(value), true));}
						catch(e) {return;}
						if (!input) {fb.ShowPopupMessage('Value must be a JSON object.', parentName); return;}
						break;
					}
					case 'number': {
						try {input = Number(utils.InputBox(window.ID, desc || 'Enter number:', parentName, value, true));}
						catch(e) {return;}
						if (isNaN(input)) {fb.ShowPopupMessage('Value must be a number.', parentName); return;}
						break;
					}
					case 'string': {
						input = '';
						try {input = utils.InputBox(window.ID, desc || 'Enter value:', parentName, value, true);}
						catch(e) {return;}
						break;
					}
					case 'boolean': {
						input = !value;
						break;
					}
				}
				if (value === input) {return;}
				if (!checkProperty(properties[key], input)) {return;} // Apply properties check which should be personalized for input value
				properties[key][1] = (type === 'object' ? JSON.stringify(input) : input);
				overwriteProperties(properties); // Updates panel
				if (popups && popups.hasOwnProperty(key)) {
					if (type !== 'boolean' || (type === 'boolean' && input)) {
						fb.ShowPopupMessage(popups[key].popup, parentName);
					}
				}
				if (key === 'bIconMode') {
					parent.bIconMode = input;
					window.Repaint();
				}
				if (callbacks) {
					if (callbacks.hasOwnProperty(key)) {
						callbacks[key](input, key);
					} else if (callbacks.hasOwnProperty('*')) {
						callbacks['*'](input, key);
					}
				}
			}});
			if (type === 'boolean') {
				menu.newCheckMenu(void(0), entryText, void(0), () => {return value;});
			}
		});
	}
	if (extraEntries) {extraEntries(menu, this);}
	menu.newEntry({entryText: 'sep'});
	menu.newEntry({entryText: 'Restore defaults...', func: () => {
		const options = Object.keys(properties);
		options.forEach((key) => {properties[key][1] = properties[key][3];});
		overwriteProperties(properties); // Updates panel
	}});
	if (readmeList) {
		menu.newEntry({entryText: 'sep'});
		if (readmeFiles.length > 1) {
			readmeFiles.forEach((name) => {
				const readmeFile = readmeList.hasOwnProperty(name) ? readmeList[name] : '';
				if (readmeFile.length) {
					menu.newEntry({entryText: readmeFile, func: () => {
						const readme = _open(folders.xxx + 'helpers\\readme\\' + readmeFile, utf8);
						if (readme.length) {fb.ShowPopupMessage(readme, readmeFile);}
						else {console.log(readmeFile + ' not found.');}
					}});
				}
			});
		} else {
			menu.newEntry({entryText: 'Readme...', func: () => {
				const readmeFile = readmeList.hasOwnProperty(readmeFiles[0]) ? readmeList[readmeFiles[0]] : '';
				const readme = readmeFile.length ? _open(folders.xxx + 'helpers\\readme\\' + readmeFile, utf8) : '';
				if (readme.length) {fb.ShowPopupMessage(readme, readmeFile);}
				else {console.log(readmeFile + ' not found.');}
			}});
		}
	}
	return menu;
}