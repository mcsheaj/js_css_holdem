// Next State takes the place of SIGNALR message to/from server
function next_state () {
    get_msg();
    update_state();
  
    if (STATE.CMD == "setup_new_player") {
      for (var i = 0; i < STATE.NUM_PLAYERS; i++) {
        write_player(i, 0, 0);  //for testing setup all players, msg from server includes all current players
      }
    }
  
    if (STATE.CMD == "start new hand") { //msg from server inc current dealer, this players hole cards, and pot size
      gui_place_dealer_button(button_index);
      write_player(small_blind_seat,0,0);
      write_player(big_blind_seat,0,0);
      write_player(0,0,1);  //show my hold cards
      gui_write_basic_general(current_pot);  //just the blinds obviously
      write_player(current_bettor_index, 1, 1); //highlight first player to act
    } 
  
    if (STATE.CMD == "player action") { 
      write_player(current_bettor_index, 0, 0);
      gui_write_basic_general(current_pot);
      //main();
    }
  
    if (STATE.CMD == "my action") { 
      write_player(current_bettor_index, 0, 0);
      gui_write_basic_general(current_pot);
      main();
    }
  
    STATE.CMD = "";
  }
  
  var next_msg = 0;
  
  function get_msg() {  //whatever STATE object server sends will be copied to our global STATE object
  
    if (next_msg == 0) {  //Setup a 6 person game with 5/10 blinds
      STATE.CMD = "setup_new_player"
      STATE.players = [
      new player("Matt", 1000, "", "", "", 0, 0),
      new player("Sally",900, "blinded", "blinded", "", 0, 0),
      new player("Les",1100, "blinded", "blinded", "", 0, 0),
      new player("Greg", 800, "blinded", "blinded", "", 0, 0),
      new player("Corrina", 1200, "blinded", "blinded", "", 0, 0),
      new player("Lisa", 950, "blinded", "blinded", "", 0, 0),
      //new player("", 200, "blinded", "blinded", "", 0, 0),
      //new player("", 999, "blinded", "blinded", "", 0, 0),
      //new player("", 888, "blinded", "blinded", "", 0, 0),
      //new player("", 777, "blinded", "blinded", "", 0, 0)
      ]
      //players = STATE.players;
      STATE.NUM_PLAYERS = 6;   //just an arbitrary test
      STATE.SMALL_BLIND = 5;   //should be sent by server
      STATE.BIG_BLIND = 10;
    }
  
    if (next_msg == 1) {    //testing server starting new hand with button at seat3, or index =2
      STATE.CMD = "start new hand";
      STATE.button_index = 2;
      
      if (STATE.button_index + 1 < STATE.players.length) {
        small_blind_seat = STATE.button_index + 1;
      }
      else {
        small_blind_seat = 0;
      }
  
      if (STATE.button_index + 2 < STATE.players.length) {
        big_blind_seat = STATE.button_index + 2;
      }
      else {
        big_blind_seat = 0;
      }
  
      if (STATE.button_index + 3 < STATE.players.length) {
        first_to_act_seat = STATE.button_index + 3;
      }
      else {
        first_to_act_seat = 0;
      }
  
      //need blinds posted
      STATE.SMALL_BLIND = 5;
      STATE.BIG_BLIND = 10;
      STATE.players[small_blind_seat].subtotal_bet = STATE.SMALL_BLIND;
      STATE.players[small_blind_seat].total_bet_amount = STATE.SMALL_BLIND;
      STATE.players[big_blind_seat].subtotal_bet = STATE.BIG_BLIND;
      STATE.players[big_blind_seat].total_bet_amount = STATE.BIG_BLIND;
      STATE.current_bet_amount = 10;
      STATE.players[0].carda = "h13";
      STATE.players[0].cardb = "s2";
      STATE.current_pot = 15;  //blinds
      STATE.current_bettor_index = first_to_act_seat;
      STATE.current_min_raise = 10;
    }
  
    if (next_msg == 2) {   //player in seat 5 raises 
      STATE.CMD = "player action";
      STATE.current_bettor_index = 5;
      STATE.players[current_bettor_index].subtotal_bet = 100;
      STATE.players[current_bettor_index].total_bet_amount += STATE.players[current_bettor_index].subtotal_bet;
      STATE.current_bet_amount = STATE.players[current_bettor_index].subtotal_bet;
      STATE.current_pot += STATE.current_bet_amount;
  
      if (STATE.current_min_raise < STATE.current_bet_amount) {
        STATE.current_min_raise = STATE.current_bet_amount;
      }
    }
  
    if(next_msg == 3) {     // get action from next player at seat1
      STATE.CMD = "my action";
      STATE.current_bettor_index = 0;
    }
    
    next_msg++;
    return;
  }