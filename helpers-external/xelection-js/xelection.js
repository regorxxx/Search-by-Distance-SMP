const Selection = (function() {
	function copyTextToClipboard(text) {
		let textArea = document.createElement('textarea');
		textArea.style.position = 'fixed';
		textArea.style.top = 0;
		textArea.style.left = 0;
		textArea.style.width = '2em';
		textArea.style.height = '2em';
		textArea.style.padding = 0;
		textArea.style.border = 'none';
		textArea.style.outline = 'none';
		textArea.style.boxShadow = 'none';
		textArea.style.background = 'transparent';
		textArea.value = text;
		
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();
		
		try {
			let successful = document.execCommand('copy');
			let msg = successful ? 'successful' : 'unsuccessful';
			console.log('Copying text command was ' + msg);
		} catch (err) {
			console.log('Oops, unable to copy');
		}
		document.body.removeChild(textArea);
	}
	
	function popupwindow(url, title = '_blank', w = screen.width / 2, h = screen.height / 2) {
		let left = screen.width / 2 - w / 2;
		let top = screen.height / 2 - h / 2;
		return window.open(
			url,
			title,
			'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, noopener=yes, noreferrer=yes, ' +
			'width=' + w + ', height=' + h + ', top=' + top + ', left=' + left
		);
	}
	
	function getBrowserLanguage(){ 
		let language = navigator.language || navigator.userLanguage || function (){ 
							const languages = navigator.languages; 
							if (languages.length > 0){return languages[0];} 
						}() || 'en'; 
		return language.split('-')[0]; 
	}
	
	function _selection() {
		let selection = '';
		let text = '';
		let bgColor = '#dc143c'; // Crimson
		let iconColor = '#ffffff'; // White
		
		let _icons = {};
		let scale = 1;
		const iWH = 24;
		let arrowSize = 5;
		let buttonMargin = 7 * 2;
		let iconSize = iWH + buttonMargin;
		let top = 0;
		let left = 0;
		
		const menuOptions = {
			twitter:{
				url: 'https://twitter.com/intent/tweet?text=',
				title: 'Twitter',
				onClick: twitterButton,
				icon:
					'<svg xmlns="http://www.w3.org/2000/svg" width="' + iWH + '" height="' + iWH + '" viewBox="0 0 ' + iWH + ' ' + iWH + '" class="selection__icon"><path d="M8.2,20.2c6.5,0,11.7-5.2,11.8-11.6c0-0.1,0-0.1,0-0.2c0-0.2,0-0.4,0-0.5c0.8-0.6,1.5-1.3,2.1-2.2c-0.8,0.3-1.6,0.6-2.4,0.7c0.9-0.5,1.5-1.3,1.8-2.3c-0.8,0.5-1.7,0.8-2.6,1c-1.6-1.7-4.2-1.7-5.9-0.1c-1.1,1-1.5,2.5-1.2,3.9C8.5,8.7,5.4,7.1,3.3,4.6c-1.1,1.9-0.6,4.3,1.3,5.5c-0.7,0-1.3-0.2-1.9-0.5l0,0c0,2,1.4,3.7,3.3,4.1c-0.6,0.2-1.2,0.2-1.9,0.1c0.5,1.7,2.1,2.8,3.9,2.9c-1.7,1.4-3.9,2-6.1,1.7C3.8,19.5,6,20.2,8.2,20.2"/></svg>'
			},
			facebook: {
				url: 'https://www.facebook.com/sharer/sharer.php?quote=',
				title: 'Facebook',
				onClick: facebookButton,
				icon:
					'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + iWH + ' ' + iWH + '" enable-background="new 0 0 ' + iWH + ' ' + iWH + '" width="' + iWH + '" height="' + iWH + '" class="selection__icon"><path d="M20,2H4C2.9,2,2,2.9,2,4v16c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V4C22,2.9,21.1,2,20,2z M18.4,7.4H17c-0.9,0-1,0.3-1,1l0,1.3 h2.1L18,12h-1.9v7h-3.2v-7h-1.2V9.6h1.2V8.1c0-2,0.8-3.1,3.1-3.1h2.4V7.4z"/></svg>'
			},
			search: {
				url: 'https://www.google.co.in/search?q=',
				title: 'Search',
				onClick: searchButton,
				icon:
					'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + iWH + ' ' + iWH + '" enable-background="new 0 0 ' + iWH + ' ' + iWH + '" width="' + iWH + '" height="' + iWH + '" class="selection__icon"><path d="M23.111 20.058l-4.977-4.977c.965-1.52 1.523-3.322 1.523-5.251 0-5.42-4.409-9.83-9.829-9.83-5.42 0-9.828 4.41-9.828 9.83s4.408 9.83 9.829 9.83c1.834 0 3.552-.505 5.022-1.383l5.021 5.021c2.144 2.141 5.384-1.096 3.239-3.24zm-20.064-10.228c0-3.739 3.043-6.782 6.782-6.782s6.782 3.042 6.782 6.782-3.043 6.782-6.782 6.782-6.782-3.043-6.782-6.782zm2.01-1.764c1.984-4.599 8.664-4.066 9.922.749-2.534-2.974-6.993-3.294-9.922-.749z"/></svg>'
			},
			copy: {
				title: 'Copy',
				onClick: copyButton,
				icon:
					'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + iWH + ' ' + iWH + '" enable-background="new 0 0 ' + iWH + ' ' + iWH + '" width="' + iWH + '" height="' + iWH + '" class="selection__icon"><path d="M18 6v-6h-18v18h6v6h18v-18h-6zm-12 10h-4v-14h14v4h-10v10zm16 6h-14v-14h14v14z"/></svg>'
			},
			speak: {
				title: 'Speak',
				onClick: speakButton,
				icon:
					'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + iWH + ' ' + iWH + '" enable-background="new 0 0 ' + iWH + ' ' + iWH + '" width="' + iWH + '" height="' + iWH + '" class="selection__icon"><path d="M16 11c0 2.209-1.791 4-4 4s-4-1.791-4-4v-7c0-2.209 1.791-4 4-4s4 1.791 4 4v7zm4-2v2c0 4.418-3.582 8-8 8s-8-3.582-8-8v-2h2v2c0 3.309 2.691 6 6 6s6-2.691 6-6v-2h2zm-7 13v-2h-2v2h-4v2h10v-2h-4z"/></svg>'
			},
			translate: {
				url:'https://translate.google.com/#auto/',
				title: 'Translate',
				onClick: translateButton,
				icon:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + iWH + ' ' + iWH + '" enable-background="new 0 0 ' + iWH + ' ' + iWH + '" width="' + iWH + '" height="' + iWH + '" class="selection__icon">'+
					'<path id="svg_3" d="m17,20l-14.5,0c-1.378,0 -2.5,-1.122 -2.5,-2.5l0,-15c0,-1.378 1.122,-2.5 2.5,-2.5l8,0c0.214,0 0.404,0.136 0.473,0.338l6.5,19c0.052,0.152 0.027,0.321 -0.066,0.452c-0.094,0.132 -0.245,0.21 -0.407,0.21zm-14.5,-19c-0.827,0 -1.5,0.673 -1.5,1.5l0,15c0,0.827 0.673,1.5 1.5,1.5l13.8,0l-6.157,-18l-7.643,0z"/>'+
					'<path id="svg_5" d="m21.5,24l-8,0c-0.208,0 -0.395,-0.129 -0.468,-0.324l-1.5,-4c-0.097,-0.259 0.034,-0.547 0.292,-0.644c0.259,-0.096 0.547,0.034 0.644,0.292l1.379,3.676l7.653,0c0.827,0 1.5,-0.673 1.5,-1.5l0,-15c0,-0.827 -0.673,-1.5 -1.5,-1.5l-9.5,0c-0.276,0 -0.5,-0.224 -0.5,-0.5s0.224,-0.5 0.5,-0.5l9.5,0c1.378,0 2.5,1.122 2.5,2.5l0,15c0,1.378 -1.122,2.5 -2.5,2.5z"/>'+
					'<path id="svg_7" d="m13.5,24c-0.117,0 -0.234,-0.041 -0.329,-0.124c-0.208,-0.182 -0.229,-0.498 -0.047,-0.706l3.5,-4c0.182,-0.209 0.498,-0.229 0.706,-0.047c0.208,0.182 0.229,0.498 0.047,0.706l-3.5,4c-0.1,0.113 -0.238,0.171 -0.377,0.171z"/>'+
					'<path id="svg_9" d="m9.5,14c-0.206,0 -0.398,-0.127 -0.471,-0.332l-2.029,-5.681l-2.029,5.681c-0.093,0.26 -0.38,0.396 -0.639,0.303c-0.26,-0.093 -0.396,-0.379 -0.303,-0.639l2.5,-7c0.142,-0.398 0.8,-0.398 0.941,0l2.5,7c0.093,0.26 -0.042,0.546 -0.303,0.639c-0.054,0.02 -0.111,0.029 -0.167,0.029z"/>'+
					'<path id="svg_11" d="m8,11l-2,0c-0.276,0 -0.5,-0.224 -0.5,-0.5s0.224,-0.5 0.5,-0.5l2,0c0.276,0 0.5,0.224 0.5,0.5s-0.224,0.5 -0.5,0.5z"/>'+
					'<path id="svg_13" d="m21.5,11l-7,0c-0.276,0 -0.5,-0.224 -0.5,-0.5s0.224,-0.5 0.5,-0.5l7,0c0.276,0 0.5,0.224 0.5,0.5s-0.224,0.5 -0.5,0.5z"/>'+
					'<path id="svg_15" d="m17.5,11c-0.276,0 -0.5,-0.224 -0.5,-0.5l0,-1c0,-0.276 0.224,-0.5 0.5,-0.5s0.5,0.224 0.5,0.5l0,1c0,0.276 -0.224,0.5 -0.5,0.5z"/>'+
					'<path id="svg_17" d="m16,17c-0.157,0 -0.311,-0.073 -0.408,-0.21c-0.16,-0.225 -0.107,-0.537 0.118,-0.697c2.189,-1.555 3.79,-4.727 3.79,-5.592c0,-0.276 0.224,-0.5 0.5,-0.5s0.5,0.224 0.5,0.5c0,1.318 -1.927,4.785 -4.21,6.408c-0.088,0.061 -0.189,0.091 -0.29,0.091z"/>'+
					'<path id="svg_19" d="m20,18c-0.121,0 -0.242,-0.043 -0.337,-0.131c-0.363,-0.332 -3.558,-3.283 -4.126,-4.681c-0.104,-0.256 0.02,-0.547 0.275,-0.651c0.253,-0.103 0.547,0.019 0.651,0.275c0.409,1.007 2.936,3.459 3.875,4.319c0.204,0.187 0.217,0.502 0.031,0.707c-0.099,0.107 -0.234,0.162 -0.369,0.162z"/>'+
					'</svg>'
			},
			dictionary: { // Merged: https://github.com/prateekkalra/Selection-js/pull/36
				enurl: 'https://dictionary.cambridge.org/dictionary/english/', //English
				esurl: 'https://dle.rae.es/', //Spanish
				frurl: 'https://www.linguee.com/english-french/search?source=french&query=', //French
				zhurl: 'https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=', //Chinese
				hiurl: 'https://www.shabdkosh.com/search-dictionary?lc=hi&sl=en&tl=hi&e=' , //Hindi
				arurl: 'http://www.baheth.info/all.jsp?term=', //Arabic
				msurl: 'https://glosbe.com/ms/ms/', //Malay
				ruurl: 'https://en.openrussian.org/ru/', //Russian
				bnurl: 'http://www.english-bangla.com/bntobn/index/', //Bengali
				pturl: 'https://pt.thefreedictionary.com/', //Portugese
				title: 'Dictionary',
				onClick: dictionaryButton,
				icon:
				'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + iWH + ' ' + iWH + '" enable-background="new 0 0 ' + iWH + ' ' + iWH + '" width="' + iWH + '" height="' + iWH + '" class="selection__icon">' +
				'<path d="M18.666 10.137c0 .305-.251.556-.555.556H5.89C5.583 10.692 5.334 10.443 5.334 10.137s.251-.556.556-.556h12.223C18.417 9.581 18.666 9.832 18.666 10.137M14.717 12.364H5.89C5.583 12.364 5.334 12.613 5.334 12.92c0 .305.251 .555.556 .555h8.828c.305 0 .555-.251.555-.555C15.271 12.613 15.022 12.364 14.717 12.364M18.111 6.808H5.89C5.583 6.808 5.334 7.057 5.334 7.364c0 .305.251 .556.556 .556h12.223c.305 0 .555-.251.555-.556C18.666 7.057 18.417 6.808 18.111 6.808M22.555 3.469v13.333c0 .305-.251.556-.556.556H11.165l-3.772 3.728c-.156.155-.947.396-.947-.395v-3.333H2.001c-.305 0-.556-.251-.556-.556v-13.333c0-.305.251-.556.556-.556h20C22.306 2.915 22.555 3.164 22.555 3.469M21.445 4.025H2.557v12.223H7.001c.305 0 .556.249 .556.555v2.559l2.989-2.953c.105-.103.245-.16.392-.16h10.508V4.025z"/>' +
				'</svg>'
			},
			image: { // Merged: https://github.com/prateekkalra/Selection-js/pull/35
				url: 'https://www.google.com/search?tbm=isch&q=',
				title: 'Image Search',
				onClick: imageButton,
				icon:
				'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + iWH + '" viewBox="12 2 5 ' + iWH + '" height="' + iWH + '" class="selection__icon"><defs><clipPath id="id1"><path d="M 3.386719 2.902344 L 26.613281 2.902344 L 26.613281 26.121094 L 3.386719 26.121094 Z M 3.386719 2.902344 " clip-rule="nonzero"></path></clipPath></defs><g clip-path="url(#id1)"><path d="M 19.0625 11.03125 C 17.460938 11.03125 16.160156 9.726562 16.160156 8.125 C 16.160156 6.523438 17.460938 5.222656 19.0625 5.222656 C 20.664062 5.222656 21.964844 6.523438 21.964844 8.125 C 21.964844 9.726562 20.664062 11.03125 19.0625 11.03125 Z M 23.476562 10.902344 C 24.03125 10.007812 24.347656 8.960938 24.277344 7.8125 C 24.125 5.316406 22.140625 3.203125 19.667969 2.9375 C 16.507812 2.585938 13.835938 5.039062 13.835938 8.125 C 13.835938 11.015625 16.171875 13.351562 19.050781 13.351562 C 20.074219 13.351562 21.023438 13.046875 21.824219 12.539062 L 24.625 15.335938 C 25.078125 15.789062 25.820312 15.789062 26.273438 15.335938 C 26.726562 14.882812 26.726562 14.140625 26.273438 13.6875 Z M 19.0625 21.480469 L 8.632812 21.480469 C 8.148438 21.480469 7.878906 20.921875 8.183594 20.539062 L 10.203125 17.949219 C 10.433594 17.660156 10.875 17.644531 11.109375 17.9375 L 12.917969 20.121094 L 15.648438 16.613281 C 15.878906 16.3125 16.34375 16.3125 16.566406 16.625 L 19.527344 20.5625 C 19.816406 20.933594 19.539062 21.480469 19.0625 21.480469 Z M 21.964844 17.996094 L 21.964844 22.640625 C 21.964844 23.28125 21.445312 23.800781 20.804688 23.800781 L 6.871094 23.800781 C 6.234375 23.800781 5.707031 23.28125 5.707031 22.640625 L 5.707031 8.707031 C 5.707031 8.070312 6.234375 7.542969 6.871094 7.542969 L 10.378906 7.542969 C 11.015625 7.542969 11.539062 7.023438 11.539062 6.382812 C 11.539062 5.746094 11.015625 5.222656 10.378906 5.222656 L 5.707031 5.222656 C 4.433594 5.222656 3.386719 6.269531 3.386719 7.542969 L 3.386719 23.800781 C 3.386719 25.078125 4.433594 26.121094 5.707031 26.121094 L 21.964844 26.121094 C 23.242188 26.121094 24.285156 25.078125 24.285156 23.800781 L 24.285156 17.996094 C 24.285156 17.359375 23.765625 16.832031 23.125 16.832031 C 22.488281 16.832031 21.964844 17.359375 21.964844 17.996094 " fill-rule="nonzero"></path></g></svg>'
			},
			print: { // Merged: https://github.com/prateekkalra/Selection-js/pull/20
				title: 'Print',
				onClick: printButton,
				icon:
				  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + iWH + ' ' + iWH + '" enable-background="new 0 0 ' + iWH + ' ' + iWH + '" width="' + iWH + '" height="' + iWH + '" class="selection__icon"><g id="surface1"><path style=" stroke:none;fill-rule:nonzero;" d="M 6 18.75 L 6 23.25 L 18 23.25 L 18 15.75 L 6 15.75 Z M 7.5 17.25 L 16.5 17.25 L 16.5 18.75 L 7.5 18.75 Z M 7.5 20.25 L 16.5 20.25 L 16.5 21.75 L 7.5 21.75 Z M 7.5 20.25 "/><path style=" stroke:none;fill-rule:nonzero;" d="M 18 5.25 L 18 0.75 L 6 0.75 L 6 8.25 L 18 8.25 Z M 18 5.25 "/><path style=" stroke:none;fill-rule:nonzero;" d="M 21 5.25 L 19.5 5.25 L 19.5 9.75 L 4.5 9.75 L 4.5 5.25 L 3 5.25 C 1.5 5.25 0 6.75 0 8.25 L 0 15.75 C 0 17.25 1.5 18.75 3 18.75 L 4.5 18.75 L 4.5 14.25 L 19.5 14.25 L 19.5 18.75 L 21 18.75 C 22.5 18.75 24 17.25 24 15.75 L 24 8.25 C 24 6.75 22.5 5.25 21 5.25 Z M 21 5.25 "/></g></svg>'
			}
		};
		const menu = Object.fromEntries([...Object.keys(menuOptions).map((item) => {return [item, true];}), ['disable', 'false']]);
		
		function facebookButton() {
			let sharelink = window.location.href;
			let finalurl = this.url;
			if (sharelink.substring(0, 4) !== 'http') {
				sharelink = 'http://www.demourl.com';
			}
			finalurl += text + '&u=' + sharelink;
			popupwindow(finalurl);
			return false;
		}
		
		function twitterButton() {
			const url = window.location.href;
			popupwindow(this.url + encodeURIComponent(text) + ' ' + url);
			return false;
		}
		
		function searchButton() {
			popupwindow(this.url + encodeURIComponent(text));
			return false;
		}
		
		function copyButton() {
			copyTextToClipboard(text);
			return false;
		}
		
		function speakButton() {
			let speech = new SpeechSynthesisUtterance(text);
			window.speechSynthesis.speak(speech);
		}
		
		function translateButton() {
			popupwindow(this.url + getBrowserLanguage() + '/' + text);
			return false;
		}
		
		function dictionaryButton() {
			text = validateDictValue(text);
			const lanKey = getBrowserLanguage() + 'url'; // Dictionary based on Browser Language or use EN as default
			const url = this.hasOwnProperty(lanKey) ? this[lanKey] : this.enurl;
			popupwindow(url + encodeURIComponent(text));
			return false;
		}
		
		function validateDictValue(text){
			var TEXT = text.value;
			var values = text.split(' ').filter(function(v){return v!==''});
			if (values.length > 1){ // If more than one word grab the first word
				
				console.log("More than one word");
				var firstWord = text.replace(/ .*/,'');
				text = firstWord
			}
			console.log('Searching: ' +  text);
			return text;
		}
		
		function imageButton() {
			popupwindow(this.url + text);
			return false;
		}
		
		function printButton() {
			const selectwindow = window.open();
			selectwindow.document.write(text);
			selectwindow.print();
			selectwindow.close();
			return false;
		}
		
		function IconStyle() {
			const style = document.createElement('style');
			style.innerHTML = `.selection__icon{fill:${iconColor};}`;
			document.body.appendChild(style);
		}
		
		function newButton() {
			return (new Button(this.icon, this.title, this.onClick.bind(this)));
		}
		
		function appendIcons() {
			const div = document.createElement('div');
			let count = 0;
			Object.keys(menuOptions).forEach((item)=>{
				if (menu[item]) {
					div.appendChild(newButton.apply(menuOptions[item]));
					count++;
				}
			})
			return {
				icons: div,
				length: count
			};
		}
		
		function setTooltipPosition() {
			const position = selection.getRangeAt(0).getBoundingClientRect();
			const DOCUMENT_SCROLL_TOP =
				window.pageXOffset || document.documentElement.scrollTop || document.body.scrollTop;
			top = position.top + DOCUMENT_SCROLL_TOP - iconSize - arrowSize;
			left = position.left + (position.width - iconSize * _icons.length) / 2;
		}
		
		function moveTooltip() {
			setTooltipPosition();
			let tooltip = document.querySelector('.selection');
			tooltip.style.top = `${top}px`;
			tooltip.style.left = `${left}px`;
		}
		
		function drawTooltip() {
			_icons = appendIcons();
			setTooltipPosition();
			
			const div = document.createElement('div');
			div.className = 'selection';
			div.style =
				'line-height:0;' +
				'position:absolute;' +
				'background-color:' + bgColor + ';' +
				'border-radius:20px;' +
				'top:' + top + 'px;' +
				'left:' + left + 'px;' +
				'transition:all .2s ease-in-out;' +
				'box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22);' +
				'z-index:99999;' +
				'scale:' + scale + ';'
				;
			
			div.animate( // Merged: https://github.com/prateekkalra/Selection-js/pull/43
				[
					// keyframes
					{ transform: "translateY(100%) scale(0)" },
					{ transform: "translateY(0) scale(100%)" },
				],
				{
					// timing options
					duration: 200,
				}
			)
			div.appendChild(_icons.icons);
			
			const arrow = document.createElement('div');
			arrow.style =
				'position:absolute;' +
				'border-left:' + arrowSize + 'px solid transparent;' +
				'border-right:' + arrowSize + 'px solid transparent;' +
				'border-top:' + arrowSize + 'px solid ' + bgColor + ';' +
				'bottom:-' + (arrowSize - 1) + 'px;' +
				'left:' + (iconSize * _icons.length / 2 - arrowSize) + 'px;' +
				'width:0;' +
				'height:0;' +
				'scale:' + scale + ';'
				;
			
			if (!menu.disable) {
				div.appendChild(arrow);
			}
			
			document.body.appendChild(div);
		}
		
		function attachEvents() {
			function hasSelection() {
				return !!window.getSelection().toString();
			}

			function hasTooltipDrawn() {
				return !!document.querySelector('.selection');
			}

			window.addEventListener(
				'mouseup',
				function() {
				setTimeout(function mouseTimeout() {
					if (hasTooltipDrawn()) {
						if (hasSelection()) {
							selection = window.getSelection();
							text = selection.toString();
							moveTooltip();
							return;
						} else {
							document.querySelector('.selection').remove();
						}
					}
					if (hasSelection()) {
						selection = window.getSelection();
						text = selection.toString();
						drawTooltip();
					}
				}, 10);
				},
				false
			);
		}
		
		function config(options) {
			 Object.keys(options).forEach((option) => {
				if (menu.hasOwnProperty(option)) {
					menu[option] = options[option] === undefined ? menu[option] : options[option]
				} else if (option === 'backgroundColor') {
					bgColor = options[option] || '#dc143c'; // Crimson
				} else if (option === 'iconColor') {
					iconColor = options[option] || '#ffffff'; // White 
				} else if (option === 'scale') {
					scale = scale && isFinite(options[option]) ? options[option] : 1;
				} else {console.log('Option not recognized: ' + option);}
			})
			return this;
		}
		
		function init() {
			IconStyle();
			attachEvents();
			return this;
		}
		
		return {config, init};
	}
	
	function Button(icon, titleText, clickFn) {
		const btn = document.createElement('div');
		btn.style = 'display:inline-block;' + 'margin:7px;' + 'cursor:pointer;' + 'transition:all .2s ease-in-out;';
		btn.innerHTML = icon;
		btn.title = titleText;
		btn.onclick = clickFn;
		btn.onmouseover = function() {
			this.style.transform = 'scale(1.2)';
		};
		btn.onmouseout = function() {
			this.style.transform = 'scale(1)';
		};
		return btn;
	}
	
	return _selection;
})();