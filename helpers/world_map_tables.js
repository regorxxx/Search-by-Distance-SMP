'use strict';
//07/02/22

/* 
	World Map
	Coordinates function and country tables.
 */

// Helper
function findCountryCoords(country, mapWidth, mapHeight, factorX, factorY) { // Mercator projection
	let xy = [-1, -1];
	if (country && country.length) {
		let isoCode = '';
		if (isoCoordinates.has(country)) {
			isoCode = country;
		} else {
			if (isoMap.has(country.toLowerCase())) {isoCode = isoMap.get(country.toLowerCase());}
			else if (nameReplacers.has(country.toLowerCase())) {isoCode = isoMap.get(nameReplacers.get(country.toLowerCase()));}
		}
		if (isoCode.length) {
			let [latitude , longitude] = isoCoordinates.get(isoCode);
			if (latitude != null) {xy = mercProj(latitude, longitude, mapWidth, mapHeight, factorX, factorY);}
		}
	}
	return xy;
}

function mercProj(latitude, longitude, mapWidth, mapHeight, factorX, factorY) {
	const x = round((longitude + 180) * (mapWidth * factorX / 100 / 360), 0);
	const latRad = latitude * Math.PI /180; // convert from degrees to radians
	const mercN = Math.log(Math.tan((Math.PI / 4) + (latRad / 2)));
	const y = round((mapHeight * factorY / 100  / 2) - (mapWidth * factorX / 100 * mercN / (2 * Math.PI)), 0);
	return [x, y];
}

function calcProximity(coord, x, y, precision, mapWidth, mapHeight, factorX, factorY) {
	const [latitude , longitude] = coord;
	const [xCoord, yCoord] = mercProj(latitude, longitude, mapWidth, mapHeight, factorX, factorY);
	const xProx = x < xCoord ? x / xCoord : xCoord / x;
	const yProx = y < yCoord ? y / yCoord : yCoord / y;
	return [xProx, yProx];
}

function findCountry(x, y, mapWidth, mapHeight, factorX, factorY, precision = 0.94, bForceOutput = true) { // Mercator projection
	let countries = [];
	// Force at least a country by lowering the precision. Note some countries are really big (compared to the point)! So this is needed
	while (countries.length === 0) {
		isoCoordinates.forEach((coord, key) => {
			const [xProx, yProx] = calcProximity(coord, x, y, precision, mapWidth, mapHeight, factorX, factorY);
			if (xProx >= precision && yProx >= precision) {countries.push({key, prox: round((xProx + yProx) / 2 * 100, 0)});}
		});
		if (!bForceOutput) {break;}
		precision -= 0.03;
	}
	// Replace ISO codes with names and sort by proximity
	// Note: don't forget to capitalize words later!
	countries.forEach((country) => {country.key = isoMapRev.get(country.key);});
	countries = countries.sort((a, b) => {return b.prox - a.prox;});
	return countries;
}

// Country tables ISO 3166-1 Alpha-3 
const isoMap = new Map([
	['afghanistan','AFG'], ['albania','ALB'], ['algeria','DZA'], ['american samoa','ASM'], ['andorra','AND'], ['angola','AGO'], ['anguilla','AIA'], ['antarctica','ATA'], ['antigua and barbuda','ATG'], ['argentina','ARG'], ['armenia','ARM'], ['aruba','ABW'], ['australia','AUS'], ['austria','AUT'], ['azerbaijan','AZE'], ['bahamas','BHS'], ['bahrain','BHR'], ['bangladesh','BGD'], ['barbados','BRB'], ['belarus','BLR'], ['belgium','BEL'], ['belize','BLZ'], ['benin','BEN'], ['bermuda','BMU'], ['bhutan','BTN'], ['bolivia','BOL'], ['bosnia and herzegovina','BIH'], ['botswana','BWA'], ['bouvet island','BVT'], ['brazil','BRA'], ['british indian ocean territory','IOT'], ['brunei','BRN'], ['bulgaria','BGR'], ['burkina faso','BFA'], ['burundi','BDI'], ['cambodia','KHM'], ['cameroon','CMR'], ['canada','CAN'], ['cape verde','CPV'], ['cayman islands','CYM'], ['central african republic','CAF'], ['chad','TCD'], ['chile','CHL'], ['china','CHN'], ['christmas island','CXR'], ['cocos (keeling) islands','CCK'], ['colombia','COL'], ['comoros','COM'], ['congo','COG'], ['congo, the democratic republic of the','COD'], ['cook islands','COK'], ['costa rica','CRI'], ['ivory coast','CIV'], ['croatia','HRV'], ['cuba','CUB'], ['cyprus','CYP'], ['czech republic','CZE'], ['denmark','DNK'], ['djibouti','DJI'], ['dominica','DMA'], ['dominican republic','DOM'], ['ecuador','ECU'], ['egypt','EGY'], ['el salvador','SLV'], ['equatorial guinea','GNQ'], ['eritrea','ERI'], ['estonia','EST'], ['ethiopia','ETH'], ['falkland islands (malvinas)','FLK'], ['faroe islands','FRO'], ['fiji','FJI'], ['finland','FIN'], ['france','FRA'], ['french guiana','GUF'], ['french polynesia','PYF'], ['french southern territories','ATF'], ['gabon','GAB'], ['gambia','GMB'], ['georgia','GEO'], ['germany','DEU'], ['ghana','GHA'], ['gibraltar','GIB'], ['greece','GRC'], ['greenland','GRL'], ['grenada','GRD'], ['guadeloupe','GLP'], ['guam','GUM'], ['guatemala','GTM'], ['guernsey','GGY'], ['guinea','GIN'], ['guinea-bissau','GNB'], ['guyana','GUY'], ['haiti','HTI'], ['heard island and mcdonald islands','HMD'], ['holy see (vatican city state)','VAT'], ['honduras','HND'], ['hong kong','HKG'], ['hungary','HUN'], ['iceland','ISL'], ['india','IND'], ['indonesia','IDN'], ['iran, islamic republic of','IRN'], ['iraq','IRQ'], ['ireland','IRL'], ['isle of man','IMN'], ['israel','ISR'], ['italy','ITA'], ['jamaica','JAM'], ['japan','JPN'], ['jersey','JEY'], ['jordan','JOR'], ['kazakhstan','KAZ'], ['kenya','KEN'], ['kiribati','KIR'], ['korea, democratic people\'s republic of','PRK'], ['south korea','KOR'], ['kuwait','KWT'], ['kyrgyzstan','KGZ'], ['lao people\'s democratic republic','LAO'], ['latvia','LVA'], ['lebanon','LBN'], ['lesotho','LSO'], ['liberia','LBR'], ['libya','LBY'], ['liechtenstein','LIE'], ['lithuania','LTU'], ['luxembourg','LUX'], ['macao','MAC'], ['macedonia, the former yugoslav republic of','MKD'], ['madagascar','MDG'], ['malawi','MWI'], ['malaysia','MYS'], ['maldives','MDV'], ['mali','MLI'], ['malta','MLT'], ['marshall islands','MHL'], ['martinique','MTQ'], ['mauritania','MRT'], ['mauritius','MUS'], ['mayotte','MYT'], ['mexico','MEX'], ['micronesia, federated states of','FSM'], ['moldova, republic of','MDA'], ['monaco','MCO'], ['mongolia','MNG'], ['montenegro','MNE'], ['montserrat','MSR'], ['morocco','MAR'], ['mozambique','MOZ'], ['myanmar','MMR'], ['namibia','NAM'], ['nauru','NRU'], ['nepal','NPL'], ['netherlands','NLD'], ['netherlands antilles','ANT'], ['new caledonia','NCL'], ['new zealand','NZL'], ['nicaragua','NIC'], ['niger','NER'], ['nigeria','NGA'], ['niue','NIU'], ['norfolk island','NFK'], ['northern mariana islands','MNP'], ['norway','NOR'], ['oman','OMN'], ['pakistan','PAK'], ['palau','PLW'], ['palestinian territory, occupied','PSE'], ['panama','PAN'], ['papua new guinea','PNG'], ['paraguay','PRY'], ['peru','PER'], ['philippines','PHL'], ['pitcairn','PCN'], ['poland','POL'], ['portugal','PRT'], ['puerto rico','PRI'], ['qatar','QAT'], ['réunion','REU'], ['romania','ROU'], ['russia','RUS'], ['rwanda','RWA'], ['saint helena, ascension and tristan da cunha','SHN'], ['saint kitts and nevis','KNA'], ['saint lucia','LCA'], ['saint pierre and miquelon','SPM'], ['saint vincent and the grenadines','VCT'], ['samoa','WSM'], ['san marino','SMR'], ['sao tome and principe','STP'], ['saudi arabia','SAU'], ['senegal','SEN'], ['serbia','SRB'], ['seychelles','SYC'], ['sierra leone','SLE'], ['singapore','SGP'], ['slovakia','SVK'], ['slovenia','SVN'], ['solomon islands','SLB'], ['somalia','SOM'], ['south africa','ZAF'], ['south georgia and the south sandwich islands','SGS'], ['south sudan','SSD'], ['spain','ESP'], ['sri lanka','LKA'], ['sudan','SDN'], ['suriname','SUR'], ['svalbard and jan mayen','SJM'], ['swaziland','SWZ'], ['sweden','SWE'], ['switzerland','CHE'], ['syrian arab republic','SYR'], ['taiwan','TWN'], ['tajikistan','TJK'], ['tanzania, united republic of','TZA'], ['thailand','THA'], ['timor-leste','TLS'], ['togo','TGO'], ['tokelau','TKL'], ['tonga','TON'], ['trinidad and tobago','TTO'], ['tunisia','TUN'], ['turkey','TUR'], ['turkmenistan','TKM'], ['turks and caicos islands','TCA'], ['tuvalu','TUV'], ['uganda','UGA'], ['ukraine','UKR'], ['united arab emirates','ARE'], ['united kingdom','GBR'], ['united states','USA'], ['united states minor outlying islands','UMI'], ['uruguay','URY'], ['uzbekistan','UZB'], ['vanuatu','VUT'], ['venezuela','VEN'], ['vietnam','VNM'], ['virgin islands, british','VGB'], ['virgin islands, u.s.','VIR'], ['wallis and futuna','WLF'], ['western sahara','ESH'], ['yemen','YEM'], ['zambia','ZMB'], ['zimbabwe','ZWE']
]);
const isoMapRev = new Map([...isoMap].map((arr) => {return arr.reverse();}));

const isoCoordinates = new Map([
	['AFG', [33,65]], ['ALB', [41,20]], ['DZA', [28,3]], ['ASM', [-14,-170]], ['AND', [43,2]], ['AGO', [-13,19]], ['AIA', [18,-63]], ['ATA', [-90,0]], ['ATG', [17,-62]], ['ARG', [-34,-64]], ['ARM', [40,45]], ['ABW', [13,-70]], ['AUS', [-27,133]], ['AUT', [47,13]], ['AZE', [41,48]], ['BHS', [24,-76]], ['BHR', [26,51]], ['BGD', [24,90]], ['BRB', [13,-60]], ['BLR', [53,28]], ['BEL', [51,4]], ['BLZ', [17,-89]], ['BEN', [10,2]], ['BMU', [32,-65]], ['BTN', [28,91]], ['BOL', [-17,-65]], ['BIH', [44,18]], ['BWA', [-22,24]], ['BVT', [-54,3]], ['BRA', [-10,-55]], ['IOT', [-6,72]], ['BRN', [5,115]], ['BGR', [43,25]], ['BFA', [13,-2]], ['BDI', [-4,30]], ['KHM', [13,105]], ['CMR', [6,12]], ['CAN', [60,-95]], ['CPV', [16,-24]], ['CYM', [20,-81]], ['CAF', [7,21]], ['TCD', [15,19]], ['CHL', [-30,-71]], ['CHN', [35,105]], ['CXR', [-11,106]], ['CCK', [-13,97]], ['COL', [4,-72]], ['COM', [-12,44]], ['COG', [-1,15]], ['COD', [0,25]], ['COK', [-21,-160]], ['CRI', [10,-84]], ['CIV', [8,-5]], ['HRV', [45,16]], ['CUB', [22,-80]], ['CYP', [35,33]], ['CZE', [50,16]], ['DNK', [56,10]], ['DJI', [12,43]], ['DMA', [15,-61]], ['DOM', [19,-71]], ['ECU', [-2,-78]], ['EGY', [27,30]], ['SLV', [14,-89]], ['GNQ', [2,10]], ['ERI', [15,39]], ['EST', [59,26]], ['ETH', [8,38]], ['FLK', [-52,-59]], ['FRO', [62,-7]], ['FJI', [-18,175]], ['FIN', [64,26]], ['FRA', [46,2]], ['GUF', [4,-53]], ['PYF', [-15,-140]], ['ATF', [-43,67]], ['GAB', [-1,12]], ['GMB', [13,-17]], ['GEO', [42,44]], ['DEU', [51,9]], ['GHA', [8,-2]], ['GIB', [36,-5]], ['GRC', [39,22]], ['GRL', [72,-40]], ['GRD', [12,-62]], ['GLP', [16,-62]], ['GUM', [13,145]], ['GTM', [16,-90]], ['GGY', [50,-3]], ['GIN', [11,-10]], ['GNB', [12,-15]], ['GUY', [5,-59]], ['HTI', [19,-72]], ['HMD', [-53,73]], ['VAT', [42,12]], ['HND', [15,-87]], ['HKG', [22,114]], ['HUN', [47,20]], ['ISL', [65,-18]], ['IND', [20,77]], ['IDN', [-5,120]], ['IRN', [32,53]], ['IRQ', [33,44]], ['IRL', [53,-8]], ['IMN', [54,-5]], ['ISR', [32,35]], ['ITA', [43,13]], ['JAM', [18,-78]], ['JPN', [36,138]], ['JEY', [49,-2]], ['JOR', [31,36]], ['KAZ', [48,68]], ['KEN', [1,38]], ['KIR', [1,173]], ['PRK', [40,127]], ['KOR', [37,128]], ['KWT', [29,48]], ['KGZ', [41,75]], ['LAO', [18,105]], ['LVA', [57,25]], ['LBN', [34,36]], ['LSO', [-30,29]], ['LBR', [7,-10]], ['LBY', [25,17]], ['LIE', [47,10]], ['LTU', [56,24]], ['LUX', [50,6]], ['MAC', [22,114]], ['MKD', [42,22]], ['MDG', [-20,47]], ['MWI', [-14,34]], ['MYS', [3,113]], ['MDV', [3,73]], ['MLI', [17,-4]], ['MLT', [36,15]], ['MHL', [9,168]], ['MTQ', [15,-61]], ['MRT', [20,-12]], ['MUS', [-20,58]], ['MYT', [-13,45]], ['MEX', [23,-102]], ['FSM', [7,158]], ['MDA', [47,29]], ['MCO', [44,7]], ['MNG', [46,105]], ['MNE', [42,19]], ['MSR', [17,-62]], ['MAR', [32,-5]], ['MOZ', [-18,35]], ['MMR', [22,98]], ['NAM', [-22,17]], ['NRU', [-1,167]], ['NPL', [28,84]], ['NLD', [53,6]], ['ANT', [12,-69]], ['NCL', [-22,166]], ['NZL', [-41,174]], ['NIC', [13,-85]], ['NER', [16,8]], ['NGA', [10,8]], ['NIU', [-19,-170]], ['NFK', [-29,168]], ['MNP', [15,146]], ['NOR', [62,10]], ['OMN', [21,57]], ['PAK', [30,70]], ['PLW', [8,135]], ['PSE', [32,35]], ['PAN', [9,-80]], ['PNG', [-6,147]], ['PRY', [-23,-58]], ['PER', [-10,-76]], ['PHL', [13,122]], ['PCN', [-25,-127]], ['POL', [52,20]], ['PRT', [40,-8]], ['PRI', [18,-67]], ['QAT', [26,51]], ['REU', [-21,56]], ['ROU', [46,25]], ['RUS', [60,100]], ['RWA', [-2,30]], ['SHN', [-16,-6]], ['KNA', [17,-63]], ['LCA', [14,-61]], ['SPM', [47,-56]], ['VCT', [13,-61]], ['WSM', [-14,-172]], ['SMR', [44,12]], ['STP', [1,7]], ['SAU', [25,45]], ['SEN', [14,-14]], ['SRB', [44,21]], ['SYC', [-5,56]], ['SLE', [9,-12]], ['SGP', [1,104]], ['SVK', [49,20]], ['SVN', [46,15]], ['SLB', [-8,159]], ['SOM', [10,49]], ['ZAF', [-29,24]], ['SGS', [-55,-37]], ['SSD', [8,30]], ['ESP', [40,-4]], ['LKA', [7,81]], ['SDN', [15,30]], ['SUR', [4,-56]], ['SJM', [78,20]], ['SWZ', [-27,32]], ['SWE', [62,15]], ['CHE', [47,8]], ['SYR', [35,38]], ['TWN', [24,121]], ['TJK', [39,71]], ['TZA', [-6,35]], ['THA', [15,100]], ['TLS', [-9,126]], ['TGO', [8,1]], ['TKL', [-9,-172]], ['TON', [-20,-175]], ['TTO', [11,-61]], ['TUN', [34,9]], ['TUR', [39,35]], ['TKM', [40,60]], ['TCA', [22,-72]], ['TUV', [-8,178]], ['UGA', [1,32]], ['UKR', [49,32]], ['ARE', [24,54]], ['GBR', [54,-2]], ['USA', [38,-97]], ['UMI', [19,167]], ['URY', [-33,-56]], ['UZB', [41,64]], ['VUT', [-16,167]], ['VEN', [8,-66]], ['VNM', [16,106]], ['VGB', [19,-65]], ['VIR', [18,-65]], ['WLF', [-13,-176]], ['ESH', [25,-13]], ['YEM', [15,48]], ['ZMB', [-15,30]], ['ZWE', [-20,30]] 
]);

const alpha3toAlpha2 = new Map([
	['AFG','AF'], ['ALB','AL'], ['DZA','DZ'], ['ASM','AS'], ['AND','AD'], ['AGO','AO'], ['AIA','AI'], ['ATA','AQ'], ['ATG','AG'], ['ARG','AR'], ['ARM','AM'], ['ABW','AW'], ['AUS','AU'], ['AUT','AT'], ['AZE','AZ'], ['BHS','BS'], ['BHR','BH'], ['BGD','BD'], ['BRB','BB'], ['BLR','BY'], ['BEL','BE'], ['BLZ','BZ'], ['BEN','BJ'], ['BMU','BM'], ['BTN','BT'], ['BOL','BO'], ['BIH','BA'], ['BWA','BW'], ['BVT','BV'], ['BRA','BR'], ['IOT','IO'], ['BRN','BN'], ['BGR','BG'], ['BFA','BF'], ['BDI','BI'], ['KHM','KH'], ['CMR','CM'], ['CAN','CA'], ['CPV','CV'], ['CYM','KY'], ['CAF','CF'], ['TCD','TD'], ['CHL','CL'], ['CHN','CN'], ['CXR','CX'], ['CCK','CC'], ['COL','CO'], ['COM','KM'], ['COG','CG'], ['COD','CD'], ['COK','CK'], ['CRI','CR'], ['CIV','CI'], ['HRV','HR'], ['CUB','CU'], ['CYP','CY'], ['CZE','CZ'], ['DNK','DK'], ['DJI','DJ'], ['DMA','DM'], ['DOM','DO'], ['ECU','EC'], ['EGY','EG'], ['SLV','SV'], ['GNQ','GQ'], ['ERI','ER'], ['EST','EE'], ['ETH','ET'], ['FLK','FK'], ['FRO','FO'], ['FJI','FJ'], ['FIN','FI'], ['FRA','FR'], ['GUF','GF'], ['PYF','PF'], ['ATF','TF'], ['GAB','GA'], ['GMB','GM'], ['GEO','GE'], ['DEU','DE'], ['GHA','GH'], ['GIB','GI'], ['GRC','GR'], ['GRL','GL'], ['GRD','GD'], ['GLP','GP'], ['GUM','GU'], ['GTM','GT'], ['GGY','GG'], ['GIN','GN'], ['GNB','GW'], ['GUY','GY'], ['HTI','HT'], ['HMD','HM'], ['VAT','VA'], ['HND','HN'], ['HKG','HK'], ['HUN','HU'], ['ISL','IS'], ['IND','IN'], ['IDN','ID'], ['IRN','IR'], ['IRQ','IQ'], ['IRL','IE'], ['IMN','IM'], ['ISR','IL'], ['ITA','IT'], ['JAM','JM'], ['JPN','JP'], ['JEY','JE'], ['JOR','JO'], ['KAZ','KZ'], ['KEN','KE'], ['KIR','KI'], ['PRK','KP'], ['KOR','KR'], ['KWT','KW'], ['KGZ','KG'], ['LAO','LA'], ['LVA','LV'], ['LBN','LB'], ['LSO','LS'], ['LBR','LR'], ['LBY','LY'], ['LIE','LI'], ['LTU','LT'], ['LUX','LU'], ['MAC','MO'], ['MKD','MK'], ['MDG','MG'], ['MWI','MW'], ['MYS','MY'], ['MDV','MV'], ['MLI','ML'], ['MLT','MT'], ['MHL','MH'], ['MTQ','MQ'], ['MRT','MR'], ['MUS','MU'], ['MYT','YT'], ['MEX','MX'], ['FSM','FM'], ['MDA','MD'], ['MCO','MC'], ['MNG','MN'], ['MNE','ME'], ['MSR','MS'], ['MAR','MA'], ['MOZ','MZ'], ['MMR','MM'], ['NAM','NA'], ['NRU','NR'], ['NPL','NP'], ['NLD','NL'], ['ANT','AN'], ['NCL','NC'], ['NZL','NZ'], ['NIC','NI'], ['NER','NE'], ['NGA','NG'], ['NIU','NU'], ['NFK','NF'], ['MNP','MP'], ['NOR','NO'], ['OMN','OM'], ['PAK','PK'], ['PLW','PW'], ['PSE','PS'], ['PAN','PA'], ['PNG','PG'], ['PRY','PY'], ['PER','PE'], ['PHL','PH'], ['PCN','PN'], ['POL','PL'], ['PRT','PT'], ['PRI','PR'], ['QAT','QA'], ['REU','RE'], ['ROU','RO'], ['RUS','RU'], ['RWA','RW'], ['SHN','SH'], ['KNA','KN'], ['LCA','LC'], ['SPM','PM'], ['VCT','VC'], ['WSM','WS'], ['SMR','SM'], ['STP','ST'], ['SAU','SA'], ['SEN','SN'], ['SRB','RS'], ['SYC','SC'], ['SLE','SL'], ['SGP','SG'], ['SVK','SK'], ['SVN','SI'], ['SLB','SB'], ['SOM','SO'], ['ZAF','ZA'], ['SGS','GS'], ['SSD','SS'], ['ESP','ES'], ['LKA','LK'], ['SDN','SD'], ['SUR','SR'], ['SJM','SJ'], ['SWZ','SZ'], ['SWE','SE'], ['CHE','CH'], ['SYR','SY'], ['TWN','TW'], ['TJK','TJ'], ['TZA','TZ'], ['THA','TH'], ['TLS','TL'], ['TGO','TG'], ['TKL','TK'], ['TON','TO'], ['TTO','TT'], ['TUN','TN'], ['TUR','TR'], ['TKM','TM'], ['TCA','TC'], ['TUV','TV'], ['UGA','UG'], ['UKR','UA'], ['ARE','AE'], ['GBR','GB'], ['USA','US'], ['UMI','UM'], ['URY','UY'], ['UZB','UZ'], ['VUT','VU'], ['VEN','VE'], ['VNM','VN'], ['VGB','VG'], ['VI',' U.S.'], ['WLF','WF'], ['ESH','EH'], ['YEM','YE'], ['ZMB','ZM'], ['ZWE','ZW']
]);

const nameReplacers = new Map([
	['the democratic republic of the congo','congo, the democratic republic of the'],
	['islamic republic of iran','iran, islamic republic of'],
	['democratic people\'s republic of korea','korea, democratic people\'s republic of'],
	['the former yugoslav republic of macedonia','macedonia, the former yugoslav republic of'],
	['federated states of micronesia','micronesia, federated states of'],
	['republic of moldova','moldova, republic of'],
	['occupied palestinian territory','palestinian territory, occupied'],
	['ascension and tristan da cunha saint helena','saint helena, ascension and tristan da cunha'],
	['united republic of tanzania','tanzania, united republic of'],
	['congo','congo, the democratic republic of the'],
	['iran','iran, islamic republic of'],
	['north korea','korea, democratic people\'s republic of'],
	['macedonia','macedonia, the former yugoslav republic of'],
	['micronesia','micronesia, federated states of'],
	['moldova','moldova, republic of'],
	['palestine','palestinian territory, occupied'],
	['saint helena','saint helena, ascension and tristan da cunha'],
	['tanzania','tanzania, united republic of'],
	['virgin islands','virgin islands, british'],
	['british virgin islands','virgin islands, british'],
	['virgin islands','virgin islands, u.s.'],
	['us virgin islands','virgin islands, u.s.'],
	['u.s. virgin islands','virgin islands, u.s.']
]);
const nameReplacersRev = new Map([...nameReplacers].map((arr) => {return arr.reverse();}));

// Debug when music_graph_descriptors_xxx_countries.js has been included before
if (typeof music_graph_descriptors_countries !== 'undefined' && typeof music_graph_descriptors_culture !== 'undefined') {
	const parent = music_graph_descriptors_countries;
	// Check all region names match
	let bMatch = true;
	if (typeof include !== 'undefined') {
		include('helpers_xxx_prototypes.js');
		if (!(new Set(music_graph_descriptors_culture.getRegionNames()).isEqual(new Set(parent.getRegionNames())))) {bMatch = false;}
	} else {
		const isSuperset = (parent, subset) => {for (let elem of subset) {if (!parent.has(elem)) {return false;}} return true;};
		const isEqual = (parent, subset) => {return (parent.size === subset.size && isSuperset(parent, subset));};
		if (!(isEqual(new Set(music_graph_descriptors_culture.getRegionNames()), new Set(parent.getRegionNames())))) {bMatch = false;}
	}
	if (!bMatch) {console.log('music_graph_descriptors_xxx_culture: Regions don\'t match');}
	// Check all countries are present in both places
	[...isoMap.values()].forEach((isoCode) => {if (!Object.keys(parent.getNodeRegion(isoCode)).length) {console.log('music_graph_descriptors_xxx_culture: ' + isoCode + ' is missing')}});
	parent.getMainRegions().forEach((region) => {
		parent.getSubRegions(region).forEach((subRegion) => {
			parent.culturalRegion[region][subRegion].forEach((isoCode) => {
				if (!isoMapRev.has(isoCode.toUpperCase())) {console.log('music_graph_descriptors_xxx_culture: ' + isoCode + ' wrong value')}
			});
		});
	});
}