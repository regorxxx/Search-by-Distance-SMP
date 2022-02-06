'use strict';
//04/02/22

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
var buttons = {}; // Global list

const oldButtonCoordinates = {x: 0, y: 0, w: 0, h: 0}; // To store coordinates of previous buttons when drawing
const tooltipButton = new _tt(null, 'Segoe UI', _scale(10), 600);  // Global tooltip

let g_down = false;
let curBtn = null;

function calcNextButtonCoordinates(buttonCoordinates,  buttonOrientation = buttonsBar.config.buttonOrientation, recalc = true) {
	let newCoordinates;
	// This requires a panel reload after resizing
	// if (buttonOrientation === 'x') {
		// newCoordinates = {x: oldButtonCoordinates.x + buttonCoordinates.x , y: buttonCoordinates.y, w: buttonCoordinates.w, h: buttonCoordinates.h};
		// if (recalc) {oldButtonCoordinates.x += buttonCoordinates.x + buttonCoordinates.w;}
	// } else if (buttonOrientation === 'y') {
		// newCoordinates = {x: buttonCoordinates.x, y: oldButtonCoordinates.y + buttonCoordinates.y, w: buttonCoordinates.w, h: buttonCoordinates.h};
		// if (recalc) {oldButtonCoordinates.y += buttonCoordinates.y  + buttonCoordinates.h;}
	// }
	// This requires on_size_buttn() within on_size callback. Is equivalent to calculate the coordinates directly with inlined functions... but maintained here for compatibility purpose
	const x = _isFunction(buttonCoordinates.x) ? buttonCoordinates.x() : buttonCoordinates.x;
	const y = _isFunction(buttonCoordinates.y) ? buttonCoordinates.y() : buttonCoordinates.y;
	const w = _isFunction(buttonCoordinates.w) ? buttonCoordinates.w() : buttonCoordinates.w;
	const h = _isFunction(buttonCoordinates.h) ? buttonCoordinates.h() : buttonCoordinates.h;
	newCoordinates = {x: oldButtonCoordinates.x + x , y: oldButtonCoordinates.y + y, w, h};
	if (buttonOrientation.toLowerCase() === 'x') {
		if (recalc) {oldButtonCoordinates.x += x + w; oldButtonCoordinates.h = Math.max(oldButtonCoordinates.h, h);}
		if (buttonsBar.config.bReflow && oldButtonCoordinates.x  > window.Width) {
			newCoordinates.x = x;
			newCoordinates.y = oldButtonCoordinates.y + oldButtonCoordinates.h;
			oldButtonCoordinates.x = x + w;
			oldButtonCoordinates.y = newCoordinates.y;
		}
	} else if (buttonOrientation.toLowerCase() === 'y') {
		if (recalc) {oldButtonCoordinates.y += y + h; oldButtonCoordinates.w = Math.max(oldButtonCoordinates.w, w);}
		if (buttonsBar.config.bReflow && oldButtonCoordinates.y  > window.Height) {
			newCoordinates.y = y;
			newCoordinates.x = oldButtonCoordinates.x + oldButtonCoordinates.w;
			oldButtonCoordinates.y = y + h;
			oldButtonCoordinates.x = newCoordinates.x;
		}
	}
	return newCoordinates;
}

function SimpleButton(x, y, w, h, text, fonClick, state, g_font = _gdiFont('Segoe UI', 12), description, prefix = '', buttonsProperties = {}, icon = null, g_font_icon = _gdiFont('FontAwesome', 12)) {
	this.state = state ? state : buttonStates.normal;
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
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
		const x_calc = _isFunction(this.x) ? this.x() : this.x;
		const y_calc = _isFunction(this.y) ? this.y() : this.y;
		const w_calc = _isFunction(this.w) ? this.w() : this.w;
		const h_calc = _isFunction(this.h) ? this.h() : this.h;
		return (x_calc <= x) && (x <= x_calc + w_calc) && (y_calc <= y) && (y <= y_calc + h_calc );
	};

	this.changeState = function (state) {
		let old = this.state;
		this.state = state;
		return old;
	};

	this.draw = function (gr, x = this.moveX || this.x, y = this.moveY || this.y) {
		if (this.state === buttonStates.hide) {
			return;
		}

		switch (this.state) {
			case buttonStates.normal:
				this.g_theme.SetPartAndStateID(buttonsBar.config.partAndStateID, 1);
				break;

			case buttonStates.hover:
				tooltipButton.SetValue( (buttonsBar.config.bShowID ? this.descriptionWithID(this) : (_isFunction(this.description) ? this.description(this) : this.description) ) , true); // ID or just description, according to string or func.
				this.g_theme.SetPartAndStateID(buttonsBar.config.partAndStateID, 2);
				break;

			case buttonStates.down:
				this.g_theme.SetPartAndStateID(buttonsBar.config.partAndStateID, 3);
				break;

			case buttonStates.hide:
				return;
		}
		
		const x_calc = _isFunction(x) ? x() : x;
		const y_calc = _isFunction(y) ? y() : y;
		const w_calc = _isFunction(this.w) ? this.w() : this.w;
		const h_calc = _isFunction(this.h) ? this.h() : this.h;
		
		this.g_theme.DrawThemeBackground(gr, x_calc, y_calc, w_calc, h_calc);
		if (this.icon !== null) {
			let iconWidthCalculated = _isFunction(this.icon) ? this.iconWidth() : this.iconWidth;
			let textWidthCalculated = _isFunction(this.text) ? this.textWidth() : this.textWidth;
			let iconCalculated = _isFunction(this.icon) ? this.icon() : this.icon;
			let textCalculated = _isFunction(this.text) ? this.text() : this.text;
			gr.GdiDrawText(iconCalculated, this.g_font_icon, buttonsBar.config.textColor, x_calc - iconWidthCalculated / 5 - textWidthCalculated / 2, y_calc, w_calc, h_calc, DT_CENTER | DT_VCENTER | DT_CALCRECT | DT_NOPREFIX); // Icon
			gr.GdiDrawText(textCalculated, this.g_font, buttonsBar.config.textColor, x_calc + iconWidthCalculated, y_calc, w_calc, h_calc, DT_CENTER | DT_VCENTER | DT_CALCRECT | DT_NOPREFIX); // Text
		} else {
			let textCalculated = _isFunction(this.text) ? this.text() : this.text;
			gr.GdiDrawText(textCalculated, this.g_font, buttonsBar.config.textColor, x_calc, y_calc, w_calc, h_calc, DT_CENTER | DT_VCENTER | DT_CALCRECT | DT_NOPREFIX); // Text
		}
	};

	this.onClick = function (mask) {
		this.fonClick && this.fonClick(mask);
	};
}

function drawAllButtons(gr) {
	for (let key in buttons) {
		if (Object.prototype.hasOwnProperty.call(buttons, key)) {
			buttons[key].draw(gr);
		}
	}
}

function chooseButton(x, y) {
	let i = 0;
	for (let key in buttons) {
		if (Object.prototype.hasOwnProperty.call(buttons, key)) {
			if (buttons[key].containXY(x, y) && buttons[key].state !== buttonStates.hide) {
				return [buttons[key], key, i];
			}
		}
		i++;
	}
	return [null, null, null];
}

function on_paint(gr) {
	// Toolbar
	if (buttonsBar.config.bToolbar){
		if (oldButtonCoordinates.x < window.Width) {gr.FillSolidRect(0, 0, window.Width, window.Height, buttonsBar.config.toolbarColor);} // Toolbar color fix
		else {gr.FillSolidRect(0, 0, window.Width, window.Height, utils.GetSysColour(15));} // Default
	}
	// Buttons
	drawAllButtons(gr);
	// Drag n drop buttons
	if (buttonsBar.move.bIsMoving) {gr.DrawRect(buttonsBar.move.rec.x, buttonsBar.move.rec.y, buttonsBar.move.rec.w, buttonsBar.move.rec.h, 2, invert(buttonsBar.config.toolbarColor))}
}

function on_mouse_move(x, y, mask) {
	let old = curBtn;
	let curBtnKey = '';
	let curBtnIdx = -1;
	[curBtn, curBtnKey, curBtnIdx] = chooseButton(x, y);

	if (old === curBtn) {
		if (g_down) {
			return;
		}
	} else if (g_down && curBtn && curBtn.state !== buttonStates.down) {
		curBtn.changeState(buttonStates.down);
		window.Repaint();
		return;
	} 
	
	//Tooltip fix
	if (old !== null) {
		if (curBtn === null) {tooltipButton.Deactivate();} // Needed because tooltip is only activated/deactivated on redrawing... 
															// otherwise it shows on empty spaces after leaving a button.
		else if (old !== curBtn && old.description === curBtn.description) { 	// This forces redraw even if buttons have the same text!
			tooltipButton.Deactivate();											// Updates position but tooltip becomes slower since it sets delay time to initial... 
			tooltipButton.SetDelayTime(3, 0); //TTDT_INITIAL
		} else {tooltipButton.SetDelayTime(3, tooltipButton.oldDelay);} 
	}
	old && old.changeState(buttonStates.normal);
	curBtn && curBtn.changeState(buttonStates.hover);
	// Toolbar Tooltip
	if (!curBtn && buttonsBar.config.toolbarTooltip.length) {
		tooltipButton.SetValue(buttonsBar.config.toolbarTooltip , true);
	}
	// Move buttons
	if (curBtn) {
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
				buttonsBar.move.rec.x = buttons[fKey].x;
				buttonsBar.move.rec.y = buttons[fKey].y;
				buttonsBar.move.rec.w = fKey !== lKey ? buttons[lKey].x + buttons[lKey].w - buttonsBar.move.rec.x : buttons[fKey].w;
				buttonsBar.move.rec.h = buttons[fKey].h;
			} else {
				buttonsBar.move.bIsMoving = true;
				buttonsBar.move.btn = curBtn;
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
			buttonsBar.move.rec.x = null;
			buttonsBar.move.rec.y = null;
			buttonsBar.move.rec.w = null;
			buttonsBar.move.rec.h = null;
		}
		for (let key in buttons) {if (buttons[key] !== buttonsBar.move.btn) {buttons[key].moveX = null; buttons[key].moveY = null;}}
	} else {
		for (let key in buttons) {buttons[key].moveX = null; buttons[key].moveY = null;}
	}
	window.Repaint();
}

function on_mouse_leave() {
	g_down = false;

	if (curBtn) {
		curBtn.changeState(buttonStates.normal);
		window.Repaint();
	}
}

function on_mouse_lbtn_down(x, y, mask) {
	g_down = true;
	if (curBtn) {
		curBtn.changeState(buttonStates.down);
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
	g_down = false;
	if (curBtn) {
		curBtn.onClick(mask);
		if (curBtn) { // Solves error if you create a new Whsell Popup (curBtn becomes null) after pressing the button and firing curBtn.onClick()
			curBtn.changeState(buttonStates.hover);
			window.Repaint();
		}
	} else if (mask === MK_SHIFT) {
		if (buttonsBar.hasOwnProperty('shiftMenu')) {buttonsBar.shiftMenu().btn_up(x, this.y + this.h);}
	}
}

function on_key_down(k) { // Update tooltip with key mask if required
	for (let key in buttons) {
		if (Object.prototype.hasOwnProperty.call(buttons, key)) {
			if (buttons[key].state === buttonStates.hover) {
				const that = buttons[key];
				tooltipButton.SetValue( (buttonsBar.config.bShowID ? that.descriptionWithID(that) : (_isFunction(that.description) ? that.description(that) : that.description) ) , true); // ID or just description, according to string or func.
			}
		}
	}
}

function on_key_up(k) {
	for (let key in buttons) {
		if (Object.prototype.hasOwnProperty.call(buttons, key)) {
			if (buttons[key].state === buttonStates.hover) {
				const that = buttons[key];
				tooltipButton.SetValue( (buttonsBar.config.bShowID ? that.descriptionWithID(that) : (_isFunction(that.description) ? that.description(that) : that.description) ) , true); // ID or just description, according to string or func.
			}
		}
	}
}

function on_size() {
	if (buttonsBar.config.buttonOrientation.toLowerCase() === 'x') {oldButtonCoordinates.x = 0;}
	else if (buttonsBar.config.buttonOrientation.toLowerCase() === 'y') {oldButtonCoordinates.y = 0;}
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
	// Since properties have a prefix according to their loading order when there are multiple instances of the same
	// script, moving a button when there other 'clones' means the other buttons may get their properties names
	// shifted by one. They need to be adjusted or buttons at greater indexes will inherit properties from lower ones!
	const properties = buttonsBar.list[toPos];
	const keys = properties ? Object.keys(properties) : [];
	if (keys.length) {
		const prefix = properties[Object.keys(properties)[0]][0].split('_')[0];
		const currentId = prefix.slice(0, prefix.length - 1);
		let currentIdNumber = 0;
		// Just rewrite all Ids with same prefix
		buttonsBar.list.forEach((oldProperties, newIdx) => {
			const oldKeys = oldProperties ? Object.keys(oldProperties) : [];
			if (oldKeys.length) {
				const oldPrefix = oldProperties[oldKeys[0]][0].split('_')[0];
				const oldId = oldPrefix.slice(0, oldPrefix.length - 1);
				if (oldId === currentId) {
					const backup = getPropertiesPairs(oldProperties, '', 0, false); // First refresh from panel
					deleteProperties(oldProperties); // Delete it at panel
					for (const key in backup) { // Update Id
						if (!backup.hasOwnProperty(key)) {continue;}
						backup[key][0] = backup[key][0].replace(oldPrefix, oldId + currentIdNumber);
					}
					setProperties(backup, '', 0, false, true); // And restore at new position
					if (oldPrefix !== prefix) {currentIdNumber++;}
				}
			}
		});
	}
	window.Reload();
}