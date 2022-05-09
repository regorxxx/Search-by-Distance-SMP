'use strict';
//07/10/21

function dyngenre_map() {
		// DYNGENRE Maps
		const genre_array = [
		//break
		["Industrial"						,	[0						]],
		["Heavy Metal"						,	[1						]],
		["Hard Rock"						,	[2						]],
		["Punk"								,	[2						]],
		["Grunge"							,	[2.5					]],
		["Alt. Rock"						,	[3						]],
		["Progressive Rock"					,	[3						]],
		["Psychedelic Rock"					,	[3						]],
		["Rock"								,	[3						]],
		["Rock & Roll"						,	[3						]],
		["Folk"								,	[3.5					]],
		["Folk-Rock"						,	[3.5					]],
		["Pop"								,	[4						]],
		["Country"							,	[5						]],
		["Funk"								,	[6						]],
		["Soul"								,	[6						]],
		["Blues"							,	[7						]],
		["Gospel"							,	[8						]],
		["Jazz"								,	[9						]],
		["Jazz Vocal"						,	[9						]],
		["Reggae"							,	[10						]],
		["Hip-Hop"							,	[11						]],
		["Electronic"						,	[13, 14, 15, 16, 17		]],
		//break
		["New Age"							,	[18						]],
		//break
		["African"							,	[30						]],
		["Nubian"							,	[31						]],
		//break
		["Indian Classical"					,	[59						]],
		["Japanese Classical"				,	[59						]],
		//break
		["Classical"						,	[60						]],
		["Opera"							,	[61						]] 
		];
		const genre_map = new Map(genre_array);
		
		const style_array = [
		["Krautrock"						,	[0						]],
		["Electro-Industrial"				,	[0						]],
		["Ambient Industrial"				,	[0						]],
		["Acoustic"							,	[3						]],
		["Afro-Rock"						,	[3						]],
		["Chillwave"						,	[4						]],
		["Electropop"						,	[4						]],
		["Synth-Pop"						,	[4						]],
		["Reggaeton"						,	[10.5					]],
		["Trap"								,	[11						]],
		["Trip Hop"							,	[12			,	18		]],
		["Future Bass"						,	[12.5					]],
		["Dubstep"							,	[13						]],
		["Techno"							,	[15						]],
		["Intelligent Dance Music"			,	[15						]],
		["House"							,	[16						]],
		["Deep House"						,	[16						]],
		["Acid House"						,	[16						]],
		["Trance"							,	[17						]],
		["Psytrance"						,	[17						]],
		["Chill-Out Downtempo"				,	[18						]],
		["Ambiental"						,	[18						]]
		];
		const style_map = new Map(style_array);
		
		const join_map = new Map(genre_array.concat(style_array));
		
		return [genre_map , style_map, join_map];
}

/* 
	Helpers
*/
function dyn_genre_range(reference, offset, bReturnLimits = false) {
	const breaks_array = [0,18,30,31,59,61]; // Cycles on pairs of two. Hardcoded see dyngenre_map()
	const breaks_array_length = breaks_array.length;
	let bFound = false;
	let lowRange = reference;
	let highRange = reference;
	let upperLimit, lowerLimit;
	if (reference != null && offset) {
		// Preliminary values
		lowRange -= offset;
		highRange += offset;
		
		// First we have to find in which range the reference is placed!
		let i = 0;
		while (i < breaks_array_length) {
			lowerLimit = breaks_array[i];
			upperLimit = breaks_array[i+1];
			if (reference >= lowerLimit && reference <= upperLimit) { //Between selected pair
				if (lowRange < lowerLimit) {
					lowRange += upperLimit + 1 - lowerLimit; // We treat the lower limit as "zero value"
				}
				if (highRange > upperLimit) {
					highRange -= upperLimit + 1 + lowerLimit;
				}
				bFound = true;
				break;
			}
			i += 2;
		}
		if (lowRange > highRange) {[lowRange, highRange] = [highRange, lowRange];} // Invert values
	}
	if (!bFound) {[lowRange, highRange, lowerLimit, upperLimit] = [-1, -1, -1, -1];} // Safety check
	if (bReturnLimits) {return [lowRange, highRange, lowerLimit, upperLimit];}
	return [lowRange, highRange];
}