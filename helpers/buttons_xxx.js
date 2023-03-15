'use strict';
//15/03/23

include('helpers_xxx_basic_js.js');
include('helpers_xxx_prototypes.js');
include('helpers_xxx_UI.js');
include('helpers_xxx_flags.js');
include('callbacks_xxx.js');

/* 
	This is the framework to create buttons as new objects with its own properties and tooltips. They can be merged and loaded multiple times
	as new buttons instances on the same toolbar. Coordinates get updated when loading multiple buttons, removing the need to manually set them.
	Check '_buttons_blank.js' to see the universal buttons structure. It loads on foobar2000 but does nothing, it's just empty.
	Check '_buttons_blank_merged.js' to see the universal structure for merging buttons, creating an entire bar
	Check '_buttons_example.js' for a working example of buttons within foobar2000.
	Check '_buttons_example_merged.js' for a working example of a buttons bar within foobar2000.
	Check '_buttons_example_merged_double.js' for a working example of merging multiple buttons and bars within foobar2000.
*/

const buttonsBar = {};
// General config
buttonsBar.config = {
	bShowID: true, // Show Prefixes + ID on tooltips
	toolbarTooltip: '', // Shown on toolbar
	toolbarColor: utils.GetSysColour(15),
	toolbarTransparency: 0,
	bToolbar: false, // Change this on buttons bars files to set the background color
	textColor: RGB(0,0,0),
	buttonColor: -1,
	activeColor: RGB(0, 163, 240),
	animationColors: [RGBA(10, 120, 204, 50), RGBA(199, 231, 255, 30)],
	orientation: 'x',
	bReflow: false,
	bAlignSize: true,
	bUseThemeManager: true,
	partAndStateID: 1, // 1 standard button, 6  bg/border button (+hover)
	scale: _scale(0.7, false),
	bIconMode: false,
	bIconModeExpand: false,
	bUseCursors: true,
	bIconInvert: false
};
buttonsBar.config.default = Object.fromEntries(Object.entries(buttonsBar.config));
// Drag n drop (internal use)
buttonsBar.move = {bIsMoving: false, btn: null, moveX: null, moveY: null, fromKey: null, toKey: null, rec: {x: null, y: null, w: null, h: null}, last: -1};
// Button objs
buttonsBar.list = []; // Button properties grouped per script
buttonsBar.listKeys = []; // Button names grouped per script (and found at buttons obj)
buttonsBar.propertiesPrefixes = new Set(); // Global properties names prefixes
buttonsBar.buttons = {}; // Global list
// Others (internal use)
buttonsBar.oldButtonCoordinates = {x: 0, y: 0, w: 0, h: 0}; // To store coordinates of previous buttons when drawing
buttonsBar.tooltipButton = new _tt(null, globFonts.tooltip.name, _scale(globFonts.tooltip.size), 600);  // Global tooltip
buttonsBar.gDown = false;
buttonsBar.curBtn = null;
buttonsBar.useThemeManager = function useThemeManager() {
	return (this.config.bUseThemeManager && this.config.partAndStateID === 1);
}

function calcNextButtonCoordinates(coord, buttonOrientation = buttonsBar.config.orientation, recalc = true) {
	let newCoordinates;
	const orientation = buttonOrientation.toLowerCase();
	const old = buttonsBar.oldButtonCoordinates;
	const bFirstButton = !old[orientation] ? true : false;
	const keys = ['x','y','w','h'];
	const bFuncCoord = Object.fromEntries(keys.map((c) => {return [c, isFunction(coord[c])];}));
	const iCoord = Object.fromEntries(keys.map((c) => {return [c, bFuncCoord[c] ? coord[c]() : coord[c]];}));
	newCoordinates = Object.fromEntries(keys.map((c) => {return [c, bFuncCoord[c] ? () => {return old[c] + coord[c]();} : (c !== 'h' && c !== 'w'? old[c] : 0) + iCoord[c]];}));
	let cache = {w: old.w, h: old.h};
	if (recalc) {
		if (orientation === 'x') {old.x += iCoord.x + iCoord.w; old.h = Math.max(old.h, iCoord.h);}
		else if (orientation === 'y') {old.y += iCoord.y + iCoord.h; old.w = Math.max(old.w, iCoord.w);}
	}
	if (buttonsBar.config.bReflow && !bFirstButton) {
		if (orientation === 'x' && old.x  > window.Width) {
			newCoordinates.x = coord.x;
			newCoordinates.y = old.y + cache.h;
			old.x = iCoord.x + iCoord.w;
			old.y = newCoordinates.y;
		} else if (orientation === 'y' && old.y  > window.Height) {
			newCoordinates.y = coord.y;
			newCoordinates.x = old.x + cache.w;
			old.y = iCoord.y + iCoord.h;
			old.x = newCoordinates.x;
		}
	}
	return newCoordinates;
}

function themedButton(
		coordinates, 
		text, 
		func, 
		state,
		gFont = _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale),
		description,
		prefix = '',
		buttonsProperties = {},
		icon = null,
		gFontIcon = _gdiFont(globFonts.buttonIcon.name, globFonts.buttonIcon.size * buttonsBar.config.scale),
		variables = null,
		listener = null,
		onInit = null
	) {
	this.name = '';
	this.state = state ? state : buttonStates.normal;
	this.animation = []; /* {bActive, condition, animStep} */
	this.highlight = false;
	this.active = false;
	this.x = this.currX = coordinates.x * buttonsBar.config.scale;
	this.y = this.currY = coordinates.y * buttonsBar.config.scale;
	this.w = this.currW = coordinates.w * buttonsBar.config.scale;
	this.h = this.currH = coordinates.h * buttonsBar.config.scale;
	this.moveX = null;
	this.moveY = null;
	this.originalWindowWidth = window.Width;
	this.g_theme = buttonsBar.useThemeManager() ? window.CreateThemeManager('Button') : null;
	this.gFont = gFont;
	this.gFontIcon = gFontIcon;
	this.description = description;
	this.text = text;
	this.textWidth  = isFunction(this.text) ? (parent) => {return _gr.CalcTextWidth(this.text(parent), gFont);} : _gr.CalcTextWidth(this.text, gFont);
	this.iconImage = this.gFontIcon === null;
	if (this.iconImage) {
		this.icon = icon; 
		this.iconWidth = null;
	} else {
		// if using the default font, then it has probably failed to load the right one, skip icon
		this.icon = this.gFontIcon.Name !== 'Microsoft Sans Serif' ? icon : null; 
		this.iconWidth = isFunction(this.icon) ? (parent) => {return _gr.CalcTextWidth(this.icon(parent), gFontIcon);} : _gr.CalcTextWidth(this.icon, gFontIcon);
	}
	this.func = func;
	this.prefix = prefix; // This let us identify properties later for different instances of the same button, like an unique ID
	this.descriptionWithID = isFunction(this.description) ? (parent) => {return (this.prefix ? this.prefix.replace('_','') + ': ' + this.description(parent) : this.description(parent));} : () => {return (this.prefix ? this.prefix.replace('_','') + ': ' + this.description : this.description);}; // Adds prefix to description, whether it's a func or a string
	this.buttonsProperties = Object.assign({}, buttonsProperties); // Clone properties for later use
	this.bIconMode = false;
	this.bIconModeExpand = false;
	
	this.containXY = function (x, y) {
		return (this.currX <= x) && (x <= this.currX + this.currW) && (this.currY <= y) && (y <= this.currY + this.currH);
	};
	
	this.changeState = function (state) {
		let old = this.state;
		this.state = state;
		return old;
	};
	
	this.switchActive = function (bActive = null) {
		this.active = bActive !== null ? bActive : !this.active;
		window.Repaint();
	};
	
	this.switchAnimation = function (name, bActive, condition = null, animationColors = buttonsBar.config.animationColors) {
		const idx = this.animation.findIndex((obj) => {return obj.name === name;});
		if (idx !== -1) { // Deactivated ones must be removed using this.cleanAnimation() afterwards
			this.animation[idx].bActive = bActive;
			this.animation[idx].condition = bActive ? condition : null;
			this.animation[idx].animStep = bActive ? 0 : -1;
			this.animation[idx].date = bActive ? Date.now() : -1;
			this.animation[idx].colors = animationColors;
		} else {
			this.animation.push({name, bActive, condition, animStep: bActive ? 0 : -1, date: bActive ? Date.now() : -1, colors: animationColors});
		}
		throttledRepaint();
	};
	
	this.switcHighlight = function (bActive = null) {
		this.highlight =  bActive !== null ? bActive : !this.highlight;
		window.Repaint();
	};
	
	this.cleanAnimation = function () {
		if (this.animation.length) {this.animation = this.animation.filter((animation) => {return animation.bActive;});}
	};
	
	this.isAnimationActive = function (name) {
		const idx = this.animation.findIndex((obj) => {return obj.name === name;});
		return (idx !== -1 && this.animation[idx].bActive);
	};
	
	this.isAnyAnimationActive = function () {
		return this.animation.some((obj) => {return obj.bActive;});
	};
	
	this.getAnimationText = function () {
		return (this.isAnyAnimationActive() ? 'Currently processing: ' + this.animation.map((ani) => ani.name).join(', ') + '\n' : '');
	};
	
	this.headerText = function () {
		const name = (isFunction(this.text) ? this.text(this) : this.text) || (this.defText && isFunction(this.defText) ? this.defText(this) : this.defText || '')
		return (this.isIconMode() ? name + '\n-----------------------------------------------------\n' : '');
	};
	
	this.isIconMode = function () { // Either global or for current button
		return (((buttonsBar.config.bIconMode || this.bIconMode) && !this.bIconModeExpand) || !(isFunction(this.text) ? this.text(this) : this.text).length);
	}
	
	this.draw = function (gr, x = this.x, y = this.y, w = this.w, h = this.h, bAlign = false, bLast = false) {
		// Draw?
		if (this.state === buttonStates.hide) {return;}
		const bDrawBackground = buttonsBar.config.partAndStateID === 1;
		// Check SO allows button theme
		if (buttonsBar.useThemeManager() && !this.g_theme) { // may have been changed before drawing but initially not set
			this.g_theme = window.CreateThemeManager('Button');
			if (!this.g_theme) {
				buttonsBar.config.bUseThemeManager = false; 
				console.log('Buttons: window.CreateThemeManager(\'Button\') failed, using experimental buttons');
			}
		}
		if (buttonsBar.useThemeManager()) {
			// Themed Button states
			switch (this.state) {
				case buttonStates.normal: {
					this.g_theme.SetPartAndStateID(buttonsBar.config.partAndStateID, 1);
					break;
				}
				case buttonStates.hover: {
					if (!buttonsBar.move.bIsMoving) {
						buttonsBar.tooltipButton.SetValue(
							this.getAnimationText() + this.headerText() + (buttonsBar.config.bShowID 
								? this.descriptionWithID(this) 
								: (isFunction(this.description) 
									? this.description(this) 
									: this.description)
						), true); // ID or just description, according to string or func.
					}
					this.g_theme.SetPartAndStateID(buttonsBar.config.partAndStateID, 2);
					break;
				}
				case buttonStates.down: {
					this.g_theme.SetPartAndStateID(buttonsBar.config.partAndStateID, 3);
					break;
				}
				case buttonStates.hide: {
					return;
				}
			}
		}
		const bIconMode = this.isIconMode();
		const textCalculated = bIconMode
			? ''
			: isFunction(this.text) ? this.text(this) : this.text;
		if (bIconMode) {
			w = 30;
			w *= buttonsBar.config.scale;
		}
		// New coordinates must be calculated and stored to interact with UI
		let {x: xCalc, y: yCalc, w: wCalc, h: hCalc} = calcNextButtonCoordinates({x, y, w, h});
		this.currX = xCalc; this.currY = yCalc; this.currW = wCalc; this.currH = hCalc;
		// When moving buttons, the button may be drawn at another position though
		if (this.moveX) {xCalc = this.moveX;}
		if (this.moveY) {yCalc = this.moveY;}
		// Draw button
		if (buttonsBar.useThemeManager()) {this.g_theme.DrawThemeBackground(gr, xCalc, yCalc, wCalc, hCalc);}
		else {
			const x = xCalc + 1; const y = yCalc; const w = wCalc - 4; const h = hCalc - 2; const arc = 3;
			gr.SetSmoothingMode(2); // Antialias for lines
			const toolbarAlpha = Math.max(0, Math.min(buttonsBar.config.toolbarTransparency, 100));
			switch (this.state) {
				case buttonStates.normal:
					if (bDrawBackground) {
						gr.FillRoundRect(x, y, w, h, arc, arc, RGB(240,240,240));
						gr.FillGradRect(x, y + 2, w, h / 2 - 2, 180, RGB(241,241,241), RGB(235,235,235));
						gr.FillGradRect(x, y + h / 2, w, h - 10, 180, RGB(219,219,219), RGB(207,207,207));
						gr.DrawRoundRect(x, y, w, h, arc, arc, 1, RGB(0,0,0));
						gr.DrawRoundRect(x + 1, y + 1, w - 2, h - 2, arc, arc, 1, RGB(243,243,243));
					} else if (buttonsBar.config.buttonColor !== -1) {
						if (toolbarAlpha) {gr.FillRoundRect(x, y, w, h, arc, arc, opaqueColor(buttonsBar.config.buttonColor, toolbarAlpha));}
						gr.DrawRoundRect(x + 1, y + 1, w - 2, h - 2, arc, arc, 1, opaqueColor(buttonsBar.config.buttonColor, 50));
					}
					break;
				case buttonStates.hover:
					buttonsBar.tooltipButton.SetValue(
						this.getAnimationText() + this.headerText() + (buttonsBar.config.bShowID
							? this.descriptionWithID(this)
							: (isFunction(this.description)
								? this.description(this)
								: this.description)
					) , true); // ID or just description, according to string or func.
					if (bDrawBackground) {
						gr.FillRoundRect(x, y, w, h, arc, arc, RGB(240,240,240));
						gr.FillGradRect(x, y + 2, w, h / 2 - 2, 180, RGB(241,241,241), RGB(235,235,235));
						gr.FillGradRect(x, y + h / 2, w, h - 10, 180, RGB(219,219,219), RGB(207,207,207));
						gr.DrawRoundRect(x, y, w, h, arc, arc, 1, RGB(0,0,0));
					} else {
						gr.DrawRoundRect(x, y, w, h, arc, arc, 1, RGB(160,160,160));
					}
					gr.DrawRoundRect(x + 1, y + 1, w - 2, h - 2, arc, arc, 1, RGB(243,243,243));
					if (bDrawBackground) {
						gr.FillRoundRect(x, y + 1, w, h / 2 - 1, arc, arc, RGBA(225,243,252,255));
						gr.FillRoundRect(x, y + h / 2, w, h / 2, arc, arc, RGBA(17,166,248,50));
					} else {
						gr.FillRoundRect(x, y + 1, w, h / 2 - 1, arc, arc, RGBA(255,255,255,50));
						gr.FillRoundRect(x, y + h / 2, w, h / 2, arc, arc, RGBA(0,0,0,10));
					}
					break;
				case buttonStates.down:
					if (bDrawBackground) {
						gr.FillRoundRect(x, y, w, h, arc, arc, RGB(240,240,240));
						gr.FillGradRect(x, y + 2, w, h / 2 - 2, 180, RGB(241,241,241), RGB(235,235,235));
						gr.FillGradRect(x, y + h / 2, w, h - 10, 180, RGB(219,219,219), RGB(207,207,207));
					}
					if (bDrawBackground) {
						gr.DrawRoundRect(x + 1, y + 1, w - 2, h - 2, arc, arc, 1, RGB(243,243,243));
						gr.FillRoundRect(x, y, w, h / 2, arc, arc, RGBA(225,243,252,255));
						gr.FillRoundRect(x, y + h / 2, w, h, arc, arc, RGBA(37,196,255,80));
						gr.DrawRoundRect(x + 1, y + 1, w - 2, h - 2, arc, arc, 3, RGBA(0,0,0,50));
					} else {
						if (buttonsBar.config.buttonColor !== -1) {
							gr.FillRoundRect(x, y, w, h, arc, arc, opaqueColor(invert(invert(buttonsBar.config.buttonColor,  true)), 5));
							gr.FillRoundRect(x, y, w, h / 8, arc / 4, arc / 4, opaqueColor(buttonsBar.config.buttonColor, 25));
							gr.FillRoundRect(x, y, w, h / 6, arc / 4, arc / 4, opaqueColor(buttonsBar.config.buttonColor, 25));
							gr.FillRoundRect(x, y + h / 6, w, h / 6, arc / 4, arc / 4, opaqueColor(buttonsBar.config.buttonColor, 10));
							gr.FillRoundRect(x, y, w, h, arc / 2, arc / 2, opaqueColor(buttonsBar.config.buttonColor, 10));
						} else if (buttonsBar.config.bToolbar) {
							const base = invert(buttonsBar.config.toolbarColor, true);
							const rgbBase = toRGB(base);
							const alpha = isDark(...rgbBase) ? 20 : 80;
							gr.FillRoundRect(x, y, w, h, arc, arc, opaqueColor(base, 10));
							gr.FillRoundRect(x, y, w, h / 8, arc / 4, arc / 4, RGBA(...rgbBase, alpha));
							gr.FillRoundRect(x, y, w, h / 6, arc / 4, arc / 4, RGBA(...rgbBase, alpha));
							gr.FillRoundRect(x, y + h / 6, w, h / 6, arc / 4, arc / 4, RGBA(...rgbBase, alpha / 2));
							gr.FillRoundRect(x, y, w, h, arc / 2, arc / 2, RGBA(...rgbBase, alpha / 2));
						} else {
							gr.FillRoundRect(x, y, w, h / 8, arc / 4, arc / 4, RGBA(0,0,0,20));
							gr.FillRoundRect(x, y, w, h / 6, arc / 4, arc / 4, RGBA(0,0,0,20));
							gr.FillRoundRect(x, y + h / 6, w, h / 6, arc / 4, arc / 4, RGBA(0,0,0,10));
							gr.FillRoundRect(x, y, w, h, arc / 2, arc / 2, RGBA(0,0,0,10));
						}
					}
					if (buttonsBar.config.buttonColor !== -1) {
						if (buttonsBar.config.bToolbar) {
							gr.DrawRoundRect(x, y, w, h, arc, arc, 1, blendColors(invert(buttonsBar.config.toolbarColor,  true), buttonsBar.config.buttonColor, 0.4));
						} else {
							gr.DrawRoundRect(x, y, w, h, arc, arc, 1, invert(invert(buttonsBar.config.buttonColor,  true)));
						}
					} else if (buttonsBar.config.bToolbar) {
						gr.DrawRoundRect(x, y, w, h, arc, arc, 1, invert(buttonsBar.config.toolbarColor, true));
					} else {
						gr.DrawRoundRect(x, y, w, h, arc, arc, 1, RGB(0,0,0));
					}
					break;
				case buttonStates.hide:
					return;
			}
			gr.SetSmoothingMode(0);
		}
		// The rest...
		if (this.icon !== null) {
			let textOffsetX = 0;
			const iconCalculated = isFunction(this.icon) ? this.icon(this) : this.icon;
			const textWidthCalculated = bIconMode 
				? 0
				: isFunction(this.text) ? this.textWidth(this) : this.textWidth;
			if (this.iconImage) { // Icon image
				if (iconCalculated.length) {
					const iconCalculatedDarkMode = !isDark(...toRGB(buttonsBar.config.textColor)) ? iconCalculated.replace(/(\..*$)/i, '_dark$1') : null;
					const iconDarkMode = iconCalculatedDarkMode ? gdi.Image(iconCalculatedDarkMode) : null;
					let icon = iconDarkMode || gdi.Image(iconCalculated);
					if (icon) {
						if (buttonsBar.config.bIconInvert || iconCalculatedDarkMode && !iconDarkMode) {icon = icon.InvertColours();}
						icon = icon.Resize(16 * buttonsBar.config.scale, 16 * buttonsBar.config.scale, InterpolationMode.NearestNeighbor);
						const iconX = buttonsBar.config.orientation.toLowerCase() === 'x' && !bAlign // Align left on Y axis
							? xCalc + wCalc / 2 - (bIconMode ? icon.Width * 1/2 : icon.Width * 7/10) - textWidthCalculated / 2
							: xCalc + icon.Width / 2;
						gr.DrawImage(icon, iconX, yCalc + hCalc / 2 - icon.Height * 1/2, wCalc, hCalc, 0, 0, wCalc, hCalc, 0);
						textOffsetX = icon.Width * 7/10;
					} else {textOffsetX = 16 * buttonsBar.config.scale * 7/10;}
				}
			} else { // Icon text
				const iconWidthCalculated = isFunction(this.icon) ? this.iconWidth(this) : this.iconWidth;
				if (iconCalculated) { // Icon
					if (this.active) { // Draw copy of icon in background blurred
						let icon = gdi.CreateImage(this.gFontIcon.Size, this.gFontIcon.Size);
						const g = icon.GetGraphics();
						g.DrawString(iconCalculated, this.gFontIcon, tintColor(buttonsBar.config.activeColor, 50), 0, 0, this.gFontIcon.Size, this.gFontIcon.Size, DT_CENTER | DT_VCENTER | DT_CALCRECT | DT_NOPREFIX);
						icon = icon.Resize(this.gFontIcon.Size + 2, this.gFontIcon.Size + 2, InterpolationMode.Bilinear);
						icon.ReleaseGraphics(g);
						// Image gets shifted in x and y axis... since it's not using text flags
						const iconX = buttonsBar.config.orientation.toLowerCase() === 'x' && !bAlign // Align left on Y axis
							? xCalc + wCalc / 2 - (bIconMode ? iconWidthCalculated * 13/20 : iconWidthCalculated * 9/10) - textWidthCalculated / 2
							: xCalc + icon.Width * 3/5;
						gr.DrawImage(icon, iconX, yCalc + hCalc / 2 - iconWidthCalculated * 1/2, wCalc, hCalc, 0, 0, wCalc, hCalc, 0);
					}
					const iconX = buttonsBar.config.orientation.toLowerCase() === 'x' && !bAlign // Align left on Y axis
							? xCalc - (bIconMode ? 0 : iconWidthCalculated / 5) - textWidthCalculated / 2
							: xCalc - wCalc / 2 + iconWidthCalculated * 5/4;
					gr.GdiDrawText(iconCalculated, this.gFontIcon,  this.active ? buttonsBar.config.activeColor : buttonsBar.config.textColor, iconX, yCalc, wCalc, hCalc, DT_CENTER | DT_VCENTER | DT_CALCRECT | DT_NOPREFIX);
				}
				textOffsetX = iconWidthCalculated;
			}
			// Text
			gr.GdiDrawText(textCalculated, this.gFont, buttonsBar.config.textColor, xCalc + textOffsetX, yCalc, wCalc, hCalc, DT_CENTER | DT_VCENTER | DT_CALCRECT | DT_NOPREFIX);
		} else {
			gr.GdiDrawText(textCalculated, this.gFont, buttonsBar.config.textColor, xCalc, yCalc, wCalc, hCalc, DT_CENTER | DT_VCENTER | DT_CALCRECT | DT_NOPREFIX);
		}
		// Process all animations but only paint once
		let bDone = false;
		this.animation.forEach((animation) => {
			if (animation.bActive) {
				if (animation.condition && Object.prototype.toString.call(animation.condition) === '[object Promise]') {animation.condition.then((bEnd) => {if (bEnd) {this.switchAnimation(animation.name, false);}});}
				if (animation.condition && isFunction(animation.condition) && animation.condition()) {this.switchAnimation(animation.name, false);}
				else {
					if (!bDone) {
						bDone = true;
						const x = xCalc + 1; const y = yCalc; const w = wCalc - 4; const h = hCalc - 2;	const arc = 3;
						if (bDrawBackground) { // 90 degrees produces a glitch on the left at step = 2 XD so lets put 88...
							gr.FillGradRect(x, y + 1, w + 2, h, animation.animStep * 88, animation.colors[0], animation.colors[1], 1);
						} else {
							gr.FillGradRect(x, y + 1, w + 1, h, animation.animStep * 90, animation.colors[1], animation.colors[0], 0.5);
							gr.DrawRoundRect(x, y, w, h, arc, arc, 1, animation.colors[0]);
						}
						const now = Date.now();
						if (now - animation.date > 2000) {
							animation.animStep++;
							animation.date = now;
						}
						
					}
				}
				throttledRepaint();
			}
		});
		this.cleanAnimation(); // Remove finished ones
		// Process button highlighting
		if (this.highlight) {
			const x = xCalc + 1; const y = yCalc; const w = wCalc - 4; const h = hCalc - 2;
			gr.FillSolidRect(x, y, w, h, opaqueColor(invert(buttonsBar.config.toolbarColor), 15));
			gr.DrawRect(x, y, w, h, 1, invert(buttonsBar.config.toolbarColor));
		}
	};

	this.onClick = function (mask) {
		this.func && this.func(mask);
	};
	
	this.adjustButtonWidth = function (newName, offset = 30) {
		this.w = _gr.CalcTextWidth(newName, this.gFont) + offset;
		this.w *= buttonsBar.config.scale;
	};
	
	this.adjustNameWidth = function (newName, offset = 30) {
		this.text = newName;
		this.adjustButtonWidth(newName, offset);
		this.changeScale(buttonsBar.config.scale);
		window.Repaint();
	};

	this.changeScale = function (scale) {
		const newScale = scale / buttonsBar.config.scale;
		this.w *= newScale;
		this.h *= newScale;
		this.currH *= newScale;
		this.currW *= newScale;
		this.gFont = _gdiFont(this.gFont.Name, this.gFont.Size * newScale);
		this.textWidth  = isFunction(this.text) ? (parent) => {return _gr.CalcTextWidth(this.text(parent), this.gFont);} : _gr.CalcTextWidth(this.text, this.gFont);
		if (!this.iconImage) {
			this.gFontIcon = _gdiFont(this.gFontIcon.Name, this.gFontIcon.Size * newScale);
			this.iconWidth = isFunction(this.icon) ? (parent) => {return _gr.CalcTextWidth(this.icon(parent), this.gFontIcon);} : _gr.CalcTextWidth(this.icon, this.gFontIcon);
		}
	};
	
	if (variables) {
		if (typeof variables === 'object') {
			for (let key in variables) {
				if (isFunction(variables[key])) {
					this[key] = variables[key].bind(this, this);
				} else {
					this[key] = variables[key];
				}
			}
		} else {console.log('butttons_xxx: variables is not an object');}
		variables = null;
	}
	if (listener) {
		if (typeof listener === 'object') {
			for (let key in listener) {
				const func = listener[key].bind(this, this);
				addEventListener(key, func);
			}
		} else {console.log('butttons_xxx: listener is not an object');}
		listener = null;
	}
	if (onInit) {
		if (isFunction(onInit)) {onInit.call(this, this);}
		else {console.log('butttons_xxx: onInit is not a function');}
		onInit = null;
	}
}
const throttledRepaint = throttle(() => window.Repaint(), 1000);

function drawAllButtons(gr) {
	const orientation = buttonsBar.config.orientation.toLowerCase();
	const bAlignSize = buttonsBar.config.bAlignSize;
	const bReflow = buttonsBar.config.bReflow;
	// First calculate the max width or height so all buttons get aligned
	const maxSize = bAlignSize ? getButtonsMaxSize() : {w: -1, h: -1, totalW: 0, totalH: 0};
	const maxSizeNoReflow = getButtonsMaxSize(false);
	// Size check
	doOnce('Buttons Size Check', buttonSizeCheck)();
	// Then draw
	for (let key in buttonsBar.buttons) {
		if (Object.prototype.hasOwnProperty.call(buttonsBar.buttons, key)) {
			const button = buttonsBar.buttons[key];
			// Don't normalize size in certain axis if not needed
			if (bAlignSize && orientation === 'x') {
				const bNormalize = maxSize.totalW > window.Width && maxSizeNoReflow.totalW > window.Width;
				button.draw(gr, void(0), void(0), bReflow && bNormalize ? maxSize.w : void(0), maxSize.h, bReflow && bNormalize);
			} else if (bAlignSize && orientation === 'y') {
				const bNormalize = maxSize.totalH > window.Height && maxSizeNoReflow.totalH > window.Height;
				button.draw(gr, void(0), void(0), maxSize.w, bReflow && bNormalize ? maxSize.h : void(0), true);
			} else {
				button.draw(gr);
			}
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

addEventListener('on_paint', (gr) => {
	// Toolbar
	if (buttonsBar.config.bToolbar){
		gr.FillSolidRect(0, 0, window.Width, window.Height, buttonsBar.config.toolbarColor);
	}
	// Buttons
	for (let key in buttonsBar.oldButtonCoordinates) {
		if (!Object.prototype.hasOwnProperty.call(buttonsBar.oldButtonCoordinates, key)) {continue;}
		buttonsBar.oldButtonCoordinates[key] = 0;
	}
	drawAllButtons(gr);
	// Drag n drop buttons
	if (buttonsBar.move.bIsMoving && buttonsBar.move.toKey) {
		gr.FillSolidRect(buttonsBar.move.rec.x, buttonsBar.move.rec.y, buttonsBar.move.rec.w, buttonsBar.move.rec.h, opaqueColor(invert(buttonsBar.config.toolbarColor), 15));
		gr.DrawRect(buttonsBar.move.rec.x, buttonsBar.move.rec.y, buttonsBar.move.rec.w, buttonsBar.move.rec.h, 1, invert(buttonsBar.config.toolbarColor));
	}
});

addEventListener('on_mouse_move', (x, y, mask) => {
	let old = buttonsBar.curBtn;
	const buttons = buttonsBar.buttons;
	let curBtnKey = '';
	[buttonsBar.curBtn, curBtnKey, ] = chooseButton(x, y);
	
	if (old === buttonsBar.curBtn) {
		if (buttonsBar.gDown) {
			return;
		}
	} else if (buttonsBar.gDown && buttonsBar.curBtn && buttonsBar.curBtn.state !== buttonStates.down) {
		buttonsBar.curBtn.changeState(buttonStates.down);
		old && old.changeState(buttonStates.normal);
		window.Repaint();
		return;
	}
	
	// Cursors
	const toolbarKeysLen = buttonsBar.listKeys.length;
	if (buttonsBar.config.bUseCursors) {
		if (buttonsBar.move.bIsMoving && buttonsBar.move.btn && toolbarKeysLen) {
			const last = buttonsBar.buttons[buttonsBar.listKeys[toolbarKeysLen - 1].flat(Infinity).pop()];
			const maxX = last.currX + last.currW + _scale(5);
			const maxY = last.currY + last.currH + _scale(5);
			const axis = buttonsBar.config.orientation;
			if ((axis === 'y' && x < last.currX) || (axis === 'x' && y < last.currY) || x <= maxX && y <= maxY) {window.SetCursor(IDC_SIZEALL);}
			else {window.SetCursor(IDC_NO);}
		} else if (buttonsBar.curBtn) {window.SetCursor(IDC_HAND);}
		else {window.SetCursor(IDC_ARROW);}
	}
	
	//Tooltip fix
	if (old !== null) {
		// Needed because tooltip is only activated/deactivated on redrawing... otherwise it shows on empty spaces after leaving a button.
		if (buttonsBar.curBtn === null) {buttonsBar.tooltipButton.Deactivate();}
		// This forces redraw even if buttons have the same text! Updates position but tooltip becomes slower since it sets delay time to initial...
		else if (old !== buttonsBar.curBtn && old.description === buttonsBar.curBtn.description) {
			buttonsBar.tooltipButton.Deactivate();
			buttonsBar.tooltipButton.SetDelayTime(3, 0); //TTDT_INITIAL
		} else {buttonsBar.tooltipButton.SetDelayTime(3, buttonsBar.tooltipButton.oldDelay);} 
	}
	// Change button states when not moving them
	old && old.changeState(buttonStates.normal);
	if (!buttonsBar.move.bIsMoving) {
		buttonsBar.curBtn && buttonsBar.curBtn.changeState(buttonStates.hover);
		if (buttonsBar.config.bIconModeExpand && buttonsBar.config.orientation === 'x') {
			if (buttonsBar.curBtn && !buttonsBar.curBtn.bIconModeExpand) {
				const curBtn = buttonsBar.curBtn;
				let oldBtn = old && old !== buttonsBar.curBtn ? old : null;
				setTimeout(() => {
					if (buttonsBar.curBtn === curBtn) {
						curBtn.bIconModeExpand = true;
						if (oldBtn) { // In case mouse is moved fast, multiple buttons may be 'old'
							let bContract = false;
							for (let key in buttonsBar.buttons) {
								oldBtn = buttonsBar.buttons[key];
								if (oldBtn !== curBtn) {
									if (!bContract) {continue;}
									oldBtn.bIconModeExpand = false;
								} else {bContract = true;}
							}
						}
						window.Repaint();
					}
				}, 200);
			}
		}
	}
	// Toolbar Tooltip
	if (!buttonsBar.curBtn && buttonsBar.config.toolbarTooltip.length && !buttonsBar.move.bIsMoving) {
		buttonsBar.tooltipButton.SetValue(buttonsBar.config.toolbarTooltip , true);
	}
	// Disable on drag n drop
	if (buttonsBar.tooltipButton.bActive && buttonsBar.move.bIsMoving) {
		buttonsBar.tooltipButton.Deactivate();
		buttonsBar.tooltipButton.SetDelayTime(3, 0); //TTDT_INITIAL
	}
	// Move buttons
	let bInvalidMove = false;
	if (toolbarKeysLen > 0) {
		if (buttonsBar.curBtn && Object.keys(buttons).length > 1) {
			if (mask === MK_RBUTTON) {
				const key = buttonsBar.listKeys[toolbarKeysLen - 1].flat(Infinity).pop();
				const last = buttonsBar.buttons[key];
				const maxX = last.currX + last.currW + _scale(5);
				const maxY = last.currY + last.currH + _scale(5);
				const axis = buttonsBar.config.orientation;
				if ((axis === 'y' && x < last.currX) || (axis === 'x' && y < last.currY) || x <= maxX && y <= maxY) {
					if (buttonsBar.move.bIsMoving) {
						buttonsBar.move.toKey = curBtnKey;
						if (buttonsBar.move.btn) {
							buttonsBar.move.btn.moveX = x;
							buttonsBar.move.btn.moveY = y;
						}
						const toBtn = buttonsBar.listKeys.find((arr) => {return arr.indexOf(curBtnKey) !== -1;});
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
				}
			}
			const bValidMove = !!buttonsBar.move.toKey;
			if (mask !== MK_RBUTTON || !bValidMove) {
				if (buttonsBar.move.bIsMoving && bValidMove) {moveButton(buttonsBar.move.fromKey, buttonsBar.move.toKey);} // Forces window reload on successful move
				else {bInvalidMove = true;}
				buttonsBar.move.bIsMoving = false;
				if (buttonsBar.move.btn) {
					buttonsBar.move.btn.moveX = null;
					buttonsBar.move.btn.moveY = null;
					buttonsBar.move.btn = null;
				}
				buttonsBar.move.fromKey = null;
				buttonsBar.move.toKey = null;
				for (let key in buttonsBar.move.rec) {if (Object.prototype.hasOwnProperty.call(buttonsBar.move.rec, key)) {buttonsBar.move.rec[key] = null;}}
			}
			for (let key in buttons) {
				if (Object.prototype.hasOwnProperty.call(buttons, key)) {
					if (buttons[key] !== buttonsBar.move.btn) {buttons[key].moveX = null; buttons[key].moveY = null;}
				}
			}
		} else {
			for (let key in buttons) {if (Object.prototype.hasOwnProperty.call(buttons, key)) {buttons[key].moveX = null; buttons[key].moveY = null;}}
			for (let key in buttonsBar.move.rec) {if (Object.prototype.hasOwnProperty.call(buttons, key)) {buttonsBar.move.rec[key] = null;}}
			if (mask !== MK_RBUTTON) {
				buttonsBar.move.bIsMoving = false;
				if (buttonsBar.move.btn) {
					buttonsBar.move.btn.moveX = null;
					buttonsBar.move.btn.moveY = null;
					buttonsBar.move.btn = null;
				}
				buttonsBar.move.fromKey = null;
			}
			buttonsBar.move.toKey = null;
			bInvalidMove = true;
		}
		if (buttonsBar.move.bIsMoving || old || buttonsBar.curBtn || bInvalidMove) {window.Repaint();}
		if (buttonsBar.move.bIsMoving) { // Force drag n drop redraw even if mouse doesn't move
			const checkMove = () => {
				setTimeout(() => {
					if (Date.now() - buttonsBar.move.last > 250) {
						if (!utils.IsKeyPressed(0x02)) {
							// Disable drag n drop
							on_mouse_move(x, y); 
							// Force state on current hovered button
							buttonsBar.curBtn = null;
							on_mouse_move(x, y);
						} else {checkMove();} // Repeat if nothing has changed
					}
				}, 500)
			};
			checkMove();
			buttonsBar.move.last = Date.now();
		}
	} else if (old || buttonsBar.curBtn) {window.Repaint();}
});

addEventListener('on_mouse_leave', () => {
	buttonsBar.gDown = false;
	if (buttonsBar.curBtn) {
		buttonsBar.curBtn.changeState(buttonStates.normal);
		window.Repaint();
		buttonsBar.curBtn = null;
	}
	if (buttonsBar.config.bIconModeExpand) {
		let bDone = false;
		for (let key in buttonsBar.buttons) {
			if (buttonsBar.buttons[key].bIconModeExpand) {bDone = true; break;}
		}
		if (bDone) {
			setTimeout(() => {
				for (let key in buttonsBar.buttons) {
					buttonsBar.buttons[key].bIconModeExpand = false;
				}
				window.Repaint();
			}, 200);
		}
	}
	if (buttonsBar.config.bUseCursors) {window.SetCursor(IDC_ARROW);}
});

addEventListener('on_mouse_lbtn_down', (x, y, mask) => {
	buttonsBar.gDown = true;
	if (buttonsBar.curBtn) {
		buttonsBar.curBtn.changeState(buttonStates.down);
		window.Repaint();
	}
});

addEventListener('on_mouse_rbtn_up', (x, y, mask) => {
	// Must return true, if you want to suppress the default context menu.
	// Note: left shift + left windows key will bypass this callback and will open default context menu.
	buttonsBar.move.bIsMoving && on_mouse_move(x, y); // Force drag n drop redraw
	return buttonsBar.hasOwnProperty('menu') ? buttonsBar.menu().btn_up(x, y) : false;
});

addEventListener('on_mouse_lbtn_up', (x, y, mask) => {
	buttonsBar.gDown = false;
	if (buttonsBar.curBtn) {
		buttonsBar.curBtn.onClick(mask);
		// Solves error if you create a new Whsell Popup (curBtn becomes null) after pressing the button and firing curBtn.onClick()
		if (buttonsBar.curBtn && window.IsVisible) {
			buttonsBar.curBtn.changeState(buttonStates.hover);
			window.Repaint();
		}
	} else if (mask === MK_SHIFT) {
		if (buttonsBar.hasOwnProperty('shiftMenu')) {buttonsBar.shiftMenu().btn_up(x, this.y + this.h);}
	}
});

addEventListener('on_key_down', (k) => { // Update tooltip with key mask if required
	for (let key in buttonsBar.buttons) {
		if (Object.prototype.hasOwnProperty.call(buttonsBar.buttons, key)) {
			if (buttonsBar.buttons[key].state === buttonStates.hover) {
				const that = buttonsBar.buttons[key];
				buttonsBar.tooltipButton.SetValue( (buttonsBar.config.bShowID ? that.descriptionWithID(that) : (isFunction(that.description) ? that.description(that) : that.description) ) , true); // ID or just description, according to string or func.
			}
		}
	}
});

addEventListener('on_key_up', (k) => {
	for (let key in buttonsBar.buttons) {
		if (Object.prototype.hasOwnProperty.call(buttonsBar.buttons, key)) {
			if (buttonsBar.buttons[key].state === buttonStates.hover) {
				const that = buttonsBar.buttons[key];
				buttonsBar.tooltipButton.SetValue( (buttonsBar.config.bShowID ? that.descriptionWithID(that) : (isFunction(that.description) ? that.description(that) : that.description) ) , true); // ID or just description, according to string or func.
			}
		}
	}
});

function getUniquePrefix(string, sep = '_') {
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
	if (typeof buttonsPath === 'undefined' || typeof barProperties === 'undefined' || !buttonsBar.listKeys.length) {console.log('Buttons: Can not move buttons in current script.'); return;}
	if (fromKey === toKey) {return;}
	const fromPos = buttonsBar.listKeys.findIndex((arr) => {return arr.indexOf(fromKey) !== -1;});
	const toPos = buttonsBar.listKeys.findIndex((arr) => {return arr.indexOf(toKey) !== -1;});
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
		const prefix = properties[Object.keys(properties)[0]][0].match(/([A-z]*[0-9]*)(_*[0-9]*\.)/)[1]; // plto3_01. or plt3. -> plto3
		const currentId = prefix.match(/([A-z]*)(?:[0-9]*)/)[1]; // plto
		let currentIdNumber = 0;
		// Backup all properties
		const propertiesBack = buttonsBar.list.map((oldProperties) => {return getPropertiesPairs(oldProperties, '', 0, false);});
		// Just rewrite all Ids with same prefix
		buttonsBar.list.forEach((oldProperties, newIdx) => {
			const oldKeys = oldProperties ? Object.keys(oldProperties) : [];
			if (oldKeys.length) {
				const oldPrefix = oldProperties[oldKeys[0]][0].match(/([A-z]*[0-9]*)(_*[0-9]*\.)/)[1];
				const oldId = oldPrefix.match(/([A-z]*)(?:[0-9]*)/)[1];
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
	// Add extra variables
	for (let buttonName in newButtons) {
		const button = newButtons[buttonName];
		// Add names to objects
		button.name = buttonName;
		// Add icons mode
		if (button.buttonsProperties.hasOwnProperty('bIconMode')) {
			button.bIconMode = button.buttonsProperties.bIconMode[1];
		}
	}
	buttonsBar.buttons = {...buttonsBar.buttons, ...newButtons};
	return newButtons;
}

function buttonSizeCheck () {
	const orientation = buttonsBar.config.orientation.toLowerCase();
	const maxSize = getButtonsMaxSize();
	if (buttonsBar.config.scale > 1 && maxSize.x > -1) {
		if (orientation === 'x' && maxSize.h > window.Height || orientation === 'y' && maxSize.w > window.Width) {
			fb.ShowPopupMessage('Buttons ' + (orientation === 'x' ? 'height' : 'width') + ' is greater than current panel size, probably due to a wrong DPI or scale setting.\nIt\'s recommended to reconfigure the buttons scale via menus.', 'Buttons');
		}
	}
}

function getButtonsMaxSize(bCurrent = true) {
	const orientation = buttonsBar.config.orientation.toLowerCase();
	let maxSize = {w: -1, h: -1, totalW: 0, totalH: 0};
	for (let key in buttonsBar.buttons) {
		const button = buttonsBar.buttons[key];
		maxSize.h = Math.max(bCurrent ? button.currH : button.h, maxSize.h) ;
		if (button.isIconMode()) {
			maxSize.w = Math.max(30, maxSize.w);
		} else {
			maxSize.w = Math.max(bCurrent ? button.currW : button.w, maxSize.w);
		}
		if (orientation === 'x') {maxSize.totalW += (bCurrent ? button.currW : button.w);}
		if (orientation === 'y') {maxSize.totalH += (bCurrent ? button.currH : button.h);}
	}
	if (orientation === 'x') {maxSize.totalH = maxSize.h;}
	if (orientation === 'y') {maxSize.totalW = maxSize.w;}
	return maxSize;
}