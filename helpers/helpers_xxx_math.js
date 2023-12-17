'use strict';
//17/12/23

/* exported combinations, nk_combinations, getClosestDivisor */

/*
	Combinatory
*/

// Ksized-combinations of a given set of elements (array)
function k_combinations(aSet, k) {
	// FROM https://gist.github.com/axelpale/3118596
	let aSetLength = aSet.length;
	// Wrong set
	let isArray = Object.prototype.toString.call(aSet) === '[object Array]' ? 1 : 0; //set
	if (!isArray || typeof aSet === 'undefined' || aSet === null || aSetLength === null || aSetLength === 0) {
		console.log('k_combinations(): checkarraykeys [' + aSet + '] was null, empty or not an array');
		return null; //Array was null or not an array
	}
	// Wrong K-size
	if (!k || k > aSetLength) {
		console.log('select_pairs: wrong combinatory number (' + k + ').');
		return null;
	}
	// K-sized set has only one K-sized subset.
	if (k === aSetLength) {
		return [aSet];
	}

	let i, j, combs;
	// There is N 1-sized subsets in a N-sized set.
	if (k === 1) {
		combs = [];
		for (i = 0; i < aSetLength; i++) {
			combs.push([aSet[i]]);
		}
		return combs;
	}
	let head, tailcombs;
	combs = [];
	for (i = 0; i < aSetLength - k + 1; i++) {
		// head is a list that includes only our current element.
		head = aSet.slice(i, i + 1);
		// We take smaller combinations from the subsequent elements
		tailcombs = k_combinations(aSet.slice(i + 1), k - 1);
		// For each (k-1)-combination we join it with the current
		// and store it to the set of k-combinations.
		for (j = 0; j < tailcombs.length; j++) {
			combs.push(head.concat(tailcombs[j]));
		}
	}
	return combs;
}

// All possible combinations of a given set of elements (array)
function combinations(aSet) {
	// FROM https://gist.github.com/axelpale/3118596
	let aSetLength = aSet.length;
	// Wrong set
	let isArray = Object.prototype.toString.call(aSet) === '[object Array]' ? 1 : 0; //set
	if (!isArray || typeof aSet === 'undefined' || aSet === null || aSetLength === null || aSetLength === 0) {
		console.log('combinations(): checkarraykeys [' + aSet + '] was null, empty or not an array');
		return null; //Array was null or not an array
	}
	// 1-sized set has only one subset.
	if (aSetLength === 1) {
		return [aSet];
	}

	let k, i, combs, k_combs;
	combs = [];

	// Calculate all non-empty k-combinations
	for (k = 1; k <= aSetLength; k++) {
		k_combs = k_combinations(aSet, k);
		for (i = 0; i < k_combs.length; i++) {
			combs.push(k_combs[i]);
		}
	}
	return combs;
}

const factLookup = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800, 39916800, 479001600, 6227020800, 87178291200, 1307674368000, 20922789888000, 355687428096000, 6402373705728000, 121645100408832000, 2432902008176640000, 51090942171709440000, 1124000727777607680000, 25852016738884976640000, 620448401733239439360000]; // First 25 results
function fact(n) {
	if (factLookup[n]) {return factLookup[n];}
	return factLookup[n] = fact(n-1) * n;
}

// Total number of possible k-combinations
function nk_combinations(n, k) {
	if (k === n) {
		return 1;
	} else if (k > n){
		return 0;
	} else {
		return fact(n) / (fact(k) * fact(n - k));
	}
}

/*
	Numbers
*/

function getClosestDivisor(n, toX){
	if (!n % toX) {return toX;}
	let res = [];
	let i = 0;
	while (i <= n) {
		if (n % i === 0){
			res.push(i);
			if (i >= toX) {break;}
		}
		i++;
	}
	let b = res.pop();
	let a = res.pop();
	return (Math.abs(b - toX) < Math.abs(a - toX) ? b : a);
}