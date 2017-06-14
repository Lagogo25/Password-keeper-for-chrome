
var socket = io('http://localhost:1337/');
var delivery = new Delivery(socket);
var connected = false;
var user = "";
var resp;

delivery.on('receive.start',function(fileUID){
    console.log('receiving a file!');
});

delivery.on('receive.success',function(file){
    console.log("receive success!");
    console.log(file.text());
    // if (file.isImage()) {
    //     $('img').attr('src', file.dataURL());
    // }
});

socket.on('server_ready', function (data) {
    chrome.runtime.onMessage.addListener(function(msg){
        user = msg.user;
        var pass = msg.password;
        var req = msg.request;
        socket.emit(req, { user: user, password: pass });
    });
});

socket.on('login_response', function(data){
    resp = data.response;
    var views = chrome.extension.getViews({
        type: "popup"
    });
    for (var i = 0; i < views.length; i++) {
        views[i].document.getElementById('status').innerHTML = resp;
    }
    if (resp === "signed in") {
        connected = true;
        for (var i = 0; i < views.length; i++) {
            views[i].document.getElementById('status').innerHTML = user + " " + resp;
            views[i].displayLogin('none');
        }
        // should now download file!

    }
    console.log(resp);
});

socket.on('register_response', function(data){
    resp = data.response;
    var views = chrome.extension.getViews({
        type: "popup"
    });
    for (var i = 0; i < views.length; i++) {
        views[i].document.getElementById('status').innerHTML = resp;
    }
    console.log(resp);
});
