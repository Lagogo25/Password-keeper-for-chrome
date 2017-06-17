var socket = io('http://localhost:1337/');

var connected = false;
var user = ""; // use to show message for popup
var password = ""; // use to encrypt and decrypt info
var salt = ""; // needed to encrypt and decrypt. key will be password + salt
var resp;

socket.on('server_ready', function (data) {
    chrome.runtime.onMessage.addListener(function(msg){
        var req = msg.request;
        switch (req){
            case "login":
            case "register":
                user = msg.user;
                password = msg.password;
                socket.emit(req, {user: user, password: password});
                break;
            case "update_server":
                connected = false;
                var fileName, fileContent;
                chrome.storage.local.get(['fileName', 'fileContent'], function(items){
                    fileName = items.fileName;
                    fileContent = items.fileContent;
                    console.log('file name: ' + fileName + ' and content: ' + fileContent);
                });
                socket.emit(req, {fileName: fileName, content: fileContent});
                chrome.runtime.reload();
                break;
            case "fetch_details":
                // should check no input password exists!
                console.log(msg.details);
                break;
        }
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
        salt = data.salt;
        // save fileName and content on local memory?
        chrome.storage.local.set({ 'fileName': data.name, 'fileContent': data.content}, function(){
            console.log('set variables fileName (' + data.name + ') and fileContent (' + data.content + ')');
        });
        for (var i = 0; i < views.length; i++) {
            views[i].document.getElementById('status').innerHTML = user + " " + resp;
            views[i].displayLogin('none');
            var fileName, fileContent;
            chrome.storage.local.get(['fileName', 'fileContent'], function (items) {
                fileName = items.fileName;
                fileContent = items.fileContent;
            });
            views[i].document.getElementById("sign-out").onclick = function () {
                // should send file to server
                connected = false;
                socket.emit('update_server', {fileName: fileName, content: fileContent});
                chrome.runtime.reload();
            };
            views[i].document.getElementById('sign-out').style.display = 'block';
        }
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

/*
Now comes the actual password keeping business!!
 */

// maybe add this functionality when signing in so that the current tab already load credentials?
chrome.tabs.onActivated.addListener(function(activeInfo){ // launch whenever we switch tab
    var tabId = activeInfo.tabId;
    if (connected) {
        chrome.tabs.executeScript(tabId, {
            file: "content.js"
        });
    }
});

// chrome.tabs.query({active: true, lastFocusedWindow: true}, function (tabs) {
//     // tabs[0] is the current active tab
//     if (connected) {
//         console.log(tabs[0].url);
//     }
// });
