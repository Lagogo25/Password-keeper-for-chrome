var connected = false;
var user = "";          // use to show message for popup
var password = "";      // use to encrypt and decrypt info
var resp;

// next fields are fetched from page and saved to file if needed
var save_user = undefined;
var save_password = undefined;
var save_url = undefined;
var save_form = undefined;

var fileContent = {}; // will be updated whenever needed
// var socket = io('http://localhost:1337'); // when running locally
var socket = io('http://184.72.209.38:1337'); // when running on AWS

function save_details(){
    if (connected) {
        chrome.storage.local.set({'fileContent': fileContent});
        // console.log("this is fileContent: " + JSON.stringify(fileContent));
        var content = "";
        for (var url in fileContent) {
            for (var form in fileContent[url]) {
                for (var usr in fileContent[url][form]) {
                    content += CryptoJS.AES.encrypt(url, password) + " " +
                        CryptoJS.AES.encrypt(form, password) + " " +
                        CryptoJS.AES.encrypt(usr, password) + " " +
                        CryptoJS.AES.encrypt(fileContent[url][form][usr], password) + "\n";
                }
            }
        }
        socket.emit('update_server', {
            user: user,
            password: password,
            content: content
        });
    }
}


socket.on('server_ready', function (data) {
    console.log("server is ready! you can now sign in.");
    chrome.runtime.onMessage.addListener(function(msg){
        var req = msg.request;
        switch (req){
            case "login":
            case "register":
                user = msg.user;
                password = msg.password;
                socket.emit(req, {user: user, password: password});
                break;
            case "fetch_details":
                if (connected) {
                    // should check no input password exists!
                    // console.log(msg.details); // details fetched from site
                    save_user = msg.details.uname;
                    save_password = msg.details.password;
                    save_url = msg.details.url;
                    save_form = msg.details.parent_id;
                }
                break;
            case "save_details":
                // console.log("save request! this is file content: " + JSON.stringify(fileContent));
                if (connected && save_user && save_password) {
                    // should check save_url fits current page
                    chrome.tabs.query({active: true, lastFocusedWindow: true}, function (tabs) {
                        if (tabs && tabs[0]) {
                            var temp_url = tabs[0].url.split('/');
                            var current_url = temp_url[0] + "//" + temp_url[2] + "/";
                            if (msg.url === current_url) {
                                if (fileContent) {
                                    if (fileContent[save_url]) { // site exists in database
                                        // check if details are up to date
                                        if (fileContent[save_url][save_form]) { // form exists in database
                                            if (fileContent[save_url][save_form][save_user]) { // user exists in database
                                                if (fileContent[save_url][save_form][save_user] !== save_password) {
                                                    // user exists, password is different!
                                                    // should alert and ask if user wants to change password!
                                                    if (confirm("There is a different password saved for this user in database. Update password?")) {
                                                        console.log("replacing password for user " + save_user + " in " + save_url);
                                                        fileContent[save_url][save_form][save_user] = save_password;
                                                        save_details();
                                                    }
                                                }
                                                else {
                                                    console.log("User exists in database! Details were placed...");
                                                }
                                            }
                                            else {
                                                // user is not yet saved!!
                                                console.log("adding another user for site " + save_url);
                                                fileContent[save_url][save_form][save_user] = save_password;
                                                save_details();
                                            }
                                        }
                                        else {
                                            // form is not yet saved!! (Only good to remember maybe if already signed up?)
                                            console.log("adding another form for site " + save_url);
                                            fileContent[save_url][save_form] = {};
                                            fileContent[save_url][save_form][save_user] = save_password;
                                            save_details();
                                        }
                                    }
                                    else {
                                        // no details are saved for this url or user!
                                        console.log("This site was never saved for this user!");
                                        fileContent[save_url] = {};
                                        fileContent[save_url][save_form] = {};
                                        fileContent[save_url][save_form][save_user] = save_password;
                                        save_details();
                                    }
                                }
                                save_user = undefined;
                                save_password = undefined;
                                save_url = undefined;
                                save_form = undefined;
                            }
                        }
                    });
                }
                break;
        }
    });
});

socket.on('login_response', function(data){
    resp = data.response;
    // get popup window
    var views = chrome.extension.getViews({
        type: "popup"
    });
    for (var i = 0; i < views.length; i++) {
        views[i].document.getElementById('status').innerHTML = resp;
    }
    if (resp === "signed in") {
        connected = true;
        var content = {};
        if (data.content !== "problem") {
            // console.log(data.content); // prints file content so client could see it is encrypted!!
            var details = data.content.split('\n');
            // decrypt all details sent from server!
            for (var i = 0; i < details.length; i++) {
                var line = details[i].split(' ');
                if (line.length === 4) {
                    if (!content[CryptoJS.AES.decrypt(line[0], password).toString(CryptoJS.enc.Utf8)])
                        content[CryptoJS.AES.decrypt(line[0], password).toString(CryptoJS.enc.Utf8)] = {};
                    if (!content[CryptoJS.AES.decrypt(line[0], password).toString(CryptoJS.enc.Utf8)][CryptoJS.AES.decrypt(line[1], password).toString(CryptoJS.enc.Utf8)])
                        content[CryptoJS.AES.decrypt(line[0], password).toString(CryptoJS.enc.Utf8)][CryptoJS.AES.decrypt(line[1], password).toString(CryptoJS.enc.Utf8)] = {};
                    content[CryptoJS.AES.decrypt(line[0], password).toString(CryptoJS.enc.Utf8)]
                        [CryptoJS.AES.decrypt(line[1], password).toString(CryptoJS.enc.Utf8)]
                        [CryptoJS.AES.decrypt(line[2], password).toString(CryptoJS.enc.Utf8)] =
                        CryptoJS.AES.decrypt(line[3], password).toString(CryptoJS.enc.Utf8);
                }
            }
            chrome.storage.local.set({'fileContent': content}, function(){
                fileContent = content;
                // fileContent is now the decrypted details for the client for every website he saved
                // console.log('set fileContent (' + JSON.stringify(fileContent) + ') in local storage');
            });
        }
        else{
            connected = false;
            if (confirm("Password Keeper:\nPassword file was altered! Deleting your account.\nWould you like to save your last backup of passwords (non decrypted!!) locally?")){
                // user wants a copy from chrome local storage
                var finished = false;
                var p = prompt("Please Enter your password for your account.\nPressing cancel will result with loss of all data!");
                while (!finished){
                    if (p !== null) {
                        if (p === password) {
                            chrome.storage.local.get(['fileContent'], function (items) {
                                if (items && items.fileContent) {
                                    fileContent = items.fileContent; // should be the last backuped locally
                                    // console.log("restored from last backup: " + JSON.stringify(fileContent));
                                    content = "";
                                    for (var url in fileContent) {
                                        for (var form in fileContent[url]) {
                                            for (var usr in fileContent[url][form]) {
                                                content += url + " " + form + " " + usr + " " + fileContent[url][form][usr] + "\n";
                                            }
                                        }
                                    }
                                    // console.log("this is content: " + content);
                                    var file = new Blob([content]);
                                    var a = document.createElement("a");
                                    url = URL.createObjectURL(file);
                                    a.href = url;
                                    a.download = user + "_passwords.txt";
                                    document.body.appendChild(a);
                                    a.click();
                                    setTimeout(function () {
                                        document.body.removeChild(a);
                                        window.URL.revokeObjectURL(url);
                                    }, 0);
                                }
                                // the reason for thie code duplication is Asynchronous of JavaScript. That solved my problem.
                                socket.emit('delete_user', {user: user, password: password});
                                resp = "ERROR!";
                                chrome.tabs.getAllInWindow(null, function (tabs) {
                                    for (var i = 0; i < tabs.length; i++) {
                                        var tab_url = tabs[i].url.split('/');
                                        tab_url = tab_url[0] + '//' + tab_url[2] + '/';
                                        if (fileContent[tab_url])
                                            chrome.tabs.update(tabs[i].id, {url: tabs[i].url});
                                    }
                                    console.log("Problem in server! Deleting account!");
                                    chrome.runtime.reload();
                                });
                            });
                            finished = true;
                        }
                        else {
                            p = prompt("Wrong Password given!\nPlease Enter your password for your account.\nPressing cancel will resuly with loss of all data!");
                        }
                    }
                    else{
                        finished = true;
                    }
                }
            }
            else{
                socket.emit('delete_user', {user: user, password: password});
                resp = "ERROR!";
                chrome.tabs.getAllInWindow(null, function (tabs) {
                    for (var i = 0; i < tabs.length; i++) {
                        var tab_url = tabs[i].url.split('/');
                        tab_url = tab_url[0] + '//' + tab_url[2] + '/';
                        if (fileContent[tab_url])
                            chrome.tabs.update(tabs[i].id, {url: tabs[i].url});
                    }
                    console.log("Problem in server! Deleting account!");
                    chrome.runtime.reload();
                });
                return;
            }

        }

        for (var i = 0; i < views.length; i++) {
            views[i].close(); // closes the popup window on successful sign-in
        }

        // refresh all saved pages on sign in
        chrome.tabs.getAllInWindow(null, function (tabs) {
            for (var i = 0; i < tabs.length; i++) {
                if (tabs[i] && !tabs[i].url.startsWith("chrome://")){
                    var tab_url = tabs[i].url.split('/');
                    tab_url = tab_url[0] + '//' + tab_url[2] + '/';
                    if (fileContent[tab_url]) {
                        chrome.tabs.update(tabs[i].id, {url: tabs[i].url});
                    }
                    chrome.tabs.executeScript(tabs[i].id, {
                        file: 'content.js'
                    });
                }
            }
        });
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

socket.on('account_deleted', function(data){
    // should send something?
    if (connected){
        connected = false;
        alert("Your account has been deleted from the server.\n" +
            "Either someone with your details deleted it from another computer, or our server been hacked.\n")
        var finished = false;
        var p = prompt("You can save your passwords to your computer.\n" +
            "Please enter your password if you wish to do so.\n" +
            "Pressing cancel will result with lose of this data");
        while (!finished){
            if (p !== null){
                if (p === password){
                    var content = "";
                    if (fileContent && JSON.stringify(fileContent) !== "{}") {
                        for (var url in fileContent) {
                            for (var form in fileContent[url]) {
                                for (var usr in fileContent[url][form]) {
                                    content += url + " " + form + " " + usr + " " + fileContent[url][form][usr] + "\n";
                                }
                            }
                        }
                    }
                    var file = new Blob([content]);
                    var a = document.createElement("a");
                    url = URL.createObjectURL(file);
                    a.href = url;
                    a.download = user + "_passwords.txt";
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(function () {
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                    }, 0);
                }
                else{
                    prompt("Wrong password given!\n" +
                        "Please enter your password if you wish to save your passwords.\n" +
                        "Pressing cancel will result with lose of this data");
                }
            }
            else{
                console.log("User canceled his request.");
                finished = true;
            }
        }
        resp = "user deleted";
        chrome.tabs.getAllInWindow(null, function (tabs) {
            for (var i = 0; i < tabs.length; i++) {
                var tab_url = tabs[i].url.split('/');
                tab_url = tab_url[0] + '//' + tab_url[2] + '/';
                if (fileContent[tab_url])
                    chrome.tabs.update(tabs[i].id, {url: tabs[i].url});
            }
            chrome.runtime.reload();
        });
    }
});

socket.on('update_file', function (data) {
    if (connected) {
        var content = {};
        // console.log(data.content); // prints file content so client could see it is encrypted!!
        var details = data.content.split('\n');
        // decrypt all details sent from server!
        for (var i = 0; i < details.length; i++) {
            var line = details[i].split(' ');
            if (line.length === 4) {
                if (!content[CryptoJS.AES.decrypt(line[0], password).toString(CryptoJS.enc.Utf8)])
                    content[CryptoJS.AES.decrypt(line[0], password).toString(CryptoJS.enc.Utf8)] = {};
                if (!content[CryptoJS.AES.decrypt(line[0], password).toString(CryptoJS.enc.Utf8)][CryptoJS.AES.decrypt(line[1], password).toString(CryptoJS.enc.Utf8)])
                    content[CryptoJS.AES.decrypt(line[0], password).toString(CryptoJS.enc.Utf8)][CryptoJS.AES.decrypt(line[1], password).toString(CryptoJS.enc.Utf8)] = {};
                content[CryptoJS.AES.decrypt(line[0], password).toString(CryptoJS.enc.Utf8)]
                    [CryptoJS.AES.decrypt(line[1], password).toString(CryptoJS.enc.Utf8)]
                    [CryptoJS.AES.decrypt(line[2], password).toString(CryptoJS.enc.Utf8)] =
                    CryptoJS.AES.decrypt(line[3], password).toString(CryptoJS.enc.Utf8);
            }
        }
        chrome.storage.local.set({'fileContent': content}, function () {
            fileContent = content;
            // fileContent is now the decrypted details for the client for every website he saved
            // console.log('set fileContent (' + JSON.stringify(fileContent) + ') in local storage');
        });
    }
});

chrome.tabs.onActivated.addListener(function(activeInfo){ // launch whenever we switch tab
    var tabId = activeInfo.tabId;
    if (connected) {
        chrome.tabs.get(tabId, function (tab) {
            if (tab && !tab.url.startsWith("chrome://")){
                chrome.tabs.executeScript(tabId, {
                    file: 'content.js'
                });
            }
        });
    }
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo){
    if (connected) {
        chrome.tabs.get(tabId, function (tab) {
            if (tab && !tab.url.startsWith("chrome://")){
                if (changeInfo.status === "complete") {
                    chrome.tabs.executeScript(tabId, {
                        file: 'content.js'
                    });
                }
            }
        });
    }
});