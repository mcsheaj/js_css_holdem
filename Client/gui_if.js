"use strict";

var buttons = null;

//  --- Not in the interface ---

function getLocalStorage (key) {
  return localStorage.getItem(key);
}

function setLocalStorage (key, value) {
  return localStorage.setItem(key, value);
}

function internal_get_a_class_named (curr, searched_name) {
  return curr.querySelector(searched_name);
}

function internal_FixTheRanking (rank) {
  var ret_rank = 'NoRank';
  if (rank === 14) {
    ret_rank = 'ace';
  } else if (rank === 13) {
    ret_rank = 'king';
  } else if (rank === 12) {
    ret_rank = 'queen';
  } else if (rank === 11) {
    ret_rank = 'jack';
  } else if (rank > 0 && rank < 11) {
    // Normal card 1 - 10
    ret_rank = rank;
  } else {
    console.log(typeof rank);
    alert('Unknown rank ' + rank);
  }
  return ret_rank;
}

function internal_FixTheSuiting (suit) {
  if (suit === 'c') {
    suit = 'clubs';
  } else if (suit === 'd') {
    suit = 'diamonds';
  } else if (suit === 'h') {
    suit = 'hearts';
  } else if (suit === 's') {
    suit = 'spades';
  } else {
    alert('Unknown suit ' + suit);
    suit = 'yourself';
  }
  return suit;
}

function internal_GetCardImageUrl (card) {
  var suit = card.substring(0, 1);
  var rank = parseInt(card.substring(1));
  rank = internal_FixTheRanking(rank); // 14 -> 'ace' etc
  suit = internal_FixTheSuiting(suit); // c  -> 'clubs' etc

  return "url('images/" + rank + "_of_" + suit + ".png')";
}

function internal_setBackground (diva, image, opacity) {
  var komage = diva.style;
  if(image === "url('')") {
    komage.opacity = 0;
  }
  else {
    komage.opacity = opacity;
  }
  komage['background-image'] = image;
}

function internal_setCard (diva, card, folded) {
  // card may be "" -> do not show card
  //             "blinded" -> show back
  //             "s14" -> show ace of spades
  var image;
  var opacity = 1.0;

  if (typeof card === 'undefined') {
    alert('Undefined card ' + card);
    image = "url('')";   
  } else if (card === "") {
    image = "url('')";
  } else if (card === "blinded") {
    image = "url('images/_cardback.png')";
  } else {
    if (folded) {
      opacity = 0.5;
    }
    image = internal_GetCardImageUrl(card);
  }
  internal_setBackground(diva, image, opacity);
}

function internal_hide(elem) {
    elem.classList.add("hidden");
    elem.classList.remove("shown");
}

function internal_show(elem) {
  elem.classList.add("shown");
  elem.classList.remove("hidden");
}

function internal_clickin_helper (button, button_text, func_on_click) {
  if (button_text === 0) {
    internal_hide(button);
  } 
  else {
    var label = button.querySelector(".button-text");
    if(label) {
       label.innerHTML = button_text;
    }
    else {
      button.innerHTML = button_text;
    }
    button.onclick = func_on_click;
    internal_show(button);
  }
}

//  --- here is the GUI stuff ---

function gui_hide_poker_table () {
  var table = document.getElementById('poker_table');
  internal_hide(table);
}

function gui_show_poker_table () {
  var table = document.getElementById('poker_table');
  internal_show(table);
}

function gui_set_player_name (name, seat) {
  var table = document.getElementById('poker_table');
  var current = 'seat' + seat;
  var seatloc = document.getElementById(current);
  var chipsdiv = internal_get_a_class_named(seatloc, '.name-chips');
  var namediv = internal_get_a_class_named(chipsdiv, '.player-name');
  if (name === "") {
    internal_hide(seatloc);
  } else {
    internal_show(seatloc);
  }
  namediv.textContent = name;
}

function gui_hilite_player (hilite_color, name_color, seat) {
  var table = document.getElementById('poker_table');
  var current = 'seat' + seat;
  var seatloc = document.getElementById(current);
  var chipsdiv = internal_get_a_class_named(seatloc, '.name-chips');
  //  var chipsdiv = seatloc.getElementById('name-chips');
  var namediv = internal_get_a_class_named(chipsdiv, '.player-name');
  if (name_color === "") {
    namediv.style.color = chipsdiv.style.color;
  } else {
    namediv.style.color = name_color;
  }
  if (hilite_color === "") {
    namediv.style.backgroundColor = chipsdiv.style.backgroundColor;
  } else {
    namediv.style.backgroundColor = hilite_color;
  }
}

function gui_set_bankroll (amount, seat) {
  var table = document.getElementById('poker_table');
  var current = 'seat' + seat;
  var seatloc = document.getElementById(current);
  var chipsdiv = internal_get_a_class_named(seatloc, '.name-chips');
    //var chipsdiv = seatloc.getElementById('name-chips');
  var namediv = internal_get_a_class_named(chipsdiv, '.chips');
  if (!isNaN(amount) && amount != "") {
    amount = "$" + amount;
  }
  namediv.textContent = amount;
}

function gui_set_bet (bet, seat) {
  var table = document.getElementById('poker_table');
  var current = 'seat' + seat;
  var seatloc = document.getElementById(current);
  var betdiv = internal_get_a_class_named(seatloc, '.bet');

  betdiv.textContent = bet;
}

function gui_clear_the_board(board) {
  for (var i = 0; i < 5; i++) {
    board[i] = "";
    gui_lay_board_card(i, board[i]);     
  }
  for (i = 0; i < 3; i++) {
    //board[i] = "";
    gui_burn_board_card(i, board[i]);
  }
}

function gui_set_player_cards (card_a, card_b, seat, folded) {
  var table = document.getElementById('poker_table');
  var current = 'seat' + seat;
  var seatloc = document.getElementById(current);
  var cardsdiv = internal_get_a_class_named(seatloc, '.holecards');
  var card1 = internal_get_a_class_named(cardsdiv, '.holecard1');
  var card2 = internal_get_a_class_named(cardsdiv, '.holecard2');

  internal_setCard(card1, card_a, folded);
  internal_setCard(card2, card_b, folded);
}

function gui_lay_board_card (n, the_card) {
  // Write the card no 'n'
  // the_card = "c9";

  var current = '';

  if (n === 0) {
    current = 'flop1';
  } else if (n === 1) {
    current = 'flop2';
  } else if (n === 2) {
    current = 'flop3';
  } else if (n === 3) {
    current = 'turn';
  } else if (n === 4) {
    current = 'river';
  }

  var table = document.getElementById('poker_table');
  var seatloc = document.getElementById("board");

  var cardsdiv = document.getElementById(current);
  internal_setCard(cardsdiv, the_card);
}

function gui_burn_board_card (n, the_card) {
  // Write the card no 'n'
  // the_card = "c9";

  var current = '';

  if (n === 0) {
    current = 'burn1';
  } else if (n === 1) {
    current = 'burn2';
  } else if (n === 2) {
    current = 'burn3';
  }

  var table = document.getElementById('poker_table');
  var seatloc = document.getElementById("board");

  var cardsdiv = document.getElementById(current);
  internal_setCard(cardsdiv, the_card);
}

function gui_write_basic_general (pot_size) {
  var total_div = document.getElementById("total-pot");

  var the_pot = 'Total pot: $' + (pot_size/100).toFixed(2);
  total_div.innerHTML = the_pot;
}

function gui_write_basic_general_text (text) {
  var total_div = document.getElementById("total-pot");
  internal_show.show(total_div);
  total_div.innerHTML = text;
}

var log_text = [];
var log_index = 10;

function gui_log_to_history (text_to_write) {
  for (var idx = log_index; idx > 0; --idx) {
    log_text[idx] = log_text[idx - 1];
  }

  log_text[0] = text_to_write;
  if (log_index < 40) {
    log_index = log_index + 1;
  }
  var text_to_output = '<br><b>' + log_text[0] + '</b>';
  for (idx = 1; idx < log_index; ++idx) {
    text_to_output += '<br>' + log_text[idx];
  }
  var history = document.getElementById('history');
  history.innerHTML = text_to_output;
}

function gui_hide_log_window () {
  var history = document.getElementById('history');
  internal_hide(history);
}

function gui_place_dealer_button (seat) {
  var table_seat = seat; // interface start at 1
  var dealerButton = document.querySelector(".dealerbutton.dealerbutton-current");
  if(dealerButton) {
      dealerButton.classList.remove("dealerbutton-current");
  }
  if(table_seat > -1 && table_seat < 11) {
      document.getElementById("dealerbutton" + table_seat).classList.add("dealerbutton-current");
  }
}

function gui_hide_dealer_button () {
  gui_place_dealer_button(-3);
}

function gui_hide_fold_call_click () {
  var fold = document.getElementById('fold-button');
  internal_clickin_helper(fold, 0, 0);

  var call = document.getElementById('call-button');
  internal_clickin_helper(call, 0, 0);
  gui_disable_shortcut_keys();
}

function gui_setup_fold_call_click (show_fold, call_text,
  fold_func, call_func) {
  
  var fold = document.getElementById('fold-button');
  internal_clickin_helper(fold, show_fold, fold_func);

  var call = document.getElementById('call-button');
  internal_clickin_helper(call, call_text, call_func);
}

function internal_le_button (buttons, button_name, button_func) {
  var le_button = document.getElementById(button_name);
  internal_show(le_button);
  le_button.onclick = button_func;
}

function gui_setup_option_buttons (new_game_func,
                                   away_game_func,
                                   join_game_func,
                                   help_func,
                                   rebuy_func,
                                   mode_func) {
  //var buttons = document.getElementById('setup-options');

  if (I_am_Host) {
    internal_le_button(buttons, 'deal-button', new_game_func);
  }
  else{
    internal_hide_le_button(buttons, 'deal-button', new_game_func);
  }
  internal_hide_le_button(buttons, 'away-button', away_game_func);
  internal_le_button(buttons, 'join-button', join_game_func);
  internal_hide_le_button(buttons, 'mode-button', mode_func);
  internal_le_button(buttons, 'help-button', help_func);
  internal_hide_le_button(buttons, 'rebuy-button', rebuy_func);
}

function internal_hide_le_button (buttons, button_name, button_func) {
  var le_button = document.getElementById(button_name);
  internal_hide(le_button);
}

function gui_hide_setup_option_buttons (name_func,
                                        speed_func,
                                        help_func,
                                        check_func) {
  //var buttons = document.getElementById('setup-options');

  internal_hide_le_button(buttons, 'deal-button');
  internal_hide_le_button(buttons, 'away-button');
  internal_hide_le_button(buttons, 'join-button');
  internal_hide_le_button(buttons, 'mode-button');
  internal_hide_le_button(buttons, 'help-button');
  internal_hide_le_button(buttons, 'rebuy-button');
}

function gui_hide_game_response () {
  var response = document.getElementById('game-response');
  internal_hide(response);
}

function gui_show_game_response () {
  var response = document.getElementById('game-response');
  internal_show(response);
}

function gui_write_game_response (text) {
  var response = document.getElementById('game-response');
  internal_show(response);
  response.innerHTML = text;
}

function gui_setup_betting_click (betting_text,
  betting_func) {
  
  //var buttons = document.getElementById('betting-options');
  var betting = document.getElementById('bet-button');
  internal_clickin_helper(betting, betting_text, betting_func);
}

function gui_hide_betting_click () {
  //var buttons = document.getElementById('betting-options');
  var betting = document.getElementById('bet-button');
  internal_clickin_helper(betting, 0, 0);
}

function gui_write_quick_raise (text) {
  var response = document.getElementById('quick-raises');
  if (text === "") {
    internal_hide(response);
  } else {
    internal_show(response);
    response.innerHTML = text;
  }
}

function gui_hide_quick_raise () { 
  gui_write_quick_raise("");
}

function gui_write_modal_box (text) {
  var modal = document.getElementById('modal-box');
  if (text === "") {
    modal.style.display = "none";
  } else {
    modal.innerHTML = text;
    modal.style.display = "block";
    modal.style.opacity = "0.90";
  }
}

function gui_initialize_css () {
  // Set all the backgrounds
  var image;
  var item;
  item = document.getElementById('poker_table');
  image = "url('images/__poker_table.png')";
  internal_setBackground(item, image, 1.0);
}

function gui_enable_shortcut_keys (func) {
  document.addEventListener('keydown', func);
}

function gui_disable_shortcut_keys (func) {
  document.removeEventListener('keydown', func);
}

// Theme mode
function internal_get_theme_mode () {
  var mode = getLocalStorage("currentmode");
  if (mode === null) {  // first time
    mode = "dark";
  }
  //return mode;
  return mode;
}

function internal_set_theme_mode (mode) {
  setLocalStorage("currentmode", mode);
}

function internal_get_into_the_mode (mode) {
  var mode_button = document.getElementById('mode-button');

  var color;
  var button_text;
  if (mode == "dark") {
    color = 'DimGray';
    button_text = 'Light mode';
  } else if (mode == "Christmas") {
    color = 'Red';
    button_text = 'Light mode';
  } else {
    color = 'White';
    button_text = 'Dark mode';
}
  //document.body.style.backgroundColor = color;
  mode_button.innerHTML = button_text;
}

function gui_initialize_theme_mode () {
  var mode = internal_get_theme_mode();
  internal_get_into_the_mode(mode);
  internal_set_theme_mode(mode);
}

function gui_toggle_the_theme_mode () {
  var mode = internal_get_theme_mode();
  if (mode == "dark") {
    mode = "light";
  } else if (mode == "Christmas") {
    mode = "light";
  } else {
    mode = "dark";
  }
  mode="dark";
  internal_get_into_the_mode(mode);
  internal_set_theme_mode(mode);
}

function gui_get_theme_mode_highlite_color () {
  var mode = internal_get_theme_mode();
  var color = "red";
  if (mode == "dark") {
    color = "yellow";
  }
  return color;
}
