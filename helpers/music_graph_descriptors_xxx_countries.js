'use strict';
//08/01/22

if (typeof include !== 'undefined') {
	include('region_xxx.js');
}

/*
	Cultural descriptors
*/
const music_graph_descriptors_countries = new regionMap ({
	nodeName: 'country',
	culturalRegion: {
		'Antarctica': {
			'Antarctica': [
				'ATA'
			]
		},
		'Africa': {
			'West Africa': [
				'SLE','NGA','LBR','GMB','GHA','GNB','GIN','SEN','CIV','BEN','TGO','CPV','MLI','MRT','BFA'
			],
			'Maghreb': [ // North Africa
				'DZA','TUN','ESH','MAR','LBY','EGY'
			],
			'Central Africa': [
				'COD','COG','GAB','SSD','NER','UGA','GNQ','CMR','RWA','CAF','TCD','BDI'
			],
			'East Africa': [
				'ETH','KEN','SDN','SOM','DJI','ERI'
			],
			'South Africa': [
				'ZAF','TZA','MOZ','NAM','ZMB','ZWE','COM','SWZ','SYC','STP','SHN','REU','AGO','MDG','BWA','ATF','LSO','MWI','MUS','MYT','BVT'
			]
		},
		'Asia': {
			'Central Asia': [
				'NPL','BTN'
			],
			'East Asia': [
				'TWN','CHN','JPN','PRK','MAC','HKG'
			],
			'West Asia': [
				'TKM','TJK','IRN','PAK','UZB','KAZ','KOR','AFG','KGZ'
			],
			'South Asia': [
				'BGD','THA','IND','MMR','VNM','LKA','SGP','TLS','PHL','MYS','LAO','KHM','MDV','BRN','MNP','IOT','IDN'
			],
			'North Asia': [
				'MNG','RUS'
			]
		},
		'Europe': {
			'Eastern Europe': [
				'ALB','UKR','SRB','MKD','HRV','MDA','MNE','ROU','BIH','BGR'
			],
			'Southern Europe': [
				'AND','ESP','ITA','GIB','GRC','PRT','MLT','SMR','VAT'
			],
			'Central Europe': [
				'AUT','CHE','SVN','SVK','DEU','CZE','LIE','POL','HUN'
			],
			'Western Europe': [
				'BEL','GBR','MCO','IRL','FRA','LUX','NLD','GGY','IMN','JEY'
			],
			'Northern Europe': [
				'BLR','SWE','NOR','LTU','EST','DNK','FIN','SJM','LVA','GRL','FRO','ISL'
			]
		},
		'Mashriq': { // West Asia
			'Arabian Peninsula': [
				'BHR','SAU','OMN','QAT','YEM','ARE'
			],
			'Anatolia': [
				'AZE','ARM','TUR','GEO'
			],
			'Levant': [
				'SYR','ISR','PSE','LBN','JOR','CYP'
			],
			'Mesopotamia': [
				'IRQ','KWT'
			]
		},
		'America': {
			'Caribbean': [
				'CUB','DMA','DOM','JAM','PRI','MSR','VIR','VGB','TCA','TTO','VCT','LCA','KNA','HTI','CYM','MTQ','ANT','GLP','GRD','AIA'
			],
			'North America': [
				'ATG','ABW','BHS','BRB','USA','CAN','SPM','BMU'
			],
			'Central America': [
				'CRI','SLV','GTM','HND','MEX','NIC','PAN','BLZ'
			],
			'South America': [
				'ARG','CHL','COL','ECU','URY','PRY','PER','VEN','SUR','SGS','BOL','GUF','BRA','FLK','GUY'
			]
		},
		'Oceania': {
			'Australasia': [
				'AUS','CCK','CXR','NFK','HMD'
			],
			'Melanesia': [
				'VUT','NCL','SLB','PNG','FJI'
			],
			'Micronesia': [
				'PLW','GUM','FSM','NRU','MHL'
			],
			'Polynesia': [
				'TUV','WLF','UMI','TKL','TON','WSM','PCN','PYF','COK','NZL','ASM','NIU','KIR'
			]
		}
	}
});
// Alternate method names
music_graph_descriptors_countries.regionHasCountry = music_graph_descriptors_countries.regionHasNode;
music_graph_descriptors_countries.getCountryRegion = music_graph_descriptors_countries.getNodeRegion;