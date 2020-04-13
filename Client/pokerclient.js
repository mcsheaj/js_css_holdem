"use strict";

var my_name = "";
var my_seat = 0;




var LOCAL_STATE = {
  CMD: "",
  CMD_PARMS: "",
  NUM_ROUNDS: 0,
  TO_CALL: 0,
  STARTING_BANKROLL: 10.00,
  SMALL_BLIND: 0,
  BIG_BLIND: 0,
  BG_HILITE: 'gold',
  cards: new Array(52),
  players: new Array(),
  board: new Array(),
  deck_index: 0,
  button_index: 0,
  current_bettor_index: 0,
  current_bet_amount: 0,
  current_total_bet: 0,
  current_min_raise: 0,
  current_pot: 0
}

function cl_player (name, bankroll, carda, cardb, status, total_bet,
  subtotal_bet) {
this.name = name;
this.bankroll = bankroll;
this.carda = carda;
this.cardb = cardb;
this.status = status;
this.total_bet = total_bet;
this.subtotal_bet = subtotal_bet;
}

function cl_init() {
  gui_hide_poker_table();
  gui_hide_log_window();
  gui_hide_setup_option_buttons();
  gui_hide_fold_call_click();
  gui_hide_quick_raise();
  gui_hide_dealer_button();
  gui_hide_game_response();
  gui_initialize_theme_mode();
  cl_new_game();
  cl_new_game_continues(); 
}

function cl_get_pot_size () {
  var p = 0;
  for (var i = 0; i < LOCAL_STATE.players.length; i++) {
    p += LOCAL_STATE.players[i].total_bet;//
  }
  //p += global_pot_remainder;
  return p.toFixed(2);
}

function cl_get_pot_size_html () {
  return "<font size=+2><b>" + cl_get_pot_size() + "</b></font>";
}

function cl_get_action () {
  gui_hide_quick_raise ();
  
  var to_call = LOCAL_STATE.TO_CALL;
  var call_button_text = "<u>C</u>all " + to_call.toFixed(2);
  var fold_button_text = "<u>F</u>old";

  if (to_call > LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].bankroll) {   //*************************
    to_call = LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].bankroll;       //*************************
  }
  var that_is_not_the_key_you_are_looking_for;
  if (to_call == 0) {
    call_button_text = "<u>C</u>heck";
    fold_button_text = 0;
  } 

  // enable fold and call the buttons
  if (to_call) {
    //LOCAL_STATE.current_bet_amount = to_call;
    gui_setup_fold_call_click(fold_button_text,
                              call_button_text,
                              cl_player_folds,
                              cl_player_calls);
  }
  else {
    gui_setup_fold_call_click(fold_button_text,
                              call_button_text,
                              cl_player_folds,
                              cl_player_checks);
  }

  var quick_values = new Array(5);

  var next_raise;
  for (var i = 0; i < 5; i++) {
    next_raise = LOCAL_STATE.current_min_raise * (i + 1);
    if (next_raise < LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].bankroll) {
      quick_values[i] = next_raise;
    }
  }
  var bet_or_raise = "Bet";
  if (to_call > 0) {
    bet_or_raise = "Raise";
  }
  var quick_bets = "<b>Quick " + bet_or_raise + "s</b><br>";
  for (i = 0; i < 6; i++) {
    if (quick_values[i]) {
      quick_bets += "<a href='javascript:parent.cl_handle_raise(" +
                    (quick_values[i] + to_call) + ")'>" + quick_values[i].toFixed(2) + "</a>" +
                    "&nbsp;&nbsp;&nbsp;";
    }
  }
  quick_bets += "<a href='javascript:parent.cl_handle_raise(" +
                LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].bankroll.toFixed(2) + ")'>All In!</a>";
  var html9 = "<td><table align=center><tr><td align=center>";
  var html10 = quick_bets +
               "</td></tr></table></td></tr></table></body></html>";
  gui_write_quick_raise(html9 + html10);

  var hi_lite_color = gui_get_theme_mode_highlite_color();
  var message = "";
     
  if (to_call){
    message = "<tr><td><font size=+2><b>Current raise: " +
                LOCAL_STATE.current_bet_amount.toFixed(2) + 
                "</b><br> You need <font color=" + hi_lite_color +
                " size=+3>" + to_call.toFixed(2) +
                "</font> more to call.<br>" +
                LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].name + ", it's your turn." +
                "</font></td></tr>";
  } 
  else {
    message = "<tr><td><font size=+2>" + LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].name + ", you are next to act." +
                "</font></td></tr>";  
  }
  gui_write_game_response(message);
} 

function cl_the_bet_function (player_index, bet_amount) {
  if (bet_amount == LOCAL_STATE.current_bet_amount){
    //huh  LOCAL_STATE.players[my_seat].status = "CALL";
  }
  LOCAL_STATE.current_bet_amount = bet_amount; 
  LOCAL_STATE.current_min_raise = LOCAL_STATE.current_bet_amount;
  
  LOCAL_STATE.players[player_index].subtotal_bet = bet_amount;
  LOCAL_STATE.players[player_index].total_bet += bet_amount;
  LOCAL_STATE.players[player_index].bankroll -= bet_amount;
  return;
}

function cl_handle_raise (bet_amount) {
  cl_the_bet_function(LOCAL_STATE.current_bettor_index, bet_amount);
  gui_write_basic_general(cl_get_pot_size());
  LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].status = "RAISE";
  cl_write_player(LOCAL_STATE.current_bettor_index, 0, 0);
  gui_hide_quick_raise();
  gui_hide_fold_call_click ();
  gui_write_game_response("");
  //LOCAL_STATE.current_total_bet = LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].total_bet;
  set_current_total_bet();
  LOCAL_STATE.CMD = "player action";
  cl_send_SignalR(LOCAL_STATE);
}
function cl_player_folds() {
  LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].status = "FOLD";
  cl_write_player(LOCAL_STATE.current_bettor_index, 0, 0);
  gui_hide_fold_call_click();
  gui_hide_quick_raise();
  gui_write_game_response("");
  LOCAL_STATE.CMD = "player action";
  cl_send_SignalR(LOCAL_STATE);
}

function cl_player_calls() {
  //var to_call = LOCAL_STATE.current_bet_amount - LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].subtotal_bet;
  var to_call = LOCAL_STATE.TO_CALL;
  LOCAL_STATE.current_pot += to_call;
  LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].bet_amount = to_call;
  LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].subtotal_bet += to_call;
  LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].bankroll -= to_call;
  LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].total_bet += to_call;
  LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].status = "CALL";
  cl_write_player(LOCAL_STATE.current_bettor_index, 0, 0);
  gui_write_basic_general(cl_get_pot_size());
  gui_hide_quick_raise();
  gui_hide_fold_call_click ();
  gui_write_game_response("");
  //LOCAL_STATE.current_total_bet = LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].total_bet;
  set_current_total_bet();
  LOCAL_STATE.CMD = "player action";
  cl_send_SignalR(LOCAL_STATE);
}

function cl_player_checks() {
  gui_write_basic_general(cl_get_pot_size());
  LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].bet_amount = 0;
  LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].status = "CHECK";
  cl_write_player(LOCAL_STATE.current_bettor_index, 0, 0);
  gui_hide_fold_call_click();
  gui_hide_quick_raise();
  gui_write_game_response("");
  //LOCAL_STATE.current_total_bet = LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].total_bet;
  set_current_total_bet();
  LOCAL_STATE.CMD = "player action";
  cl_send_SignalR(LOCAL_STATE);
}

function set_current_total_bet() {
  if (LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].total_bet > LOCAL_STATE.current_total_bet) {
    LOCAL_STATE.current_total_bet = LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].total_bet;
  }
}

function cl_new_game () {
  cl_initialize_game();
  gui_setup_option_buttons(cl_start_game,
    cl_change_name,
    cl_help_func,
    cl_request_next_hand,
    gui_toggle_the_theme_mode);
}

function cl_new_game_continues (req_no_opponents) {
  cl_clear_player_cards(10);  //clear max number of players, it's easier this way, trust me
  //cl_reset_player_statuses(0); 
  //cl_clear_bets();
  cl_new_round();
}

function cl_new_round () {
  LOCAL_STATE.RUN_EM = 0;
  // Clear buttons
  gui_hide_fold_call_click();

  cl_reset_player_statuses(1);
  cl_clear_bets();
  cl_clear_pot();
  LOCAL_STATE.current_min_raise = 0;
  cl_collect_cards();
 
  var i;
  for (i = 0; i < LOCAL_STATE.players.length; i++) {
    cl_write_player(i, 0, 0);
  }

  gui_clear_the_board(LOCAL_STATE.board);
  gui_hide_quick_raise();
}

function cl_initialize_game () {
  gui_hide_poker_table();
  gui_hide_dealer_button();
  gui_hide_fold_call_click();
  gui_show_poker_table();
}

function cl_clear_player_cards (count) {
  count = count; // Count that human too
  for (var pl = 0; pl < count; ++pl) {
    gui_set_player_cards("", "", pl);
    gui_set_player_name("", pl);
    gui_set_bet("", pl);
  }
}

function cl_leave_pseudo_alert () {
  gui_write_modal_box("");
}

function cl_my_pseudo_alert (text) {
  var html = "<html><body topmargin=2 bottommargin=0 bgcolor=" +
             LOCAL_STATE.BG_HILITE + " onload='document.f.y.focus();'>" +
             "<font size=+2>" + text +
             "</font><form name=f><input name=y type=button value='  OK  ' " +
             "onclick='parent.cl_leave_pseudo_alert()'></form></body></html>";
  gui_write_modal_box(html);
}


function cl_clear_bets () {
  for (var i = 0; i < LOCAL_STATE.players.length; i++) {
  }
  LOCAL_STATE.current_bet_amount = 0;
}

function cl_deal_flop() {
  cl_reset_player_statuses(2);
  cl_write_all_players();
  gui_burn_board_card(0, "blinded");
  gui_lay_board_card(0, LOCAL_STATE.board[0]);
  gui_lay_board_card(1, LOCAL_STATE.board[1]);
  gui_lay_board_card(2, LOCAL_STATE.board[2]);
}

function cl_deal_fourth() {
  cl_reset_player_statuses(2);
  cl_write_all_players();
  gui_burn_board_card(1, "blinded");
  gui_lay_board_card(3, LOCAL_STATE.board[3]);
}

function cl_deal_fifth() {
  cl_reset_player_statuses(2);
  cl_write_all_players();
  gui_burn_board_card(2, "blinded");
  gui_lay_board_card(4, LOCAL_STATE.board[4]);
}

function cl_get_my_seat() {
  my_seat = LOCAL_STATE.current_bettor_index; //need to lookup in players array but for no so I can play all players
}


function cl_help_func () {
  // Open help.html
  window.open('help.html'); //window.location.href = 
}

function cl_change_name () {
  my_name = prompt("What is your name? (14 characters or less)", getLocalStorage("playername"));
  if (my_name) {
    if (my_name.length > 14) {
      cl_my_pseudo_alert("Name must be less than 14 characters");
      my_name = "";
      return;
    }
  }
  if (my_name){
//SERVERMSG here with new player name
  setLocalStorage("playername", my_name);
  }
  cl_send_new_player(my_name);
}

function cl_reset_player_statuses (type) {
  for (var i = 0; i < LOCAL_STATE.players.length; i++) {
    if (type == 0) {
      LOCAL_STATE.players[i].status = "";
    } else if (type == 1 && LOCAL_STATE.players[i].status != "BUST") {
      LOCAL_STATE.players[i].status = "";
    } else if (type == 2 &&
               LOCAL_STATE.players[i].status != "FOLD" &&
               LOCAL_STATE.players[i].status != "BUST") {
      LOCAL_STATE.players[i].status = "";
    }
  }
}

function cl_clear_pot () {
  for (var i = 0; i < LOCAL_STATE.players.length; i++) {
    LOCAL_STATE.players[i].total_bet = 0;
  }
}

function cl_collect_cards () {
  LOCAL_STATE.board = new Array(6);
  for (var i = 0; i < LOCAL_STATE.players.length; i++) {
    LOCAL_STATE.players[i].carda = "";
    LOCAL_STATE.players[i].cardb = "";
  }
}

function cl_has_money (i) {
  if (LOCAL_STATE.players[i].bankroll >= 0.01) {
    return true;
  }
  return false;
}

function cl_write_player (n, hilite, show_cards) {
  var carda = "";
  var cardb = "";
  var name_background_color = "";
  var name_font_color = "";
  if (hilite == 1) {            // Current
    name_background_color = LOCAL_STATE.BG_HILITE;
    name_font_color = 'black';
  } else if (hilite == 2) {       // Winner
    name_background_color = 'red';
  }
  if (LOCAL_STATE.players[n].status == "FOLD") {
    name_font_color = 'black';
    name_background_color = 'gray';
  }
  if (LOCAL_STATE.players[n].status == "BUST") {
    name_font_color = 'white';
    name_background_color = 'black';
  }
  gui_hilite_player(name_background_color, name_font_color, n);

  var show_folded = false;  
  show_cards = 1; 

  if (LOCAL_STATE.players[n].carda) {
    if (LOCAL_STATE.players[n].status == "FOLD") {
      carda = "";
      show_folded = true;
    } else {
      carda = "blinded";
    }
    if (show_cards && LOCAL_STATE.players[n].status != "FOLD") {
      carda = LOCAL_STATE.players[n].carda;
    }
  }
  
  if (LOCAL_STATE.players[n].cardb) {
    if (LOCAL_STATE.players[n].status == "FOLD") {
      cardb = "";
      show_folded = true;
    } else {
      cardb = "blinded";
    }
    if (show_cards && LOCAL_STATE.players[n].status != "FOLD") {  //some twisted logic here, figure it out
      cardb = LOCAL_STATE.players[n].cardb;
    }
  }
  if (n == LOCAL_STATE.button_index) {
    gui_place_dealer_button(n);
  }
  var bet_text = "TO BE OVERWRITTEN";
  var allin = "Bet:";

  if (LOCAL_STATE.players[n].status == "CALL") {
    allin = "Called:";
  }
  if (LOCAL_STATE.players[n].status == "FOLD") {
    bet_text = "FOLDED ($" +
               LOCAL_STATE.players[n].total_bet.toFixed(2) + ")";
    } else if (LOCAL_STATE.players[n].status == "BUST") {
    bet_text = "BUSTED";
    } else if (!cl_has_money(n)) {
    bet_text = "ALL IN " + LOCAL_STATE.players[n].subtotal_bet.toFixed(2) + " ($" +
               LOCAL_STATE.players[n].total_bet.toFixed(2) + ")";
    } else {
    bet_text = LOCAL_STATE.players[n].status + " $" + LOCAL_STATE.players[n].subtotal_bet.toFixed(2) +
               " ($" + LOCAL_STATE.players[n].total_bet.toFixed(2) + ")";
  }
  if (LOCAL_STATE.players[n].status == "CHECK") {
    bet_text = "Check" + " ($" + LOCAL_STATE.players[n].total_bet.toFixed(2) + ")";
  }

  gui_set_player_name(LOCAL_STATE.players[n].name, n);    // offset 1 on seat-index
  gui_set_bet(bet_text, n);
  gui_set_bankroll(LOCAL_STATE.players[n].bankroll.toFixed(2), n);
  
  //only show cards for my seat, back of cards for all others
  if (LOCAL_STATE.players[n].name == my_name) {
    gui_set_player_cards(carda, cardb, n, show_folded);
  }
  else {
    if (carda != "") {
      gui_set_player_cards("blinded", "blinded", n, show_folded);
    }
    else {
      gui_set_player_cards("", "", n, show_folded);
    }
  }
}

function cl_write_all_players() {
  for (var n=0; n<LOCAL_STATE.players.length; n++) {
    if (LOCAL_STATE.current_bettor_index !=n) {
      cl_write_player(n, 0, 0);
    }
    else {
      cl_write_player(n, 1, 0);
    }
  }
}

//INTERACT WITH SERVER


//STUB for eventual SIGNALR receive, currently is is called when a button is pressed
function cl_rcv_SignalR(current_state) {
  LOCAL_STATE = current_state;
  cl_msg_dispatch();
}

//HANDLE incoming message from server
function cl_msg_dispatch () {

  if (LOCAL_STATE.CMD == "new player added") {
    for (var i = 0; i < LOCAL_STATE.players.length; i++) {
      cl_write_player(i, 0, 0);
    }
  }
  else if (LOCAL_STATE.CMD == "game response") {
    gui_write_game_response("<font size=+2><b>" + LOCAL_STATE.CMD_PARMS + "</b></font>");
  }

  else if (LOCAL_STATE.CMD == "start hand") {
    gui_place_dealer_button(LOCAL_STATE.button_index);
    cl_write_all_players();
  }

  else if (LOCAL_STATE.CMD == "next player to act") {
    cl_write_all_players();
    //LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].status = "";
    cl_get_action();
    cl_write_player(LOCAL_STATE.current_bettor_index, 1, 0);
    gui_write_basic_general(cl_get_pot_size());
    gui_write_game_response("next to act is seat " + LOCAL_STATE.current_bettor_index);
  }

  else if (LOCAL_STATE.CMD == "deal flop") {
    cl_write_all_players();
    //LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].status = "";
    cl_get_action();
    cl_write_player(LOCAL_STATE.current_bettor_index, 1, 0);
    gui_write_basic_general(cl_get_pot_size());
    cl_deal_flop();
  }

  else if (LOCAL_STATE.CMD == "deal fourth") {
    cl_get_action();
    cl_write_player(LOCAL_STATE.current_bettor_index, 1, 0);
    gui_write_basic_general(cl_get_pot_size());
    cl_deal_fourth();
  }

  else if (LOCAL_STATE.CMD == "deal fifth") {
    cl_get_action();
    cl_write_player(LOCAL_STATE.current_bettor_index, 1, 0);
    gui_write_basic_general(cl_get_pot_size());
    cl_deal_fifth();
  }
  
}


//send SignalR msg to server -- for now just calls server function directly
function cl_send_SignalR(current_state) {
  rcv_SignalR(current_state); //for testing with local server
}

//Outgoing msg functions
function cl_send_new_player(name) {
  LOCAL_STATE.CMD = "add new player";
  LOCAL_STATE.CMD_PARMS = name;
  cl_send_SignalR(LOCAL_STATE);
}


//these are client action handlers that send msgs to server
function cl_start_game() {
  if (LOCAL_STATE.players.length < 2) {
    gui_write_game_response("<font size=+2><b>Need at lease 2 players to start new game</b></font>");
    return;
  }
  LOCAL_STATE.CMD = "request new game";
  cl_send_SignalR(LOCAL_STATE);
  gui_write_game_response("<font size=+2><b>New game started, player seats randomly assigned, GOOD LUCK everyone!</b></font>");
  var buttons = document.getElementById('setup-options');
  cl_get_my_seat();
  internal_hide_le_button(buttons, 'new-game-button');
}

function cl_request_next_hand() {
  LOCAL_STATE.CMD = "request next hand";
  cl_send_SignalR(LOCAL_STATE);
}

/*
  new_round(); LOCAL_STATE.CMD = "start new hand";  //just playing, remove this

  if (LOCAL_STATE.CMD == "setup new player") {
    for (var i = 0; i < LOCAL_STATE.players.length; i++) {
        cl_write_player(i, 0, 0);
    }
  }

  if (STATE.CMD == "start new hand") { //msg from server inc current dealer, this players hole cards, and pot size
    gui_place_dealer_button(LOCAL_STATE.button_index);
    cl_write_all_players();
    //gui_write_basic_general(cl_get_pot_size());  //just the blinds obviously
  } 

  if (STATE.CMD == "next player to act") {  //highlights next player and enables betting controls
      cl_write_player(LOCAL_STATE.current_bettor_index, 1, 1);
      gui_write_basic_general(cl_get_pot_size());
  }

  if (STATE.CMD == "player action") { 
    cl_write_player(LOCAL_STATE.current_bettor_index, 0, 0);
    gui_write_basic_general(cl_get_pot_size());
  }

  if (STATE.CMD == "my action") { 
    LOCAL_STATE.players[my_seat].status = "";
    cl_get_my_action();
    cl_write_player(LOCAL_STATE.current_bettor_index, 0, 0);
    gui_write_basic_general(cl_get_pot_size());
  }

  if (STATE.CMD == "lay flop") {
      cl_reset_player_statuses(2);
      cl_write_all_players();
      gui_burn_board_card(0, "blinded");
      gui_lay_board_card(0, LOCAL_STATE.board[0]);
      gui_lay_board_card(1, LOCAL_STATE.board[1]);
      gui_lay_board_card(2, LOCAL_STATE.board[2]);
  }

  if (STATE.CMD == "lay turn") {
    cl_write_all_players();
    gui_burn_board_card(1, "blinded");
    gui_lay_board_card(3, LOCAL_STATE.board[3]);
  }

  if (STATE.CMD == "lay river") {
    cl_write_all_players();
    gui_burn_board_card(2, "blinded");
    gui_lay_board_card(4, LOCAL_STATE.board[4]);
  }

  if (STATE.CMD == "hand complete") {
    gui_write_game_response(STATE.winning_hand_text)
  }

  STATE.CMD = "";
}
*/
