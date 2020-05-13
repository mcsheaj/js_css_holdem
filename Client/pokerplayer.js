"use strict";

var my_name = "";
var my_seat = 0;

var LOCAL_STATE = {
  SENDER: "",
  CMD: "",
  CMD_PARMS: "",
  NUM_ROUNDS: 0,
  TO_CALL: 0,
  STARTING_BANKROLL: 1000,
  SMALL_BLIND: 5,
  BIG_BLIND: 10,
  players: new Array(),
  board: new Array(),
  button_index: 0,
  current_bettor_index: 0,
  current_bet_amount: 0,
  current_total_bet: 0,
  current_min_raise: 0,
  global_pot_remainder: 0,
  last_raiser: -1
}

function cl_player (name, bankroll, totalbank, carda, cardb, status, total_bet, subtotal_bet) {
this.name = name;
this.bankroll = bankroll;
this.totalbank = totalbank;
this.carda = carda;
this.cardb = cardb;
this.status = status;
this.total_bet = total_bet;
this.subtotal_bet = subtotal_bet;
}

function cl_init() {
  document.querySelector('body').style.display='block';
  gui_hide_poker_table();
  gui_hide_log_window();
  gui_hide_setup_option_buttons();
  gui_hide_fold_call_click();
  gui_hide_betting_click();
  gui_hide_quick_raise();
  gui_hide_dealer_button();
  gui_hide_game_response();
  gui_initialize_theme_mode();
  gui_setup_option_buttons(cl_start_game,
    cl_away_func,
    cl_change_name,
    cl_help_func,
    cl_rebuy,
    gui_toggle_the_theme_mode);
  cl_new_game();
  cl_new_game_continues(); 
}

function cl_get_pot_size () {
  var p = 0;
  for (var i = 0; i < LOCAL_STATE.players.length; i++) {
    p += LOCAL_STATE.players[i].total_bet;//
  }
  p += LOCAL_STATE.global_pot_remainder;
  return p;
}

function cl_get_pot_size_html () {
  return "<font size=+2><b>" + cl_get_pot_size() + "</b></font>";
}

var spinBox;

function cl_get_action () {
  cl_get_my_seat();
  if ((LOCAL_STATE.current_bettor_index == my_seat) || (I_am_Host)) {
    if (LOCAL_STATE.current_bettor_index == my_seat) {
      var sound = new Audio('sounds/ding.wav');
      sound.play();
    }

    gui_hide_quick_raise ();
  
    var to_call = LOCAL_STATE.TO_CALL;
    if (to_call > LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].bankroll) {
      to_call = LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].bankroll;
    }
    var call_button_text = "Call " + (to_call/100).toFixed(2);
    var fold_button_text = "Fold";

    if (to_call == 0) {
      call_button_text = "Check";
      fold_button_text = 0;
    } 

    // enable fold and call buttons
    if (to_call) {
      gui_setup_fold_call_click(fold_button_text,
                                  call_button_text,
                                  cl_player_folds,
                                  cl_player_calls);
    }
    else{
      gui_setup_fold_call_click(fold_button_text,
                                call_button_text,
                                cl_player_folds,
                                cl_player_checks);
    }
    if (to_call) {
      gui_setup_betting_click("==> Raise", cl_handle_raise);
    }
    else {
      gui_setup_betting_click("==> Bet", cl_handle_raise);
    }
    //PUT SPINNER INPUT HERE
    var response = document.getElementById('quick-raises');

    var minCurrency, bankrollCurrency, stepCurrency;

    if (LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].bankroll <= LOCAL_STATE.TO_CALL) {
      internal_hide(response);
      gui_hide_betting_click();
    }
    else {
      minCurrency = (LOCAL_STATE.current_min_raise/100);
                          //(LOCAL_STATE.current_bet_amount/100) -
                          //(LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].subtotal_bet/100); 

      bankrollCurrency = (LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].bankroll/100) -
                              LOCAL_STATE.TO_CALL/100;

      stepCurrency = lowest_chip_amount/100;
      internal_show(response);
      
      spinBox = new SpinBox('quick-raises', 
            {'minimum' : minCurrency, 
            'maximum' : bankrollCurrency, 
            'value' : minCurrency,
            'step' : stepCurrency, 
            'decimals' : 2});
    }
  }
  else {
    gui_hide_fold_call_click();
    gui_hide_betting_click();
    gui_hide_quick_raise();
  }
} 

function cl_the_bet_function (player_index, bet_amount) {
  LOCAL_STATE.players[player_index].total_bet += (bet_amount - LOCAL_STATE.players[player_index].subtotal_bet);
  LOCAL_STATE.players[player_index].bankroll -= (bet_amount - LOCAL_STATE.players[player_index].subtotal_bet);
  LOCAL_STATE.players[player_index].subtotal_bet = bet_amount;

  //if player went all in with less then current bet amount then dont update bet amount
  //or min raise
  if (LOCAL_STATE.players[player_index].total_bet > LOCAL_STATE.current_bet_amount) {
    LOCAL_STATE.current_min_raise = LOCAL_STATE.players[player_index].total_bet - 
    LOCAL_STATE.current_bet_amount;
    LOCAL_STATE.current_bet_amount = LOCAL_STATE.players[player_index].total_bet;
  }
  return;
}

function cl_handle_raise () {          //call back from betting control
  var bet_amount = Number((spinBox.getValue().toFixed(2) * 100).toFixed(2)) + 
                    Number(LOCAL_STATE.TO_CALL) +
                    Number(LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].subtotal_bet);
  //need input value validation here
  if (bet_amount > LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].bankroll +
                    LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].subtotal_bet) {
    gui_write_game_response("<b><font size=+2>Bet is greater than your bankroll, get a clue!</b>");
    cl_get_action();
    return;
  }
  if (bet_amount < (LOCAL_STATE.TO_CALL)) {
    gui_write_game_response("<b><font size=+2>Bet is less than needed to call, get a grip!</b>");
    cl_get_action();
    return;
  }
  if (bet_amount % lowest_chip_amount) {
    gui_write_game_response("<b><font size=+2>Bet must be a multiple of " + lowest_chip_amount +
          ", get off the crack!</b>");
          cl_get_action();
          return;
  }
  cl_the_bet_function(LOCAL_STATE.current_bettor_index, bet_amount);
  gui_write_basic_general(cl_get_pot_size());
  LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].status = "RAISE";
  cl_write_player(LOCAL_STATE.current_bettor_index, 0, 0);
  gui_hide_quick_raise();
  gui_hide_fold_call_click();
  gui_hide_betting_click();
  gui_write_game_response("");
  set_current_total_bet();
  LOCAL_STATE.CMD = "player action";
  cl_send_SignalR(LOCAL_STATE);
}

function cl_player_folds() {
  LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].status = "FOLD";
  cl_write_player(LOCAL_STATE.current_bettor_index, 0, 0);
  gui_hide_fold_call_click();
  gui_hide_betting_click();
  gui_hide_quick_raise();
  gui_write_game_response("");
  LOCAL_STATE.CMD = "player action";
  cl_send_SignalR(LOCAL_STATE);
  //var buttons = document.getElementById('setup-options');
  internal_le_button(buttons,'away-button', cl_away_func);
  var seat = cl_get_my_seat();
  if (LOCAL_STATE.players[seat].bankroll < (LOCAL_STATE.STARTING_BANKROLL/4)) {
    internal_le_button(buttons,'rebuy-button', cl_rebuy);
  }
}

function cl_player_calls() {   //call back from betting control
  var to_call = LOCAL_STATE.TO_CALL;
  if (to_call > LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].bankroll) {
    to_call = LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].bankroll;
  }
  LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].bet_amount = to_call;
  LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].subtotal_bet += to_call;
  LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].bankroll -= to_call;
  LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].total_bet += to_call;
  LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].status = "CALL";
  cl_write_player(LOCAL_STATE.current_bettor_index, 0, 0);
  gui_write_basic_general(cl_get_pot_size());
  gui_hide_quick_raise();
  gui_hide_fold_call_click ();
  gui_hide_betting_click();
  gui_write_game_response("");
  set_current_total_bet();
  LOCAL_STATE.CMD = "player action";
  cl_send_SignalR(LOCAL_STATE);
}

function cl_player_checks() {          //call back from betting control
  gui_write_basic_general(cl_get_pot_size());
  if (LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].status != "OPTION") {
    LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].subtotal_bet = 0;
  }
  LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].bet_amount = 0;
  LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].status = "CHECK";
  //LOCAL_STATE.current_bet_amount = 0; 
  cl_write_player(LOCAL_STATE.current_bettor_index, 0, 0);
  gui_hide_fold_call_click();
  gui_hide_betting_click();
  gui_hide_quick_raise();
  gui_write_game_response("");
  set_current_total_bet();
  LOCAL_STATE.CMD = "player action";
  cl_send_SignalR(LOCAL_STATE);
}

function set_current_total_bet() {
  if (LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].total_bet > LOCAL_STATE.current_total_bet) {
    LOCAL_STATE.current_total_bet = LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].total_bet;
    LOCAL_STATE.last_raiser = LOCAL_STATE.current_bettor_index;
  }
}

function cl_new_game () {
  for (var n=0; n<LOCAL_STATE.players.length; n++){
    LOCAL_STATE.players[n].bankroll = LOCAL_STATE.STARTING_BANKROLL;
  }
  cl_initialize_game();
}

var cl_away = true;

function cl_away_func() {  //toggles status between AWAY and WAIT, WAIT will get changed to a playing status
                            //when a new hand is dealt
  var seat = cl_get_my_seat();
  var button = document.getElementById('away-button');
  if (cl_away) {
    button.innerHTML = "Press to Return"
    cl_away = false;
    LOCAL_STATE.players[seat].status = "AWAY";
  }
  else {
    button.innerHTML = "Press to Sit Out"
    cl_away = true;
    LOCAL_STATE.players[seat].status = "WAIT";
  }
  cl_write_player(seat,0,0);
  LOCAL_STATE.CMD = "update player status";
  cl_send_SignalR(LOCAL_STATE);
}

function cl_rebuy() {
  var seat = cl_get_my_seat();
  LOCAL_STATE.players[seat].bankroll += LOCAL_STATE.STARTING_BANKROLL;
  LOCAL_STATE.players[seat].totalbank += LOCAL_STATE.STARTING_BANKROLL;
  LOCAL_STATE.players[seat].status = "WAIT";
  //var buttons = document.getElementById('setup-options');
  internal_hide_le_button(buttons,'rebuy-button', cl_rebuy);
  LOCAL_STATE.CMD = "update player status";
  cl_send_SignalR(LOCAL_STATE);
}

function cl_new_game_continues (req_no_opponents) {
  cl_clear_player_cards(10);  //clear max number of players, it's easier this way, trust me
  cl_new_round();
}

function cl_new_round () {
  LOCAL_STATE.RUN_EM = 0;
  // Clear buttons
  if (LOCAL_STATE.players.length) { //hide sitting out button unless player is sitting out
    if (LOCAL_STATE.players[my_seat].status != "AWAY") {
      //var buttons = document.getElementById('setup-options');
      internal_hide_le_button(buttons,'away-button', cl_away_func);
      internal_hide_le_button(buttons,'rebuy-button', cl_rebuy);
    }
  }
  gui_hide_fold_call_click();
  gui_hide_betting_click();
  //cl_clear_bets();
  //cl_clear_pot();
  LOCAL_STATE.current_min_raise = LOCAL_STATE.BIG_BLIND;
  LOCAL_STATE.current_bet_amount = LOCAL_STATE.BIG_BLIND;
  cl_collect_cards();
 
  var i;
  for (i = 0; i < LOCAL_STATE.players.length; i++) {
    cl_write_player(i, 0, 0);
  }

  gui_clear_the_board(LOCAL_STATE.board);
  gui_hide_quick_raise();
  LOCAL_STATE.last_raiser = -1;
}

function cl_initialize_game () {
  gui_hide_poker_table();
  gui_hide_dealer_button();
  gui_hide_fold_call_click();
  gui_hide_betting_click();
  gui_show_poker_table();
}

function cl_clear_player_cards (count) {
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
             BG_HILITE + " onload='document.f.y.focus();'>" +
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

function cl_show_board() {
  for (var n = 0; n < 6; n++) {
    if (LOCAL_STATE.board[n]) {
      gui_lay_board_card(n, LOCAL_STATE.board[n]);
    }
  }
  for (n=0; n<3; n++) {
    //gui_burn_board_card([n], "");
  }
}

function cl_deal_flop() {
  cl_write_all_players();
  setTimeout(gui_burn_board_card, 500, 0, "blinded");
  setTimeout(gui_lay_board_card, 1000, 0, LOCAL_STATE.board[0]);
  setTimeout(gui_lay_board_card, 1500, 1, LOCAL_STATE.board[1]);
  setTimeout(gui_lay_board_card, 2000, 2, LOCAL_STATE.board[2]);
}

function cl_deal_fourth() {
  cl_write_all_players();
  setTimeout(gui_burn_board_card, 500, 1, "blinded");
  setTimeout(gui_lay_board_card, 1000, 3, LOCAL_STATE.board[3]);}

function cl_deal_fifth() {
  cl_write_all_players();
  setTimeout(gui_burn_board_card, 500, 2, "blinded");
  setTimeout(gui_lay_board_card, 1000, 4, LOCAL_STATE.board[4]);
}

function cl_get_my_seat() {
  for (var n = 0; n < LOCAL_STATE.players.length; n++) {
    if (LOCAL_STATE.players[n].name == my_name) {
      my_seat = n;
      break;
    }
  }
  return my_seat;
}

function cl_help_func () {
  var help_text = "Straight Flush\n" +
  "Four of a Kind\n" +
  "Full House\n" +
  "Flush\n" +
  "Straight\n" +
  "Three of a Kind\n" +
  "Two Pair\n" +
  "One Pair\n" +
  "High Card\n" +
  "Leigh Anne Flush\n" +
  "Leigh Anne Straight\n" +
  "*Need to ask Leigh Anne if the 5th card kicker is relevant\n\n";

  if (LOCAL_STATE.players.length) {
    help_text += "Let's Talk Bank: (current bets not accounted for during a hand)\n\n";
    for (var n=0; n<LOCAL_STATE.players.length; n++) {
      help_text += LOCAL_STATE.players[n].name + "'s current winnings $" + 
                ((LOCAL_STATE.players[n].bankroll - LOCAL_STATE.players[n].totalbank)/100).toFixed(2) + "\n";
    }
  }
  window.alert(help_text);
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
    setLocalStorage("playername", my_name);
    cl_send_new_player(my_name);
  }
  //var buttons = document.getElementById('setup-options');
  internal_le_button(buttons,'away-button', cl_away_func);
}

function cl_clear_pot () {
  for (var i = 0; i < LOCAL_STATE.players.length; i++) {
    LOCAL_STATE.players[i].total_bet = 0;
  }
}

function cl_collect_cards () {
  LOCAL_STATE.board = new Array(6);
   
  for (var i = 0; i < 5; i++) {
    LOCAL_STATE.board[i] = "";
    gui_lay_board_card(i, LOCAL_STATE.board[i]);     // Clear the board
  }
  for (i = 0; i < 3; i++) {
    LOCAL_STATE.board[i] = "";
    gui_burn_board_card(i, LOCAL_STATE.board[i]);
  }
}

function cl_has_money (i) {
  if (LOCAL_STATE.players[i].bankroll >= 0.01) {
    return true;
  }
  return false;
}

function cl_check_for_busts() {
  for (var n=0; n<LOCAL_STATE.players.length; n++) {
    if (LOCAL_STATE.players[n].bankroll == 0) {
      LOCAL_STATE.players[n].status = "BUST";
    }
  }
}

function cl_write_player (n, hilite, show_cards) {
  var carda = "";
  var cardb = "";
  var name_background_color = "";
  var name_font_color = "";
  if (hilite == 1) {            // Current
    name_background_color = BG_HILITE;
    name_font_color = 'black';
  } else if (hilite == 2) {       // Winner
    name_background_color = 'red';
  }
  if (LOCAL_STATE.players[n].status == "FOLD") {
    name_font_color = 'black';
    name_background_color = 'gray';
  }
  if ((LOCAL_STATE.players[n].status == "BUST") || (LOCAL_STATE.players[n].status == "WAIT")
                                                || (LOCAL_STATE.players[n].status == "AWAY")){
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
    if (show_cards && LOCAL_STATE.players[n].status != "FOLD") { 
      cardb = LOCAL_STATE.players[n].cardb;
    }
  }
  if (n == LOCAL_STATE.button_index) {
    gui_place_dealer_button(n);
  }
  var bet_text = "TO BE OVERWRITTEN";

  if (LOCAL_STATE.players[n].status == "FOLD") {
    bet_text = "FOLDED ($" +
               (LOCAL_STATE.players[n].total_bet/100).toFixed(2) + ")";
    } else if ((LOCAL_STATE.players[n].status == "BUST")){
    bet_text = "BUSTED";
    } else if (!cl_has_money(n)) {
    bet_text = "ALL IN " + (LOCAL_STATE.players[n].subtotal_bet/100).toFixed(2) + " ($" +
               (LOCAL_STATE.players[n].total_bet/100).toFixed(2) + ")";
    } else {
    bet_text = LOCAL_STATE.players[n].status + " $" + (LOCAL_STATE.players[n].subtotal_bet/100).toFixed(2) +
               " ($" + (LOCAL_STATE.players[n].total_bet/100).toFixed(2) + ")";
  }
  if (LOCAL_STATE.players[n].status == "CHECK") {
    bet_text = "Check" + " ($" + (LOCAL_STATE.players[n].total_bet/100).toFixed(2) + ")";
  }

  gui_set_player_name(LOCAL_STATE.players[n].name, n);    // offset 1 on seat-index
  gui_set_bet(bet_text, n);
  gui_set_bankroll((LOCAL_STATE.players[n].bankroll/100).toFixed(2), n);
  
  //show winner and last raiser cards
  if ((LOCAL_STATE.players[n].status == "WIN") || (LOCAL_STATE.players[n].status == "SHOW")) {
    gui_set_player_cards(carda, cardb, n, show_folded);
    return;
  }//unless no showdown
  if (LOCAL_STATE.players[n].status == "NOSHOW") {
    gui_set_player_cards("blinded", "blinded", n, show_folded);
  }
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

    //gui_set_player_cards(carda, cardb, n, show_folded);  //get rid of this to hide other players cards*****************
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
    if ((LOCAL_STATE.players[n].status == "WIN") || (LOCAL_STATE.players[n].status == "NOSHOW")){ 
      cl_write_player(n, 2, 0);
    }
  }
}



//HANDLE incoming message from server
function cl_msg_dispatch () {

  if (LOCAL_STATE.CMD == "new player added") {
    cl_write_all_players();
    //to work correctly this needs to recover and draw current state of things
    gui_write_basic_general(LOCAL_STATE.current_bet_amount);
    return;
  }
  
  else if (LOCAL_STATE.CMD == "game response") {
    gui_write_game_response("<font size=+2><b>" + LOCAL_STATE.CMD_PARMS + "</b></font>");
  }

  else if (LOCAL_STATE.CMD == "update player status") {
    cl_write_all_players();
  }

  else if ((LOCAL_STATE.CMD == "start hand") || (LOCAL_STATE.CMD == "request next hand") ||
            (LOCAL_STATE.CMD == "request new game")) {
    cl_new_round();
    //cl_show_board();
    gui_place_dealer_button(LOCAL_STATE.button_index);
    cl_write_all_players();
    LOCAL_STATE.CMD = "next player to act";
  }

  if (LOCAL_STATE.CMD == "next player to act") {
    cl_write_all_players();
    //cl_show_board();
    cl_get_action();
    cl_write_player(LOCAL_STATE.current_bettor_index, 1, 0);
    gui_write_basic_general(cl_get_pot_size());
    gui_write_game_response("<font size=+2><b>Next to Act: " + 
                        LOCAL_STATE.players[LOCAL_STATE.current_bettor_index].name);
    if (LOCAL_STATE.CMD_PARMS == "deal flop") {
      cl_deal_flop();
    }
    else if (LOCAL_STATE.CMD_PARMS == "deal fourth") {
      cl_deal_fourth();
    }
    else if (LOCAL_STATE.CMD_PARMS == "deal fifth") {
      cl_deal_fifth();
    }
  }
  else if (LOCAL_STATE.CMD == "end of round") {
    cl_deal_flop();
    setTimeout(cl_deal_fourth,2000);
    setTimeout(cl_deal_fifth,2500);
    gui_hide_quick_raise();
    gui_hide_fold_call_click ();
    gui_hide_betting_click();
    cl_check_for_busts();
    for (var n=0; n<LOCAL_STATE.players.length; n++) { //show cards if player made last raise
      if ((n == LOCAL_STATE.last_raiser) && (LOCAL_STATE.players[n].status != "WIN")  &&
                                            (LOCAL_STATE.players[n].status != "NOSHOW")) {
        LOCAL_STATE.players[n].status = "SHOW";
      }
    }
    cl_write_all_players();
    setTimeout(gui_write_game_response, 2500, LOCAL_STATE.CMD_PARMS);
    var sound = new Audio('sounds/tada.wav');
    sound.play();
    //var buttons = document.getElementById('setup-options');
    internal_le_button(buttons,'away-button', cl_away_func);
    var seat = cl_get_my_seat();
    if ((LOCAL_STATE.players[seat].bankroll < (LOCAL_STATE.STARTING_BANKROLL/4)) ||
        (LOCAL_STATE.players[seat].status == "BUST")) {
      internal_le_button(buttons,'rebuy-button', cl_rebuy);
    }
    if (I_am_Host) {
      //var buttons = document.getElementById('setup-options');
      setTimeout(internal_le_button, 5000, buttons, 'deal-button', cl_request_next_hand);
      var accounting = 0;
      for (var n=0; n<LOCAL_STATE.players.length; n++) {
        accounting += 
          LOCAL_STATE.players[n].bankroll - LOCAL_STATE.players[n].totalbank + LOCAL_STATE.global_pot_remainder;
      }
      if (accounting) {
        window.alert("House account is off by $" + (accounting/100).toFixed(2));
      }
    }
  }
}

//Outgoing msg functions
function cl_send_new_player(name) {
  //app.init();
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
  cl_new_game();
  gui_setup_option_buttons(cl_request_next_hand,
    cl_away_func,
    cl_change_name,
    cl_help_func,
    cl_rebuy,
    gui_toggle_the_theme_mode);
  //var buttons = document.getElementById('setup-options'); //this looks stupid, it is stupid, but I 
  internal_hide_le_button(buttons, 'deal-button');        //don't feel like making the gui code work correctly
}

function cl_request_next_hand() {
  //var buttons = document.getElementById('setup-options');
  internal_hide_le_button(buttons, 'deal-button');
  LOCAL_STATE.CMD = "request next hand";
  cl_send_SignalR(LOCAL_STATE);
}

function cl_send_SignalR(current_state) {
  current_state.SENDER = my_name;
  app.sendMessage(current_state);
}

function cl_rcv_SignalR(current_state) {
  if (current_state.CMD != "add new player") {
    LOCAL_STATE = current_state;
  }
  cl_msg_dispatch();
}
