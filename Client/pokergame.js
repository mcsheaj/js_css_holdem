"use strict";

var gameDeck = new Array(52);
var deck_index = 0;

var lowest_chip_amount = 5; //this works for my home game nickel/dime

var SERVER_STATE = {
    SENDER: "",
    CMD: "",
    CMD_PARMS: "",
    NUM_ROUNDS: 0,
    TO_CALL: 0,
    STARTING_BANKROLL: 1000,
    SMALL_BLIND: 5,
    BIG_BLIND: 10,
    players: new Array,
    board: new Array(),
    button_index: 0,
    current_bettor_index: 0,
    current_bet_amount: 0,
    current_total_bet: 0,
    current_min_raise: 0,
    global_pot_remainder: 0,
    last_raiser: -1
}

function player(name, bankroll, totalbank, carda, cardb, status, total_bet,
    subtotal_bet) {
    this.name = name;
    this.bankroll = bankroll;
    this.totalbank = totalbank;
    this.carda = carda;
    this.cardb = cardb;
    this.status = status;
    this.total_bet = total_bet;
    this.subtotal_bet = subtotal_bet;
}

var apiBaseUrl = 'https://func-jsholdem-useast.azurewebsites.net'; // JMM-Joe
//var apiBaseUrl = 'https://func-jsholdem-eastus-matt.azurewebsites.net'; // MJM-Matt
//var apiBaseUrl = 'http://127.0.0.1:7071'; // JMM-Joe
var authProvider = 'aad'; // aad, twitter, microsoftaccount, google, facebook
var app = {
    connection: null,
    ready: false,

    ///////////////////////////////////////////////
    // init members, connect to signalR and setup 
    // callback handlers
    ///////////////////////////////////////////////
    init: function () {

        // create a signalr connection (ready to connect, but not yet connected)
        app.connection = new signalR.HubConnectionBuilder()
            .withUrl(`${apiBaseUrl}/api`)
            .build();

        // setup a callback for signalr to send messages back to
        app.connection.on('newMessage', function (message) {
            app.messageHandler(message);
        });

        // setup a callback to tell me when my connection is lost
        app.connection.onclose(function () {
            app.ready = false;
            console.log('disconnected');
            app.init();
            app.timerId = setInterval(app.init, 10000);
        });

        // now initiate the connection
        app.connection.start()
            .then(function () {
                if (app.timerId) {
                    console.log('reconnected');
                    clearInterval(app.timerId);
                }
                app.ready = true;
            })
            .catch(console.error);
    },

    ///////////////////////////////////////////////
    // Send a message to signalR
    ///////////////////////////////////////////////
    sendMessage: function (messageText) {
        var sender = name;
        // payload is an arbitrary object (i.e. could be your whole state)
        var message = {
            recipient: '',
            sender: sender.value,
            payload: {
                priority: 100,
                text: messageText
            }
        };


        // send the message using axios promises
        return axios.post(`${apiBaseUrl}/api/send`, message)
            .then(
                function (resp) {
                    console.log("sendMessage ", message.payload.text); //resp.data);
                }
            ).catch(
                function (err) {
                    console.log(err);
                }
            );
    },

    ///////////////////////////////////////////////
    // Handle a message coming back from signalR
    ///////////////////////////////////////////////
    messageHandler: function (message) {
        if (!message.sender) message.sender = "anonymous";
        console.log("messageHandler ", message.payload.text);
        rcv_SignalR(message.payload.text);
    }
};

app.init();

function init() {
    cl_init();
    make_deck();
}

function make_deck() {
    var i;
    var j = 0;
    for (i = 2; i < 15; i++) {
        gameDeck[j++] = "h" + i;
        gameDeck[j++] = "d" + i;
        gameDeck[j++] = "c" + i;
        gameDeck[j++] = "s" + i;
    }
}

function clear_player_cards(count) {
    count = count;
    for (var pl = 0; pl < count; ++pl) {
    }
}

function add_new_player(current_state) {
    var player_added = false;

    if (SERVER_STATE.players.length == 0) { //first player
        SERVER_STATE.players[0] =
            new player(current_state.CMD_PARMS,
                current_state.STARTING_BANKROLL,
                current_state.STARTING_BANKROLL, "", "", "WAIT", 0, 0);
        player_added = true;
    }
    else if (SERVER_STATE.players.length < 10) { //can't have more than 10 players
        var dup = false;
        for (var n = 0; n < SERVER_STATE.players.length; n++) { //look for a player with duplicate name
            if (SERVER_STATE.players[n].name == current_state.CMD_PARMS) {
                dup = true;
                SERVER_STATE.players[n].status = "WAIT";  //user must sit out rest of hand
                send_game_response(SERVER_STATE.players[n].name + " has rejoined the game");
                //rejoining with same name should just send back game state without adding new player\
                LOCAL_STATE.CMD = "update player status";
                cl_send_SignalR(LOCAL_STATE);
            }
        }
        if (!dup) {
            SERVER_STATE.players[SERVER_STATE.players.length] =
                new player(current_state.CMD_PARMS,
                    current_state.STARTING_BANKROLL,
                    current_state.STARTING_BANKROLL, "", "", "WAIT", 0, 0);
            player_added = true;
        }
    }
    else {
        //send_game_response("Player tried to join a full game. No more than 10 players allowed");
    }
    return player_added;
}

function compRan() {
    return 0.5 - Math.random();
}

function new_game() {
    SERVER_STATE.NUM_ROUNDS = 0;
    reset_player_statuses(0);
    clear_bets();
    SERVER_STATE.button_index = Math.floor(Math.random() * SERVER_STATE.players.length);
    SERVER_STATE.players.sort(compRan);
    new_round();
}

function new_round() {
    SERVER_STATE.NUM_ROUNDS++;
    reset_player_statuses(1);
    clear_bets();
    clear_pot();
    SERVER_STATE.current_min_raise = SERVER_STATE.BIG_BLIND;
    collect_cards();
    SERVER_STATE.button_index = get_next_player_position(SERVER_STATE.button_index, 1);
    shuffle();
    blinds_and_deal();
}

function number_of_active_players() { //this does not include players who went all in
    var num_playing = 0;
    var i;
    for (i = 0; i < SERVER_STATE.players.length; i++) {
        if ((has_money(i)) && ((SERVER_STATE.players[i].status != "FOLD") &&
            (SERVER_STATE.players[i].status != "BUST") &&
            (SERVER_STATE.players[i].status != "AWAY") &&
            (SERVER_STATE.players[i].status != "WAIT"))) {
            num_playing += 1;
        }
    }
    return num_playing;
}

function number_of_players_in_hand() { //this includes players who went all in
    var num_playing = 0;
    var i;
    for (i = 0; i < SERVER_STATE.players.length; i++) {
        if ((SERVER_STATE.players[i].status != "FOLD") &&
            (SERVER_STATE.players[i].status != "BUST") &&
            (SERVER_STATE.players[i].status != "AWAY") &&
            (SERVER_STATE.players[i].status != "WAIT")) {
            num_playing += 1;
        }
    }
    return num_playing;
}

function collect_cards() {
    SERVER_STATE.board = new Array(6);
    for (var i = 0; i < SERVER_STATE.players.length; i++) {
        SERVER_STATE.players[i].carda = "";
        SERVER_STATE.players[i].cardb = "";
        SERVER_STATE.board[0] = "";
        SERVER_STATE.board[1] = "";
        SERVER_STATE.board[2] = "";
        SERVER_STATE.board[3] = "";
        SERVER_STATE.board[4] = "";
    }
    for (i = 0; i < SERVER_STATE.board.length; i++) {
        if (i > 4) {        // board.length != 5
            continue;
        }
        SERVER_STATE.board[i] = "";
        //gui_lay_board_card(i, SERVER_STATE.board[i]);     // Clear the board
    }
    for (i = 0; i < 3; i++) {
        SERVER_STATE.board[i] = "";
        //gui_burn_board_card(i, SERVER_STATE.board[i]);
    }
}

function get_random_int(max) {
    return Math.floor(Math.random() * max);
}

function new_shuffle() {
    var len = gameDeck.length;
    for (var i = 0; i < len; ++i) {
        var j = i + get_random_int(len - i);
        var tmp = gameDeck[i];
        gameDeck[i] = gameDeck[j];
        gameDeck[j] = tmp;
    }
}

function shuffle() {
    new_shuffle();
}

function blinds_and_deal() {
    var num_playing = number_of_active_players();

    var small_blind = get_next_player_position(SERVER_STATE.button_index, 1);
    the_bet_function(small_blind, SERVER_STATE.SMALL_BLIND);

    var big_blind = get_next_player_position(small_blind, 1);
    the_bet_function(big_blind, SERVER_STATE.BIG_BLIND);

    SERVER_STATE.players[big_blind].status = "OPTION";
    SERVER_STATE.current_bettor_index = get_next_player_position(big_blind, 1);
    SERVER_STATE.current_total_bet = SERVER_STATE.BIG_BLIND;
    deal_and_write_a();
}

function deal_and_write_a() {
    var current_player;
    var start_player;

    start_player = current_player = get_next_player_position(SERVER_STATE.button_index, 1);

    // Deal gameDeck to players still active
    do {
        SERVER_STATE.players[current_player].carda = gameDeck[deck_index++];
        current_player = get_next_player_position(current_player, 1);
    } while (current_player != start_player);

    deal_and_write_b();
}

function deal_and_write_b() {
    var current_player;
    var start_player;

    start_player = current_player = get_next_player_position(SERVER_STATE.button_index, 1);

    // Deal gameDeck to players still active
    do {
        SERVER_STATE.players[current_player].cardb = gameDeck[deck_index++];
        current_player = get_next_player_position(current_player, 1);
    } while (current_player != start_player);
}

function deal_flop() {
    var burn = gameDeck[deck_index++];

    for (var i = 0; i < 3; i++) {
        SERVER_STATE.board[i] = gameDeck[deck_index++];
    }
    get_next_action_seat();
    clear_subtotal_bets();
}

function deal_fourth() {
    var burn = gameDeck[deck_index++];
    SERVER_STATE.board[3] = gameDeck[deck_index++];
    get_next_action_seat();
    clear_subtotal_bets();
}

function deal_fifth() {
    var burn = gameDeck[deck_index++];
    SERVER_STATE.board[4] = gameDeck[deck_index++];
    get_next_action_seat();
    clear_subtotal_bets();
}

function clear_subtotal_bets() {
    for (var n = 0; n < SERVER_STATE.players.length; n++) {
        SERVER_STATE.players[n].subtotal_bet = 0;
    }
}

function get_next_action_seat() {
    SERVER_STATE.current_bettor_index = get_next_player_position(SERVER_STATE.button_index, 1);
}

//var global_pot_remainder = 0;

function handle_end_of_round() {
    var candidates = new Array(SERVER_STATE.players.length);
    var allocations = new Array(SERVER_STATE.players.length);
    var winning_hands = new Array(SERVER_STATE.players.length);
    var my_total_bets_per_player = new Array(SERVER_STATE.players.length);

    // Clear the ones that folded or are busted
    var i;
    var still_active_candidates = 0;
    for (i = 0; i < candidates.length; i++) {
        allocations[i] = 0;
        my_total_bets_per_player[i] = SERVER_STATE.players[i].total_bet;
        if (SERVER_STATE.players[i].status != "FOLD" &&
            SERVER_STATE.players[i].status != "BUST" &&
            SERVER_STATE.players[i].status != "AWAY" &&
            SERVER_STATE.players[i].status != "WAIT") {
            candidates[i] = SERVER_STATE.players[i];
            still_active_candidates += 1;
        }
    }

    var my_total_pot_size = get_pot_size();
    var my_best_hand_name = "";
    var best_hand_players;
    var current_pot_to_split = 0;
    var pot_remainder = 0;
    if (SERVER_STATE.global_pot_remainder) {
        pot_remainder = SERVER_STATE.global_pot_remainder;
        my_total_pot_size += SERVER_STATE.global_pot_remainder;
        SERVER_STATE.global_pot_remainder = 0;
    }

    while (my_total_pot_size > (pot_remainder + 0.9) && still_active_candidates) {
        // The first round all who not folded or busted are candidates
        // If that/ose winner(s) cannot get all of the pot then we try
        // with the remaining players until the pot is emptied
        var winners = get_winners(candidates, SERVER_STATE.board);
        if (!best_hand_players) {
            best_hand_players = winners;
        }
        if (!winners) {
            pot_remainder = my_total_pot_size;
            my_total_pot_size = 0;
            break;
        }

        // Get the lowest winner bet, e.g. an all-in
        var lowest_winner_bet = my_total_pot_size * 2;
        var num_winners = 0;
        for (i = 0; i < winners.length; i++) {
            if (!winners[i]) { // Only the winners bets
                continue;
            }
            if (!my_best_hand_name) {
                my_best_hand_name = winners[i]["hand_name"];
            }
            num_winners++;
            if (my_total_bets_per_player[i] < lowest_winner_bet) {
                lowest_winner_bet = my_total_bets_per_player[i];
            }
        }

        current_pot_to_split = pot_remainder;
        pot_remainder = 0;

        for (i = 0; i < SERVER_STATE.players.length; i++) {
            if (lowest_winner_bet >= my_total_bets_per_player[i]) {
                current_pot_to_split += my_total_bets_per_player[i];
                my_total_bets_per_player[i] = 0;
            } else {
                current_pot_to_split += lowest_winner_bet;
                my_total_bets_per_player[i] -= lowest_winner_bet;
            }
        }

        var share = current_pot_to_split;
        if (num_winners > 1) {
            pot_remainder = current_pot_to_split;
            for (i = 0; pot_remainder >= (num_winners * lowest_chip_amount); i++) {
                pot_remainder -= lowest_chip_amount * num_winners;
            }
            share = i * lowest_chip_amount;
        }

        for (i = 0; i < winners.length; i++) {
            if (my_total_bets_per_player[i] < 0.01) {
                candidates[i] = null;           // You have got your share
            }
            if (!winners[i]) {                // You should not have any
                continue;
            }
            my_total_pot_size -= share;       // Take from the pot
            allocations[i] += share;          // and give to the winners
            winning_hands[i] = winners[i].hand_name;
        }

        // Iterate until pot size is zero - or no more candidates
        for (i = 0; i < candidates.length; i++) {
            if (candidates[i] == null) {
                continue;
            }
            still_active_candidates += 1
        }
        if (still_active_candidates == 0) {
            pot_remainder = my_total_pot_size;
        }
    } // End of pot distribution

    SERVER_STATE.global_pot_remainder = pot_remainder;

    pot_remainder = 0;
    var winner_text = "";

    // Distribute the pot - and then do too many things
    for (i = 0; i < allocations.length; i++) {
        if (allocations[i] > 0) {
            var a_string = "" + allocations[i];
            var dot_index = a_string.indexOf(".");
            if (dot_index > 0) {
                a_string = "" + a_string + "00";
                allocations[i] = a_string.substring(0, dot_index + 3) - 0;
            }

            if (number_of_players_in_hand() > 1) {
                winner_text += SERVER_STATE.players[i].name + " wins $" + (allocations[i] / 100).toFixed(2) + " with " +
                    winning_hands[i] + ". ";
                if (best_hand_players[i]) {
                    SERVER_STATE.players[i].status = "WIN";
                }
            } else {
                winner_text += SERVER_STATE.players[i].name + " wins $" + (allocations[i] / 100).toFixed(2);
                if (best_hand_players[i]) {
                    SERVER_STATE.players[i].status = "NOSHOW";
                }
            }
            SERVER_STATE.players[i].bankroll += allocations[i];
        }
    }

    var num_playing = number_of_active_players();
    if (num_playing < 2) {
        // Convoluted way of finding the active player and give him the pot
        for (i = 0; i < SERVER_STATE.players.length; i++) {
            // For whosoever hath, to him shall be given
            if (has_money(i)) {
                SERVER_STATE.players[i].bankroll += pot_remainder;
                pot_remainder = 0;
            }
        }
    }
    var hi_lite_color = gui_get_theme_mode_highlite_color();
    var html = "<html><body topmargin=2 bottommargin=0 bgcolor=gold onload='document.f.c.focus();'>" +
        get_pot_size_html() +
        "  <font size=+2 color=" + hi_lite_color +
        "><b>Winning: " +
        winner_text + "</b></font><br>";

    SERVER_STATE.CMD_PARMS = html; //winner_text gets sent to players to display
}


function the_bet_function(player_index, bet_amount) {
    //make sure previous player didn't go allin with less than previous bet
    if (SERVER_STATE.current_bet_amount < bet_amount) {
        SERVER_STATE.current_bet_amount = bet_amount;
    }
    if (SERVER_STATE.current_min_raise < bet_amount) {
        SERVER_STATE.current_min_raise = bet_amount;
    }
    SERVER_STATE.players[player_index].subtotal_bet += bet_amount;
    SERVER_STATE.players[player_index].total_bet += bet_amount;
    SERVER_STATE.players[player_index].bankroll -= bet_amount;
    var current_pot_size = get_pot_size();
    return 1;
}

function make_readable_rank(r) {
    if (r < 11) {
        return r;
    } else if (r == 11) {
        return "J";
    } else if (r == 12) {
        return "Q";
    } else if (r == 13) {
        return "K";
    } else if (r == 14) {
        return "A";
    }
}

function get_pot_size() {
    var p = 0;
    for (var i = 0; i < SERVER_STATE.players.length; i++) {
        p += SERVER_STATE.players[i].total_bet; // + SERVER_STATE.players[i].subtotal_bet;
    }
    p += SERVER_STATE.global_pot_remainder;
    return p;
}

function get_pot_size_html() {
    return "<font size=+2><b>TOTAL POT: $" + (get_pot_size() / 100).toFixed(2) + "</b><br></font>";
}

function pot_is_good() {
    //if the next players total bet is = tables current bet then pot is good
    var good = true;

    var next = get_next_player_position(SERVER_STATE.current_bettor_index, 1);
    if (SERVER_STATE.players[next].total_bet != SERVER_STATE.current_total_bet) {
        good = false
    }

    return good;
}

function clear_bets() {
    for (var i = 0; i < SERVER_STATE.players.length; i++) {
        SERVER_STATE.players[i].subtotal_bet = 0;
    }
    SERVER_STATE.current_bet_amount = 0;
    SERVER_STATE.current_total_bet = 0;
    SERVER_STATE.current_min_raise = 0;
    SERVER_STATE.TO_CALL = 0;
}

function clear_pot() {
    for (var i = 0; i < SERVER_STATE.players.length; i++) {
        SERVER_STATE.players[i].total_bet = 0;
    }
}

function reset_player_statuses(type) {
    for (var i = 0; i < SERVER_STATE.players.length; i++) {
        if ((type == 0) && (SERVER_STATE.players[i].status != "AWAY")) {
            SERVER_STATE.players[i].status = "";
        } else if (type == 1 &&
            SERVER_STATE.players[i].status != "BUST" &&
            SERVER_STATE.players[i].status != "AWAY") {
            SERVER_STATE.players[i].status = "";
        } else if (type == 2 &&
            SERVER_STATE.players[i].status != "FOLD" &&
            SERVER_STATE.players[i].status != "BUST" &&
            SERVER_STATE.players[i].status != "AWAY" &&
            SERVER_STATE.players[i].status != "ALL IN" &&
            SERVER_STATE.players[i].status != "WAIT") {
            SERVER_STATE.players[i].status = "";
        }
    }
}

function get_num_betting() {
    var n = 0;
    for (var i = 0; i < SERVER_STATE.players.length; i++) {
        if (SERVER_STATE.players[i].status != "FOLD" &&
            SERVER_STATE.players[i].status != "BUST" &&
            SERVER_STATE.players[i].status != "AWAY" &&
            SERVER_STATE.players[i].status != "WAIT" &&
            has_money(i)) {
            n++;
        }
    }
    return n;
}

function get_next_player_position(i, delta) {
    if (number_of_active_players() < 1) { // getting here is not good
        console.log("no active player left but get_next_player was called")
        return;
    }
    var j = 0;
    var step = 1;
    if (delta < 0) step = -1;

    var loop_on = 0;
    do {
        i += step;
        if (i >= SERVER_STATE.players.length) {
            i = 0;
        } else {
            if (i < 0) {
                i = SERVER_STATE.players.length - 1;
            }
        }

        // Check if we can stop
        loop_on = 0;
        if (SERVER_STATE.players[i].status == "BUST") loop_on = 1;
        if (SERVER_STATE.players[i].status == "FOLD") loop_on = 1;
        if (SERVER_STATE.players[i].status == "WAIT") loop_on = 1;
        if (SERVER_STATE.players[i].status == "AWAY") loop_on = 1;
        if (!has_money(i)) loop_on = 1;
        if (++j < delta) loop_on = 1;
        if (j > SERVER_STATE.players.length) { //no active players, getting here is not good
            console.log("Bad stuff, no next player to get")
            loop_on = 0;
        }
    } while (loop_on);

    return i;
}

function has_money(i) {
    if (SERVER_STATE.players[i].bankroll >= 0.01) {
        return true;
    }
    SERVER_STATE.players[i].bankroll = 0;   //should never be negative but let's make sure
    return false;
}

function active_player(i) {
    if ((SERVER_STATE.players[i].status == "BUST") ||
        (SERVER_STATE.players[i].status == "FOLD") ||
        (SERVER_STATE.players[i].status == "WAIT") ||
        (SERVER_STATE.players[i].status == "AWAY") ||
        (!has_money(i))) {
        return false;
    }
    return true;
}

var all_all_in = false;
var why = "";

function betting_is_done() {  //this is done before we move to next player so see if next player has OPTION
    var done = true;            //if any statuses are "" than we have not been around once yet
    //and check that each players total bet is the same for this round OR
    //if all active players are ALL IN

    why = ""
    all_all_in = false;

    if (!number_of_active_players()) {
        all_all_in = true;
        return true;
    }

    //if each players total bet amount is the same then pot is good, 
    if (!pot_is_good()) {
        done = false;
        why = "pot is not right"
    }
    //but if next player has OPTION (BB in first round) then betting is still not done
    else if (SERVER_STATE.players[get_next_player_position(SERVER_STATE.current_bettor_index, 1)].status ==
        "OPTION") {
        done = false; why = "option"
    }
    //and if any players status is "" then we haven't been completely around once in this round so keep betting
    for (var n = 0; n < SERVER_STATE.players.length; n++) {
        if (active_player(n) && (SERVER_STATE.players[n].status == "")) {
            done = false; why = "not around once";
        }
        //if anyones total bet is not equal to the tables current high total then keep betting
        if (active_player(n)) {
            if (SERVER_STATE.players[n].total_bet != SERVER_STATE.current_total_bet) {
                done = false; why = "player " + SERVER_STATE.players[n].name + " bet not = current total bet";
            }
        }
    }
    //Ok, all else being checked, if every active player is ALL IN then betting is done
    var num_allin_or_fold_or_bust = 0;
    for (var i = 0; i < SERVER_STATE.players.length; i++) {
        if (!active_player(i)) {
            num_allin_or_fold_or_bust++;
        }
    }
    if (num_allin_or_fold_or_bust == (SERVER_STATE.players.length)) {
        done = true;
        all_all_in = true; why = "all in";
    }
    console.log("betting_is_done returned " + done + ", player is " +
        SERVER_STATE.players[SERVER_STATE.current_bettor_index].name + ", because " + why);
    return done;
}

function set_to_call() {

    if (SERVER_STATE.TO_CALL > SERVER_STATE.players[SERVER_STATE.current_bettor_index].bankroll) {
        //All in
        SERVER_STATE.TO_CALL = SERVER_STATE.players[SERVER_STATE.current_bettor_index].bankroll;
    }
    else {
        SERVER_STATE.TO_CALL = SERVER_STATE.current_total_bet -
            SERVER_STATE.players[SERVER_STATE.current_bettor_index].total_bet;
    }
}

function compRan() {
    return 0.5 - Math.random();
}

function msg_dispatch(current_state) {

    if (!cl_i_am_host()) return;  //if i'm not host then don't do any game logic

    if (current_state.CMD == "add new player") {
        if (add_new_player(current_state)) {
            SERVER_STATE.CMD = "new player added";
            send_SignalR(SERVER_STATE); //tell clients to add new player
        } else {
            //SERVER_STATE.CMD = "new player added";
            //send_SignalR(SERVER_STATE); //I know this is redundant but Im testing and im tired
        }
        return;  //so we do not clobber SERVER_STATE with an empty LOCAL_STATE
    }

    SERVER_STATE = current_state;
    if (SERVER_STATE.players.length == 0) {
        console.log("SERVER_STATE players array is empty");
    }

    if (current_state.CMD == "request new game") {
        new_game();
        SERVER_STATE.CMD = "start hand";
        send_SignalR(SERVER_STATE);
        if (number_of_active_players() < 3) {
            SERVER_STATE.TO_CALL = SERVER_STATE.SMALL_BLIND; //when only two players
        }
        else {
            SERVER_STATE.TO_CALL = SERVER_STATE.BIG_BLIND;
        }
        SERVER_STATE.CMD = "next player to act";
        send_SignalR(SERVER_STATE);
        return;
    }

    if (current_state.CMD == "request next hand") {
        new_round();
        SERVER_STATE.TO_CALL = SERVER_STATE.BIG_BLIND;
        SERVER_STATE.CMD = "start hand";
        send_SignalR(SERVER_STATE);
        if (number_of_active_players() < 3) {
            SERVER_STATE.TO_CALL = SERVER_STATE.SMALL_BLIND; //when only two players
        }
        else {
            SERVER_STATE.TO_CALL = SERVER_STATE.BIG_BLIND;
        }
        return;
    }

    if (current_state.CMD == "player action") {
        if (number_of_players_in_hand() < 2) { //only one player left so give them the pot
            handle_end_of_round();
            SERVER_STATE.CMD = "end of round";
            send_SignalR(SERVER_STATE);
        }

        //if the betting round is done figure out next step and tell player
        //no need to send client and action msg as current bettor is already correct and they are ready to act

        else if (betting_is_done()) {
            if ((all_all_in) || (number_of_active_players() < 2)) {
                deal_rest_of_hand();
                return;
            }
            reset_player_statuses(2);
            SERVER_STATE.TO_CALL = 0;
            if (SERVER_STATE.board[0] == "") {
                deal_flop();
                SERVER_STATE.CMD = "next player to act";
                SERVER_STATE.CMD_PARMS = "deal flop";
                send_SignalR(SERVER_STATE);
            }
            else if (SERVER_STATE.board[3] == "") {
                deal_fourth();
                SERVER_STATE.CMD = "next player to act";
                SERVER_STATE.CMD_PARMS = "deal fourth";
                send_SignalR(SERVER_STATE);
            }
            else if (SERVER_STATE.board[4] == "") {
                deal_fifth();
                SERVER_STATE.CMD = "next player to act";
                SERVER_STATE.CMD_PARMS = "deal fifth";
                send_SignalR(SERVER_STATE);
            }

            else {
                handle_end_of_round();
                SERVER_STATE.CMD = "end of round";
                send_SignalR(SERVER_STATE);
            }
        }
        else {
            //if the betting round is not over, figure out any current bet and ask next player to act
            SERVER_STATE.current_bettor_index = get_next_player_position(SERVER_STATE.current_bettor_index, 1);
            set_to_call();
            SERVER_STATE.CMD = "next player to act";
            SERVER_STATE.CMD_PARMS = "";
            send_SignalR(SERVER_STATE);
        }
    }
}

function deal_rest_of_hand() {
    if (SERVER_STATE.board[0] == "") {
        deal_flop();
        deal_fourth();
        deal_fifth();
    }
    else if (SERVER_STATE.board[3] == "") {
        deal_fourth();
        deal_fifth()
    }
    else if (SERVER_STATE.board[4] == "") {
        deal_fifth();
    }
    handle_end_of_round();
    SERVER_STATE.CMD = "end of round";
    send_SignalR(SERVER_STATE);
}

function send_game_response(response) {
    SERVER_STATE.CMD = "game response";
    SERVER_STATE.CMD_PARMS = response;
    send_SignalR(SERVER_STATE);
}

function send_SignalR(current_state) {
    current_state.SENDER = my_name;
    app.sendMessage(current_state);
    SERVER_STATE.CMD == "";
}

function rcv_SignalR(current_state) {
    msg_dispatch(current_state);
    cl_rcv_SignalR(current_state);
    SERVER_STATE.CMD == "";
}

