'use strict';
//15/11/23

function _createSubMenuEditEntries(parent, menuName, options /*{name, subMenuName, list, defaults, input, bAdd, bNumbered, bDuplicate, onBtnUp}*/) {
	/*
		name:			popup name
		subMenuName:	name for the edit entries sub-menu
		list:			current entries. Every entry must have a 'name' key present.
		defaults:		default entries used on 'reset'
		input:			should be a function which returns an object: () => {return {....};}
						there is no need to add logic for 'name' key, it's built-in. Only add whatever you need.
						make sure it returns null or undefined if user cancels or values are not valid!
		bAdd: 			true to show an 'Add entry' option on submenu 
		bNumbered:		true to enumerate each entry shown
		bDuplicate:		allow entries with duplicated names
		onBtnUp:		function to run after any menu entry is run (usually to save the modified entries on properties). List is passed as argument. onBtnUp(options.list) => {...}
	*/
	if (options.onBtnUp && !isFunction(options.onBtnUp)) {
		throw new Error('_createSubMenuEditEntries: onBtnUp is not a function');
	}
	if (!options.list || !options.defaults || !Array.isArray(options.list) || !Array.isArray(options.defaults) || !options.input || !isFunction(options.input)) {
		throw new Error('_createSubMenuEditEntries: list, defaults or input options are non valid or not provided');
	}
	// options.list always point to the original entry list and original values are edited
	const subMenuSecondName = parent.newMenu(options.subMenuName || 'Edit entries from list...', menuName); // It will throw if the menu already exists!
	let i = 0;
	const seps = [];
	options.list.forEach((entry, index) => {
		if (entry.name !== 'sep') {i++;}
		const entryName = (entry.name === 'sep' ? '------(separator)------' + parent.getNextId() : (options.bNumbered ? i + '. ' : '') + (entry.name.length > 40 ? entry.name.substring(0,40) + ' ...' : entry.name));
		const subMenuThirdName = parent.newMenu(entryName, subMenuSecondName);
		parent.newEntry({menuName: subMenuThirdName, entryText: 'Edit entry...', func: () => {
			const oriEntry = JSON.stringify(entry);
			let newEntry = oriEntry;
			try {newEntry = utils.InputBox(window.ID, 'Edit entry as JSON:', options.name, oriEntry, true);}
			catch (e) {return;}
			if (newEntry === oriEntry) {return;}
			if (!newEntry || !newEntry.length) {fb.ShowPopupMessage('Input: ' + newEntry + '\n\nNon valid entry.', 'JSON error'); return;}
			try {newEntry = JSON.parse(newEntry);} catch (e) {fb.ShowPopupMessage('Input: ' + newEntry.toString() + '\n\n' + e, 'JSON error'); return;}
			if (!newEntry) {return;}
			if (!options.bDuplicate && options.list.filter((otherEntry) => otherEntry !== entry).findIndex((otherEntry) => otherEntry.name === newEntry.name) !== -1) {
				fb.ShowPopupMessage('There is another entry with same name.\nRetry with another name.', scriptName);
				return;
			}
			options.list[index] = newEntry;
			if (options.onBtnUp) {options.onBtnUp(options.list);}
			return options.list;
		}, flags: entry.name === 'sep' ? MF_GRAYED : MF_STRING});
		parent.newEntry({menuName: subMenuThirdName, entryText: 'Move entry...', func: () => {
			let pos = 1;
			try {pos = Number(utils.InputBox(window.ID, 'Move up X indexes (negative is down):\n', options.name, pos, true));} 
			catch (e) {return;}
			if (pos === 0 || !Number.isSafeInteger(pos)) {return;}
			if (index - pos < 0) {pos = 0;}
			else if (index - pos >= options.list.length) {pos = options.list.length;}
			else {pos = index - pos;}
			options.list.splice(pos, 0, options.list.splice(index, 1)[0]);
			if (options.onBtnUp) {options.onBtnUp(options.list);}
			return options.list;
		}});
		parent.newEntry({menuName: subMenuThirdName, entryText: 'sep'});
		parent.newEntry({menuName: subMenuThirdName, entryText: 'Remove entry', func: () => {
			options.list.splice(index, 1);
			if (options.onBtnUp) {options.onBtnUp(options.list);}
			return options.list;
		}});
	});
	if (!options.list.length) {parent.newEntry({menuName: subMenuSecondName, entryText: '(none saved yet)', func: null, flags: MF_GRAYED});}
	parent.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
	if (!options.hasOwnProperty('bAdd') || options.bAdd) {
		parent.newEntry({menuName: subMenuSecondName, entryText: 'Add new entry to list...' , func: () => {
			// Input all variables
			let input;
			let entryName = '';
			try {entryName = utils.InputBox(window.ID, 'Enter name for menu entry:\nWrite \'sep\' to add a line.', options.name, '', true);}
			catch (e) {return;}
			if (!entryName.length) {return;}
			if (entryName === 'sep') {input = {name: entryName};} // Add separator
			else { // or new entry
				if (!options.bDuplicate && options.list.findIndex((entry) => entry.name === entryName) !== -1) {
					fb.ShowPopupMessage('There is another entry with same name.\nRetry with another name.', scriptName);
					return;
				}
				const entry = options.input();
				if (!entry) {return;}
				input = {name: entryName, ...entry}
			}
			// Add entry
			options.list.push(input);
			if (options.onBtnUp) {options.onBtnUp(options.list);}
			return options.list;
		}});
	}
	parent.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
	parent.newEntry({menuName: subMenuSecondName, entryText: 'Restore defaults...', func: () => {
		options.list.length = 0;
		clone(options.defaults).forEach(e => options.list.push(e));
		if (options.onBtnUp) {options.onBtnUp(options.list);}
		return options.list;
	}});
}