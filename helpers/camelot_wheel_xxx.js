'use strict';

// The Camelot Wheel lists musical keys that are displayed as ‘hours’ on a clock. For example, 4 o’clock corresponds to 4B or 4A. The ‘B’ letter represents major
// keys, and the ‘A’ letter represents the minor keys. Two songs probably sound good together because they are “in key” with one another. The wheel can be used 
// to easily mix songs following these rules:
// 	-Perfect Match (nX -> nX): staying in the same 'hour' and letter. 
//	-Energy Changes:
//		- Energy Boost (nX -> n+1X): adding one 'hour' (+1), equivalent to going up a fifth.
//		- Energy Drop (nX -> n-1X): subtracting one 'hour' (-1), equivalent to going down a fifth.
//		- Energy Switch (nA -> nB): staying in he same 'hour' but changing the letter, equivalent to going from relative minor to major (and viceversa).
// 	-Mood Changes:
//		- Mood Boost (nA -> n+3B): adding three 'hours' (+3), equivalent to going from minor to major.
//		- Mood Drop (nX -> n-3B): subtracting three 'hours' (-3), equivalent to going from major to minor.
//	-Key Changes:
//		- Dominant Key (nA -> n+1B): subtracting one 'hour' (+1) and changing the letter.
//		- Sub Dominant Key (nB -> n-1A): subtracting one 'hour' (+1) and changing the letter.
//	-Experimental Energy Changes:
//		- Energy Boost ++ (nX -> n+2X): adding two 'hours' (+2), equivalent to going up a step.
//		- Dramatic Energy Raise (nX -> n+7X): adding seven 'hours' (+7), equivalent to going up a half step.
const camelotWheel = { // Use {...camelotWheel.[map].get(x)} to get a copy of the objects and not just a reference to the originals
	wheelNotationFlat: new Map([
		[1	, {A: 'Abm'		, B: 'B'	}],
		[2	, {A: 'Ebm'		, B: 'Gb'	}],
		[3	, {A: 'Bbm'		, B: 'Db'	}],
		[4	, {A: 'Fm'		, B: 'Ab'	}],
		[5	, {A: 'Cm'		, B: 'Eb'	}],
		[6	, {A: 'Gm'		, B: 'Bb'	}],
		[7	, {A: 'Dm'		, B: 'F'	}],
		[8	, {A: 'Am'		, B: 'C'	}],
		[9	, {A: 'Em'		, B: 'G'	}],
		[10	, {A: 'Bm'		, B: 'D'	}],
		[11	, {A: 'Gbm'		, B: 'A'	}],
		[12	, {A: 'Dbm'		, B: 'E'	}]
	]),
	wheelNotationSharp: new Map([
		[1	, {A: 'G#m'		, B: 'B'	}],
		[2	, {A: 'D#m'		, B: 'F#'	}],
		[3	, {A: 'A#m'		, B: 'C#'	}],
		[4	, {A: 'Fm'		, B: 'G#'	}],
		[5	, {A: 'Cm'		, B: 'D#'	}],
		[6	, {A: 'Gm'		, B: 'A#'	}],
		[7	, {A: 'Dm'		, B: 'F'	}],
		[8	, {A: 'Am'		, B: 'C'	}],
		[9	, {A: 'Em'		, B: 'G'	}],
		[10	, {A: 'Bm'		, B: 'D'	}],
		[11	, {A: 'F#m'		, B: 'A'	}],
		[12	, {A: 'C#m'		, B: 'E'	}]
	]),
	keyNotationObject:  new Map([ //Merged sharp and flat key notations when there are equivalences
		['G#m'	, {hour: 1	, letter: 'A'}], // Minor
		['Abm'	, {hour: 1	, letter: 'A'}],
		['D#m'	, {hour: 2	, letter: 'A'}],
		['Ebm'	, {hour: 2	, letter: 'A'}],
		['A#m'	, {hour: 3	, letter: 'A'}],
		['Bbm'	, {hour: 3	, letter: 'A'}],
		['Fm'	, {hour: 4	, letter: 'A'}],
		['Cm'	, {hour: 5	, letter: 'A'}],
		['Gm'	, {hour: 6	, letter: 'A'}],
		['Dm'	, {hour: 7	, letter: 'A'}],
		['Am'	, {hour: 8	, letter: 'A'}],
		['Em'	, {hour: 9	, letter: 'A'}],
		['Bm'	, {hour: 10	, letter: 'A'}],
		['F#m'	, {hour: 11	, letter: 'A'}],
		['Gbm'	, {hour: 11	, letter: 'A'}],
		['C#m'	, {hour: 12	, letter: 'A'}],
		['Dbm'	, {hour: 12	, letter: 'A'}],
		['B'	, {hour: 1	, letter: 'B'}], // Major
		['F#'	, {hour: 2	, letter: 'B'}],
		['Gb'	, {hour: 2	, letter: 'B'}],
		['C#'	, {hour: 3	, letter: 'B'}],
		['Db'	, {hour: 3	, letter: 'B'}],
		['G#'	, {hour: 4	, letter: 'B'}],
		['Ab'	, {hour: 4	, letter: 'B'}],
		['D#'	, {hour: 5	, letter: 'B'}],
		['Eb'	, {hour: 5	, letter: 'B'}],
		['A#'	, {hour: 6	, letter: 'B'}],
		['Bb'	, {hour: 6	, letter: 'B'}],
		['F'	, {hour: 7	, letter: 'B'}],
		['C'	, {hour: 8	, letter: 'B'}],
		['G'	, {hour: 9	, letter: 'B'}],
		['D'	, {hour: 10	, letter: 'B'}],
		['A'	, {hour: 11	, letter: 'B'}],
		['E'	, {hour: 12	, letter: 'B'}],
		['1A'	, {hour: 1	, letter: 'A'}], // Itself
		['2A'	, {hour: 2	, letter: 'A'}],
		['3A'	, {hour: 3	, letter: 'A'}],
		['4A'	, {hour: 4	, letter: 'A'}],
		['5A'	, {hour: 5	, letter: 'A'}],
		['6A'	, {hour: 6	, letter: 'A'}],
		['7A'	, {hour: 7	, letter: 'A'}],
		['8A'	, {hour: 8	, letter: 'A'}],
		['9A'	, {hour: 9	, letter: 'A'}],
		['10A'	, {hour: 10	, letter: 'A'}],
		['11A'	, {hour: 11	, letter: 'A'}],
		['12A'	, {hour: 12	, letter: 'A'}],
		['1B'	, {hour: 1	, letter: 'B'}],
		['2B'	, {hour: 2	, letter: 'B'}],
		['3B'	, {hour: 3	, letter: 'B'}],
		['4B'	, {hour: 4	, letter: 'B'}],
		['5B'	, {hour: 5	, letter: 'B'}],
		['6B'	, {hour: 6	, letter: 'B'}],
		['7B'	, {hour: 7	, letter: 'B'}],
		['8B'	, {hour: 8	, letter: 'B'}],
		['9B'	, {hour: 9	, letter: 'B'}],
		['10B'	, {hour: 10	, letter: 'B'}],
		['11B'	, {hour: 11	, letter: 'B'}],
		['12B'	, {hour: 12	, letter: 'B'}]
	]),
	keyNotation:  new Map([ //Merged sharp and flat key notations when there are equivalences
		['G#m'	, '1A' 	], // Minor
		['Abm'	, '1A' 	],
		['D#m'	, '2A' 	],
		['Ebm'	, '2A' 	],
		['A#m'	, '3A' 	],
		['Bbm'	, '3A' 	],
		['Fm'	, '4A' 	],
		['Cm'	, '5A' 	],
		['Gm'	, '6A' 	],
		['Dm'	, '7A' 	],
		['Am'	, '8A' 	],
		['Em'	, '9A' 	],
		['Bm'	, '10A'	],
		['F#m'	, '11A'	],
		['Gbm'	, '11A'	],
		['C#m'	, '12A'	],
		['Dbm'	, '12A'	],
		['B'	, '1B'	], // Major
		['F#'	, '2B'	],
		['Gb'	, '2B'	],
		['C#'	, '3B'	],
		['Db'	, '3B'	],
		['G#'	, '4B'	],
		['Ab'	, '4B'	],
		['D#'	, '5B'	],
		['Eb'	, '5B'	],
		['A#'	, '6B'	],
		['Bb'	, '6B'	],
		['F'	, '7B'	],
		['C'	, '8B'	],
		['G'	, '9B'	],
		['D'	, '10B'	],
		['A'	, '11B'	],
		['E'	, '12B'	],
		['1A'	, '1A'	], // Itself
		['2A'	, '2A'	],
		['3A'	, '3A'	],
		['4A'	, '4A'	],
		['5A'	, '5A'	],
		['6A'	, '6A'	],
		['7A'	, '7A'	],
		['8A'	, '8A'	],
		['9A'	, '9A'	],
		['10A'	, '10A'	],
		['11A'	, '11A'	],
		['12A'	, '12A'	],
		['1B'	, '1B'	],
		['2B'	, '2B'	],
		['3B'	, '3B'	],
		['4B'	, '4B'	],
		['5B'	, '5B'	],
		['6B'	, '6B'	],
		['7B'	, '7B'	],
		['8B'	, '8B'	],
		['9B'	, '9B'	],
		['10B'	, '10B'	],
		['11B'	, '11B'	],
		['12B'	, '12B'	]
	]),
	// Methods to retrieve Key Objects (x) from Key Strings (y)
	hasKey(xy) {return (typeof xy === 'object' ? (xy.hasOwnProperty('hour') && xy.hasOwnProperty('letter') ? this.keyNotation.has(xy.hour + xy.letter) : false): this.keyNotation.has(xy));},
	getKeyNotationObject(y) {return (this.hasKey(y) ? {...this.keyNotationObject.get(y)} : null);},
	getKeyNotationFlat(x) {return (this.hasKey(x) ? this.wheelNotationFlat.get(x.hour)[x.letter] : null);},
	getKeyNotationSharp(x) {return (this.hasKey(x) ? this.wheelNotationSharp.get(x.hour)[x.letter] : null);},
	// Methods to work with Key Objects (x)
	// Beware to pass a copy of the object if you want a new key object, otherwise the original will be modified!
	perfectMatch(x) {return x;},
	energyBoost(x) {x.hour = cyclicOffset(x.hour, 1, [1,12]); return x;},
	energyDrop(x) {x.hour = cyclicOffset(x.hour, -1, [1,12]); return x;},
	energySwitch(x) {x.letter = (x.letter === 'A') ? 'B' : 'A'; return x;},
	moodBoost(x) {x.hour = cyclicOffset(x.hour, 3, [1,12]); return x;},
	moodDrop(x) {x.hour = cyclicOffset(x.hour, -3, [1,12]); return x;},
	domKey(x) {this.energySwitch(x);this.energyBoost(x); return x;},
	subDomKey(x) {this.energySwitch(x);this.energyDrop(x); return x;},
	energyRaise(x) {x.hour = cyclicOffset(x.hour, 7, [1,12]); return x;},
	// Methods to create and apply patterns
	createHarmonicMixingPattern(length) {return createHarmonicMixingPattern(length);},
	applyPattern(x, pattern) {return applyPattern(x, pattern);},
};

/*
	Helpers
*/

function createHarmonicMixingPattern(playlistLength) {
	// Instead of predefining a mixing pattern, create one randomly each time, with predefined proportions
	// TODO: randomize proportions a bit and use perfectMatch as default for the rest
	const movements = {
		perfectMatch: 	35	, // perfectMatch (=)
		energyBoost	: 	10	, // energyBoost (+1)
		energyDrop	:	10	, // energyDrop (-1)
		energySwitch:	10	, // energySwitch (B/A)
		moodBoost	:	5	, // moodBoost (+3)
		moodDrop	:	5	, // moodDrop (-3)
		energyRaise	:	5	, // energyRaise (+7)
		domKey		:	10	, // domKey (+1 & B/A) = energyBoost & energySwitch
		subDomKey	:	10	, // subDomKey (-1 & B/A) = energyDrop & energySwitch
	}; // Sum must be 100%
	let pattern = [];
	Object.keys(movements).forEach((key) => {
		pattern = pattern.concat(Array(Math.ceil(playlistLength * movements[key] / 100)).fill(key));
	});
	pattern.sort(() => Math.random() - 0.5);
	if (pattern.length > playlistLength) {pattern.length = playlistLength;} // finalPlaylistLength is always <= PlaylistLength
	return pattern;
}

function applyPattern(key, pattern, bReturnObj = true) {
	let keyArr = [];
	if (Array.isArray(pattern) && pattern.length && camelotWheel.hasKey(key)) {
		let firstKey;
		if (typeof key === 'string') {keyArr.push(camelotWheel.getKeyNotationObject(key));}
		else if (typeof key === 'object' && key.hasOwnProperty('hour') && key.hasOwnProperty('letter')) {keyArr.push(key);}
		else {return keyArr;}
		pattern.forEach( (movement, index) => {keyArr.push(camelotWheel[movement]({...keyArr[index - 1]}));});
		if (!bReturnObj) {keyArr = keyArr.map( (keyObj) => {return camelotWheel.getKeyNotationSharp(key);});} // Translate back
	}
	return keyArr;
}

if (typeof cyclicOffset === 'undefined') {
	// Adds/subtracts 'offset' to 'reference' considering the values must follow cyclic logic within 'limits' range (both values included)
	// Ex: [1,8], x = 5 -> x + 4 = 1 <=> cyclicOffset(5, 4, [1,8])
	var cyclicOffset = function cyclicOffset(reference, offset, limits) {
		if (offset && reference >= limits[0] && reference <= limits[1]) {
			reference += offset;
			if (reference < limits[0]) {reference += limits[1];}
			if (reference > limits[1]) {reference -= limits[1];}
		}
		return reference;
	};
}