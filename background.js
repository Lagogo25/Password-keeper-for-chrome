var socket = io('http://localhost:1337/');

var connected = false;
var user = "";          // use to show message for popup
var password = "";      // use to encrypt and decrypt info
//var salt = "";          // needed to encrypt and decrypt. key will be password + salt
var resp;
//var key = "";

// next fields are fetched from page and saved to file if needed
var save_user = undefined;
var save_password = undefined;
var save_url = undefined;
var save_form = undefined;

var fileName = "";
var fileContent = {}; // will be updated whenever needed

socket.on('server_ready', function (data) {
    chrome.runtime.onMessage.addListener(function(msg){
        var req = msg.request;
        switch (req){
            case "login":
            case "register":
                user = msg.user;
                password = msg.password;
                // key = CryptoJS.enc.Base64.parse(password);
                socket.emit(req, {user: user, password: password});
                break;
            case "update_server":
                connected = false;
                // chrome.storage.local.get(['fileName', 'fileContent'], function(items){
                //     fileName = items.fileName;
                //     fileContent = items.fileContent;
                //     // console.log('file name: ' + fileName + ' and content: ' + fileContent);
                // });
                var content = "";
                for (var url in fileContent){
                    for (var form in fileContent[url]) {
                        for (var usr in fileContent[url][form]) {
                            content += CryptoJS.AES.encrypt(url, password) + " " +
                                CryptoJS.AES.encrypt(form, password) + " " +
                                CryptoJS.AES.encrypt(usr, password) + " " +
                                CryptoJS.AES.encrypt(fileContent[url][form][usr], password) + "\n";
                        }
                    }
                }
                socket.emit(req, {fileName: fileName, content: content});
                chrome.runtime.reload();
                break;
            case "fetch_details":
                // should check no input password exists!
                // console.log(msg.details);
                save_user = msg.details.uname;
                save_password = msg.details.password;
                save_url = msg.details.url;
                save_form = msg.details.parent_id;
                break;
            case "save_details":
                // console.log("save request! this is file content: " + JSON.stringify(fileContent));
                if (save_user && save_password) {
                    // should check save_url fits current page
                    chrome.tabs.query({active: true, lastFocusedWindow: true}, function (tabs) {
                        // tabs[0] is undefined for some reason!!
                        // console.log("tab is " + tabs[0].id);
                        var temp_url = tabs[0].url.split('/');
                        var current_url = temp_url[0] + "//" + temp_url[2] + "/";
                        // console.log("current_url is " + current_url);
                        if (msg.url === current_url) {
                            console.log('details: ' + save_url + ' ' + save_form + ' ' + save_user + ' ' + save_password);
                            // maybe get file name and content?
                            if (fileContent){
                                if (fileContent[save_url]) { // site exists in database
                                    // check if details are up to date
                                    if (fileContent[save_url][save_form]) { // form exists in database
                                        if (fileContent[save_url][save_form][save_user]) { // user exists in database
                                            if (fileContent[save_url][save_form][save_user] !== save_password) {
                                                // user exists, password is different!
                                                // should alert and ask if user wants to change password!
                                                if (confirm("There is a different password saved for this user in database. Update password?")) {
                                                    console.log("replacing password: " + fileContent[save_url][save_form][save_user] + " with password: " + save_password);
                                                    fileContent[save_url][save_form][save_user] = save_password;
                                                    chrome.storage.local.set({'fileContent': fileContent});
                                                    console.log("this is fileContent: " + JSON.stringify(fileContent));
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
                                                        fileName: fileName,
                                                        content: content
                                                    });
                                                }
                                            }
                                            else{
                                                console.log("User exists in database!");
                                            }
                                        }
                                        else {
                                            // user is not yet saved!!
                                            // if (confirm("There is a different user name saved in database. Change existing user?")){
                                            console.log("adding another user for site " + save_url);
                                            fileContent[save_url][save_form][save_user] = save_password;
                                            chrome.storage.local.set({'fileContent': fileContent});
                                            console.log("this is fileContent: " + JSON.stringify(fileContent));
                                            var content = "";
                                            for (var url in fileContent){
                                                for (var form in fileContent[url]) {
                                                    for (var usr in fileContent[url][form]) {
                                                        content += CryptoJS.AES.encrypt(url, password) + " " +
                                                            CryptoJS.AES.encrypt(form, password) + " " +
                                                            CryptoJS.AES.encrypt(usr, password) + " " +
                                                            CryptoJS.AES.encrypt(fileContent[url][form][usr], password) + "\n";
                                                    }
                                                }
                                            }
                                            socket.emit('update_server', {fileName: fileName, content: content});
                                            // }
                                        }
                                    }
                                    else{
                                        // form is not yet saved!!
                                        console.log("adding another form for site " + save_url);
                                        fileContent[save_url][save_form] = {};
                                        fileContent[save_url][save_form][save_user] = save_password;
                                        chrome.storage.local.set({'fileContent': fileContent});
                                        console.log("this is fileContent: " + JSON.stringify(fileContent));
                                        var content = "";
                                        for (var url in fileContent){
                                            for (var form in fileContent[url]) {
                                                for (var usr in fileContent[url][form]) {
                                                    content += CryptoJS.AES.encrypt(url, password) + " " +
                                                        CryptoJS.AES.encrypt(form, password) + " " +
                                                        CryptoJS.AES.encrypt(usr, password) + " " +
                                                        CryptoJS.AES.encrypt(fileContent[url][form][usr], password) + "\n";
                                                }
                                            }
                                        }
                                        socket.emit('update_server', {fileName: fileName, content: content});
                                    }
                                }
                                else {
                                    // no details are saved for this url or user!
                                    console.log("This site was never saved for this user!");
                                    fileContent[save_url] = {};
                                    fileContent[save_url][save_form] = {};
                                    fileContent[save_url][save_form][save_user] = save_password; // = {user: save_user, password: save_password}; // ???
                                    chrome.storage.local.set({'fileContent': fileContent});
                                    console.log("this is fileContent: " + JSON.stringify(fileContent));
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
                                    socket.emit('update_server', {fileName: fileName, content: content});
                                }
                            }
                            else{ // the file is empty!! (necessary???)
                                console.log("file is empty! fileName: " + fileName);
                                fileContent = {};
                                fileContent[save_url] = {};
                                fileContent[save_url][save_form] = {};
                                fileContent[save_url][save_form][save_user] = save_password;
                                //fileContent = { save_url: {user: save_user, password: save_password}};
                                chrome.storage.local.set({'fileContent': fileContent});
                                console.log("this is fileContent: " + JSON.stringify(fileContent));
                                var content = CryptoJS.AES.encrypt(save_url, password) + " " +
                                    CryptoJS.AES.encrypt(save_form, password) + " " +
                                    CryptoJS.AES.encrypt(save_user, password) + " " +
                                    CryptoJS.AES.encrypt(save_password, password) + "\n";
                                socket.emit('update_server', {fileName: fileName, content: content});

                            }
                            save_user = undefined;
                            save_password = undefined;
                            save_url = undefined;
                            save_form = undefined;
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
        //salt = CryptoJS.enc.Base64.parse(data.salt);
        //console.log("this is key: " + key);
        // save fileName and content on local memory?

        var details = data.content.split('\n');
        var content = {};
        for (var i = 0; i < details.length; i++){
            var line = details[i].split(' ');
            if (line.length === 4) {
                console.log("this is line " + i + ": " + line);
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

        chrome.storage.local.set({ 'fileName': data.name, 'fileContent': content}, function(){
            fileName = data.name;
            fileContent = content;
            console.log('set variables fileName (' + fileName + ') and fileContent (' + JSON.stringify(fileContent) + ') in local storage');
        });

        for (var i = 0; i < views.length; i++) {
            views[i].document.getElementById('status').innerHTML = user + " " + resp;
            views[i].displayLogin('none');
            // var fileName, fileContent;
            // chrome.storage.local.get(['fileName', 'fileContent'], function (items) {
            //     fileName = items.fileName;
            //     fileContent = items.fileContent;
            // });
            views[i].document.getElementById("sign-out").onclick = function () {
                // should send file to server
                connected = false;
                var content = "";
                for (var url in fileContent){
                    for (var usr in fileContent[url]) {
                        content += url + " " + usr + " " + fileContent[url][usr] + "\n";
                    }
                }
                socket.emit('update_server', {fileName: fileName, content: content});
                chrome.runtime.reload();
            };
            // chrome.tabs.query({active: true, lastFocusedWindow: true}, function (tabs) {
            //     tabs[0] is the current active tab
            //     chrome.tabs.executeScript(tabs[0].id, {
            //         file: 'content.js'
            //     });
            // });
            chrome.tabs.getAllInWindow(null, function(tabs) {
                for(var i = 0; i < tabs.length; i++) {
                    chrome.tabs.update(tabs[i].id, {url: tabs[i].url});
                }
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


