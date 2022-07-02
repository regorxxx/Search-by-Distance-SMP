'use strict'
//01/07/22

include('menu_xxx.js');
include('helpers_xxx.js');
include('helpers_xxx_file.js');

function createButtonsMenu(name) {
	const menu = new _menu();
	menu.clear(true); // Reset on every call
	const files = findRecursivefile('*.js', [folders.xxx + 'buttons']).filter((path) => {return !path.split('\\').pop().startsWith('_');});
	const readmeList = _isFile(folders.xxx + 'helpers\\readme\\buttons_list.json') ? _jsonParseFileCheck(folders.xxx + 'helpers\\readme\\buttons_list.json', 'Readme list', window.Name, utf8) : null;
	// Header
	menu.newEntry({entryText: 'Toolbar configuration:', func: null, flags: MF_GRAYED});
	menu.newEntry({entryText: 'sep'});
	if (!_isFolder(folders.data)) {_createFolder(folders.data);}
	const notAllowedDup = new Set(['buttons_playlist_tools.js', 'buttons_playlist_history.js', 'buttons_playlist_tools_macros.js', 'buttons_playlist_tools_pool.js', 'buttons_others_device_priority.js', 'buttons_tags_save_tags.js', 'buttons_tags_fingerprint_chromaprint.js', 'buttons_tags_fingerprint_fooid.js', 'buttons_search_fingerprint_chromaprint.js','buttons_search_fingerprint_chromaprint_fast.js', 'buttons_search_fingerprint_fooid.js','buttons_fingerprint_tools.js']);
	const requirePlaylistTools = new Set(['buttons_playlist_tools_macros.js', 'buttons_playlist_tools_macro_custom.js', 'buttons_playlist_tools_pool.js', 'buttons_playlist_tools_submenu_custom.js']);
	const subCategories = ['_fingerprint_', '_search_', '_tags_', '_playlist_tools', '_playlist_', '_others_']; // By order of priority if it matches multiple strings
	const buttonsPathNames = new Set(buttonsPath.map((path) => {return path.split('\\').pop();}));
	function isAllowed(fileName) {return !notAllowedDup.has(fileName) || !buttonsPathNames.has(fileName);}
	function isAllowedV2(fileName) {return !requirePlaylistTools.has(fileName) || buttonsPathNames.has('buttons_playlist_tools.js');}
	{
		const subMenu = menu.newMenu('Add buttons');
		const invId =  nextId('invisible', true, false); // To avoid classes with other submenus
		files.forEach((path) => {
			const fileName = path.split('\\').pop();
			let entryText = path.split('\\').pop() + (isAllowed(fileName) ? (isAllowedV2(fileName) ? '' : '\t(Playlist Tools)') : '\t(1 allowed)');
			let subMenuFolder = subCategories.find((folder) => {return entryText.indexOf(folder) !== -1;});
			if (subMenuFolder && subMenuFolder.length) {
				subMenuFolder = (subMenuFolder === '_playlist_tools' ? 'Playlist Tools' : capitalizeAll(subMenuFolder.replace(/[_]/g,''))) + invId;
				if (!menu.hasMenu(subMenuFolder, subMenu)) {menu.newMenu(subMenuFolder, subMenu);}
			}
			entryText = entryText.replace('buttons_', '');
			menu.newEntry({menuName: subMenuFolder || 'Others', entryText, func: () => {
				buttonsPath.push(path);
				const fileNames = buttonsPath.map((path) => {return path.split('\\').pop();});
				_save(folders.data + name + '.json', JSON.stringify(fileNames, null, '\t'));
				if (readmeList) {
					const readmeFile = readmeList.hasOwnProperty(fileName) ? readmeList[fileName] : '';
					const readme = readmeFile.length ? _open(folders.xxx + 'helpers\\readme\\' + readmeFile, utf8) : '';
					if (readme.length) {fb.ShowPopupMessage(readme, readmeFile);}
				}
				window.Reload();
			}, flags: isAllowed(fileName) && isAllowedV2(fileName) ? MF_STRING : MF_GRAYED});
		});
	}
	{
		const subMenu = menu.newMenu('Remove buttons');
		buttonsPath.forEach((path, idx) => {
			menu.newEntry({menuName: subMenu, entryText: path.split('\\').pop() + '\t(' + (idx + 1) + ')', func: () => {
				// Remove button
				buttonsPath.splice(idx, 1);
				// Remove properties
				// Since properties have a prefix according to their loading order when there are multiple instances of the same
				// script, removing a button when there a other 'clones' means the other buttons will get their properties names
				// shifted by one. They need to be adjusted or buttons at greater indexes will inherit properties from lower ones!
				const properties = buttonsBar.list[idx];
				if (properties) {deleteProperties(properties);} // Delete current position
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
										if (!Object.prototype.hasOwnProperty.call(backup, key)) {continue;}
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
				const fileNames = buttonsPath.map((path) => {return path.split('\\').pop();});
				_save(folders.data + name + '.json', JSON.stringify(fileNames, null, '\t'));
				window.Reload();
			}});
		});
	}
	{
		const subMenu = menu.newMenu('Change buttons position');
		menu.newEntry({menuName: subMenu, entryText: 'Buttons can also be moved on UI while pressing R. Click:', flags: MF_GRAYED});
		menu.newEntry({menuName: subMenu, entryText: 'sep'});
		buttonsPath.forEach((path, idx) => {
			menu.newEntry({menuName: subMenu, entryText: path.split('\\').pop() + '\t(' + (idx + 1) + ')', func: () => {
				let input;
				try {input = Number(utils.InputBox(window.ID, 'Enter new position.\n(1 - ' + buttonsPath.length +')', 'Buttons bar', idx + 1));}
				catch (e) {return;}
				if (isNaN(input) || input > buttonsPath.length) {return;}
				buttonsPath.splice(input - 1, 0, buttonsPath.splice(idx, 1)[0]);
				buttonsBar.list.splice(input - 1, 0, buttonsBar.list.splice(idx, 1)[0]);
				const fileNames = buttonsPath.map((path) => {return path.split('\\').pop();});
				_save(folders.data + name + '.json', JSON.stringify(fileNames, null, '\t'));
				// Since properties have a prefix according to their loading order when there are multiple instances of the same
				// script, moving a button when there other 'clones' means the other buttons may get their properties names
				// shifted by one. They need to be adjusted or buttons at greater indexes will inherit properties from lower ones!
				const properties = buttonsBar.list[input - 1];
				const keys = properties ? Object.keys(properties) : [];
				if (keys.length) {
					const prefix = properties[Object.keys(properties)[0]][0].split('_')[0];
					const currentId = prefix.slice(0, prefix.length - 1);
					let currentIdNumber = 0;
					// Just rewrite all Ids with same prefix
					buttonsBar.list.forEach((oldProperties) => {
						const oldKeys = oldProperties ? Object.keys(oldProperties) : [];
						if (oldKeys.length) {
							const oldPrefix = oldProperties[oldKeys[0]][0].split('_')[0];
							const oldId = oldPrefix.slice(0, oldPrefix.length - 1);
							if (oldId === currentId) {
								const backup = getPropertiesPairs(oldProperties, '', 0, false); // First refresh from panel
								deleteProperties(oldProperties); // Delete it at panel
								for (const key in backup) { // Update Id
									if (!Object.prototype.hasOwnProperty.call(backup, key)) {continue;}
									backup[key][0] = backup[key][0].replace(oldPrefix, oldId + currentIdNumber);
								}
								setProperties(backup, '', 0, false, true); // And restore at new position
								if (oldPrefix !== prefix) {currentIdNumber++;}
							}
						}
					});
				}
				window.Reload();
			}});
		});
	}
	menu.newEntry({entryText: 'sep'});
	menu.newEntry({entryText:'Restore default buttons', func: () => {
		// Restore buttons
		buttonsPath = [...buttonsPathDef];
		// Remove all properties
		buttonsBar.list.forEach((properties) => {deleteProperties(properties);});
		// Save and reload
		const fileNames = buttonsPath.map((path) => {return path.split('\\').pop();});
		_save(folders.data + name + '.json', JSON.stringify(fileNames, null, '\t'));
		if (readmeList) {
			fileNames.forEach((fileName) => {
				const readmeFile = readmeList.hasOwnProperty(fileName) ? readmeList[fileName] : '';
				if (readmeFile.length && _isFile(folders.xxx + 'helpers\\readme\\' + readmeFile)) {
					fb.ShowPopupMessage(_open(folders.xxx + 'helpers\\readme\\' + readmeFile, utf8), readmeFile);
				}
			});
		}
		window.Reload();
	}});
	menu.newEntry({entryText: 'sep'});
	{
		const menuName = menu.newMenu('Colors...');
		menu.newEntry({menuName, entryText: 'Set custom bar color...', func: () => {
			barProperties.toolbarColor[1] = utils.ColourPicker(window.ID, barProperties.toolbarColor[1]);
			overwriteProperties(barProperties);
			buttonsBar.config.bToolbar = true; // buttons_xxx.js
			buttonsBar.config.toolbarColor = barProperties.toolbarColor[1]; // buttons_xxx.js
			window.Repaint();
		}});
		menu.newEntry({menuName, entryText: 'Set custom text color...', func: () => {
			barProperties.textColor[1] = utils.ColourPicker(window.ID, barProperties.textColor[1]);
			overwriteProperties(barProperties);
			buttonsBar.config.textColor = barProperties.textColor[1]; // buttons_xxx.js
			window.Repaint();
		}});
		menu.newEntry({menuName, entryText: 'sep'});
		menu.newEntry({menuName, entryText: 'Set active button color...', func: () => {
			barProperties.activeColor[1] = utils.ColourPicker(window.ID, barProperties.activeColor[1]);
			overwriteProperties(barProperties);
			buttonsBar.config.activeColor = barProperties.activeColor[1]; // buttons_xxx.js
			window.Repaint();
		}});
		menu.newEntry({menuName, entryText: 'Set animation button colors...', func: () => {
			let colors = JSON.parse(barProperties.animationColors[1]);
			colors = [RGBA(...toRGB(utils.ColourPicker(window.ID, colors[0])), 50), RGBA(...toRGB(utils.ColourPicker(window.ID, colors[1])), 30)];
			barProperties.animationColors[1] = JSON.stringify(colors);
			overwriteProperties(barProperties);
			buttonsBar.config.animationColors = colors; // buttons_xxx.js
			window.Repaint(); // Note existing animations will use the previous colors, since the (default) colors are applied per animation once before firing
		}});
		menu.newEntry({menuName, entryText: 'sep'});
		menu.newEntry({menuName, entryText: 'No background buttons', func: () => {
			barProperties.bBgButtons[1] = !barProperties.bBgButtons[1];
			overwriteProperties(barProperties);
			buttonsBar.config.partAndStateID = barProperties.bBgButtons[1] ? 1 : 6; // buttons_xxx.js
		}});
		menu.newCheckMenu(menuName, 'No background buttons', void(0), () => {return !barProperties.bBgButtons[1];});
		menu.newEntry({menuName, entryText: 'sep'});
		menu.newEntry({menuName, entryText: 'Reset...', func: () => {
			barProperties.toolbarColor[1] = -1;
			buttonsBar.config.toolbarColor = buttonsBar.config.default.toolbarColor;
			barProperties.textColor[1] = buttonsBar.config.textColor = buttonsBar.config.default.textColor;
			barProperties.activeColor[1] =  buttonsBar.config.activeColor = buttonsBar.config.default.activeColor;
			barProperties.animationColors[1] = JSON.stringify(buttonsBar.config.default.animationColors);
			buttonsBar.config.animationColors = buttonsBar.config.default.animationColors;
			buttonsBar.config.bToolbar = buttonsBar.config.default.bToolbar;
			overwriteProperties(barProperties);
			window.Repaint();
		}});
	}
	{
		const menuName = menu.newMenu('Size and placement...');
		const orientation = barProperties.orientation[1].toLowerCase();
		menu.newEntry({menuName, entryText: 'Reflow buttons according to ' + (orientation === 'x' ? 'width' : 'height'), func: () => {
			barProperties.bReflow[1] = !barProperties.bReflow[1];
			overwriteProperties(barProperties);
			buttonsBar.config.bReflow = barProperties.bReflow[1]; // buttons_xxx.js
			window.Repaint();
		}});
		menu.newCheckMenu(menuName, 'Reflow buttons according to ' + (orientation === 'x' ? 'width' : 'height'), void(0), () => {return barProperties.bReflow[1];});
		menu.newEntry({menuName, entryText: 'Normalize buttons ' + (orientation === 'x' ? 'height' : 'width'), func: () => {
			barProperties.bAlignSize[1] = !barProperties.bAlignSize[1];
			overwriteProperties(barProperties);
			buttonsBar.config.bAlignSize = barProperties.bAlignSize[1]; // buttons_xxx.js
			window.Repaint();
		}});
		menu.newCheckMenu(menuName, 'Normalize buttons ' + (orientation === 'x' ? 'height' : 'width'), void(0), () => {return barProperties.bAlignSize[1];});
		menu.newEntry({menuName, entryText: 'sep'});
		menu.newEntry({menuName, entryText: 'Set scale...' + '\t[' + round(buttonsBar.config.scale, 2) + ']', func: () => {
			let input = buttonsBar.config.scale;
			try {input = Number(utils.InputBox(window.ID, 'Enter number:', 'Buttons bar', input, true));}
			catch(e) {return;}
			if (isNaN(input)) {return;}
			if (buttonsBar.config.scale === input) {return;}
			for (let key in buttonsBar.buttons) {
				if (!Object.prototype.hasOwnProperty.call(buttonsBar.buttons, key)) {continue;}
				buttonsBar.buttons[key].changeScale(input);
			}
			buttonsBar.config.scale = input; // buttons_xxx.js
			barProperties.scale[1] = buttonsBar.config.scale;
			overwriteProperties(barProperties);
			window.Repaint();
			buttonSizeCheck();
		}});
		menu.newCheckMenu(menuName, 'Normalize buttons ' + (orientation === 'x' ? 'height' : 'width'), void(0), () => {return barProperties.bAlignSize[1];});
	}
	{
		const menuName = menu.newMenu('Other UI configuration...');
		menu.newEntry({menuName, entryText: 'Show properties IDs on tooltip', func: () => {
			barProperties.bShowId[1] = !barProperties.bShowId[1];
			overwriteProperties(barProperties);
			buttonsBar.config.bShowID = barProperties.bShowId[1]; // buttons_xxx.js
		}});
		menu.newCheckMenu(menuName, 'Show properties IDs on tooltip', void(0), () => {return barProperties.bShowId[1];});
		menu.newEntry({menuName, entryText: 'sep'});
		const orientation = barProperties.orientation[1].toLowerCase();
		menu.newEntry({menuName, entryText: 'Toolbar orientation \t[' + orientation + ']', func: () => {
			barProperties.orientation[1] = orientation === 'x' ? 'y' : 'x';
			overwriteProperties(barProperties);
			buttonsBar.config.orientation = barProperties.orientation[1]; // buttons_xxx.js
			window.Reload();
		}});
	}
	menu.newEntry({entryText: 'sep'});
	{
		const subMenu = menu.newMenu('Readmes...');
		const invId =  nextId('invisible', true, false); // To avoid classes with other submenus
		menu.newEntry({menuName: subMenu, entryText: 'Toolbar', func: () => {
			const readmePath = folders.xxx + 'helpers\\readme\\toolbar.txt';
			const readme = _open(readmePath, utf8);
			if (readme.length) {fb.ShowPopupMessage(readme, 'Toolbar');}
		}});
		if (readmeList) {
			menu.newEntry({menuName: subMenu, entryText: 'sep'});
			Object.keys(readmeList).forEach((fileName) => {
				const readmeFile = readmeList.hasOwnProperty(fileName) ? readmeList[fileName] : '';
				if (!readmeFile.length || !_isFile(folders.xxx + 'helpers\\readme\\' + readmeFile)) {return;}
				let subMenuFolder = subCategories.find((folder) => {return fileName.indexOf(folder) !== -1;});
				if (subMenuFolder && subMenuFolder.length) {
					subMenuFolder = (subMenuFolder === '_playlist_tools' ? 'Playlist Tools' : capitalizeAll(subMenuFolder.replace(/[_]/g,''))) + invId;;
					if (!menu.hasMenu(subMenuFolder, subMenu)) {menu.newMenu(subMenuFolder, subMenu);}
				}
				const entryText = fileName.replace('buttons_', '');
				menu.newEntry({menuName: subMenuFolder || 'Others', entryText, func: () => {
					if (_isFile(folders.xxx + 'helpers\\readme\\' + readmeFile)) {
						fb.ShowPopupMessage(_open(folders.xxx + 'helpers\\readme\\' + readmeFile, utf8), readmeFile);
					}
				}});
			});
		}
	}
	menu.newEntry({entryText: 'sep'});
	menu.newEntry({entryText: 'Open buttons folder...', func: () => {
		_explorer(folders.xxx + 'buttons');
	}});
	return menu;
}