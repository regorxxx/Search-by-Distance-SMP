include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\menu_xxx.js');
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\helpers_xxx_file.js');

function createButtonsMenu(name) {
	const menu = new _menu();
	menu.clear(true); // Reset on every call
	const files = findRecursivefile('*.js', [fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\buttons']).filter((path) => {return !path.split('\\').pop().startsWith('_');});
	// Header
	menu.newEntry({entryText: 'Toolbar configuration:', func: null, flags: MF_GRAYED});
	menu.newEntry({entryText: 'sep'});
	{
		const subMenu = menu.newMenu('Add buttons');
		const notAllowedDup = new Set(['buttons_playlist_tools.js', 'buttons_playlist_history.js'])
		const buttonsPathNames = new Set(buttonsPath.map((path) => {return path.split('\\').pop();}));
		function isAllowed(fileName) {return !notAllowedDup.has(fileName) || !buttonsPathNames.has(fileName);}
		files.forEach((path, idx) => {
			const fileName = path.split('\\').pop();
			const entryText = path.split('\\').pop() + (isAllowed(fileName) ? '' : '\t(1 allowed)') ;
			menu.newEntry({menuName: subMenu, entryText, func: () => {
				buttonsPath.push(path);
				_save(fb.ProfilePath + 'js_data\\' + name + '.json', JSON.stringify(buttonsPath, null, 3));
				window.Reload();
			}, flags: isAllowed(fileName) ? MF_STRING : MF_GRAYED});
		});
	}
	{
		const subMenu = menu.newMenu('Remove buttons');
		buttonsPath.forEach((path, idx) => {
			menu.newEntry({menuName: subMenu, entryText: path.split('\\').pop() + '\t(' + (idx + 1) + ')', func: () => {
				buttonsPath.splice(idx, 1);
				_save(fb.ProfilePath + 'js_data\\' + name + '.json', JSON.stringify(buttonsPath, null, 3));
				window.Reload();
			}});
		});
	}
	{
		const subMenu = menu.newMenu('Change buttons possition');
		buttonsPath.forEach((path, idx) => {
			menu.newEntry({menuName: subMenu, entryText: path.split('\\').pop() + '\t(' + (idx + 1) + ')', func: () => {
			try {input = Number(utils.InputBox(window.ID, 'Enter new possition.\n(1 - ' + buttonsPath.length +')', 'Buttons bar', idx + 1));}
			catch (e) {return;}
			if (isNaN(input) || input > buttonsPath.length) {return;}
			buttonsPath.splice(input - 1, 0, buttonsPath.splice(idx, 1)[0]);
			_save(fb.ProfilePath + 'js_data\\' + name + '.json', JSON.stringify(buttonsPath, null, 3));
			window.Reload();
			}});
		});
	}
	menu.newEntry({entryText: 'sep'});
	const menuName = menu.newMenu('Colours...');
	menu.newEntry({menuName, entryText: 'Set custom colour...', func: () => {
		barProperties.toolbarColor[1] = utils.ColourPicker(window.ID, barProperties.toolbarColor[1]);
		overwriteProperties(barProperties);
		window.Reload();
	}});
	menu.newEntry({menuName, entryText: 'Reset...', func: () => {
		barProperties.toolbarColor[1] = -1;
		overwriteProperties(barProperties);
		window.Reload();
	}});
	menu.newEntry({entryText: 'sep'});
	menu.newEntry({entryText: 'Open buttons folder', func: () => {
		_explorer(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\buttons');
	}});
	return menu;
}