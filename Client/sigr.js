//////////////////////////////////////////////////////////////////////////
// Declare an iffe. Pass in a namespace (window.jsholdem which is just 
// jsh locally). 
//////////////////////////////////////////////////////////////////////////
(function (jsh) {

    /////////////////////////////////////////////////////////////////
    // Create a singleton instance, globally available through our
    // namespace, to handle Signal send and receive messages.
    /////////////////////////////////////////////////////////////////
    jsh.sigr = {
        baseUrl: null, // root web URL for api calls
        connection: null, // the SignalR hub connection
        ready: false, // true if we're connected to SignalR

        ///////////////////////////////////////////////////
        // Initialize members, connect to signalR and setup 
        // callback handlers
        ///////////////////////////////////////////////////
        init: function (baseUrl, receiveHandler) {
            // only connection if we're not already connected
            if (!jsh.sigr.ready) {
                // save base url to an instance variable (need it later in sendMessage)
                jsh.sigr.baseUrl = baseUrl;

                // create a signalr connection (ready to connect, but not yet connected)
                jsh.sigr.connection = new signalR.HubConnectionBuilder()
                    .withUrl(`${baseUrl}/api`)
                    .build();

                // setup a callback for signalr to send messages back to
                jsh.sigr.connection.on('newMessage', function (message) {
                    // call the receive handler passed into us
                    receiveHandler(message);
                });

                // setup a callback to tell me when my connection is lost and try to handle it
                jsh.sigr.connection.onclose(function () {
                    // set ready instance variable to false
                    jsh.sigr.ready = false;
                    console.log('disconnected');

                    // try to reconnect
                    setTimeout(function () {
                        jsh.sigr.init();
                    }, 2000);
                });

                // now initiate the connection
                jsh.sigr.connection.start()
                    .then(function () { jsh.sigr.ready = true; })
                    .catch(console.error);
            }
        },

        ///////////////////////////////////////////////////
        // Send a message to signalR
        ///////////////////////////////////////////////////
        sendMessage: function (message) {
            // if connection not ready, throw an exception
            if (!jsh.sigr.ready) {
                throw "SigR connection not ready";
            }

            // send the message using axios promises
            return axios.post(`${apiBaseUrl}/api/send`, message)
                .then(
                    function (resp) {
                        console.log(resp.data);
                    },
                    function (err) {
                        console.log(err);
                    }
                );
        }
    };

})(window.jsholdem = window.jsholdem || {}); // call the fundtion, pass in our existing namespace or create it as needed
