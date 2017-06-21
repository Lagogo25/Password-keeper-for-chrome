var socket = io('http://localhost:1337/');

var connected = false;
var user = "";          // use to show message for popup
var password = "";      // use to encrypt and decrypt info
var salt = "";          // needed to encrypt and decrypt. key will be password + salt
var resp;

// next fields are fetched from page and saved to file if needed
var save_user = undefined;
var save_password = undefined;
var save_url = undefined;


var fileName, fileContent; // will be updated whenever needed

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
                chrome.storage.local.get(['fileName', 'fileContent'], function(items){
                    fileName = items.fileName;
                    fileContent = items.fileContent;
                    // console.log('file name: ' + fileName + ' and content: ' + fileContent);
                });
                socket.emit(req, {fileName: fileName, content: fileContent});
                chrome.runtime.reload();
                break;
            case "fetch_details":
                // should check no input password exists!
                console.log(msg.details);
                save_user = msg.details.uname;
                save_password = msg.details.password;
                save_url = msg.details.url;
                break;
            case "save_details":
                if (save_user && save_password) {
                    // should check save_url fits current page
                    chrome.tabs.query({active: true, lastFocusedWindow: true}, function (tabs) {
                        // tabs[0] is undefined for some reason!!
                        // console.log("tab is " + tabs[0].id);
                        var temp_url = tabs[0].url.split('/');
                        var current_url = temp_url[0] + "//" + temp_url[2] + "/";
                        // console.log("current_url is " + current_url);
                        if (msg.url === current_url) {
                            console.log('details: ' + save_url + ' ' + save_user + ' ' + save_password);
                            // now should check if fileContent has the site and if the passwords match.
                            // if they match, do nothing. if they don't, ask to update fileContent.
                            save_url = CryptoJS.AES.encrypt(save_url, password + salt); // url was now encrypted!
                            if (fileContent.save_url){
                                // check if details are up to date
                            }
                            save_user = undefined;
                            save_password = undefined;
                            save_url = undefined;
                        }
                        else{
                            console.log('ERROR! msg.url: ' + msg.url + ' current_url: ' + current_url);
                        }
                    });
                }
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
        // should first check if file was altered by third party!!!
        // TODO!!!
        connected = true;
        salt = data.salt;
        // save fileName and content on local memory?

        var details = data.content.split('\n');
        var content = {};
        for (var i = 0; i < details.length; i++){
            var line = details[i].split(' ');
            content[line[0]] = {user: line[1], password: line[2]};
        }

        chrome.storage.local.set({ 'fileName': data.name, 'fileContent': content}, function(){
            console.log('set variables fileName (' + data.name + ') and fileContent (' + content + ')');
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
            chrome.tabs.query({active: true, lastFocusedWindow: true}, function (tabs) {
                // tabs[0] is the current active tab
                chrome.tabs.executeScript(tabs[0].id, {
                    file: 'content.js'
                });
            });
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

chrome.tabs.onActivated.addListener(function(activeInfo){ // launch whenever we switch tab
    var tabId = activeInfo.tabId;
    if (connected) {
        chrome.tabs.executeScript(tabId, {
            file: "content.js"
        });
    }
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo){
    if (connected) {
        if (changeInfo.status === "complete") {
            chrome.tabs.executeScript(tabId, {
                file: 'content.js'
            });
        }
    }
});


