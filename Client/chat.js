//////////////////////////////////////////////////////////////////////////
// Declare an iffe. Pass in a namespace (window.jsholdem which is just 
// jsh locally). 
//////////////////////////////////////////////////////////////////////////
(function (jsh) {

    // Change this to point to your asure function
    var apiBaseUrl = 'https://func-jsholdem-useast.azurewebsites.net';
    //var apiBaseUrl = 'https://func-jsholdem-matt-useast.azurewebsites.net';

    /////////////////////////////////////////////////////////////////
    // ChatClient is our application. It's a type that can be
    // instantiated. It will handle using the jsh.sigr instance to
    // talk to SignalR and update the UI.
    /////////////////////////////////////////////////////////////////
    var ChatClient = function (baseUrl) {

        // initialize some local variables
        var _this = this;
        var container = document.getElementById("container");
        var template = document.getElementById("messageTemplate").innerHTML;

        // make enter send the message unless empty
        document.onkeydown = function (e) {
            if (window.event.keyCode == '13') {
                var text = document.getElementById("messageText").value;
                if (text.length > 0) {
                    _this.sendMessage(text);
                    e.stopPropagation();
                }
            }
        }

        // setup our connection and callback to sigr
        jsh.sigr.init(baseUrl, function (message) {
            _this.receiveMessage(message, template, container);
        });

    }

    //////////////////////////////////////////////////////////////////////
    // Construct the message from the UI and call jsh.sigr.sendMessage
    //////////////////////////////////////////////////////////////////////
    ChatClient.prototype.sendMessage = function (messageText) {

        // get the sender textbox
        var sender = document.getElementById("userName");

        // payload is an arbitrary object (i.e. could be your whole state),
        // really all of message is an arbitrary object
        var message = {
            recipient: '',
            sender: sender.value,
            payload: {
                priority: 100,
                text: messageText
            }
        };

        // don't allow changing user name once set
        if (sender.value) {
            sender.disabled = true;
        }

        // blank out the messageText textbox
        document.getElementById("messageText").value = "";

        // send the message through jsh.sigr
        jsh.sigr.sendMessage(message);

    }

    //////////////////////////////////////////////////////////////////////
    // Receive a message from the sigr hub and put it in the DOM
    //////////////////////////////////////////////////////////////////////
    ChatClient.prototype.receiveMessage = function (message, template, container) {

        // set message sender to anonymous if empty, and log the message
        if (!message.sender) message.sender = "anonymous";
        console.log(message);

        // construct the message html from the template and the message
        var msgHtml = template;
        msgHtml = msgHtml.replace(/{{ message.sender }}/, message.sender);
        msgHtml = msgHtml.replace(/{{ message.text }}/, JSON.stringify(message.payload));

        // now shove the message into the dom
        var newDiv = document.createElement("div");
        newDiv.innerHTML = msgHtml;
        container.appendChild(newDiv);

    }

    // Create an instance of ChatClient. It will setup UI and sigr
    // event receivers in it's constructor, and then wait for an event.
    // It doesn't need to be globally accessible because it's not used
    // outside of this script/iffe.
    var chatInstance = new ChatClient(apiBaseUrl);

})(window.jsholdem = window.jsholdem || {});  // call the fundtion, pass in our existing namespace or create it as needed