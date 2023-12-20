'use strict';
//19/12/23

/* exported secondsToTime */

function secondsToTime(secs){
	const h = Math.floor(secs / (60 * 60));
	const divisorMinutes = secs % (60 * 60);
	const m = Math.floor(divisorMinutes / 60);
	const divisorSeconds = divisorMinutes % 60;
	const s = Math.ceil(divisorSeconds);
	return `${h ? `${h}h ` : ''}${m ? `${m}min ${s}s` : `${s}s`}`;
}