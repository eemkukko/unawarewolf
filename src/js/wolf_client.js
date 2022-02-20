const socket = io();
const card_names = ["BACK","BACK_SELECTED","DOPPELGANGER",
"DRUNK","HUNTER","INSOMNIAC","MASON",
"MINION","ROBBER","SEER","TROUBLEMAKER",
"VILLAGER", "WEREWOLF", "NOTHING"]
const img_sources = {}
for (let c_name of card_names){
    img_sources[c_name] = `/static/card_${c_name.toLowerCase()}.png`;
}

// Server communication
function sendLoginMessage() {
    socket.emit("loginMessage", document.getElementById("nameInputField").value.toString())
}

function sendRequestStatus(){
    socket.emit("debug_getStatus");
    console.log("Status update requested");
}

// Input: JSON object of data to be sent
function sendClientGameUpdate(data){
    socket.emit("clientGameUpdate", data);
    console.log("Msg sent with data:");
    console.log(data);
}

function sendFinishGame(){
    socket.emit("debug_finishGame");
    console.log("Sent finish game message")
}

function sendReadyMessage(){
    socket.emit("togglePlayerReady");
}

function sendSetSettingsMessage(data){
    socket.emit("setGameSettings", data);
    console.log("Sent game settings:")
    console.log(data)
}

function sendGetSettingsMessage(){
    socket.emit("getGameSettings");
}

function sendGetPlayerListMessage(){
    socket.emit("getPlayerList");
}
function sendVote(vote) {
    socket.emit("clientGameVote", {vote: vote})
}

function isVowel(letter){
    return "AaEeIiOoUuYy".includes(letter);
}

// React

class CardButton extends React.Component{
    constructor(props){
        super(props);
        this.handleClick = this.handleClick.bind(this)
        this.state = {
            selected: false,
            value: this.props.value,
            //keep_facedown: if false, card will flip over when selected
            keep_facedown: this.props.keepDown,
        }
    }

    handleClick() {
        if (!this.props.autoFlip){
            this.props.onClick(this.state.value, this.state.selected);
            this.setState({selected: !this.state.selected});
        }
    }

    componentDidMount(){
        if (this.props.autoFlip){
            setTimeout(() => {this.setState({selected: true})}, 800);
        }
    }
    
    render(){
        if (this.state.keep_facedown){
            var img_src = this.state.selected ? 
                img_sources["BACK_SELECTED"] : img_sources["BACK"];
            return(
                <div className='cardContainer'>
                    <input id={"card" +this.state.value.toString()}
                        className='cardImage' type="image" 
                        src={img_src} onClick={this.handleClick}
                    />
                    <label htmlFor={this.state.value.toString()}>{this.props.label}</label>
                </div>
                );
        }
        else{
            var id_string = "card_" + this.state.value.toString()
            return(
            <div className={this.state.selected ? "cardContainer active" : "cardContainer"}>
                <div id={id_string} className="cardInner" transform={this.state.selected? "rotateY(180deg)" : null}>
                    <div className="cardBack">
                        <input type="image" className='cardImage'
                            src={img_sources["BACK"]} onClick={this.handleClick}/>
                    </div>
                    <div className="cardFace">
                        <input type="image" className='cardImage' 
                            src={img_sources[this.props.face]} 
                        />
                    </div>
                </div>
                <label htmlFor={id_string}>{this.props.label}</label>
            </div>);
        }
    }
}

function DisplayPlayerCards(props){
    const otherPlayers = props.playerList.filter(myName => myName != props.myName);
    const cardRows = [];
    var newRow = [];
    var i = 0;
    for (const username of otherPlayers){
        newRow.push(username);
        if (i > 0 && ((i+1)%3===0 || i+1===otherPlayers.length)){
            cardRows.push(
            <CardRow
            key={"row_"+newRow.join()}
            values={newRow}
            onClick={(data) => props.onClick(data)}
            centerCards={false}
            />);
            newRow = [];
        }
        i++;
    }
    return (<div className="cardDisplay">{cardRows}</div>);
}

function DisplayCenterCards(props){
    if (props.centerCount === 0) {
        return <div className="cardDisplay">(Sorry, but there are no center cards...)</div>
    }
    const cardRows = [];
    var newRow = [];
    for(let i=0; i<props.centerCount; i++){
        newRow.push(i);
        if ((i+1)%3===0 || i+1===props.centerCount){
            cardRows.push(
            <CardRow
            key={"row_"+newRow.join()}
            values={newRow}
            onClick={(data) => props.onClick(data)}
            centerCards={true}
            />);
            newRow = [];
        }
    }
    return <div className="cardDisplay">{cardRows}</div>;
}

function CardRow(props){
    return (
    <div className="cardRow">{props.values.map((value) => {
        if (props.centerCards) {
        return (<CardButton
            key={"card_"+value.toString()}
            value={value} 
            onClick={(data) => props.onClick(data)}
            label={"Center card " + (value+1).toString()}
            keepDown={true}
            />);
        }
        return (<CardButton
            key={"card_"+value.toString()}
            value={value} 
            onClick={(data) => props.onClick(data)}
            label={value}
            keepDown={true}
            />);
    })}
    </div>);
}

class SeerOptions extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            seer_selection: 0, //0: not selected, 1: see player 2: see center 3: done
            cardChoices: [],
            roleData: [],
            result_string: "",
        }
    }

    setSeerSelection(selection){
        this.setState({seer_selection: selection});
    }

    makeMovePayload() {
        var payload = {};
            payload["moveType"] = 'SEER';
            payload["cards"] = this.state.cardChoices;
            if (this.state.seer_selection === 1) {
                payload["details"] = {center: false, doppel:this.props.doppel}
            }
            else if (this.state.seer_selection === 2){
                payload["details"] = {center: true, doppel:this.props.doppel}
            }
        return payload;
    }

    handleAction(data){
        var newChoices = this.state.cardChoices;
        if (newChoices.includes(data)){
            newChoices.splice(newChoices.indexOf(data), 1);
        }
        else{
            newChoices.push(data);
        }
        console.log(newChoices);
        this.setState({cardChoices: newChoices}, () => {
            let cCount=this.state.cardChoices.length;
            let sSelect=this.state.seer_selection;
            if(sSelect===1 && cCount>0){
                sendClientGameUpdate(this.makeMovePayload());
            }
            else if(sSelect===2 && (cCount===this.props.centerCount || cCount>1) ){
                sendClientGameUpdate(this.makeMovePayload());
            }
        });
    }

    componentDidMount(){
        socket.on('roleInfo', (msg) => {
            if (this.state.seer_selection === 1){
                let artcl = isVowel(msg[0].charAt(0))? "an" : "a";
                const intel_string = `You saw ${this.state.cardChoices[0]}s card. It was ${artcl} ${msg[0]}`;
                this.props.addIntel(intel_string);
            }
            else if (this.state.seer_selection === 2){
                var intel_string = `You looked at center card ${this.state.cardChoices[0] + 1} and ${this.state.cardChoices[1] + 1}. 
                You saw ${isVowel(msg[0].charAt(0))? "an" : "a"} ${msg[0]}`;
                if (this.props.centerCount > 1) {
                    intel_string +=  ` and ${isVowel(msg[1].charAt(0))? "an" : "a"} ${msg[1]}`;
                }
                this.props.addIntel(intel_string);
            }
            this.setState({roleData: msg, seer_selection: 3})
            // wait for reveal animation to play before updating result string
            var result_string = "";
            setTimeout(() => {
                result_string = "You see ";
                for (let i=0; i<this.state.roleData.length; i++){
                    if (i > 0){
                        result_string += " and ";
                    }
                    let artcl = isVowel(this.state.roleData[i][0])? "an" : "a";
                    result_string += `${artcl} ${this.state.roleData[i]}`;
                }
                this.setState({result_string: result_string});
            }, 1000);
        });
    }

    componentWillUnmount(){
        socket.on('roleInfo', (msg) => {
            console.log("Component has been unmounted")
        });
    }

    render (){
        var choice = this.state.seer_selection;
        if(choice===0 && this.props.centerCount===0){
            choice = 1;
            this.setState({seer_selection: 1});
        }
        switch (choice){
            case 0:
                return(<div className='seerSelection'>
                    <button onClick={this.setSeerSelection.bind(this, 1)}>
                        See another players card</button>
                    <button onClick={this.setSeerSelection.bind(this, 2)}>
                        See 2 center cards</button>
                    </div>);
            case 1:
                return(<div className='seerSelection'>
                    <p>Select a player card to view:</p>
                    <DisplayPlayerCards 
                        playerList={this.props.playerList}
                        myName={this.props.myName}
                        onClick={(data) => this.handleAction(data)}
                    />
                </div>);
            case 2:
                return (<div className='seerSelection'>
                    <p>Select 2 center cards to view:</p>
                    <DisplayCenterCards 
                        centerCount={this.props.centerCount}
                        onClick={(data) => this.handleAction(data)}
                    />
                </div>
                );
            case 3:
                if (this.state.roleData){
                    const resultCardButtons = [];
                    for (let i=0; i<this.state.roleData.length; i++){
                        resultCardButtons.push(
                        <CardButton
                            key={"flipCard" + i.toString()}
                            value={i}
                            keepDown={false}
                            face={this.state.roleData[i]}
                            autoFlip={true}
                            label={""}
                        />);
                    }
                    return (<div className='seerSelection'>
                        <p>{this.state.result_string}</p>
                        <div className='autoFlipButtons'>{resultCardButtons}</div>
                        </div>);
                }
            return (<p>You focus your magical powers...</p>);
        }
    }
}

class WerewolfOptions extends React.Component {
    constructor(props){
        super(props);
        this.makeMovePayload = this.makeMovePayload.bind(this);
        this.state = {
            alone: false,
            roleData: [],
            cardChoice: -1,
            /* turn_state 
            0: waiting for other wolves 
            1: displaying other wolves/solo choices 
            2: waiting for solo choice response
            3: done with solo choice */
            turn_state: 0,
            result_string: "",
        }
    }

    componentDidMount(){
        socket.on('roleInfo', (msg) => {
            if(this.state.turn_state===0 || this.state.turn_state === 1){
                this.setState({alone: msg["alone"], roleData: msg["others"], turn_state:1});
                if (msg["alone"]){
                    this.props.addIntel("You were the only werewolf.");
                }
                else {
                    let plural_or_nay = msg["others"].length > 1? "werewolves were" : "werewolf was";
                    this.props.addIntel(`The other ${plural_or_nay} ${msg["others"].join(', ')}`);
                }
            }
            else if (this.state.turn_state===2){
                let artcl = isVowel(msg[0].charAt(0))? "an" : "a";
                const intel_string = `You looked at center card ${this.state.cardChoice+1}. It was ${artcl} ${msg[0]}`;
                this.props.addIntel(intel_string);
                this.setState({roleData: msg, turn_state: 3})
                setTimeout(() => {
                    this.setState({result_string: `You see a ${msg[0]}`})
                }, 1000);
            }
        });
    }

    componentWillUnmount(){
        socket.on('roleInfo', (msg) => {
            console.log("Component has been unmounted")
        });
    }

    makeMovePayload() {
        var payload = {
            moveType: 'WEREWOLF',
            cards: [this.state.cardChoice]
        };
        return payload;
    }

    handleAction(choice){
        let int_choice = parseInt(choice)
        this.setState({cardChoice: int_choice, turn_state: 2}, () =>
        sendClientGameUpdate(this.makeMovePayload()));
    }

    render() {
        switch(this.state.turn_state){
            case 0:
                return (<div className="werewolfOptions"><p>You smell the air and look for other werewolves...</p></div>);
            case 1:
                if (this.state.alone){
                    return(
                    <div className="werewolfOptions">
                        <p>You are the only werewolf. Select a center card to view:</p>
                        <DisplayCenterCards 
                            centerCount={this.props.centerCount}
                            onClick={(choice) => this.handleAction(choice)}
                        />
                    </div>);
                }
                return(<div className="werewolfOptions">
                    <p>The other werewolves are: </p>
                    <ul>{this.state.roleData.map(username => {
                        return <li key={username}>{username}</li> //TODO implement better keys
                    })}</ul>
                </div>);
            case 2:
                return (<div className="werewolfOptions"><p>You turn over the center card...</p></div>);
            case 3:
                return(<div className="werewolfOptions">
                    <p>{this.state.result_string}</p>
                    <CardButton
                        key={"flipCard" + this.state.cardChoice.toString()}
                        value={this.state.cardChoice}
                        keepDown={false}
                        face={this.state.roleData[0]}
                        autoFlip={true}
                        label={""}
                    />
                    </div>);
            default:
                break;
        }
    }
}

class TroublemakerOptions extends React.Component {
    constructor(props){
        super(props);
        this.makeMovePayload = this.makeMovePayload.bind(this);
        this.state = {
            choices: [],
            moveSent: false,
        }
    }

    handleAction(data){
        var newChoices = this.state.choices;
        if (newChoices.includes(data)) {
            newChoices.splice(newChoices.indexOf(data), 1);
        }
        else {
            newChoices.push(data);
        }
        this.setState({cardChoices: newChoices}, () => {
            if(this.state.choices.length === 2){
                sendClientGameUpdate(this.makeMovePayload());
                const intel_string = `You swapped the cards of ${this.state.choices[0]} and ${this.state.choices[1]}.`;
                this.props.addIntel(intel_string);
            }
        });
    }

    makeMovePayload(){
        if (this.state.choices.length == 2){
            var payload = {
                moveType: 'TROUBLEMAKER',
                cards: this.state.choices,
                details: {doppel: this.props.doppel? true : false} //Cast to bool in case doppel is not provided
            };
            this.setState({moveSent: true});
            return payload;
        }
        //TODO handle cases where exactly 2 cards haven't been selected
    }
    render(){
        if (!this.state.moveSent){
            return (
            <div className="troublemakerOptions">
                <p>Select 2 cards to swap: </p>
                <DisplayPlayerCards 
                        playerList={this.props.playerList}
                        myName={this.props.myName}
                        onClick={(data) => this.handleAction(data)}
                />
            </div>);
        }
        else{
            return(<div className="troublemakerOptions">
                <p>You swapped the cards of {this.state.choices[0]} and {this.state.choices[1]}.</p>
            </div>);
        }
    }
}

class RobberOptions extends React.Component {
    constructor(props){
        super(props);
        this.makeMovePayload = this.makeMovePayload.bind(this);
        this.state = {
            turn_state: 0, //0: not selected, 1: waiting for server response 2: done
            choice: "",
            roleData: "",
            result_string: "",
        }
    }

    componentDidMount(){
        socket.on('roleInfo', (msg) => {
            if (this.state.turn_state === 1){
                let artcl = isVowel(msg[0].charAt(0))? "an" : "a";
                const intel_string = `You robbed ${this.state.choice} and became ${artcl} ${msg[0]}`;
                this.props.addIntel(intel_string);
                this.setState({roleData: msg[0], turn_state: 2})
                setTimeout(() => {
                    this.setState({result_string: intel_string})
                }, 1000);
            }
        });
    }

    componentWillUnmount(){
        socket.on('roleInfo', (msg) => {
            console.log("Component has been unmounted")
        });
    }

    makeMovePayload(){
        var payload = {
            moveType: "ROBBER",
            cards: [this.state.choice],
            details: {doppel: this.props.doppel ? true : false}
        }
        this.setState({turn_state: 1})
        return payload
    }

    handleAction(choice){
        this.setState({choice: choice}, () => {
            sendClientGameUpdate(this.makeMovePayload());
            this.setState({turn_state: 1});
        });
    }

    render(){
        switch(this.state.turn_state){
            case 0:
                return(
                    <div className="robberOptions">
                        <p>Select a player to rob: </p>
                        <DisplayPlayerCards 
                        playerList={this.props.playerList}
                        myName={this.props.myName}
                        onClick={(data) => this.handleAction(data)}
                        />
                    </div>
                );
            case 1:
                return(
                <div className="robberOptions">
                    <p>You search through {this.state.choice}s belongings...</p>
                </div>
                );
            case 2:
                return (<div className="robberOptions">
                    <p>{this.state.result_string}</p>
                    <CardButton
                        key={"flipCard" + this.state.choice.toString()}
                        value={this.state.choice}
                        keepDown={false}
                        face={this.state.roleData}
                        autoFlip={true}
                        label={""}
                    />
                    </div>);
        }
    }
}

class MinionOptions extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            roleData: [],
            alone: false,
            waitingForServer: true,
        }
    }

    componentDidMount(){
        socket.on('roleInfo', (msg) => {
            if(this.state.waitingForServer){
                this.setState({alone: msg["alone"], roleData: msg["others"], waitingForServer: false});
                if (msg["alone"]){
                    this.props.addIntel("You didn't see any werewolves.");
                }
                else {
                    let plural_or_nay = msg["others"].length > 1? "were werewolves" : "was a werewolf";
                    this.props.addIntel(`${msg["others"].join(', ')} ${plural_or_nay}.`);
                }
            }
        });
    }

    componentWillUnmount(){
        socket.on('roleInfo', (msg) => {
            console.log("Component has been unmounted")
        });
    }

    render() {
        if(this.state.waitingForServer){
            return(<div className="minionOptions"><p>You wait for a signal from your werewolf allies...</p></div>)
        }
        else if (this.state.alone){
            return(<div className="minionOptions">
                <p>There are no werewolves in the village. 
                Stay alive and make sure someone else dies!</p>
            </div>);
        } else {
            return(<div className="minionOptions">
                <p>The werewolves are:</p>
                <ul>{this.state.roleData.map(username => {
                    return <li key={username}>{username}</li> //TODO implement better keys
                })}
                </ul>
                    <p>Take the heat off the werewolves, even if it means sacrificing yourself!</p>
                </div>);
        }
    }
}

class MasonOptions extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            roleData: [],
            alone: false,
            waitingForServer: true,
        }
    }
    componentDidMount(){
        socket.on('roleInfo', (msg) => {
            if(this.state.waitingForServer){
                this.setState({alone: msg["alone"], roleData: msg["others"], waitingForServer: false});
                if (msg["alone"]){
                    this.props.addIntel("You didn't see any other masons.");
                }
                else {
                    let plural_or_nay = msg["others"].length > 1 ? "masons were" : "mason was";
                    this.props.addIntel(`The other ${plural_or_nay} ${msg["others"].join(', ')}`);
                }
            }
        });
    }
    componentWillUnmount(){
        socket.on('roleInfo', (msg) => {
            console.log("Component has been unmounted")
        });
    }
    render() {
        if(this.state.waitingForServer){
            return(<div className="masonOptions"><p>You make your way to the secret meeting place...</p></div>)
        }
        else if (this.state.alone){
            return(<div className="masonOptions">
                <p>You are the only mason.</p>
            </div>);
        } else {
            return(<div className="masonOptions">
                <p>The other masons are:</p>
                <ul>{this.state.roleData.map(username => {
                    return <li key={username}>{username}</li>
                })}
                </ul>
                </div>);
        }
    }
}

class DrunkOptions extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            done: false,
            choice: -1,
        }
    }

    makeMovePayload() {
        var payload = {
            moveType: 'DRUNK',
            cards: [this.state.choice],
            details: {doppel: this.props.doppel? true : false}
        };
        return payload;
    }

    handleAction(choice){
        this.setState({choice: parseInt(choice), done: true}, () => {
            sendClientGameUpdate(this.makeMovePayload());
            const intel_string = `You swapped your card with center card ${this.state.choice+1}.`;
            this.props.addIntel(intel_string);
        });
    }

    render (){
        if(!this.state.done) {
            return (
            <div className="drunkOptions">
                <p>Select a center card:</p>
                <DisplayCenterCards
                centerCount={this.props.centerCount}
                onClick={(data) => this.handleAction(data)}/>
            </div>
            );
        }
        else{
            return(
                <div>
                    <p>You swapped your card with center card {this.state.choice + 1},
                    but can't seem to remember what you got in return...
                    </p>
                </div>
            );
        }
    }
}

class InsomniacOptions extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            waitingForServer: true,
            done: false,
            roleData: "NOTHING",
        }
    }

    componentDidMount(){
        socket.on('roleInfo', (msg) => {
            if(this.state.waitingForServer){
                this.setState({roleData: msg[0], waitingForServer: false});
                let artcl = isVowel(msg[0].charAt(0))? "an" : "a";
                this.props.addIntel(`In the end, your card was ${artcl} ${msg[0]}`)
            }
        });
    }

    componentWillUnmount(){
        socket.on('roleInfo', (msg) => {
            console.log("Component has been unmounted")
        });
    }
    render(){
        var text = this.state.done? 
            <p>You look at your card and see: {this.state.roleData}</p> :
            <p>Look at your own card.</p>
        return (
            <div className="insomniacOptions">
                {text}
                <CardButton 
                    label={"Your card"}
                    value={0}
                    onClick={()=>this.setState({done: true})}
                    keepDown={false}
                    face={this.state.roleData}
                />
            </div>
        );
    }

}

class DoppelgangerOptions extends React.Component {
    constructor(props){
        super(props);
        this.makeMovePayload = this.makeMovePayload.bind(this);
        this.state = {
            /* turn_state:
                * 0: player is making choice
                * 1: waiting for server response
                * 2: displaying transformation data
                * 3: displaying fast-acting role options (seer, robber etc)
                */
            turn_state: 0,
            choice: "",
            roleData: "",
            result_string: "",
        }
    }

    componentDidMount(){
        socket.on('roleInfo', (msg) => {
            if (this.state.turn_state === 1){
                this.setState({roleData: msg[0], turn_state: 2});
                this.props.updateAlt(msg[0]);
                let artcl = isVowel(msg[0].charAt(0))? "an" : "a";
                const intel_string = `You copied ${this.state.choice}s card and transformed into a ${artcl} ${msg[0]}`;
                this.props.addIntel(intel_string);
                setTimeout(() => {
                    this.setState({result_string: intel_string});
                }, 1000);
                //Give the player a second to understand their new role before displaying options
                if (["SEER","ROBBER","TROUBLEMAKER","DRUNK"].includes(msg[0])) {
                    setTimeout(() => {
                        this.setState({turn_state: 3})
                    }, 2000);
                }
            }
        });
    }

    componentWillUnmount(){
        socket.on('roleInfo', (msg) => {
            console.log("Component has been unmounted")
        });
    }

    makeMovePayload(){
        var payload = {
            moveType: "DOPPELGANGER",
            cards: [this.state.choice],
        }
        this.setState({turn_state: 1})
        return payload
    }

    handleAction(choice){
        this.setState({choice: choice}, () => {
            sendClientGameUpdate(this.makeMovePayload());
            this.setState({turn_state: 1});
        });
    }

    render(){
        switch(this.state.turn_state){
            case 0:
                return(
                    <div className="doppelOptions">
                        <p>Select a player to doppel: </p>
                        <DisplayPlayerCards
                        playerList={this.props.playerList}
                        myName={this.props.myName}
                        onClick={(data) => this.handleAction(data)}
                        />
                    </div>
                );
            case 1:
                return(
                <div className="doppelOptions">
                    <p>You spy on {this.state.choice}s every move...</p>
                </div>
                );
            case 2:
                if (this.state.roleData === "DOPPELGANGER"){
                    return (
                    <div className="doppelOptions"><p>You transformed into {this.state.choice}s role,
                        but they were also a doppelganger. You are still on the villager team.
                        </p>
                        <CardButton
                            key={"flipCard" + this.state.choice.toString()}
                            value={this.state.choice}
                            keepDown={false}
                            face={this.state.roleData}
                            autoFlip={true}
                            label={""}
                        />
                    </div>);
                }
                else {
                    return(
                        <div className="doppelOptions">
                            <p>{this.state.result_string}</p>
                            <CardButton
                                key={"flipCard" + this.state.choice.toString()}
                                value={this.state.choice}
                                keepDown={false}
                                face={this.state.roleData}
                                autoFlip={true}
                                label={""}
                            />
                        </div>);
                }
            case 3:
                let artcl = isVowel(this.state.roleData.charAt(0)) ? "an" : "a";
                return (<div className="doppelOptions">
                    <p>You have transformed into {artcl} {this.state.roleData}.</p>
                    {this.props.createRoleOptions(this.state.roleData)}
                    </div>);
            default:
                return (<div className="doppelOptions"></div>);
        }
    }
}
/* PlayArea
    Displays interactive options for the player to use on their turn in the night
 */
class PlayArea extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            altRole: "NOTHING",
            readyToSleep: false,
        }
    }

    updateAlt(newAlt){
        this.setState({altRole: newAlt});
    }

    handleBedtimeClick(){
        if (!this.state.readyToSleep) {
            this.setState({readyToSleep: true}, sendReadyMessage);
        }
    }

    createRoleOptions(role, doppel=false){
        switch(role) {
            case 'WEREWOLF':
                return (
                <WerewolfOptions 
                    centerCount={this.props.centerCount}
                    playerList={this.props.playerList}
                    addIntel={this.props.addIntel}
                />);
            case 'SEER':
                return (
                <SeerOptions 
                    centerCount={this.props.centerCount}
                    playerList={this.props.playerList}
                    myName={this.props.myName}
                    doppel={doppel}
                    addIntel={this.props.addIntel}
                />);
            case 'TROUBLEMAKER':
                return (
                <TroublemakerOptions
                    playerList={this.props.playerList}
                    myName={this.props.myName}
                    doppel={doppel}
                    addIntel={this.props.addIntel}
                />
                );
            case 'MINION':
                return (<MinionOptions
                    addIntel={this.props.addIntel}/>);
            case 'MASON':
                return(<MasonOptions
                    addIntel={this.props.addIntel}/>);
            case 'DRUNK':
                return (<DrunkOptions
                        centerCount={this.props.centerCount}
                        doppel={doppel}
                        addIntel={this.props.addIntel}
                        />);
            case 'INSOMNIAC':
                return (<InsomniacOptions
                    addIntel={this.props.addIntel}/>);
            case 'ROBBER':
                return(
                <RobberOptions
                    playerList={this.props.playerList}
                    myName={this.props.myName}
                    doppel={doppel}
                    addIntel={this.props.addIntel}
                />);
            case 'DOPPELGANGER':
                return (
                <DoppelgangerOptions
                playerList={this.props.playerList}
                myName={this.props.myName}
                centerCount={this.props.centerCount}
                createRoleOptions={(role, doppel) => this.createRoleOptions(role, doppel=true)}
                updateAlt={(newAlt) => this.updateAlt(newAlt)}
                addIntel={this.props.addIntel}
                />);
            case 'NOTHING':
                return (<div>Game is in a weird limbo state, stand by...</div>);
            default:
                return(<div>This client is outdated. Try refreshing the page and starting a new game</div>);
        }
    }

    render() {
        if (this.props.bedTimePhase){
            return(
            <div className='playArea roleActive'>
                <div className="bedTimeCard">
                    <p>This is your card. Tap on it to see what it is</p>
                    <CardButton
                        label={""}
                        value={0}
                        onClick={() => this.handleBedtimeClick()}
                        keepDown={false}
                        face={this.props.role}
                    />
                </div>
            </div>
            );
        }
        // Check if Doppelganger needs to act off-turn
        if ((this.props.turn!=="DOPPELGANGER")&&this.props.role==="DOPPELGANGER"){
            // Check if doppelganger transformed into something other than the instantly acting roles
            if (!["NOTHING","DOPPELGANGER","SEER","ROBBER","TROUBLEMAKER","DRUNK"].includes(this.state.altRole)){
                if(this.props.turn === this.state.altRole){
                    return(
                        <div className="playArea roleActive">
                            {this.createRoleOptions(this.state.altRole)}
                        </div>
                        );
                }
            }
        }
        if (this.props.turn === this.props.role){
                                
            return(
                <div className="playArea roleActive">
                    {this.createRoleOptions(this.props.role)}
                </div>);
        }
        return (<div className="playArea"></div>)
    }
}

class VoteButton extends React.Component {
    constructor(props){
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }
    handleClick(){
        this.props.handleVote(this.props.value);
    } 
    render(){
        if (this.props.isTarget){
            return(<button className="VoteButton"
            value={this.props.value}
            onClick={this.handleClick}
            disabled>
                {this.props.value}
            </button>)
        }
        return(
        <button className="VoteButton"
            value={this.props.value}
            onClick={this.handleClick}>
        {this.props.value}
        </button>
        );
    }
}
/* Voting area
    Presented when the night is over and the game has progressed to the voting phase
 */
class VotingArea extends React.Component {
    constructor(props){
        super(props);
        this.toggleConfirmEndGame = this.toggleConfirmEndGame.bind(this);
        this.state = {
            votingFor: "",
            confirmingEnd: false,
        }
    }
    
    handleVote(player) {
        this.setState({votingFor: player});
        sendVote(player);
    }

    renderButton(username){
        return (<VoteButton
            key={"votebutton_" +username}
            isTarget={username === this.state.votingFor}
            value={username}
            handleVote={(username) => this.handleVote(username)}
            />
        );
    }

    toggleConfirmEndGame(){
        this.setState({confirmingEnd: !this.state.confirmingEnd})
    }

    render(){
        if (this.state.confirmingEnd){
            return (
                <div className="votingArea">
                <ConfirmDialog
                    prompt={"Skip to the end of voting and finish the game?"}
                    onCancel={this.toggleConfirmEndGame}
                    onConfirm={sendFinishGame}
                />
                </div>
            );
        }
        const otherPlayers = this.props.playerList.filter(myName => myName != this.props.myName);
        const buttons = otherPlayers.map((username) => {
            return this.renderButton(username)
        });
        const votingString = this.state.votingFor === ""? "" : `You are voting for ${this.state.votingFor}`;
        return (
            <div className="votingArea">
                <p>Choose a player to vote for: </p>
                <div className="voteButtons">
                    {buttons}
                </div>
                <p>{votingString}</p>
                {<button className="endGameButton" onClick={this.toggleConfirmEndGame}>End voting phase</button>}
            </div>
        );
    }
}

function ConfirmDialog (props){
    return (
        <div className="confirmDialog">
            <p>{props.prompt}</p>
            <button onClick={props.onCancel}>Cancel</button>
            <button onClick={props.onConfirm}>Do it!</button>
        </div>
    );
}

/* InfoArea
    Contains information that the player should know to help them strategize
    Available throughout the game 
*/
class InfoArea extends React.Component {
    render() {
        const role = this.props.role;
        if (this.props.bedTimePhase){
            return(
                <div className="infoArea roleActive">
                    <p>The night is starting soon...</p>
                </div>
            );
        }
        else if (this.props.nightPhase) {
            if (this.props.role === this.props.turn){
                return(
                    <div className="infoArea roleActive">
                        <p>It is the {this.props.role} turn. That means you!</p>
                        <p className="turnTimer">{this.props.timer}</p>
                    </div>

                );
            }
            return(
                <div className="infoArea">
                <p>{this.make_role_string(role)} </p>
                <div className="intelligence">{this.make_intelligence_list()}</div>
                <p>It is currently the {this.props.turn} turn.</p>
                <p className="timer">{this.props.timer}</p>
                </div>
            );
        }

        else if (this.props.votingPhase){
            return(
                <div className="infoArea votingActive">
                    <p>{this.make_role_string(role)} </p>
                    <div className="intelligence">{this.make_intelligence_list()}</div>
                    <p className="timer">{this.props.timer}</p>
                </div>
            );
        }
        return (
            <p>Waiting for a game to start</p>
        );
    }

    make_role_string(role) {
        if (role === 'NOTHING'){
            return 'You do not have a role right now.';
        }
        if (!this.props.votingPhase){
            return `You are ${isVowel(role.charAt(0))? 'an' : 'a'} ${role}.`;
        }
        return(`In the beginning, your role was ${isVowel(role.charAt(0))? 'an' : 'a'} ${role}.`);
    }

    make_role_list(inplay){
        var role_counts = {};
        for (let i=0; i < inplay.length; i++) {
            if (!role_counts[inplay[i]]){
                role_counts[inplay[i]] = 1;
            }
            else {
                role_counts[inplay[i]] += 1;
            }
        }
        const list = Object.entries(role_counts).map( ([key, value]) => {
            return <li key={key}>{key}: x{value}</li>
        });
        return list;
    }

    make_intelligence_list(){
        return (<ul>{this.props.intelligence.map((info) => {
            return <li>{info}</li>
        })}</ul>)
    }
}

/* ResultsArea
 * After voting is over displays the final results of the game
 */
class ResultsArea extends React.Component {
    render () {
        const results = this.props.results;
        return(<div className="resultsArea">
            <p>
                The following players were eliminated:
            </p>
            <ul>{this.makeList(results['elims'])}</ul>
            <p>
                The winners are: 
            </p>
            <ul> {this.makeList(results['winners'])} </ul>
            <button onClick={this.props.onExit}>Back to lobby</button>
        </div>)
    }
    makeList(elems){
        if (elems.length === 0){
            return (<li key="Nobody">Nobody!</li>)
        }
        return elems.map(player => {
            return <li key={player}>{player} ({this.props.results['player_results'][player]['role_end']})</li>
        });
    }
}

/* Game
Main container for the game
*/
class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            nightPhase: false,
            votingPhase: false,
            gameOver: false,
            turn: 'NOTHING',
            myRole: props.gameStartInfo["role"],
            timer: 0,
            inPlay: props.gameStartInfo["in_play"],
            results: {},
            roleIntelligence: [],
        }
    }
    componentDidMount(){
        socket.on('gameStateUpdate', (msg) => {
            console.log("gamestateupdate:");
            console.log(msg);
            if (msg["has_game"]){
                this.setState({
                    turn  :  msg["turn"],
                    timer :  msg["time_left"],
                    nightPhase : msg["isNight"],
                    votingPhase: !msg["isNight"]
                });
            }
        });
        socket.on('resultAnnouncement', (msg) =>{
            this.setState({nightPhase: false, votingPhase: false,
                gameOver: true, results: msg});
        });
    }

    componentWillUnmount(){
        socket.on('gameStateUpdate', (msg) => {
            console.log("Got gameStateUpdate, but Game component is unmounted")
        });
        socket.on('resultAnnouncement', (msg) => {
            console.log("Got resultAnnouncement, but Game component is unmounted")
        });
    }

    startGame(){
        sendStartGame();
    }

    appendToIntelligence(intelligence){
        this.setState({roleIntelligence: [...this.state.roleIntelligence, intelligence]});
    }

    render(){
        if (!this.state.gameOver) {
            var interactiveComponent = (<div></div>);
            if(this.state.votingPhase){
                interactiveComponent = (
                <VotingArea
                    playerList={this.props.playerList}
                    myName={this.props.myName}
                />);
            }
            else if(this.state.nightPhase || this.props.bedTimePhase){
                interactiveComponent = (
                        <PlayArea
                            myName={this.props.myName}
                            startGame={() => this.startGame()}
                            bedTimePhase={this.props.bedTimePhase}
                            nightPhase={this.state.nightPhase}
                            turn={this.state.turn}
                            role={this.state.myRole}
                            playerList={this.props.playerList}
                            centerCount={this.state.inPlay.length-this.props.playerList.length}
                            addIntel={(intel) => this.appendToIntelligence(intel)}
                        />);
            }
            return(
                <div className='game'>
                    <InfoArea
                        myName={this.props.myName}
                        role={this.state.myRole}
                        turn={this.state.turn}
                        timer={this.state.timer.toString()}
                        inPlay={this.state.inPlay}
                        bedTimePhase={this.props.bedTimePhase}
                        nightPhase={this.state.nightPhase}
                        votingPhase={this.state.votingPhase}
                        playerList={this.props.playerList}
                        intelligence={this.state.roleIntelligence}
                    />
                    {interactiveComponent}
                </div>
            );
        }
        return(
            <div className='game'>
                    <ResultsArea
                    results={this.state.results}
                    onExit={this.props.onExit}/>
            </div>
        );
    }
}

class SettingsView extends React.Component{
    constructor(props){
        super(props);
        this.handleSetRoles = this.handleSetRoles.bind(this);
        this.state = {
            rolesWithCounts: Object.assign({}, this.props.rolesWithCounts)
        }
    }

    addRemoveRole(role, willAdd){
        var newRoleCount = this.state.rolesWithCounts;
        if (role in newRoleCount){
            willAdd ? newRoleCount[role] +=1 : newRoleCount[role] -=1
        }
        if (!(role in newRoleCount) || newRoleCount[role]<0){
            newRoleCount[role] = 0;
        }
        this.setState({rolesWithCounts: newRoleCount});
    }

    handleSetRoles(){
        this.props.onSetRoles(this.state.rolesWithCounts);
    }

    render(){
        const roleList = Object.keys(this.state.rolesWithCounts).map((role) => {
            return(
            <div className="roleSelection" key={role + "_selection"}>
                <span className="roleSelectText">
                    <span>{role}:</span>
                    <span className="roleCount">{this.state.rolesWithCounts[role]}</span>
                </span>
                <div className="plusMinusButtons">
                    <button onClick={(r, add) => this.addRemoveRole(role, false)}>-</button> 
                    <button onClick={(r, add) => this.addRemoveRole(role, true)}>+</button>
                </div>
            </div>);
        });
        return(
            <div className="settingsView">
                <div className="roleMenu">{roleList}</div>
                <div className="bottomButtons">
                    <button onClick={this.props.onCancel}>Cancel</button>
                    <button onClick={this.handleSetRoles}>Confirm</button>
                </div>
            </div>
        );
    }

}

class Lobby extends React.Component {
    constructor(props){
        super(props);
        this.toggleReady = this.toggleReady.bind(this);
        this.toggleSettings = this.toggleSettings.bind(this);
        this.state = {
            ready: false,
            rolesWithCounts: {},
            showSettings: false,
        }
    }
    
    componentDidMount() {
        socket.on('gameSettingsMessage', (msg) => {
            this.setState({rolesWithCounts: msg["roles"]});
        });
        // Get initial settings
        sendGetSettingsMessage();
    }

    componentWillUnmount() {
        socket.on('gameSettingsMessage', (msg) => {
            console.log("Component has been unmounted.")
        });
    }

    toggleReady() {
        //this.setState({ready: !this.state.ready});
        sendReadyMessage();
    }

    toggleSettings(){
        this.setState({showSettings: !this.state.showSettings});
    }

    handleSetRoles(rolesWithCounts){
        sendSetSettingsMessage({
            "roles": rolesWithCounts
        });
        sendGetSettingsMessage();
        this.setState({showSettings: false});
    }

    renderPlayerList() {
        const playerList = this.props.players.map(
            ([username, ready]) => {
            return <li key={"lobby_"+username}>{username}: {ready? "Ready" : "Not ready"}</li>
        });
        return(<div className="playerList">
            <h2>Connected players:</h2>
            <ul>{playerList}</ul>
            </div>);
    }
    renderSettingsList() {
        const roleArray = Object.keys(this.state.rolesWithCounts).filter((elem) => {
            return this.state.rolesWithCounts[elem] > 0;
        });
        var roleCount = 0;
        const roleList = roleArray.map((role) =>{
                let count = this.state.rolesWithCounts[role];
                roleCount += count;
                return (<li key={"lobby_roles_" + role}>{role}: x{count}</li>);
        });
        return (
            <div className="lobbySettings">
                <h2>Selected roles:</h2>
                <ul className="roleList">{roleList}</ul>
                <p>Total cards: {roleCount}</p>
            </div>);
    }

    playerIsReady(){
        for (let player of this.props.players){
            if (player[0] === this.props.myName){
                return player[1];
            }
        }
    }

    render (){
        if (!this.state.showSettings) {
            return(<div className="gameLobby">
                <h1>Lobby</h1>
                <p className="serverMessage">{this.props.serverMessage}</p>
                <div className="pregameInfoContainer">
                    {this.renderPlayerList()}
                    {this.renderSettingsList()}
                </div>
                <div className="bottomButtons">
                    <button onClick={this.toggleSettings}>Settings</button>
                    <button onClick={this.toggleReady}>
                        {this.playerIsReady()? "Unready" : "Ready"}
                    </button>

                </div>
            </div>);
        }
        return(<div className="gameLobby">
            <SettingsView 
                rolesWithCounts={this.state.rolesWithCounts}
                onCancel={this.toggleSettings}
                onSetRoles={(newRoles) => this.handleSetRoles(newRoles)}
            />
        </div>);
    }
}

function LoginMenu(props) {
    const feedback = props.nameFeedback!=="" ? <p>{props.nameFeedback}</p> : "";
    return(
        <div className="loginMenu">
            <div className="nameFeedback">{feedback}</div>
            <p>Enter your name:</p>
            <input type="text" id="nameInputField"></input>
            <button onClick={sendLoginMessage}>OK</button>
        </div>
    );
}

class App extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            pregame: true,
            bedTimePhase: false,
            playerReadyList: [["Player", true], ["Player2", true], ["Player3", true]], //[[username, ready]]
            myUsername: "Player",
            gameStartData: {"role": "NOTHING",
                            "in_play": ["SEER", "VILLAGER", "WEREWOLF"]
                        },
            serverMessage: "",
            loggedIn: false,
            nameFeedback: "",
        }
        this.handleBackToLobby = this.handleBackToLobby.bind(this);
    }
    componentDidMount(){
        socket.on('playerListUpdate', (msg) => {
            this.setState({playerReadyList: msg});
        });
        socket.on('gameStartInfo', (msg) => {
            this.setState({pregame: false, bedTimePhase: true, gameStartData: msg})
        });
        socket.on('name_confirmed', (msg) =>{
            this.setState({myUsername: msg, loggedIn:true});
        });
        socket.on('nameFeedback', (msg) => {
            this.setState({nameFeedback: msg})
        });
        socket.on('serverMessage', (msg) => {
            this.setState({serverMessage: msg})
        });
        socket.on('nightBeginsMessage', () => {
            this.setState({bedTimePhase: false})
        });
        socket.on('serverResetMessage', (msg) => {
            this.setState({pregame: true, bedTimePhase: false, loggedIn:false, nameFeedback: msg})
        });
    }
    componentWillUnmount(){
        const msgNames = ['playerListUpdate','gameStartInfo','name_confirmed','nameFeedback',
        'serverMessage','nightBeginsMessage','serverResetMessage'];
        for (msgName of msgNames){
            socket.on(msgName, (msg) => {
                console.log(`Got ${msgName}, but App component is unmounted`);
            });
        }
    }
    handleBackToLobby(){
        this.setState({pregame: true, serverMessage:""});
        sendGetPlayerListMessage();
    }

    render() {
        if (!this.state.loggedIn){
            return (<LoginMenu
                    nameFeedback={this.state.nameFeedback}/>);
        }
        if (this.state.pregame){
            return (<Lobby 
                    players={this.state.playerReadyList}
                    serverMessage={this.state.serverMessage}
                    myName={this.state.myUsername}
                    />);
        }
        else {
            return (<Game 
                    playerList={this.state.playerReadyList.map((nameReady) =>
                        {return nameReady[0]})} // Only players' usernames are needed
                    myName={this.state.myUsername}
                    bedTimePhase={this.state.bedTimePhase}
                    gameStartInfo={this.state.gameStartData}
                    onExit={this.handleBackToLobby}
                    serverMessage={this.state.serverMessage}
                    />);
        }

    } 
}


const domContainer = document.querySelector('#app_container');
ReactDOM.render(<App/>, domContainer);