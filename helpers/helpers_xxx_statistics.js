﻿'use strict';
//11/11/24

/* exported zScoreToProbability, probabilityToZscore, zScoreToCDF, calcStatistics */

/*  The following JavaScript functions for calculating normal and
	chi-square probabilities and critical values were adapted by
	John Walker from C implementations
	written by Gary Perlman of Wang Institute, Tyngsboro, MA
	01879.  Both the original C code and this JavaScript edition
	are in the public domain.  */

/*  POZ  --  probability of normal z value
	Adapted from a polynomial approximation in:
			Ibbetson D, Algorithm 209
			Collected Algorithms of the CACM 1963 p. 616
	Note:
			This routine has six digit accuracy, so it is only useful for absolute
			z values <= 6.  For z values > to 6.0, poz() returns 0.0.
*/

function zScoreToProbability(z) {
	const Z_MAX = 6;
	let y, x, w;
	if (z === 0) {
		x = 0;
	} else {
		y = 0.5 * Math.abs(z);
		if (y > (Z_MAX * 0.5)) {
			x = 1;
		} else if (y < 1) {
			w = y * y;
			x = ((((((((0.000124818987 * w
				- 0.001075204047) * w + 0.005198775019) * w
				- 0.019198292004) * w + 0.059054035642) * w
				- 0.151968751364) * w + 0.319152932694) * w
				- 0.531923007300) * w + 0.797884560593) * y * 2;
		} else {
			y -= 2;
			x = (((((((((((((-0.000045255659 * y
				+ 0.000152529290) * y - 0.000019538132) * y
				- 0.000676904986) * y + 0.001390604284) * y
				- 0.000794620820) * y - 0.002034254874) * y
				+ 0.006549791214) * y - 0.010557625006) * y
				+ 0.011630447319) * y - 0.009279453341) * y
				+ 0.005353579108) * y - 0.002141268741) * y
				+ 0.000535310849) * y + 0.999936657524;
		}
	}
	return z > 0.0 ? ((x + 1) * 0.5) : ((1 - x) * 0.5);
}


/*  CRITZ  --  Compute critical normal z value to
			   produce given p.  We just do a bisection
			   search for a value within CHI_EPSILON,
			   relying on the monotonicity of pochisq().  */

function probabilityToZscore(p) {
	const Z_MAX = 6;
	const Z_EPSILON = 1e-6;     /* Accuracy of z approximation */
	let minz = -Z_MAX;
	let maxz = Z_MAX;
	let zval = 0.0;
	let pval;
	if (p < 0) { p = 0.0; }
	if (p > 1) { p = 1.0; }
	while ((maxz - minz) > Z_EPSILON) {
		pval = zScoreToProbability(zval);
		if (pval > p) {
			maxz = zval;
		} else {
			minz = zval;
		}
		zval = (maxz + minz) * 0.5;
	}
	return (zval);
}

/*  cdfz  --   Compute Cumulative Distribution Function
			   of the Standard Normal Distribution for
			   a given Z. Values from table. */

function zScoreToCDF(z, bSym = true) {
	const Z_MAX = 4.09;
	if (z > Z_MAX) { z = Z_MAX; }
	const i = Math.round(z / 0.01);
	const cdfs = [
		/* 0.00		0.01	 0.02	  0.03	   0.04		0.05	 0.06	  0.07	   0.08		0.09 */
		0.00000, 0.00399, 0.00798, 0.01197, 0.01595, 0.01994, 0.02392, 0.02790, 0.03188, 0.03586, /* 0.0 */
		0.03983, 0.04380, 0.04776, 0.05172, 0.05567, 0.05962, 0.06356, 0.06749, 0.07142, 0.07535, /* 0.1 */
		0.07926, 0.08317, 0.08706, 0.09095, 0.09483, 0.09871, 0.10257, 0.10642, 0.11026, 0.11409, /* 0.2 */
		0.11791, 0.12172, 0.12552, 0.12930, 0.13307, 0.13683, 0.14058, 0.14431, 0.14803, 0.15173, /* 0.3 */
		0.15542, 0.15910, 0.16276, 0.16640, 0.17003, 0.17364, 0.17724, 0.18082, 0.18439, 0.18793, /* 0.4 */
		0.19146, 0.19497, 0.19847, 0.20194, 0.20540, 0.20884, 0.21226, 0.21566, 0.21904, 0.22240, /* 0.5 */
		0.22575, 0.22907, 0.23237, 0.23565, 0.23891, 0.24215, 0.24537, 0.24857, 0.25175, 0.25490, /* 0.6 */
		0.25804, 0.26115, 0.26424, 0.26730, 0.27035, 0.27337, 0.27637, 0.27935, 0.28230, 0.28524, /* 0.7 */
		0.28814, 0.29103, 0.29389, 0.29673, 0.29955, 0.30234, 0.30511, 0.30785, 0.31057, 0.31327, /* 0.8 */
		0.31594, 0.31859, 0.32121, 0.32381, 0.32639, 0.32894, 0.33147, 0.33398, 0.33646, 0.33891, /* 0.9 */
		0.34134, 0.34375, 0.34614, 0.34849, 0.35083, 0.35314, 0.35543, 0.35769, 0.35993, 0.36214, /* 1.0 */
		0.36433, 0.36650, 0.36864, 0.37076, 0.37286, 0.37493, 0.37698, 0.37900, 0.38100, 0.38298, /* 1.1 */
		0.38493, 0.38686, 0.38877, 0.39065, 0.39251, 0.39435, 0.39617, 0.39796, 0.39973, 0.40147, /* 1.2 */
		0.40320, 0.40490, 0.40658, 0.40824, 0.40988, 0.41149, 0.41308, 0.41466, 0.41621, 0.41774, /* 1.3 */
		0.41924, 0.42073, 0.42220, 0.42364, 0.42507, 0.42647, 0.42785, 0.42922, 0.43056, 0.43189, /* 1.4 */
		0.43319, 0.43448, 0.43574, 0.43699, 0.43822, 0.43943, 0.44062, 0.44179, 0.44295, 0.44408, /* 1.5 */
		0.44520, 0.44630, 0.44738, 0.44845, 0.44950, 0.45053, 0.45154, 0.45254, 0.45352, 0.45449, /* 1.6 */
		0.45543, 0.45637, 0.45728, 0.45818, 0.45907, 0.45994, 0.46080, 0.46164, 0.46246, 0.46327, /* 1.7 */
		0.46407, 0.46485, 0.46562, 0.46638, 0.46712, 0.46784, 0.46856, 0.46926, 0.46995, 0.47062, /* 1.8 */
		0.47128, 0.47193, 0.47257, 0.47320, 0.47381, 0.47441, 0.47500, 0.47558, 0.47615, 0.47670, /* 1.9 */
		0.47725, 0.47778, 0.47831, 0.47882, 0.47932, 0.47982, 0.48030, 0.48077, 0.48124, 0.48169, /* 2.0 */
		0.48214, 0.48257, 0.48300, 0.48341, 0.48382, 0.48422, 0.48461, 0.48500, 0.48537, 0.48574, /* 2.1 */
		0.48610, 0.48645, 0.48679, 0.48713, 0.48745, 0.48778, 0.48809, 0.48840, 0.48870, 0.48899, /* 2.2 */
		0.48928, 0.48956, 0.48983, 0.49010, 0.49036, 0.49061, 0.49086, 0.49111, 0.49134, 0.49158, /* 2.3 */
		0.49180, 0.49202, 0.49224, 0.49245, 0.49266, 0.49286, 0.49305, 0.49324, 0.49343, 0.49361, /* 2.4 */
		0.49379, 0.49396, 0.49413, 0.49430, 0.49446, 0.49461, 0.49477, 0.49492, 0.49506, 0.49520, /* 2.5 */
		0.49534, 0.49547, 0.49560, 0.49573, 0.49585, 0.49598, 0.49609, 0.49621, 0.49632, 0.49643, /* 2.6 */
		0.49653, 0.49664, 0.49674, 0.49683, 0.49693, 0.49702, 0.49711, 0.49720, 0.49728, 0.49736, /* 2.7 */
		0.49744, 0.49752, 0.49760, 0.49767, 0.49774, 0.49781, 0.49788, 0.49795, 0.49801, 0.49807, /* 2.8 */
		0.49813, 0.49819, 0.49825, 0.49831, 0.49836, 0.49841, 0.49846, 0.49851, 0.49856, 0.49861, /* 2.9 */
		0.49865, 0.49869, 0.49874, 0.49878, 0.49882, 0.49886, 0.49889, 0.49893, 0.49896, 0.49900, /* 3.0 */
		0.49903, 0.49906, 0.49910, 0.49913, 0.49916, 0.49918, 0.49921, 0.49924, 0.49926, 0.49929, /* 3.1 */
		0.49931, 0.49934, 0.49936, 0.49938, 0.49940, 0.49942, 0.49944, 0.49946, 0.49948, 0.49950, /* 3.2 */
		0.49952, 0.49953, 0.49955, 0.49957, 0.49958, 0.49960, 0.49961, 0.49962, 0.49964, 0.49965, /* 3.3 */
		0.49966, 0.49968, 0.49969, 0.49970, 0.49971, 0.49972, 0.49973, 0.49974, 0.49975, 0.49976, /* 3.4 */
		0.49977, 0.49978, 0.49978, 0.49979, 0.49980, 0.49981, 0.49981, 0.49982, 0.49983, 0.49983, /* 3.5 */
		0.49984, 0.49985, 0.49985, 0.49986, 0.49986, 0.49987, 0.49987, 0.49988, 0.49988, 0.49989, /* 3.6 */
		0.49989, 0.49990, 0.49990, 0.49990, 0.49991, 0.49991, 0.49992, 0.49992, 0.49992, 0.49992, /* 3.7 */
		0.49993, 0.49993, 0.49993, 0.49994, 0.49994, 0.49994, 0.49994, 0.49995, 0.49995, 0.49995, /* 3.8 */
		0.49995, 0.49995, 0.49996, 0.49996, 0.49996, 0.49996, 0.49996, 0.49996, 0.49997, 0.49997, /* 3.9 */
		0.49997, 0.49997, 0.49997, 0.49997, 0.49997, 0.49997, 0.49998, 0.49998, 0.49998, 0.49998  /* 4.0 */
	];
	return bSym ? cdfs[i] * 2 : cdfs[i];
}

function calcStatistics(dataArr, options = { bClampPopRange: true }) {
	options = { bClampPopRange: true, ...(options || {}) };
	const statistics = {
		max: -Infinity,
		min: +Infinity,
		maxCount: 0,
		minCount: 0,
		count: 0,
		sum: 0,
		mean: null,
		median: null,
		mode: null,
		sigma: 0,
		range: 0,
		popRange: {
			normal: { '50%': [], '75%': [], '89%': [], '95%': [] },
			universal: { '50%': [], '75%': [], '89%': [], '95%': [] }
		},

	};
	const bMapKeys = dataArr.some((val) => typeof val === 'string');
	if (bMapKeys) {
		const copy = [...dataArr];
		const freqMap = new Map();
		copy.forEach((val) => {
			const freq = freqMap.get(val);
			if (typeof freq === 'undefined') {freqMap.set(val, 1);}
			else {freqMap.set(val, freq + 1);}
		});
		const points = [...freqMap].map((pair) => {return {key: pair[0], val: Math.round(pair[1])};});
		const stats = calcStatistics([...freqMap.values()], options);
		['max', 'mean', 'median', 'mode', 'min'].forEach((key) => {
			const ref = Math.round(stats[key]);
			if (key === 'max') {points.sort((a, b) => b.val - a.val);} // Sorting allows to break earlier
			else if (key === 'min') {points.reverse();}
			stats[key + 'Keys'] = [];
			let bFound = false;
			for (const p in points) {
				if (p.val === ref) {stats[key + 'Points'].push(p); bFound = true;}
				else if (bFound) {break;}
			}
			if (key === 'max' || key === 'min') {stats[key + '10Points'] = points.slice(0, 9).map((p) => p);}
		});
		return stats;
	}
	statistics.count = dataArr.length;
	dataArr.forEach((val, i) => {
		if (bMapKeys) { val = i; }
		if (val > statistics.max) { statistics.max = val; statistics.maxCount = 1; }
		else if (val === statistics.max) { statistics.maxCount++; }
		if (val < statistics.min) { statistics.min = val; statistics.minCount = 1; }
		else if (val === statistics.min) { statistics.minCount++; }
		statistics.sum += val;
		statistics.sigma += val ** 2;
	});
	statistics.range = statistics.max - statistics.min;
	statistics.mean = statistics.sum / statistics.count;
	statistics.sigma = Math.sqrt((statistics.sigma - statistics.sum ** 2 / statistics.count) / (statistics.count - 1));
	statistics.popRange.universal['50%'].push(statistics.mean - Math.sqrt(2) * statistics.sigma, statistics.mean + Math.sqrt(2) * statistics.sigma);
	statistics.popRange.universal['75%'].push(statistics.mean - 2 * statistics.sigma, statistics.mean + 2 * statistics.sigma);
	statistics.popRange.universal['89%'].push(statistics.mean - 3 * statistics.sigma, statistics.mean + 3 * statistics.sigma);
	statistics.popRange.universal['95%'].push(statistics.mean - 4 * statistics.sigma, statistics.mean + 4 * statistics.sigma);
	statistics.popRange.normal['50%'].push(statistics.mean - 0.674490 * statistics.sigma, statistics.mean + 0.674490 * statistics.sigma);
	statistics.popRange.normal['75%'].push(statistics.mean - 1.149954 * statistics.sigma, statistics.mean + 1.149954 * statistics.sigma);
	statistics.popRange.normal['89%'].push(statistics.mean - 1.644854 * statistics.sigma, statistics.mean + 1.644854 * statistics.sigma);
	statistics.popRange.normal['95%'].push(statistics.mean - 2 * statistics.sigma, statistics.mean + 2 * statistics.sigma);
	if (options.bClampPopRange) {
		for (let key in statistics.popRange) {
			for (let subKey in statistics.popRange[key]) {
				statistics.popRange[key][subKey][0] = Math.max(statistics.min, statistics.popRange[key][subKey][0]);
				statistics.popRange[key][subKey][1] = Math.min(statistics.max, statistics.popRange[key][subKey][1]);
			}
		}
	}
	const binSize = 1;
	const histogram = calcHistogram(dataArr, binSize, statistics.max, statistics.min);
	const masxFreq = Math.max(...histogram);
	statistics.mode = { value: statistics.min + histogram.indexOf(masxFreq) * binSize, frequency: masxFreq };
	{
		let i = 0, acumFreq = statistics.count / 2;
		while (true) { // eslint-disable-line no-constant-condition
			acumFreq -= histogram[i];
			if (acumFreq <= 0) { break; } else { i++; }
		}
		statistics.median = statistics.min + (i > 0 ? (2 * i - 1) * binSize / 2 : 0);
	}
	return statistics;
}

function calcHistogram(data, size, max, min) {
	if (typeof max === 'undefined' || typeof min === 'undefined') {
		min = Infinity;
		max = -Infinity;
		for (const item of data) {
			if (item < min) { min = item; }
			if (item > max) { max = item; }
		}
	}
	if (min === Infinity) { min = 0; }
	if (max === -Infinity) { max = 0; }
	let bins = Math.ceil((max - min + 1) / size);
	const histogram = new Array(bins).fill(0);
	for (const item of data) {
		histogram[Math.floor((item - min) / size)]++;
	}
	return histogram;
}