'use strict';
//15/02/22

include('helpers_xxx_prototypes.js');
include('helpers_xxx_UI.js');
include('helpers_xxx_flags.js');

/* 
	This is the framework to create buttons as new objects with its own properties and tooltips. They can be merged and loaded multiple times
	as new buttons instances on the same toolbar. Coordinates get updated when loading multiple buttons, removing the need to manually set them.
	Check '_buttons_blank.js' to see the universal buttons structure. It loads on foobar but does nothing, it's just empty.
	Check '_buttons_blank_merged.js' to see the universal structure for merging butons, creating an entire bar
	Check '_buttons_example.js' for a working example of buttons within foobar.
	Check '_buttons_example_merged.js' for a working example of a buttons bar within foobar.
	Check '_buttons_example_merged_double.js' for a working example of merging multiple buttons and bars within foobar.
*/

const buttonsBar = {};
// General config
buttonsBar.config = {
	bShowID: true, // Show Prefixes + ID on tooltips
	toolbarTooltip: '', // Shown on toolbar
	toolbarColor: RGB(211,218,237), // Toolbar color
	bToolbar: false, // Change this on buttons bars files to set the background color
	textColor: RGB(0,0,0),
	buttonOrientation: 'x',
	bReflow: false,
	partAndStateID: 1 // 1 standard button, 6  bg/border button (+hover)
}; 
// Drag n drop (internal use)
buttonsBar.move = {bIsMoving: false, btn: null, moveX: null, moveY: null, fromKey: null, toKey: null};
buttonsBar.move.rec = {x: null, y: null, w: null, h: null};
// Button objs
buttonsBar.list = []; // Button properties grouped per script
buttonsBar.listKeys = []; // Button names grouped per script (and found at buttons obj)
buttonsBar.propertiesPrefixes = new Set(); // Global properties names prefixes
buttonsBar.buttons = {}; // Global list
// Others (internal use)
buttonsBar.oldButtonCoordinates = {x: 0, y: 0, w: 0, h: 0}; // To store coordinates of previous buttons when drawing
buttonsBar.tooltipButton = new _tt(null, 'Segoe UI', _scale(10), 600);  // Global tooltip
buttonsBar.g_down = false;
buttonsBar.curBtn = null;

function calcNextButtonCoordinates(coord, buttonOrientation = buttonsBar.config.buttonOrientation, recalc = true) {
	let newCoordinates;
	const orientation = buttonOrientation.toLowerCase();
	const old = buttonsBar.oldButtonCoordinates;
	const bFirstButton = !old[orientation] ? true : false;
	const keys = ['x','y','w','h'];
	const bFuncCoord = Object.fromEntries(keys.map((c) => {return [c, _isFunction(coord[c])];}));
	const iCoord = Object.fromEntries(keys.map((c) => {return [c, bFuncCoord[c] ? coord[c]() : coord[c]];}));
	newCoordinates = Object.fromEntries(keys.map((c) => {return [c, bFuncCoord[c] ? () => {return old[c] + coord[c]()} : (c !== 'h' && c !== 'w'? old[c] : 0) + iCoord[c]];}));
	if (recalc) {
		if (orientation === 'x') {old.x += iCoord.x + iCoord.w; old.h = Math.max(old.h, iCoord.h);}
		else if (orientation === 'y') {old.y += iCoord.y + iCoord.h; old.w = Math.max(old.w, iCoord.w);}
	}
	if (buttonsBar.config.bReflow && !bFirstButton) {
		if (orientation === 'x' && old.x  > window.Width) {
			newCoordinates.x = coord.x;
			newCoordinates.y = old.y + old.h;
			old.x = iCoord.x + iCoord.w;
			old.y = newCoordinates.y;
		} else if (orientation === 'y' && old.y  > window.Height) {
			newCoordinates.y = coord.y;
			newCoordinates.x = old.x + old.w;
			old.y = iCoord.y + iCoord.h;
			old.x = newCoordinates.x;
		}
	}
	return newCoordinates;
}

function themedButton(coordinates, text, fonClick, state, g_font = _gdiFont('Segoe UI', 12), description, prefix = '', buttonsProperties = {}, icon = null, g_font_icon = _gdiFont('FontAwesome', 12)) {
	this.state = state ? state : buttonStates.normal;
	this.x = this.currX = coordinates.x;
	this.y = this.currY = coordinates.y;
	this.w = this.currW = coordinates.w;
	this.h = this.currH = coordinates.h;
	this.moveX = null;
	this.moveY = null;
	this.originalWindowWidth = window.Width;
	this.g_theme = window.CreateThemeManager('Button');
	this.g_font = g_font;
	this.g_font_icon = g_font_icon;
	this.description = description;
	this.text = text;
	this.textWidth  = _isFunction(this.text) ? () => {return _gr.CalcTextWidth(this.text(), g_font);} : _gr.CalcTextWidth(this.text, g_font);
	this.icon = this.g_font_icon.Name !== 'Microsoft Sans Serif' ? icon : null; // if using the default font, then it has probably failed to load the right one, skip icon
	this.iconWidth = _isFunction(this.icon) ? () => {return _gr.CalcTextWidth(this.icon(), g_font_icon);} : _gr.CalcTextWidth(this.icon, g_font_icon);
	this.fonClick = fonClick;
	this.prefix = prefix; // This let us identify properties later for different instances of the same button, like an unique ID
	this.descriptionWithID = _isFunction(this.description) ? (parent) => {return (this.prefix ? this.prefix.replace('_','') + ': ' + this.description(parent) : this.description(parent));} : () => {return (this.prefix ? this.prefix.replace('_','') + ': ' + this.description : this.description);}; // Adds prefix to description, whether it's a func or a string
	this.buttonsProperties = Object.assign({}, buttonsProperties); // Clone properties for later use

	this.containXY = function (x, y) {
		return (this.currX <= x) && (x <= this.currX + this.currW) && (this.currY <= y) && (y <= this.currY + this.currH);
	};

	this.changeState = function (state) {
		let old = this.state;
		this.state = state;
		return old;
	};

	this.draw = function (gr, x = this.x, y = this.y, w = this.w, h = this.h) {
		if (this.state === buttonStates.hide) {
			return;
		}

		switch (this.state) {
			case buttonStates.normal:
				this.g_theme.SetPartAndStateID(buttonsBar.config.partAndStateID, 1);
				break;

			case buttonStates.hover:
				buttonsBar.tooltipButton.SetValue( (buttonsBar.config.bShowID ? this.descriptionWithID(this) : (_isFunction(this.description) ? this.description(this) : this.description) ) , true); // ID or just description, according to string or func.
				this.g_theme.SetPartAndStateID(buttonsBar.config.partAndStateID, 2);
				break;

			case buttonStates.down:
				this.g_theme.SetPartAndStateID(buttonsBar.config.partAndStateID, 3);
				break;

			case buttonStates.hide:
				return;
		}
		// New coordinates must be calculated and stored to interact with UI
		let {x: xCalc, y: yCalc, w: wCalc, h: hCalc} = calcNextButtonCoordinates({x, y, w, h});
		this.currX = xCalc; this.currY = yCalc; this.currW = wCalc; this.currH = hCalc;
		// When moving buttons, the button may be drawn at another position though
		if (this.moveX) {xCalc = this.moveX;}
		if (this.moveY) {yCalc = this.moveY;}
		this.g_theme.DrawThemeBackground(gr, xCalc, yCalc, wCalc, hCalc);
		if (this.icon !== null) {
			let iconWidthCalculated = _isFunction(this.icon) ? this.iconWidth() : this.iconWidth;
			let textWidthCalculated = _isFunction(this.text) ? this.textWidth() : this.textWidth;
			let iconCalculated = _isFunction(this.icon) ? this.icon() : this.icon;
			let textCalculated = _isFunction(this.text) ? this.text() : this.text;
			gr.GdiDrawText(iconCalculated, this.g_font_icon, buttonsBar.config.textColor, xCalc - iconWidthCalculated / 5 - textWidthCalculated / 2, yCalc, wCalc, hCalc, DT_CENTER | DT_VCENTER | DT_CALCRECT | DT_NOPREFIX); // Icon
			gr.GdiDrawText(textCalculated, this.g_font, buttonsBar.config.textColor, xCalc + iconWidthCalculated, yCalc, wCalc, hCalc, DT_CENTER | DT_VCENTER | DT_CALCRECT | DT_NOPREFIX); // Text
		} else {
			let textCalculated = _isFunction(this.text) ? this.text() : this.text;
			gr.GdiDrawText(textCalculated, this.g_font, buttonsBar.config.textColor, xCalc, yCalc, wCalc, hCalc, DT_CENTER | DT_VCENTER | DT_CALCRECT | DT_NOPREFIX); // Text
		}
	};

	this.onClick = function (mask) {
		this.fonClick && this.fonClick(mask);
	};
}

function drawAllButtons(gr) {
	for (let key in buttonsBar.buttons) {
		if (Object.prototype.hasOwnProperty.call(buttonsBar.buttons, key)) {
			buttonsBar.buttons[key].draw(gr);
		}
	}
}

function chooseButton(x, y) {
	let i = 0;
	for (let key in buttonsBar.buttons) {
		if (Object.prototype.hasOwnProperty.call(buttonsBar.buttons, key)) {
			if (buttonsBar.buttons[key].containXY(x, y) && buttonsBar.buttons[key].state !== buttonStates.hide) {
				return [buttonsBar.buttons[key], key, i];
			}
		}
		i++;
	}
	return [null, null, null];
}

function on_paint(gr) {
	// Toolbar
	if (buttonsBar.config.bToolbar){
		if (buttonsBar.oldButtonCoordinates.x < window.Width) {gr.FillSolidRect(0, 0, window.Width, window.Height, buttonsBar.config.toolbarColor);} // Toolbar color fix
		else {gr.FillSolidRect(0, 0, window.Width, window.Height, utils.GetSysColour(15));} // Default
	}
	// Buttons
	for (let key in buttonsBar.oldButtonCoordinates) {buttonsBar.oldButtonCoordinates[key] = 0;}
	drawAllButtons(gr);
	// Drag n drop buttons
	if (buttonsBar.move.bIsMoving) {
		gr.FillSolidRect(buttonsBar.move.rec.x, buttonsBar.move.rec.y, buttonsBar.move.rec.w, buttonsBar.move.rec.h, opaqueColor(invert(buttonsBar.config.toolbarColor), 15));
		gr.DrawRect(buttonsBar.move.rec.x, buttonsBar.move.rec.y, buttonsBar.move.rec.w, buttonsBar.move.rec.h, 1, invert(buttonsBar.config.toolbarColor));
	}
}

function on_mouse_move(x, y, mask) {
	let old = buttonsBar.curBtn;
	const buttons = buttonsBar.buttons;
	let curBtnKey = '';
	let curBtnIdx = -1;
	[buttonsBar.curBtn, curBtnKey, curBtnIdx] = chooseButton(x, y);
	
	if (old === buttonsBar.curBtn) {
		if (buttonsBar.g_down) {
			return;
		}
	} else if (buttonsBar.g_down && buttonsBar.curBtn && buttonsBar.curBtn.state !== buttonStates.down) {
		buttonsBar.curBtn.changeState(buttonStates.down);
		window.Repaint();
		return;
	}
	
	//Tooltip fix
	if (old !== null) {
		if (buttonsBar.curBtn === null) {buttonsBar.tooltipButton.Deactivate();} // Needed because tooltip is only activated/deactivated on redrawing... 
															// otherwise it shows on empty spaces after leaving a button.
		else if (old !== buttonsBar.curBtn && old.description === buttonsBar.curBtn.description) { 	// This forces redraw even if buttons have the same text!
			buttonsBar.tooltipButton.Deactivate();											// Updates position but tooltip becomes slower since it sets delay time to initial... 
			buttonsBar.tooltipButton.SetDelayTime(3, 0); //TTDT_INITIAL
		} else {buttonsBar.tooltipButton.SetDelayTime(3, buttonsBar.tooltipButton.oldDelay);} 
	}
	// Change button states when not moving them
	old && old.changeState(buttonStates.normal);
	if (!buttonsBar.move.bIsMoving) {
		buttonsBar.curBtn && buttonsBar.curBtn.changeState(buttonStates.hover);
	}
	// Toolbar Tooltip
	if (!buttonsBar.curBtn && buttonsBar.config.toolbarTooltip.length) {
		buttonsBar.tooltipButton.SetValue(buttonsBar.config.toolbarTooltip , true);
	}
	// Move buttons
	if (buttonsBar.curBtn) {
		if (mask === MK_RBUTTON) {
			if (buttonsBar.move.bIsMoving) {
				buttonsBar.move.toKey = curBtnKey;
				if (buttonsBar.move.btn) {
					buttonsBar.move.btn.moveX = x;
					buttonsBar.move.btn.moveY = y;
				}
				const toBtn = buttonsBar.listKeys.find((arr) => {return arr.indexOf(curBtnKey) !== -1});
				const fKey = toBtn[0];
				const lKey = toBtn[toBtn.length - 1];
				buttonsBar.move.rec.x = buttons[fKey].currX;
				buttonsBar.move.rec.y = buttons[fKey].currY;
				buttonsBar.move.rec.w = fKey !== lKey ? buttons[lKey].currX + buttons[lKey].currW - buttonsBar.move.rec.x : buttons[fKey].currW;
				buttonsBar.move.rec.h = buttons[fKey].currH;
			} else {
				buttonsBar.move.bIsMoving = true;
				buttonsBar.move.btn = buttonsBar.curBtn;
				buttonsBar.move.fromKey = curBtnKey;
				buttonsBar.move.toKey = curBtnKey;
			}
		} else {
			if (buttonsBar.move.bIsMoving) {moveButton(buttonsBar.move.fromKey, buttonsBar.move.toKey);} // Forces window reload on successful move
			buttonsBar.move.bIsMoving = false;
			if (buttonsBar.move.btn) {
				buttonsBar.move.btn.moveX = null;
				buttonsBar.move.btn.moveY = null;
				buttonsBar.move.btn = null;
			}
			buttonsBar.move.fromKey = null;
			buttonsBar.move.toKey = null;
			for (let key in buttonsBar.move.rec) {buttonsBar.move.rec[key] = null;}
		}
		for (let key in buttons) {if (buttons[key] !== buttonsBar.move.btn) {buttons[key].moveX = null; buttons[key].moveY = null;}}
	} else {
		for (let key in buttons) {buttons[key].moveX = null; buttons[key].moveY = null;}
		for (let key in buttonsBar.move.rec) {buttonsBar.move.rec[key] = null;}
	}
	window.Repaint();
}

function on_mouse_leave() {
	buttonsBar.g_down = false;

	if (buttonsBar.curBtn) {
		buttonsBar.curBtn.changeState(buttonStates.normal);
		window.Repaint();
	}
}

function on_mouse_lbtn_down(x, y, mask) {
	buttonsBar.g_down = true;
	if (buttonsBar.curBtn) {
		buttonsBar.curBtn.changeState(buttonStates.down);
		window.Repaint();
	}
}

// function on_mouse_rbtn_down(x, y, mask) {
	// console.log('down');
	// if (buttonsBar.move.bIsMoving) {moveButton(buttonsBar.move.fromIdx, buttonsBar.move.toIdx);}
	// if (buttonsBar.move.btn) {
		// buttonsBar.move.btn.moveX = null;
		// buttonsBar.move.btn.moveY = null;
		// buttonsBar.move.btn = null;
	// }
	// buttonsBar.move.btnKey = null;
	// buttonsBar.move.fromIdx = null;
	// buttonsBar.move.toIdx = null;
	// buttonsBar.move.bIsMoving = false;
// }

function on_mouse_rbtn_up(x, y, mask) {
	console.log('release');
	// Must return true, if you want to suppress the default context menu.
	// Note: left shift + left windows key will bypass this callback and will open default context menu.
	return buttonsBar.hasOwnProperty('menu') ? buttonsBar.menu().btn_up(x, this.y + this.h) : false;
}

function on_mouse_lbtn_up(x, y, mask) {
	buttonsBar.g_down = false;
	if (buttonsBar.curBtn) {
		buttonsBar.curBtn.onClick(mask);
		if (buttonsBar.curBtn) { // Solves error if you create a new Whsell Popup (curBtn becomes null) after pressing the button and firing curBtn.onClick()
			buttonsBar.curBtn.changeState(buttonStates.hover);
			window.Repaint();
		}
	} else if (mask === MK_SHIFT) {
		if (buttonsBar.hasOwnProperty('shiftMenu')) {buttonsBar.shiftMenu().btn_up(x, this.y + this.h);}
	}
}

function on_key_down(k) { // Update tooltip with key mask if required
	for (let key in buttonsBar.buttons) {
		if (Object.prototype.hasOwnProperty.call(buttonsBar.buttons, key)) {
			if (buttonsBar.buttons[key].state === buttonStates.hover) {
				const that = buttonsBar.buttons[key];
				buttonsBar.tooltipButton.SetValue( (buttonsBar.config.bShowID ? that.descriptionWithID(that) : (_isFunction(that.description) ? that.description(that) : that.description) ) , true); // ID or just description, according to string or func.
			}
		}
	}
}

function on_key_up(k) {
	for (let key in buttonsBar.buttons) {
		if (Object.prototype.hasOwnProperty.call(buttonsBar.buttons, key)) {
			if (buttonsBar.buttons[key].state === buttonStates.hover) {
				const that = buttonsBar.buttons[key];
				buttonsBar.tooltipButton.SetValue( (buttonsBar.config.bShowID ? that.descriptionWithID(that) : (_isFunction(that.description) ? that.description(that) : that.description) ) , true); // ID or just description, according to string or func.
			}
		}
	}
}

function getUniquePrefix(string, sep = '_'){
	if (string === null || !string.length) {return '';}
	let newPrefix = string.replace(sep,'') + 0;  // First ID
	let i = 1;
	while (buttonsBar.propertiesPrefixes.has(newPrefix)) { // The rest
		newPrefix = string.replace(sep,'') + i;
		i++;
	}
	buttonsBar.propertiesPrefixes.add(newPrefix);
	newPrefix = newPrefix + sep;
	return newPrefix;
}

function moveButton(fromKey, toKey) {
	if (typeof buttonsPath === 'undefined' || typeof barProperties === 'undefined') {console.log('Buttons: Can not move buttons in current script.'); return;}
	if (fromKey === toKey) {return;}
	const fromPos = buttonsBar.listKeys.findIndex((arr) => {return arr.indexOf(fromKey) !== -1});
	const toPos = buttonsBar.listKeys.findIndex((arr) => {return arr.indexOf(toKey) !== -1});
	buttonsPath.splice(toPos, 0, buttonsPath.splice(fromPos, 1)[0]);
	buttonsBar.list.splice(toPos, 0, buttonsBar.list.splice(fromPos, 1)[0]);
	const fileNames = buttonsPath.map((path) => {return path.split('\\').pop();});
	_save(folders.data + barProperties.name[1] + '.json', JSON.stringify(fileNames, null, '\t'));
	// Since properties have a prefix according to their loading order, when there are multiple instances of the same
	// script, moving a button when there are other 'clones' means the other buttons may get their properties names
	// shifted by one. They need to be adjusted or buttons at greater indexes will inherit properties from lower ones!
	const properties = buttonsBar.list[toPos];
	const keys = properties ? Object.keys(properties) : [];
	if (keys.length) {
		const prefix = properties[Object.keys(properties)[0]][0].split('_')[0];
		const currentId = prefix.slice(0, prefix.length - 1);
		let currentIdNumber = 0;
		// Backup all properties
		const propertiesBack = buttonsBar.list.map((oldProperties) => {return getPropertiesPairs(oldProperties, '', 0, false);});
		// Just rewrite all Ids with same prefix
		buttonsBar.list.forEach((oldProperties, newIdx) => {
			const oldKeys = oldProperties ? Object.keys(oldProperties) : [];
			if (oldKeys.length) {
				const oldPrefix = oldProperties[oldKeys[0]][0].split('_')[0];
				const oldId = oldPrefix.slice(0, oldPrefix.length - 1);
				if (oldId === currentId) {
					const backup = propertiesBack[newIdx];
					for (const key in backup) { // Update Id
						if (!backup.hasOwnProperty(key)) {continue;}
						backup[key][0] = backup[key][0].replace(oldPrefix, oldId + currentIdNumber);
					}
					overwriteProperties(backup); // And restore at new position
					currentIdNumber++;
				}
			}
		});
	}
	window.Reload(); // Instead of doing the same with the button objects to update the UI, just reload with new paths... moving buttons is done once anyway
}

function addButton(newButtons) {
	// Check if the button list already has the same button ID
	for (let buttonName in newButtons) {
		if (buttonsBar.buttons.hasOwnProperty(buttonName)) {
			Object.defineProperty(newButtons, buttonName + Object.keys(buttonsBar.buttons).length, Object.getOwnPropertyDescriptor(newButtons, buttonName));
			delete newButtons[buttonName];
		}
	}
	buttonsBar.buttons = {...buttonsBar.buttons, ...newButtons};
}