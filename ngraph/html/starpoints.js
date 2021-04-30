'use strict'

function getStarPoints(nodeSize) {
	const starWidth = nodeSize;
	const starHeight = nodeSize;
	let centerX = starWidth / 2;
	let centerY = starHeight / 2;

	let innerCirclePoints = 5; // a 5 point star

	// starWidth --> this is the beam length of each
	// side of the SVG square that holds the star
	let innerRadius = starWidth / innerCirclePoints;   
    let innerOuterRadiusRatio = 2.5; // set star sharpness/chubyness
    let outerRadius = innerRadius * innerOuterRadiusRatio;

	return calcStarPoints(centerX, centerY, innerCirclePoints, innerRadius, outerRadius);
};

function calcStarPoints(centerX, centerY, innerCirclePoints, innerRadius, outerRadius) {
	const angle = (Math.PI / innerCirclePoints);
	const angleOffsetToCenterStar = 0;

	const totalPoints = innerCirclePoints * 2; // 10 in a 5-points star 
	let points = '';
	for (let i = 0; i < totalPoints; i++) {
		let isEvenIndex = i % 2 == 0;
		let r = isEvenIndex ? outerRadius : innerRadius;
		let currX = centerX + Math.cos(i * angle + angleOffsetToCenterStar ) * r;
		let currY = centerY + Math.sin(i * angle + angleOffsetToCenterStar) * r;
		points += currX + ',' + currY + ' ';
	}
	return points;
};

function getStarPointsOffset(nodeSize, offsetX, offsetY) {
	const starWidth = nodeSize;
	const starHeight = nodeSize;
	let centerX = starWidth / 2 + offsetX; 
	let centerY = starHeight / 2 + offsetY;

	let innerCirclePoints = 5; // a 5 point star

	// starWidth --> this is the beam length of each
	// side of the SVG square that holds the star
	let innerRadius = starWidth / innerCirclePoints;   
    let innerOuterRadiusRatio = 2.5; // set star sharpness/chubyness
    let outerRadius = innerRadius * innerOuterRadiusRatio;

	return calcStarPoints(centerX, centerY, innerCirclePoints, innerRadius, outerRadius);
};