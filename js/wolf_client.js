var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var socket = io();
var card_names = ["BACK", "BACK_SELECTED", "DOPPELGANGER", "DRUNK", "HUNTER", "INSOMNIAC", "MASON", "MINION", "ROBBER", "SEER", "TROUBLEMAKER", "VILLAGER", "WEREWOLF", "NOTHING"];
var img_sources = {};
var _iteratorNormalCompletion = true;
var _didIteratorError = false;
var _iteratorError = undefined;

try {
    for (var _iterator = card_names[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var c_name = _step.value;

        img_sources[c_name] = "/static/card_" + c_name.toLowerCase() + ".png";
    }

    // Server communication
} catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
} finally {
    try {
        if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
        }
    } finally {
        if (_didIteratorError) {
            throw _iteratorError;
        }
    }
}

function sendLoginMessage() {
    socket.emit("loginMessage", document.getElementById("nameInputField").value.toString());
}

function sendRequestStatus() {
    socket.emit("debug_getStatus");
    console.log("Status update requested");
}

// Input: JSON object of data to be sent
function sendClientGameUpdate(data) {
    socket.emit("clientGameUpdate", data);
    console.log("Msg sent with data:");
    console.log(data);
}

function sendFinishGame() {
    socket.emit("debug_finishGame");
    console.log("Sent finish game message");
}

function sendReadyMessage() {
    socket.emit("togglePlayerReady");
}

function sendSetSettingsMessage(data) {
    socket.emit("setGameSettings", data);
    console.log("Sent game settings:");
    console.log(data);
}

function sendGetSettingsMessage() {
    socket.emit("getGameSettings");
}

function sendGetPlayerListMessage() {
    socket.emit("getPlayerList");
}
function sendVote(vote) {
    socket.emit("clientGameVote", { vote: vote });
}

function isVowel(letter) {
    return "AaEeIiOoUuYy".includes(letter);
}

// React

var CardButton = function (_React$Component) {
    _inherits(CardButton, _React$Component);

    function CardButton(props) {
        _classCallCheck(this, CardButton);

        var _this = _possibleConstructorReturn(this, (CardButton.__proto__ || Object.getPrototypeOf(CardButton)).call(this, props));

        _this.handleClick = _this.handleClick.bind(_this);
        _this.state = {
            selected: false,
            value: _this.props.value,
            //keep_facedown: if false, card will flip over when selected
            keep_facedown: _this.props.keepDown
        };
        return _this;
    }

    _createClass(CardButton, [{
        key: "handleClick",
        value: function handleClick() {
            if (!this.props.autoFlip) {
                this.props.onClick(this.state.value, this.state.selected);
                this.setState({ selected: !this.state.selected });
            }
        }
    }, {
        key: "componentDidMount",
        value: function componentDidMount() {
            var _this2 = this;

            if (this.props.autoFlip) {
                setTimeout(function () {
                    _this2.setState({ selected: true });
                }, 800);
            }
        }
    }, {
        key: "render",
        value: function render() {
            if (this.state.keep_facedown) {
                var img_src = this.state.selected ? img_sources["BACK_SELECTED"] : img_sources["BACK"];
                return React.createElement(
                    "div",
                    { className: "cardContainer" },
                    React.createElement("input", { id: "card" + this.state.value.toString(),
                        className: "cardImage", type: "image",
                        src: img_src, onClick: this.handleClick
                    }),
                    React.createElement(
                        "label",
                        { htmlFor: this.state.value.toString() },
                        this.props.label
                    )
                );
            } else {
                var id_string = "card_" + this.state.value.toString();
                return React.createElement(
                    "div",
                    { className: this.state.selected ? "cardContainer active" : "cardContainer" },
                    React.createElement(
                        "div",
                        { id: id_string, className: "cardInner", transform: this.state.selected ? "rotateY(180deg)" : null },
                        React.createElement(
                            "div",
                            { className: "cardBack" },
                            React.createElement("input", { type: "image", className: "cardImage",
                                src: img_sources["BACK"], onClick: this.handleClick })
                        ),
                        React.createElement(
                            "div",
                            { className: "cardFace" },
                            React.createElement("input", { type: "image", className: "cardImage",
                                src: img_sources[this.props.face]
                            })
                        )
                    ),
                    React.createElement(
                        "label",
                        { htmlFor: id_string },
                        this.props.label
                    )
                );
            }
        }
    }]);

    return CardButton;
}(React.Component);

function DisplayPlayerCards(props) {
    var otherPlayers = props.playerList.filter(function (myName) {
        return myName != props.myName;
    });
    var cardRows = [];
    var newRow = [];
    var i = 0;
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = otherPlayers[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var username = _step2.value;

            newRow.push(username);
            if (i > 0 && ((i + 1) % 3 === 0 || i + 1 === otherPlayers.length)) {
                cardRows.push(React.createElement(CardRow, {
                    key: "row_" + newRow.join(),
                    values: newRow,
                    onClick: function onClick(data) {
                        return props.onClick(data);
                    },
                    centerCards: false
                }));
                newRow = [];
            }
            i++;
        }
    } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
            }
        } finally {
            if (_didIteratorError2) {
                throw _iteratorError2;
            }
        }
    }

    return React.createElement(
        "div",
        { className: "cardDisplay" },
        cardRows
    );
}

function DisplayCenterCards(props) {
    if (props.centerCount === 0) {
        return React.createElement(
            "div",
            { className: "cardDisplay" },
            "(Sorry, but there are no center cards...)"
        );
    }
    var cardRows = [];
    var newRow = [];
    for (var i = 0; i < props.centerCount; i++) {
        newRow.push(i);
        if ((i + 1) % 3 === 0 || i + 1 === props.centerCount) {
            cardRows.push(React.createElement(CardRow, {
                key: "row_" + newRow.join(),
                values: newRow,
                onClick: function onClick(data) {
                    return props.onClick(data);
                },
                centerCards: true
            }));
            newRow = [];
        }
    }
    return React.createElement(
        "div",
        { className: "cardDisplay" },
        cardRows
    );
}

function CardRow(props) {
    return React.createElement(
        "div",
        { className: "cardRow" },
        props.values.map(function (value) {
            if (props.centerCards) {
                return React.createElement(CardButton, {
                    key: "card_" + value.toString(),
                    value: value,
                    onClick: function onClick(data) {
                        return props.onClick(data);
                    },
                    label: "Center card " + (value + 1).toString(),
                    keepDown: true
                });
            }
            return React.createElement(CardButton, {
                key: "card_" + value.toString(),
                value: value,
                onClick: function onClick(data) {
                    return props.onClick(data);
                },
                label: value,
                keepDown: true
            });
        })
    );
}

var SeerOptions = function (_React$Component2) {
    _inherits(SeerOptions, _React$Component2);

    function SeerOptions(props) {
        _classCallCheck(this, SeerOptions);

        var _this3 = _possibleConstructorReturn(this, (SeerOptions.__proto__ || Object.getPrototypeOf(SeerOptions)).call(this, props));

        _this3.state = {
            seer_selection: 0, //0: not selected, 1: see player 2: see center 3: done
            cardChoices: [],
            roleData: [],
            result_string: ""
        };
        return _this3;
    }

    _createClass(SeerOptions, [{
        key: "setSeerSelection",
        value: function setSeerSelection(selection) {
            this.setState({ seer_selection: selection });
        }
    }, {
        key: "makeMovePayload",
        value: function makeMovePayload() {
            var payload = {};
            payload["moveType"] = 'SEER';
            payload["cards"] = this.state.cardChoices;
            if (this.state.seer_selection === 1) {
                payload["details"] = { center: false, doppel: this.props.doppel };
            } else if (this.state.seer_selection === 2) {
                payload["details"] = { center: true, doppel: this.props.doppel };
            }
            return payload;
        }
    }, {
        key: "handleAction",
        value: function handleAction(data) {
            var _this4 = this;

            var newChoices = this.state.cardChoices;
            if (newChoices.includes(data)) {
                newChoices.splice(newChoices.indexOf(data), 1);
            } else {
                newChoices.push(data);
            }
            console.log(newChoices);
            this.setState({ cardChoices: newChoices }, function () {
                var cCount = _this4.state.cardChoices.length;
                var sSelect = _this4.state.seer_selection;
                if (sSelect === 1 && cCount > 0) {
                    sendClientGameUpdate(_this4.makeMovePayload());
                } else if (sSelect === 2 && (cCount === _this4.props.centerCount || cCount > 1)) {
                    sendClientGameUpdate(_this4.makeMovePayload());
                }
            });
        }
    }, {
        key: "componentDidMount",
        value: function componentDidMount() {
            var _this5 = this;

            socket.on('roleInfo', function (msg) {
                if (_this5.state.seer_selection === 1) {
                    var artcl = isVowel(msg[0].charAt(0)) ? "an" : "a";
                    var _intel_string = "You saw " + _this5.state.cardChoices[0] + "s card. It was " + artcl + " " + msg[0];
                    _this5.props.addIntel(_intel_string);
                } else if (_this5.state.seer_selection === 2) {
                    var intel_string = "You looked at center card " + (_this5.state.cardChoices[0] + 1) + " and " + (_this5.state.cardChoices[1] + 1) + ". \n                You saw " + (isVowel(msg[0].charAt(0)) ? "an" : "a") + " " + msg[0];
                    if (_this5.props.centerCount > 1) {
                        intel_string += " and " + (isVowel(msg[1].charAt(0)) ? "an" : "a") + " " + msg[1];
                    }
                    _this5.props.addIntel(intel_string);
                }
                _this5.setState({ roleData: msg, seer_selection: 3 });
                // wait for reveal animation to play before updating result string
                var result_string = "";
                setTimeout(function () {
                    result_string = "You see ";
                    for (var i = 0; i < _this5.state.roleData.length; i++) {
                        if (i > 0) {
                            result_string += " and ";
                        }
                        var _artcl = isVowel(_this5.state.roleData[i][0]) ? "an" : "a";
                        result_string += _artcl + " " + _this5.state.roleData[i];
                    }
                    _this5.setState({ result_string: result_string });
                }, 1000);
            });
        }
    }, {
        key: "componentWillUnmount",
        value: function componentWillUnmount() {
            socket.on('roleInfo', function (msg) {
                console.log("Component has been unmounted");
            });
        }
    }, {
        key: "render",
        value: function render() {
            var _this6 = this;

            var choice = this.state.seer_selection;
            if (choice === 0 && this.props.centerCount === 0) {
                choice = 1;
                this.setState({ seer_selection: 1 });
            }
            switch (choice) {
                case 0:
                    return React.createElement(
                        "div",
                        { className: "seerSelection" },
                        React.createElement(
                            "button",
                            { onClick: this.setSeerSelection.bind(this, 1) },
                            "See another players card"
                        ),
                        React.createElement(
                            "button",
                            { onClick: this.setSeerSelection.bind(this, 2) },
                            "See 2 center cards"
                        )
                    );
                case 1:
                    return React.createElement(
                        "div",
                        { className: "seerSelection" },
                        React.createElement(
                            "p",
                            null,
                            "Select a player card to view:"
                        ),
                        React.createElement(DisplayPlayerCards, {
                            playerList: this.props.playerList,
                            myName: this.props.myName,
                            onClick: function onClick(data) {
                                return _this6.handleAction(data);
                            }
                        })
                    );
                case 2:
                    return React.createElement(
                        "div",
                        { className: "seerSelection" },
                        React.createElement(
                            "p",
                            null,
                            "Select 2 center cards to view:"
                        ),
                        React.createElement(DisplayCenterCards, {
                            centerCount: this.props.centerCount,
                            onClick: function onClick(data) {
                                return _this6.handleAction(data);
                            }
                        })
                    );
                case 3:
                    if (this.state.roleData) {
                        var resultCardButtons = [];
                        for (var i = 0; i < this.state.roleData.length; i++) {
                            resultCardButtons.push(React.createElement(CardButton, {
                                key: "flipCard" + i.toString(),
                                value: i,
                                keepDown: false,
                                face: this.state.roleData[i],
                                autoFlip: true,
                                label: ""
                            }));
                        }
                        return React.createElement(
                            "div",
                            { className: "seerSelection" },
                            React.createElement(
                                "p",
                                null,
                                this.state.result_string
                            ),
                            React.createElement(
                                "div",
                                { className: "autoFlipButtons" },
                                resultCardButtons
                            )
                        );
                    }
                    return React.createElement(
                        "p",
                        null,
                        "You focus your magical powers..."
                    );
            }
        }
    }]);

    return SeerOptions;
}(React.Component);

var WerewolfOptions = function (_React$Component3) {
    _inherits(WerewolfOptions, _React$Component3);

    function WerewolfOptions(props) {
        _classCallCheck(this, WerewolfOptions);

        var _this7 = _possibleConstructorReturn(this, (WerewolfOptions.__proto__ || Object.getPrototypeOf(WerewolfOptions)).call(this, props));

        _this7.makeMovePayload = _this7.makeMovePayload.bind(_this7);
        _this7.state = {
            alone: false,
            roleData: [],
            cardChoice: -1,
            /* turn_state 
            0: waiting for other wolves 
            1: displaying other wolves/solo choices 
            2: waiting for solo choice response
            3: done with solo choice */
            turn_state: 0,
            result_string: ""
        };
        return _this7;
    }

    _createClass(WerewolfOptions, [{
        key: "componentDidMount",
        value: function componentDidMount() {
            var _this8 = this;

            socket.on('roleInfo', function (msg) {
                if (_this8.state.turn_state === 0 || _this8.state.turn_state === 1) {
                    _this8.setState({ alone: msg["alone"], roleData: msg["others"], turn_state: 1 });
                    if (msg["alone"]) {
                        _this8.props.addIntel("You were the only werewolf.");
                    } else {
                        var plural_or_nay = msg["others"].length > 1 ? "werewolves were" : "werewolf was";
                        _this8.props.addIntel("The other " + plural_or_nay + " " + msg["others"].join(', '));
                    }
                } else if (_this8.state.turn_state === 2) {
                    var artcl = isVowel(msg[0].charAt(0)) ? "an" : "a";
                    var intel_string = "You looked at center card " + (_this8.state.cardChoice + 1) + ". It was " + artcl + " " + msg[0];
                    _this8.props.addIntel(intel_string);
                    _this8.setState({ roleData: msg, turn_state: 3 });
                    setTimeout(function () {
                        _this8.setState({ result_string: "You see a " + msg[0] });
                    }, 1000);
                }
            });
        }
    }, {
        key: "componentWillUnmount",
        value: function componentWillUnmount() {
            socket.on('roleInfo', function (msg) {
                console.log("Component has been unmounted");
            });
        }
    }, {
        key: "makeMovePayload",
        value: function makeMovePayload() {
            var payload = {
                moveType: 'WEREWOLF',
                cards: [this.state.cardChoice]
            };
            return payload;
        }
    }, {
        key: "handleAction",
        value: function handleAction(choice) {
            var _this9 = this;

            var int_choice = parseInt(choice);
            this.setState({ cardChoice: int_choice, turn_state: 2 }, function () {
                return sendClientGameUpdate(_this9.makeMovePayload());
            });
        }
    }, {
        key: "render",
        value: function render() {
            var _this10 = this;

            switch (this.state.turn_state) {
                case 0:
                    return React.createElement(
                        "div",
                        { className: "werewolfOptions" },
                        React.createElement(
                            "p",
                            null,
                            "You smell the air and look for other werewolves..."
                        )
                    );
                case 1:
                    if (this.state.alone) {
                        return React.createElement(
                            "div",
                            { className: "werewolfOptions" },
                            React.createElement(
                                "p",
                                null,
                                "You are the only werewolf. Select a center card to view:"
                            ),
                            React.createElement(DisplayCenterCards, {
                                centerCount: this.props.centerCount,
                                onClick: function onClick(choice) {
                                    return _this10.handleAction(choice);
                                }
                            })
                        );
                    }
                    return React.createElement(
                        "div",
                        { className: "werewolfOptions" },
                        React.createElement(
                            "p",
                            null,
                            "The other werewolves are: "
                        ),
                        React.createElement(
                            "ul",
                            null,
                            this.state.roleData.map(function (username) {
                                return React.createElement(
                                    "li",
                                    { key: username },
                                    username
                                ); //TODO implement better keys
                            })
                        )
                    );
                case 2:
                    return React.createElement(
                        "div",
                        { className: "werewolfOptions" },
                        React.createElement(
                            "p",
                            null,
                            "You turn over the center card..."
                        )
                    );
                case 3:
                    return React.createElement(
                        "div",
                        { className: "werewolfOptions" },
                        React.createElement(
                            "p",
                            null,
                            this.state.result_string
                        ),
                        React.createElement(CardButton, {
                            key: "flipCard" + this.state.cardChoice.toString(),
                            value: this.state.cardChoice,
                            keepDown: false,
                            face: this.state.roleData[0],
                            autoFlip: true,
                            label: ""
                        })
                    );
                default:
                    break;
            }
        }
    }]);

    return WerewolfOptions;
}(React.Component);

var TroublemakerOptions = function (_React$Component4) {
    _inherits(TroublemakerOptions, _React$Component4);

    function TroublemakerOptions(props) {
        _classCallCheck(this, TroublemakerOptions);

        var _this11 = _possibleConstructorReturn(this, (TroublemakerOptions.__proto__ || Object.getPrototypeOf(TroublemakerOptions)).call(this, props));

        _this11.makeMovePayload = _this11.makeMovePayload.bind(_this11);
        _this11.state = {
            choices: [],
            moveSent: false
        };
        return _this11;
    }

    _createClass(TroublemakerOptions, [{
        key: "handleAction",
        value: function handleAction(data) {
            var _this12 = this;

            var newChoices = this.state.choices;
            if (newChoices.includes(data)) {
                newChoices.splice(newChoices.indexOf(data), 1);
            } else {
                newChoices.push(data);
            }
            this.setState({ cardChoices: newChoices }, function () {
                if (_this12.state.choices.length === 2) {
                    sendClientGameUpdate(_this12.makeMovePayload());
                    var intel_string = "You swapped the cards of " + _this12.state.choices[0] + " and " + _this12.state.choices[1] + ".";
                    _this12.props.addIntel(intel_string);
                }
            });
        }
    }, {
        key: "makeMovePayload",
        value: function makeMovePayload() {
            if (this.state.choices.length == 2) {
                var payload = {
                    moveType: 'TROUBLEMAKER',
                    cards: this.state.choices,
                    details: { doppel: this.props.doppel ? true : false //Cast to bool in case doppel is not provided
                    } };
                this.setState({ moveSent: true });
                return payload;
            }
            //TODO handle cases where exactly 2 cards haven't been selected
        }
    }, {
        key: "render",
        value: function render() {
            var _this13 = this;

            if (!this.state.moveSent) {
                return React.createElement(
                    "div",
                    { className: "troublemakerOptions" },
                    React.createElement(
                        "p",
                        null,
                        "Select 2 cards to swap: "
                    ),
                    React.createElement(DisplayPlayerCards, {
                        playerList: this.props.playerList,
                        myName: this.props.myName,
                        onClick: function onClick(data) {
                            return _this13.handleAction(data);
                        }
                    })
                );
            } else {
                return React.createElement(
                    "div",
                    { className: "troublemakerOptions" },
                    React.createElement(
                        "p",
                        null,
                        "You swapped the cards of ",
                        this.state.choices[0],
                        " and ",
                        this.state.choices[1],
                        "."
                    )
                );
            }
        }
    }]);

    return TroublemakerOptions;
}(React.Component);

var RobberOptions = function (_React$Component5) {
    _inherits(RobberOptions, _React$Component5);

    function RobberOptions(props) {
        _classCallCheck(this, RobberOptions);

        var _this14 = _possibleConstructorReturn(this, (RobberOptions.__proto__ || Object.getPrototypeOf(RobberOptions)).call(this, props));

        _this14.makeMovePayload = _this14.makeMovePayload.bind(_this14);
        _this14.state = {
            turn_state: 0, //0: not selected, 1: waiting for server response 2: done
            choice: "",
            roleData: "",
            result_string: ""
        };
        return _this14;
    }

    _createClass(RobberOptions, [{
        key: "componentDidMount",
        value: function componentDidMount() {
            var _this15 = this;

            socket.on('roleInfo', function (msg) {
                if (_this15.state.turn_state === 1) {
                    var artcl = isVowel(msg[0].charAt(0)) ? "an" : "a";
                    var intel_string = "You robbed " + _this15.state.choice + " and became " + artcl + " " + msg[0];
                    _this15.props.addIntel(intel_string);
                    _this15.setState({ roleData: msg[0], turn_state: 2 });
                    setTimeout(function () {
                        _this15.setState({ result_string: intel_string });
                    }, 1000);
                }
            });
        }
    }, {
        key: "componentWillUnmount",
        value: function componentWillUnmount() {
            socket.on('roleInfo', function (msg) {
                console.log("Component has been unmounted");
            });
        }
    }, {
        key: "makeMovePayload",
        value: function makeMovePayload() {
            var payload = {
                moveType: "ROBBER",
                cards: [this.state.choice],
                details: { doppel: this.props.doppel ? true : false }
            };
            this.setState({ turn_state: 1 });
            return payload;
        }
    }, {
        key: "handleAction",
        value: function handleAction(choice) {
            var _this16 = this;

            this.setState({ choice: choice }, function () {
                sendClientGameUpdate(_this16.makeMovePayload());
                _this16.setState({ turn_state: 1 });
            });
        }
    }, {
        key: "render",
        value: function render() {
            var _this17 = this;

            switch (this.state.turn_state) {
                case 0:
                    return React.createElement(
                        "div",
                        { className: "robberOptions" },
                        React.createElement(
                            "p",
                            null,
                            "Select a player to rob: "
                        ),
                        React.createElement(DisplayPlayerCards, {
                            playerList: this.props.playerList,
                            myName: this.props.myName,
                            onClick: function onClick(data) {
                                return _this17.handleAction(data);
                            }
                        })
                    );
                case 1:
                    return React.createElement(
                        "div",
                        { className: "robberOptions" },
                        React.createElement(
                            "p",
                            null,
                            "You search through ",
                            this.state.choice,
                            "s belongings..."
                        )
                    );
                case 2:
                    return React.createElement(
                        "div",
                        { className: "robberOptions" },
                        React.createElement(
                            "p",
                            null,
                            this.state.result_string
                        ),
                        React.createElement(CardButton, {
                            key: "flipCard" + this.state.choice.toString(),
                            value: this.state.choice,
                            keepDown: false,
                            face: this.state.roleData,
                            autoFlip: true,
                            label: ""
                        })
                    );
            }
        }
    }]);

    return RobberOptions;
}(React.Component);

var MinionOptions = function (_React$Component6) {
    _inherits(MinionOptions, _React$Component6);

    function MinionOptions(props) {
        _classCallCheck(this, MinionOptions);

        var _this18 = _possibleConstructorReturn(this, (MinionOptions.__proto__ || Object.getPrototypeOf(MinionOptions)).call(this, props));

        _this18.state = {
            roleData: [],
            alone: false,
            waitingForServer: true
        };
        return _this18;
    }

    _createClass(MinionOptions, [{
        key: "componentDidMount",
        value: function componentDidMount() {
            var _this19 = this;

            socket.on('roleInfo', function (msg) {
                if (_this19.state.waitingForServer) {
                    _this19.setState({ alone: msg["alone"], roleData: msg["others"], waitingForServer: false });
                    if (msg["alone"]) {
                        _this19.props.addIntel("You didn't see any werewolves.");
                    } else {
                        var plural_or_nay = msg["others"].length > 1 ? "were werewolves" : "was a werewolf";
                        _this19.props.addIntel(msg["others"].join(', ') + " " + plural_or_nay + ".");
                    }
                }
            });
        }
    }, {
        key: "componentWillUnmount",
        value: function componentWillUnmount() {
            socket.on('roleInfo', function (msg) {
                console.log("Component has been unmounted");
            });
        }
    }, {
        key: "render",
        value: function render() {
            if (this.state.waitingForServer) {
                return React.createElement(
                    "div",
                    { className: "minionOptions" },
                    React.createElement(
                        "p",
                        null,
                        "You wait for a signal from your werewolf allies..."
                    )
                );
            } else if (this.state.alone) {
                return React.createElement(
                    "div",
                    { className: "minionOptions" },
                    React.createElement(
                        "p",
                        null,
                        "There are no werewolves in the village. Stay alive and make sure someone else dies!"
                    )
                );
            } else {
                return React.createElement(
                    "div",
                    { className: "minionOptions" },
                    React.createElement(
                        "p",
                        null,
                        "The werewolves are:"
                    ),
                    React.createElement(
                        "ul",
                        null,
                        this.state.roleData.map(function (username) {
                            return React.createElement(
                                "li",
                                { key: username },
                                username
                            ); //TODO implement better keys
                        })
                    ),
                    React.createElement(
                        "p",
                        null,
                        "Take the heat off the werewolves, even if it means sacrificing yourself!"
                    )
                );
            }
        }
    }]);

    return MinionOptions;
}(React.Component);

var MasonOptions = function (_React$Component7) {
    _inherits(MasonOptions, _React$Component7);

    function MasonOptions(props) {
        _classCallCheck(this, MasonOptions);

        var _this20 = _possibleConstructorReturn(this, (MasonOptions.__proto__ || Object.getPrototypeOf(MasonOptions)).call(this, props));

        _this20.state = {
            roleData: [],
            alone: false,
            waitingForServer: true
        };
        return _this20;
    }

    _createClass(MasonOptions, [{
        key: "componentDidMount",
        value: function componentDidMount() {
            var _this21 = this;

            socket.on('roleInfo', function (msg) {
                if (_this21.state.waitingForServer) {
                    _this21.setState({ alone: msg["alone"], roleData: msg["others"], waitingForServer: false });
                    if (msg["alone"]) {
                        _this21.props.addIntel("You didn't see any other masons.");
                    } else {
                        var plural_or_nay = msg["others"].length > 1 ? "masons were" : "mason was";
                        _this21.props.addIntel("The other " + plural_or_nay + " " + msg["others"].join(', '));
                    }
                }
            });
        }
    }, {
        key: "componentWillUnmount",
        value: function componentWillUnmount() {
            socket.on('roleInfo', function (msg) {
                console.log("Component has been unmounted");
            });
        }
    }, {
        key: "render",
        value: function render() {
            if (this.state.waitingForServer) {
                return React.createElement(
                    "div",
                    { className: "masonOptions" },
                    React.createElement(
                        "p",
                        null,
                        "You make your way to the secret meeting place..."
                    )
                );
            } else if (this.state.alone) {
                return React.createElement(
                    "div",
                    { className: "masonOptions" },
                    React.createElement(
                        "p",
                        null,
                        "You are the only mason."
                    )
                );
            } else {
                return React.createElement(
                    "div",
                    { className: "masonOptions" },
                    React.createElement(
                        "p",
                        null,
                        "The other masons are:"
                    ),
                    React.createElement(
                        "ul",
                        null,
                        this.state.roleData.map(function (username) {
                            return React.createElement(
                                "li",
                                { key: username },
                                username
                            );
                        })
                    )
                );
            }
        }
    }]);

    return MasonOptions;
}(React.Component);

var DrunkOptions = function (_React$Component8) {
    _inherits(DrunkOptions, _React$Component8);

    function DrunkOptions(props) {
        _classCallCheck(this, DrunkOptions);

        var _this22 = _possibleConstructorReturn(this, (DrunkOptions.__proto__ || Object.getPrototypeOf(DrunkOptions)).call(this, props));

        _this22.state = {
            done: false,
            choice: -1
        };
        return _this22;
    }

    _createClass(DrunkOptions, [{
        key: "makeMovePayload",
        value: function makeMovePayload() {
            var payload = {
                moveType: 'DRUNK',
                cards: [this.state.choice],
                details: { doppel: this.props.doppel ? true : false }
            };
            return payload;
        }
    }, {
        key: "handleAction",
        value: function handleAction(choice) {
            var _this23 = this;

            this.setState({ choice: parseInt(choice), done: true }, function () {
                sendClientGameUpdate(_this23.makeMovePayload());
                var intel_string = "You swapped your card with center card " + (_this23.state.choice + 1) + ".";
                _this23.props.addIntel(intel_string);
            });
        }
    }, {
        key: "render",
        value: function render() {
            var _this24 = this;

            if (!this.state.done) {
                return React.createElement(
                    "div",
                    { className: "drunkOptions" },
                    React.createElement(
                        "p",
                        null,
                        "Select a center card:"
                    ),
                    React.createElement(DisplayCenterCards, {
                        centerCount: this.props.centerCount,
                        onClick: function onClick(data) {
                            return _this24.handleAction(data);
                        } })
                );
            } else {
                return React.createElement(
                    "div",
                    null,
                    React.createElement(
                        "p",
                        null,
                        "You swapped your card with center card ",
                        this.state.choice + 1,
                        ", but can't seem to remember what you got in return..."
                    )
                );
            }
        }
    }]);

    return DrunkOptions;
}(React.Component);

var InsomniacOptions = function (_React$Component9) {
    _inherits(InsomniacOptions, _React$Component9);

    function InsomniacOptions(props) {
        _classCallCheck(this, InsomniacOptions);

        var _this25 = _possibleConstructorReturn(this, (InsomniacOptions.__proto__ || Object.getPrototypeOf(InsomniacOptions)).call(this, props));

        _this25.state = {
            waitingForServer: true,
            done: false,
            roleData: "NOTHING"
        };
        return _this25;
    }

    _createClass(InsomniacOptions, [{
        key: "componentDidMount",
        value: function componentDidMount() {
            var _this26 = this;

            socket.on('roleInfo', function (msg) {
                if (_this26.state.waitingForServer) {
                    _this26.setState({ roleData: msg[0], waitingForServer: false });
                    var artcl = isVowel(msg[0].charAt(0)) ? "an" : "a";
                    _this26.props.addIntel("In the end, your card was " + artcl + " " + msg[0]);
                }
            });
        }
    }, {
        key: "componentWillUnmount",
        value: function componentWillUnmount() {
            socket.on('roleInfo', function (msg) {
                console.log("Component has been unmounted");
            });
        }
    }, {
        key: "render",
        value: function render() {
            var _this27 = this;

            var text = this.state.done ? React.createElement(
                "p",
                null,
                "You look at your card and see: ",
                this.state.roleData
            ) : React.createElement(
                "p",
                null,
                "Look at your own card."
            );
            return React.createElement(
                "div",
                { className: "insomniacOptions" },
                text,
                React.createElement(CardButton, {
                    label: "Your card",
                    value: 0,
                    onClick: function onClick() {
                        return _this27.setState({ done: true });
                    },
                    keepDown: false,
                    face: this.state.roleData
                })
            );
        }
    }]);

    return InsomniacOptions;
}(React.Component);

var DoppelgangerOptions = function (_React$Component10) {
    _inherits(DoppelgangerOptions, _React$Component10);

    function DoppelgangerOptions(props) {
        _classCallCheck(this, DoppelgangerOptions);

        var _this28 = _possibleConstructorReturn(this, (DoppelgangerOptions.__proto__ || Object.getPrototypeOf(DoppelgangerOptions)).call(this, props));

        _this28.makeMovePayload = _this28.makeMovePayload.bind(_this28);
        _this28.state = {
            /* turn_state:
                * 0: player is making choice
                * 1: waiting for server response
                * 2: displaying transformation data
                * 3: displaying fast-acting role options (seer, robber etc)
                */
            turn_state: 0,
            choice: "",
            roleData: "",
            result_string: ""
        };
        return _this28;
    }

    _createClass(DoppelgangerOptions, [{
        key: "componentDidMount",
        value: function componentDidMount() {
            var _this29 = this;

            socket.on('roleInfo', function (msg) {
                if (_this29.state.turn_state === 1) {
                    _this29.setState({ roleData: msg[0], turn_state: 2 });
                    _this29.props.updateAlt(msg[0]);
                    var artcl = isVowel(msg[0].charAt(0)) ? "an" : "a";
                    var intel_string = "You copied " + _this29.state.choice + "s card and transformed into a " + artcl + " " + msg[0];
                    _this29.props.addIntel(intel_string);
                    setTimeout(function () {
                        _this29.setState({ result_string: intel_string });
                    }, 1000);
                    //Give the player a second to understand their new role before displaying options
                    if (["SEER", "ROBBER", "TROUBLEMAKER", "DRUNK"].includes(msg[0])) {
                        setTimeout(function () {
                            _this29.setState({ turn_state: 3 });
                        }, 2000);
                    }
                }
            });
        }
    }, {
        key: "componentWillUnmount",
        value: function componentWillUnmount() {
            socket.on('roleInfo', function (msg) {
                console.log("Component has been unmounted");
            });
        }
    }, {
        key: "makeMovePayload",
        value: function makeMovePayload() {
            var payload = {
                moveType: "DOPPELGANGER",
                cards: [this.state.choice]
            };
            this.setState({ turn_state: 1 });
            return payload;
        }
    }, {
        key: "handleAction",
        value: function handleAction(choice) {
            var _this30 = this;

            this.setState({ choice: choice }, function () {
                sendClientGameUpdate(_this30.makeMovePayload());
                _this30.setState({ turn_state: 1 });
            });
        }
    }, {
        key: "render",
        value: function render() {
            var _this31 = this;

            switch (this.state.turn_state) {
                case 0:
                    return React.createElement(
                        "div",
                        { className: "doppelOptions" },
                        React.createElement(
                            "p",
                            null,
                            "Select a player to doppel: "
                        ),
                        React.createElement(DisplayPlayerCards, {
                            playerList: this.props.playerList,
                            myName: this.props.myName,
                            onClick: function onClick(data) {
                                return _this31.handleAction(data);
                            }
                        })
                    );
                case 1:
                    return React.createElement(
                        "div",
                        { className: "doppelOptions" },
                        React.createElement(
                            "p",
                            null,
                            "You spy on ",
                            this.state.choice,
                            "s every move..."
                        )
                    );
                case 2:
                    if (this.state.roleData === "DOPPELGANGER") {
                        return React.createElement(
                            "div",
                            { className: "doppelOptions" },
                            React.createElement(
                                "p",
                                null,
                                "You transformed into ",
                                this.state.choice,
                                "s role, but they were also a doppelganger. You are still on the villager team."
                            ),
                            React.createElement(CardButton, {
                                key: "flipCard" + this.state.choice.toString(),
                                value: this.state.choice,
                                keepDown: false,
                                face: this.state.roleData,
                                autoFlip: true,
                                label: ""
                            })
                        );
                    } else {
                        return React.createElement(
                            "div",
                            { className: "doppelOptions" },
                            React.createElement(
                                "p",
                                null,
                                this.state.result_string
                            ),
                            React.createElement(CardButton, {
                                key: "flipCard" + this.state.choice.toString(),
                                value: this.state.choice,
                                keepDown: false,
                                face: this.state.roleData,
                                autoFlip: true,
                                label: ""
                            })
                        );
                    }
                case 3:
                    var artcl = isVowel(this.state.roleData.charAt(0)) ? "an" : "a";
                    return React.createElement(
                        "div",
                        { className: "doppelOptions" },
                        React.createElement(
                            "p",
                            null,
                            "You have transformed into ",
                            artcl,
                            " ",
                            this.state.roleData,
                            "."
                        ),
                        this.props.createRoleOptions(this.state.roleData)
                    );
                default:
                    return React.createElement("div", { className: "doppelOptions" });
            }
        }
    }]);

    return DoppelgangerOptions;
}(React.Component);
/* PlayArea
    Displays interactive options for the player to use on their turn in the night
 */


var PlayArea = function (_React$Component11) {
    _inherits(PlayArea, _React$Component11);

    function PlayArea(props) {
        _classCallCheck(this, PlayArea);

        var _this32 = _possibleConstructorReturn(this, (PlayArea.__proto__ || Object.getPrototypeOf(PlayArea)).call(this, props));

        _this32.state = {
            altRole: "NOTHING",
            readyToSleep: false
        };
        return _this32;
    }

    _createClass(PlayArea, [{
        key: "updateAlt",
        value: function updateAlt(newAlt) {
            this.setState({ altRole: newAlt });
        }
    }, {
        key: "handleBedtimeClick",
        value: function handleBedtimeClick() {
            if (!this.state.readyToSleep) {
                this.setState({ readyToSleep: true }, sendReadyMessage);
            }
        }
    }, {
        key: "createRoleOptions",
        value: function createRoleOptions(role) {
            var _this33 = this;

            var doppel = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            switch (role) {
                case 'WEREWOLF':
                    return React.createElement(WerewolfOptions, {
                        centerCount: this.props.centerCount,
                        playerList: this.props.playerList,
                        addIntel: this.props.addIntel
                    });
                case 'SEER':
                    return React.createElement(SeerOptions, {
                        centerCount: this.props.centerCount,
                        playerList: this.props.playerList,
                        myName: this.props.myName,
                        doppel: doppel,
                        addIntel: this.props.addIntel
                    });
                case 'TROUBLEMAKER':
                    return React.createElement(TroublemakerOptions, {
                        playerList: this.props.playerList,
                        myName: this.props.myName,
                        doppel: doppel,
                        addIntel: this.props.addIntel
                    });
                case 'MINION':
                    return React.createElement(MinionOptions, {
                        addIntel: this.props.addIntel });
                case 'MASON':
                    return React.createElement(MasonOptions, {
                        addIntel: this.props.addIntel });
                case 'DRUNK':
                    return React.createElement(DrunkOptions, {
                        centerCount: this.props.centerCount,
                        doppel: doppel,
                        addIntel: this.props.addIntel
                    });
                case 'INSOMNIAC':
                    return React.createElement(InsomniacOptions, {
                        addIntel: this.props.addIntel });
                case 'ROBBER':
                    return React.createElement(RobberOptions, {
                        playerList: this.props.playerList,
                        myName: this.props.myName,
                        doppel: doppel,
                        addIntel: this.props.addIntel
                    });
                case 'DOPPELGANGER':
                    return React.createElement(DoppelgangerOptions, {
                        playerList: this.props.playerList,
                        myName: this.props.myName,
                        centerCount: this.props.centerCount,
                        createRoleOptions: function createRoleOptions(role, doppel) {
                            return _this33.createRoleOptions(role, doppel = true);
                        },
                        updateAlt: function updateAlt(newAlt) {
                            return _this33.updateAlt(newAlt);
                        },
                        addIntel: this.props.addIntel
                    });
                case 'NOTHING':
                    return React.createElement(
                        "div",
                        null,
                        "Game is in a weird limbo state, stand by..."
                    );
                default:
                    return React.createElement(
                        "div",
                        null,
                        "This client is outdated. Try refreshing the page and starting a new game"
                    );
            }
        }
    }, {
        key: "render",
        value: function render() {
            var _this34 = this;

            if (this.props.bedTimePhase) {
                return React.createElement(
                    "div",
                    { className: "playArea roleActive" },
                    React.createElement(
                        "div",
                        { className: "bedTimeCard" },
                        React.createElement(
                            "p",
                            null,
                            "This is your card. Tap on it to see what it is"
                        ),
                        React.createElement(CardButton, {
                            label: "",
                            value: 0,
                            onClick: function onClick() {
                                return _this34.handleBedtimeClick();
                            },
                            keepDown: false,
                            face: this.props.role
                        })
                    )
                );
            }
            // Check if Doppelganger needs to act off-turn
            if (this.props.turn !== "DOPPELGANGER" && this.props.role === "DOPPELGANGER") {
                // Check if doppelganger transformed into something other than the instantly acting roles
                if (!["NOTHING", "DOPPELGANGER", "SEER", "ROBBER", "TROUBLEMAKER", "DRUNK"].includes(this.state.altRole)) {
                    if (this.props.turn === this.state.altRole) {
                        return React.createElement(
                            "div",
                            { className: "playArea roleActive" },
                            this.createRoleOptions(this.state.altRole)
                        );
                    }
                }
            }
            if (this.props.turn === this.props.role) {

                return React.createElement(
                    "div",
                    { className: "playArea roleActive" },
                    this.createRoleOptions(this.props.role)
                );
            }
            return React.createElement("div", { className: "playArea" });
        }
    }]);

    return PlayArea;
}(React.Component);

var VoteButton = function (_React$Component12) {
    _inherits(VoteButton, _React$Component12);

    function VoteButton(props) {
        _classCallCheck(this, VoteButton);

        var _this35 = _possibleConstructorReturn(this, (VoteButton.__proto__ || Object.getPrototypeOf(VoteButton)).call(this, props));

        _this35.handleClick = _this35.handleClick.bind(_this35);
        return _this35;
    }

    _createClass(VoteButton, [{
        key: "handleClick",
        value: function handleClick() {
            this.props.handleVote(this.props.value);
        }
    }, {
        key: "render",
        value: function render() {
            if (this.props.isTarget) {
                return React.createElement(
                    "button",
                    { className: "VoteButton",
                        value: this.props.value,
                        onClick: this.handleClick,
                        disabled: true },
                    this.props.value
                );
            }
            return React.createElement(
                "button",
                { className: "VoteButton",
                    value: this.props.value,
                    onClick: this.handleClick },
                this.props.value
            );
        }
    }]);

    return VoteButton;
}(React.Component);
/* Voting area
    Presented when the night is over and the game has progressed to the voting phase
 */


var VotingArea = function (_React$Component13) {
    _inherits(VotingArea, _React$Component13);

    function VotingArea(props) {
        _classCallCheck(this, VotingArea);

        var _this36 = _possibleConstructorReturn(this, (VotingArea.__proto__ || Object.getPrototypeOf(VotingArea)).call(this, props));

        _this36.toggleConfirmEndGame = _this36.toggleConfirmEndGame.bind(_this36);
        _this36.state = {
            votingFor: "",
            confirmingEnd: false
        };
        return _this36;
    }

    _createClass(VotingArea, [{
        key: "handleVote",
        value: function handleVote(player) {
            this.setState({ votingFor: player });
            sendVote(player);
        }
    }, {
        key: "renderButton",
        value: function renderButton(username) {
            var _this37 = this;

            return React.createElement(VoteButton, {
                key: "votebutton_" + username,
                isTarget: username === this.state.votingFor,
                value: username,
                handleVote: function handleVote(username) {
                    return _this37.handleVote(username);
                }
            });
        }
    }, {
        key: "toggleConfirmEndGame",
        value: function toggleConfirmEndGame() {
            this.setState({ confirmingEnd: !this.state.confirmingEnd });
        }
    }, {
        key: "render",
        value: function render() {
            var _this38 = this;

            if (this.state.confirmingEnd) {
                return React.createElement(
                    "div",
                    { className: "votingArea" },
                    React.createElement(ConfirmDialog, {
                        prompt: "Skip to the end of voting and finish the game?",
                        onCancel: this.toggleConfirmEndGame,
                        onConfirm: sendFinishGame
                    })
                );
            }
            var otherPlayers = this.props.playerList.filter(function (myName) {
                return myName != _this38.props.myName;
            });
            var buttons = otherPlayers.map(function (username) {
                return _this38.renderButton(username);
            });
            var votingString = this.state.votingFor === "" ? "" : "You are voting for " + this.state.votingFor;
            return React.createElement(
                "div",
                { className: "votingArea" },
                React.createElement(
                    "p",
                    null,
                    "Choose a player to vote for: "
                ),
                React.createElement(
                    "div",
                    { className: "voteButtons" },
                    buttons
                ),
                React.createElement(
                    "p",
                    null,
                    votingString
                ),
                React.createElement(
                    "button",
                    { className: "endGameButton", onClick: this.toggleConfirmEndGame },
                    "End voting phase"
                )
            );
        }
    }]);

    return VotingArea;
}(React.Component);

function ConfirmDialog(props) {
    return React.createElement(
        "div",
        { className: "confirmDialog" },
        React.createElement(
            "p",
            null,
            props.prompt
        ),
        React.createElement(
            "button",
            { onClick: props.onCancel },
            "Cancel"
        ),
        React.createElement(
            "button",
            { onClick: props.onConfirm },
            "Do it!"
        )
    );
}

/* InfoArea
    Contains information that the player should know to help them strategize
    Available throughout the game 
*/

var InfoArea = function (_React$Component14) {
    _inherits(InfoArea, _React$Component14);

    function InfoArea() {
        _classCallCheck(this, InfoArea);

        return _possibleConstructorReturn(this, (InfoArea.__proto__ || Object.getPrototypeOf(InfoArea)).apply(this, arguments));
    }

    _createClass(InfoArea, [{
        key: "render",
        value: function render() {
            var role = this.props.role;
            if (this.props.bedTimePhase) {
                return React.createElement(
                    "div",
                    { className: "infoArea roleActive" },
                    React.createElement(
                        "p",
                        null,
                        "The night is starting soon..."
                    )
                );
            } else if (this.props.nightPhase) {
                if (this.props.role === this.props.turn) {
                    return React.createElement(
                        "div",
                        { className: "infoArea roleActive" },
                        React.createElement(
                            "p",
                            null,
                            "It is the ",
                            this.props.role,
                            " turn. That means you!"
                        ),
                        React.createElement(
                            "p",
                            { className: "turnTimer" },
                            this.props.timer
                        )
                    );
                }
                return React.createElement(
                    "div",
                    { className: "infoArea" },
                    React.createElement(
                        "p",
                        null,
                        this.make_role_string(role),
                        " "
                    ),
                    React.createElement(
                        "div",
                        { className: "intelligence" },
                        this.make_intelligence_list()
                    ),
                    React.createElement(
                        "p",
                        null,
                        "It is currently the ",
                        this.props.turn,
                        " turn."
                    ),
                    React.createElement(
                        "p",
                        { className: "timer" },
                        this.props.timer
                    )
                );
            } else if (this.props.votingPhase) {
                return React.createElement(
                    "div",
                    { className: "infoArea votingActive" },
                    React.createElement(
                        "p",
                        null,
                        this.make_role_string(role),
                        " "
                    ),
                    React.createElement(
                        "div",
                        { className: "intelligence" },
                        this.make_intelligence_list()
                    ),
                    React.createElement(
                        "p",
                        { className: "timer" },
                        this.props.timer
                    )
                );
            }
            return React.createElement(
                "p",
                null,
                "Waiting for a game to start"
            );
        }
    }, {
        key: "make_role_string",
        value: function make_role_string(role) {
            if (role === 'NOTHING') {
                return 'You do not have a role right now.';
            }
            if (!this.props.votingPhase) {
                return "You are " + (isVowel(role.charAt(0)) ? 'an' : 'a') + " " + role + ".";
            }
            return "In the beginning, your role was " + (isVowel(role.charAt(0)) ? 'an' : 'a') + " " + role + ".";
        }
    }, {
        key: "make_role_list",
        value: function make_role_list(inplay) {
            var role_counts = {};
            for (var i = 0; i < inplay.length; i++) {
                if (!role_counts[inplay[i]]) {
                    role_counts[inplay[i]] = 1;
                } else {
                    role_counts[inplay[i]] += 1;
                }
            }
            var list = Object.entries(role_counts).map(function (_ref) {
                var _ref2 = _slicedToArray(_ref, 2),
                    key = _ref2[0],
                    value = _ref2[1];

                return React.createElement(
                    "li",
                    { key: key },
                    key,
                    ": x",
                    value
                );
            });
            return list;
        }
    }, {
        key: "make_intelligence_list",
        value: function make_intelligence_list() {
            return React.createElement(
                "ul",
                null,
                this.props.intelligence.map(function (info) {
                    return React.createElement(
                        "li",
                        null,
                        info
                    );
                })
            );
        }
    }]);

    return InfoArea;
}(React.Component);

/* ResultsArea
 * After voting is over displays the final results of the game
 */


var ResultsArea = function (_React$Component15) {
    _inherits(ResultsArea, _React$Component15);

    function ResultsArea() {
        _classCallCheck(this, ResultsArea);

        return _possibleConstructorReturn(this, (ResultsArea.__proto__ || Object.getPrototypeOf(ResultsArea)).apply(this, arguments));
    }

    _createClass(ResultsArea, [{
        key: "render",
        value: function render() {
            var results = this.props.results;
            return React.createElement(
                "div",
                { className: "resultsArea" },
                React.createElement(
                    "p",
                    null,
                    "The following players were eliminated:"
                ),
                React.createElement(
                    "ul",
                    null,
                    this.makeList(results['elims'])
                ),
                React.createElement(
                    "p",
                    null,
                    "The winners are:"
                ),
                React.createElement(
                    "ul",
                    null,
                    " ",
                    this.makeList(results['winners']),
                    " "
                ),
                React.createElement(
                    "button",
                    { onClick: this.props.onExit },
                    "Back to lobby"
                )
            );
        }
    }, {
        key: "makeList",
        value: function makeList(elems) {
            var _this41 = this;

            if (elems.length === 0) {
                return React.createElement(
                    "li",
                    { key: "Nobody" },
                    "Nobody!"
                );
            }
            return elems.map(function (player) {
                return React.createElement(
                    "li",
                    { key: player },
                    player,
                    " (",
                    _this41.props.results['player_results'][player]['role_end'],
                    ")"
                );
            });
        }
    }]);

    return ResultsArea;
}(React.Component);

/* Game
Main container for the game
*/


var Game = function (_React$Component16) {
    _inherits(Game, _React$Component16);

    function Game(props) {
        _classCallCheck(this, Game);

        var _this42 = _possibleConstructorReturn(this, (Game.__proto__ || Object.getPrototypeOf(Game)).call(this, props));

        _this42.state = {
            nightPhase: false,
            votingPhase: false,
            gameOver: false,
            turn: 'NOTHING',
            myRole: props.gameStartInfo["role"],
            timer: 0,
            inPlay: props.gameStartInfo["in_play"],
            results: {},
            roleIntelligence: []
        };
        return _this42;
    }

    _createClass(Game, [{
        key: "componentDidMount",
        value: function componentDidMount() {
            var _this43 = this;

            socket.on('gameStateUpdate', function (msg) {
                console.log("gamestateupdate:");
                console.log(msg);
                if (msg["has_game"]) {
                    _this43.setState({
                        turn: msg["turn"],
                        timer: msg["time_left"],
                        nightPhase: msg["isNight"],
                        votingPhase: !msg["isNight"]
                    });
                }
            });
            socket.on('resultAnnouncement', function (msg) {
                _this43.setState({ nightPhase: false, votingPhase: false,
                    gameOver: true, results: msg });
            });
        }
    }, {
        key: "componentWillUnmount",
        value: function componentWillUnmount() {
            socket.on('gameStateUpdate', function (msg) {
                console.log("Got gameStateUpdate, but Game component is unmounted");
            });
            socket.on('resultAnnouncement', function (msg) {
                console.log("Got resultAnnouncement, but Game component is unmounted");
            });
        }
    }, {
        key: "startGame",
        value: function startGame() {
            sendStartGame();
        }
    }, {
        key: "appendToIntelligence",
        value: function appendToIntelligence(intelligence) {
            this.setState({ roleIntelligence: [].concat(_toConsumableArray(this.state.roleIntelligence), [intelligence]) });
        }
    }, {
        key: "render",
        value: function render() {
            var _this44 = this;

            if (!this.state.gameOver) {
                var interactiveComponent = React.createElement("div", null);
                if (this.state.votingPhase) {
                    interactiveComponent = React.createElement(VotingArea, {
                        playerList: this.props.playerList,
                        myName: this.props.myName
                    });
                } else if (this.state.nightPhase || this.props.bedTimePhase) {
                    interactiveComponent = React.createElement(PlayArea, {
                        myName: this.props.myName,
                        startGame: function startGame() {
                            return _this44.startGame();
                        },
                        bedTimePhase: this.props.bedTimePhase,
                        nightPhase: this.state.nightPhase,
                        turn: this.state.turn,
                        role: this.state.myRole,
                        playerList: this.props.playerList,
                        centerCount: this.state.inPlay.length - this.props.playerList.length,
                        addIntel: function addIntel(intel) {
                            return _this44.appendToIntelligence(intel);
                        }
                    });
                }
                return React.createElement(
                    "div",
                    { className: "game" },
                    React.createElement(InfoArea, {
                        myName: this.props.myName,
                        role: this.state.myRole,
                        turn: this.state.turn,
                        timer: this.state.timer.toString(),
                        inPlay: this.state.inPlay,
                        bedTimePhase: this.props.bedTimePhase,
                        nightPhase: this.state.nightPhase,
                        votingPhase: this.state.votingPhase,
                        playerList: this.props.playerList,
                        intelligence: this.state.roleIntelligence
                    }),
                    interactiveComponent
                );
            }
            return React.createElement(
                "div",
                { className: "game" },
                React.createElement(ResultsArea, {
                    results: this.state.results,
                    onExit: this.props.onExit })
            );
        }
    }]);

    return Game;
}(React.Component);

var SettingsView = function (_React$Component17) {
    _inherits(SettingsView, _React$Component17);

    function SettingsView(props) {
        _classCallCheck(this, SettingsView);

        var _this45 = _possibleConstructorReturn(this, (SettingsView.__proto__ || Object.getPrototypeOf(SettingsView)).call(this, props));

        _this45.handleSetRoles = _this45.handleSetRoles.bind(_this45);
        _this45.state = {
            rolesWithCounts: Object.assign({}, _this45.props.rolesWithCounts)
        };
        return _this45;
    }

    _createClass(SettingsView, [{
        key: "addRemoveRole",
        value: function addRemoveRole(role, willAdd) {
            var newRoleCount = this.state.rolesWithCounts;
            if (role in newRoleCount) {
                willAdd ? newRoleCount[role] += 1 : newRoleCount[role] -= 1;
            }
            if (!(role in newRoleCount) || newRoleCount[role] < 0) {
                newRoleCount[role] = 0;
            }
            this.setState({ rolesWithCounts: newRoleCount });
        }
    }, {
        key: "handleSetRoles",
        value: function handleSetRoles() {
            this.props.onSetRoles(this.state.rolesWithCounts);
        }
    }, {
        key: "render",
        value: function render() {
            var _this46 = this;

            var roleList = Object.keys(this.state.rolesWithCounts).map(function (role) {
                return React.createElement(
                    "div",
                    { className: "roleSelection", key: role + "_selection" },
                    React.createElement(
                        "span",
                        { className: "roleSelectText" },
                        React.createElement(
                            "span",
                            null,
                            role,
                            ":"
                        ),
                        React.createElement(
                            "span",
                            { className: "roleCount" },
                            _this46.state.rolesWithCounts[role]
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "plusMinusButtons" },
                        React.createElement(
                            "button",
                            { onClick: function onClick(r, add) {
                                    return _this46.addRemoveRole(role, false);
                                } },
                            "-"
                        ),
                        React.createElement(
                            "button",
                            { onClick: function onClick(r, add) {
                                    return _this46.addRemoveRole(role, true);
                                } },
                            "+"
                        )
                    )
                );
            });
            return React.createElement(
                "div",
                { className: "settingsView" },
                React.createElement(
                    "div",
                    { className: "roleMenu" },
                    roleList
                ),
                React.createElement(
                    "div",
                    { className: "bottomButtons" },
                    React.createElement(
                        "button",
                        { onClick: this.props.onCancel },
                        "Cancel"
                    ),
                    React.createElement(
                        "button",
                        { onClick: this.handleSetRoles },
                        "Confirm"
                    )
                )
            );
        }
    }]);

    return SettingsView;
}(React.Component);

var Lobby = function (_React$Component18) {
    _inherits(Lobby, _React$Component18);

    function Lobby(props) {
        _classCallCheck(this, Lobby);

        var _this47 = _possibleConstructorReturn(this, (Lobby.__proto__ || Object.getPrototypeOf(Lobby)).call(this, props));

        _this47.toggleReady = _this47.toggleReady.bind(_this47);
        _this47.toggleSettings = _this47.toggleSettings.bind(_this47);
        _this47.state = {
            ready: false,
            rolesWithCounts: {},
            showSettings: false
        };
        return _this47;
    }

    _createClass(Lobby, [{
        key: "componentDidMount",
        value: function componentDidMount() {
            var _this48 = this;

            socket.on('gameSettingsMessage', function (msg) {
                _this48.setState({ rolesWithCounts: msg["roles"] });
            });
            // Get initial settings
            sendGetSettingsMessage();
        }
    }, {
        key: "componentWillUnmount",
        value: function componentWillUnmount() {
            socket.on('gameSettingsMessage', function (msg) {
                console.log("Component has been unmounted.");
            });
        }
    }, {
        key: "toggleReady",
        value: function toggleReady() {
            //this.setState({ready: !this.state.ready});
            sendReadyMessage();
        }
    }, {
        key: "toggleSettings",
        value: function toggleSettings() {
            this.setState({ showSettings: !this.state.showSettings });
        }
    }, {
        key: "handleSetRoles",
        value: function handleSetRoles(rolesWithCounts) {
            sendSetSettingsMessage({
                "roles": rolesWithCounts
            });
            sendGetSettingsMessage();
            this.setState({ showSettings: false });
        }
    }, {
        key: "renderPlayerList",
        value: function renderPlayerList() {
            var playerList = this.props.players.map(function (_ref3) {
                var _ref4 = _slicedToArray(_ref3, 2),
                    username = _ref4[0],
                    ready = _ref4[1];

                return React.createElement(
                    "li",
                    { key: "lobby_" + username },
                    username,
                    ": ",
                    ready ? "Ready" : "Not ready"
                );
            });
            return React.createElement(
                "div",
                { className: "playerList" },
                React.createElement(
                    "h2",
                    null,
                    "Connected players:"
                ),
                React.createElement(
                    "ul",
                    null,
                    playerList
                )
            );
        }
    }, {
        key: "renderSettingsList",
        value: function renderSettingsList() {
            var _this49 = this;

            var roleArray = Object.keys(this.state.rolesWithCounts).filter(function (elem) {
                return _this49.state.rolesWithCounts[elem] > 0;
            });
            var roleCount = 0;
            var roleList = roleArray.map(function (role) {
                var count = _this49.state.rolesWithCounts[role];
                roleCount += count;
                return React.createElement(
                    "li",
                    { key: "lobby_roles_" + role },
                    role,
                    ": x",
                    count
                );
            });
            return React.createElement(
                "div",
                { className: "lobbySettings" },
                React.createElement(
                    "h2",
                    null,
                    "Selected roles:"
                ),
                React.createElement(
                    "ul",
                    { className: "roleList" },
                    roleList
                ),
                React.createElement(
                    "p",
                    null,
                    "Total cards: ",
                    roleCount
                )
            );
        }
    }, {
        key: "playerIsReady",
        value: function playerIsReady() {
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = this.props.players[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var player = _step3.value;

                    if (player[0] === this.props.myName) {
                        return player[1];
                    }
                }
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }
        }
    }, {
        key: "render",
        value: function render() {
            var _this50 = this;

            if (!this.state.showSettings) {
                return React.createElement(
                    "div",
                    { className: "gameLobby" },
                    React.createElement(
                        "h1",
                        null,
                        "Lobby"
                    ),
                    React.createElement(
                        "p",
                        { className: "serverMessage" },
                        this.props.serverMessage
                    ),
                    React.createElement(
                        "div",
                        { className: "pregameInfoContainer" },
                        this.renderPlayerList(),
                        this.renderSettingsList()
                    ),
                    React.createElement(
                        "div",
                        { className: "bottomButtons" },
                        React.createElement(
                            "button",
                            { onClick: this.toggleSettings },
                            "Settings"
                        ),
                        React.createElement(
                            "button",
                            { onClick: this.toggleReady },
                            this.playerIsReady() ? "Unready" : "Ready"
                        )
                    )
                );
            }
            return React.createElement(
                "div",
                { className: "gameLobby" },
                React.createElement(SettingsView, {
                    rolesWithCounts: this.state.rolesWithCounts,
                    onCancel: this.toggleSettings,
                    onSetRoles: function onSetRoles(newRoles) {
                        return _this50.handleSetRoles(newRoles);
                    }
                })
            );
        }
    }]);

    return Lobby;
}(React.Component);

function LoginMenu(props) {
    var feedback = props.nameFeedback !== "" ? React.createElement(
        "p",
        null,
        props.nameFeedback
    ) : "";
    return React.createElement(
        "div",
        { className: "loginMenu" },
        React.createElement(
            "div",
            { className: "nameFeedback" },
            feedback
        ),
        React.createElement(
            "p",
            null,
            "Enter your name:"
        ),
        React.createElement("input", { type: "text", id: "nameInputField" }),
        React.createElement(
            "button",
            { onClick: sendLoginMessage },
            "OK"
        )
    );
}

var App = function (_React$Component19) {
    _inherits(App, _React$Component19);

    function App(props) {
        _classCallCheck(this, App);

        var _this51 = _possibleConstructorReturn(this, (App.__proto__ || Object.getPrototypeOf(App)).call(this, props));

        _this51.state = {
            pregame: true,
            bedTimePhase: false,
            playerReadyList: [["Player", true], ["Player2", true], ["Player3", true]], //[[username, ready]]
            myUsername: "Player",
            gameStartData: { "role": "NOTHING",
                "in_play": ["SEER", "VILLAGER", "WEREWOLF"]
            },
            serverMessage: "",
            loggedIn: false,
            nameFeedback: ""
        };
        _this51.handleBackToLobby = _this51.handleBackToLobby.bind(_this51);
        return _this51;
    }

    _createClass(App, [{
        key: "componentDidMount",
        value: function componentDidMount() {
            var _this52 = this;

            socket.on('playerListUpdate', function (msg) {
                _this52.setState({ playerReadyList: msg });
            });
            socket.on('gameStartInfo', function (msg) {
                _this52.setState({ pregame: false, bedTimePhase: true, gameStartData: msg });
            });
            socket.on('name_confirmed', function (msg) {
                _this52.setState({ myUsername: msg, loggedIn: true });
            });
            socket.on('nameFeedback', function (msg) {
                _this52.setState({ nameFeedback: msg });
            });
            socket.on('serverMessage', function (msg) {
                _this52.setState({ serverMessage: msg });
            });
            socket.on('nightBeginsMessage', function () {
                _this52.setState({ bedTimePhase: false });
            });
            socket.on('serverResetMessage', function (msg) {
                _this52.setState({ pregame: true, bedTimePhase: false, loggedIn: false, nameFeedback: msg });
            });
        }
    }, {
        key: "componentWillUnmount",
        value: function componentWillUnmount() {
            var msgNames = ['playerListUpdate', 'gameStartInfo', 'name_confirmed', 'nameFeedback', 'serverMessage', 'nightBeginsMessage', 'serverResetMessage'];
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = msgNames[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    msgName = _step4.value;

                    socket.on(msgName, function (msg) {
                        console.log("Got " + msgName + ", but App component is unmounted");
                    });
                }
            } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion4 && _iterator4.return) {
                        _iterator4.return();
                    }
                } finally {
                    if (_didIteratorError4) {
                        throw _iteratorError4;
                    }
                }
            }
        }
    }, {
        key: "handleBackToLobby",
        value: function handleBackToLobby() {
            this.setState({ pregame: true, serverMessage: "" });
            sendGetPlayerListMessage();
        }
    }, {
        key: "render",
        value: function render() {
            if (!this.state.loggedIn) {
                return React.createElement(LoginMenu, {
                    nameFeedback: this.state.nameFeedback });
            }
            if (this.state.pregame) {
                return React.createElement(Lobby, {
                    players: this.state.playerReadyList,
                    serverMessage: this.state.serverMessage,
                    myName: this.state.myUsername
                });
            } else {
                return React.createElement(Game, {
                    playerList: this.state.playerReadyList.map(function (nameReady) {
                        return nameReady[0];
                    }) // Only players' usernames are needed
                    , myName: this.state.myUsername,
                    bedTimePhase: this.state.bedTimePhase,
                    gameStartInfo: this.state.gameStartData,
                    onExit: this.handleBackToLobby,
                    serverMessage: this.state.serverMessage
                });
            }
        }
    }]);

    return App;
}(React.Component);

var domContainer = document.querySelector('#app_container');
ReactDOM.render(React.createElement(App, null), domContainer);