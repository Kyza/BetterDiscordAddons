//META{"name":"CharCounter","website":"https://github.com/mwittrien/BetterDiscordAddons/tree/master/Plugins/CharCounter","source":"https://raw.githubusercontent.com/mwittrien/BetterDiscordAddons/master/Plugins/CharCounter/CharCounter.plugin.js"}*//

class CharCounter {
	getName () {return "CharCounter";}

	getVersion () {return "1.3.6";}

	getAuthor () {return "DevilBro";}

	getDescription () {return "Adds a charcounter in the chat.";}

	constructor () {
		this.changelog = {
			"fixed":[["Light Theme Update","Fixed bugs for the Light Theme Update, which broke 99% of my plugins"]]
		};

		this.patchModules = {
			"ChannelTextArea":"componentDidMount",
			"UserPopout":"componentDidMount",
			"UserProfile":"componentDidMount",
			"ChangeNickname":"componentDidMount"
		};
	}

	initConstructor () {
		this.maxLenghts = {
			normal: 2000,
			edit: 2000,
			form: 2000,
			nickname: 32,
			popout: 256,
			profile: 256
		}
		   
		this.css = `
			${BDFDB.dotCN.themelight} #charcounter {
				color: #747f8d;
				opacity: .7;
			}
			${BDFDB.dotCN.themedark} #charcounter {
				color: #ccc;
				opacity: .5;
			}
			${BDFDB.dotCNS.typing + BDFDB.dotCN.cooldownwrapper} {
				margin-right: 64px;
			}
			.charcounter-added {
				position: relative !important;
			}
			#charcounter {
				display: block;
				position: absolute;
				z-index: 1000;
				pointer-events: none;
				font-size: 15px;
			}
			#charcounter.normal {
				right: 0;
				bottom: -1.3em;
			}
			#charcounter.edit {
				left: 0;
				bottom: -1.3em;
			}
			#charcounter.form {
				right: 0;
				bottom: -1.0em;
			}
			#charcounter.nickname {
				right: 0 !important;
				top: 0 !important;
			}
			#charcounter.popout {
				right: 3px !important;
				bottom: 1px !important;
				font-size: 10px !important;
			}
			#charcounter.profile {
				right: -5px !important;
				bottom: 3px !important;
				font-size: 12px !important;
			}
			${BDFDB.dotCN.usernote} textarea:not(:focus) + #charcounter {
				display: none;
			}`;
	}

	//legacy
	load () {}

	start () {
		if (!global.BDFDB) global.BDFDB = {myPlugins:{}};
		if (global.BDFDB && global.BDFDB.myPlugins && typeof global.BDFDB.myPlugins == "object") global.BDFDB.myPlugins[this.getName()] = this;
		var libraryScript = document.querySelector('head script#BDFDBLibraryScript');
		if (!libraryScript || (performance.now() - libraryScript.getAttribute("date")) > 600000) {
			if (libraryScript) libraryScript.remove();
			libraryScript = document.createElement("script");
			libraryScript.setAttribute("id", "BDFDBLibraryScript");
			libraryScript.setAttribute("type", "text/javascript");
			libraryScript.setAttribute("src", "https://mwittrien.github.io/BetterDiscordAddons/Plugins/BDFDB.min.js");
			libraryScript.setAttribute("date", performance.now());
			libraryScript.addEventListener("load", () => {this.initialize();});
			document.head.appendChild(libraryScript);
		}
		else if (global.BDFDB && typeof BDFDB === "object" && BDFDB.loaded) this.initialize();
		this.startTimeout = setTimeout(() => {this.initialize();}, 30000);
	}

	initialize () {
		if (global.BDFDB && typeof BDFDB === "object" && BDFDB.loaded) {
			if (this.started) return;
			BDFDB.PluginUtils.init(this);

			BDFDB.ModuleUtils.forceAllUpdates(this);
		}
		else console.error(`%c[${this.getName()}]%c`, 'color: #3a71c1; font-weight: 700;', '', 'Fatal Error: Could not load BD functions!');
	}


	stop () {
		if (global.BDFDB && typeof BDFDB === "object" && BDFDB.loaded) {
			this.stopping = true;

			BDFDB.DOMUtils.remove(".charcounter");
			BDFDB.DOMUtils.removeClassFromDOM("charcounter-added");
			BDFDB.PluginUtils.clear(this);
		}
	}


	// begin of own functions

	processChannelTextArea (instance, wrapper, returnvalue) {
		if (instance.props && instance.props.type && this.maxLenghts[instance.props.type]) this.appendCounter(wrapper.querySelector("textarea"), instance.props.type, true);
	}

	processNote (instance, wrapper, returnvalue) {
		this.appendCounter(wrapper.firstElementChild, BDFDB.DOMUtils.containsClass(wrapper, BDFDB.disCN.usernotepopout) ? "popout" : (BDFDB.DOMUtils.containsClass(wrapper, BDFDB.disCN.usernoteprofile) ? "profile" : null), false);
	}

	processUserPopout (instance, wrapper, returnvalue) {
		this.appendCounter(wrapper.querySelector(BDFDB.dotCN.usernote).firstElementChild, "popout", false);
	}

	processUserProfile (instance, wrapper, returnvalue) {
		this.appendCounter(wrapper.querySelector(BDFDB.dotCN.usernote).firstElementChild, "profile", false);
	}

	processChangeNickname (instance, wrapper, returnvalue) {
		let reset = wrapper.querySelector(BDFDB.dotCN.reset);
		if (reset && BDFDB.DOMUtils.getText(reset.firstElementChild) == BDFDB.LanguageUtils.LanguageStrings.RESET_NICKNAME) this.appendCounter(wrapper.querySelector(BDFDB.dotCN.inputdefault), "nickname", false);
	}

	appendCounter (input, type, parsing) {
		if (!input || !type) return;
		BDFDB.DOMUtils.remove(input.parentElement.querySelectorAll("#charcounter"));
		var counter = BDFDB.DOMUtils.create(`<div id="charcounter" class="charcounter ${type}"></div>`);
		input.parentElement.appendChild(counter);

		var updateCounter = () => {
			var inputlength = parsing ? BDFDB.getParsedLength(input.value) : input.value.length;
			var seleclength = input.selectionEnd - input.selectionStart == 0 ? 0 : (parsing ? BDFDB.getParsedLength(input.value.slice(input.selectionStart, input.selectionEnd)) : (input.selectionEnd - input.selectionStart));
			seleclength = !seleclength ? 0 : (seleclength > inputlength ? inputlength - (inputlength - input.selectionEnd - input.selectionStart) : seleclength);
			counter.innerText = inputlength + "/" + (this.maxLenghts[type] || 2000) + (!seleclength ? "" : " (" + seleclength + ")");
		};

		BDFDB.DOMUtils.addClass(input.parentElement.parentElement, "charcounter-added");
		if (type == "nickname") input.setAttribute("maxlength", 32);
		BDFDB.ListenerUtils.add(this, input, "keydown click change", e => {
			clearTimeout(input.charcountertimeout);
			input.charcountertimeout = setTimeout(() => {updateCounter();},100);
		});
		BDFDB.ListenerUtils.add(this, input, "mousedown", e => {
			BDFDB.ListenerUtils.add(this, document, "mouseup", () => {
				BDFDB.ListenerUtils.remove(this, document);
				if (input.selectionEnd - input.selectionStart) setImmediate(() => {BDFDB.ListenerUtils.add(this, document, "click", () => {
					var contexttype = BDFDB.ReactUtils.getValue(document.querySelector(BDFDB.dotCN.contextmenu), "return.stateNode.props.type");
					if (!contexttype || !contexttype.startsWith("CHANNEL_TEXT_AREA")) {
						input.selectionStart = 0;
						input.selectionEnd = 0;
						updateCounter();
					}
					else setTimeout(() => {updateCounter();},100);
					BDFDB.ListenerUtils.remove(this, document);
				});});
			});
			BDFDB.ListenerUtils.add(this, document, "mousemove", () => {setTimeout(() => {updateCounter();},10);});
		});

		updateCounter();
	}
}
