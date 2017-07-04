function displayLogin(state){
    document.getElementById("user-box").style.display = state;
    document.getElementById("pass-box").style.display = state;
    document.getElementById("buttons1").style.display = state;
}

// for password
function validPassword(str) {
    //language=JSRegexp
    return str.length === 8 &&/^[\x21-\x7E]*$/.test(str);
}

// for username
function validUser(str) {
    //language=JSRegexp
    return 1 <= str.length && str.length <= 256 && /^[\x30-\x39\x41-\x5A\x61-\x7A]*$/.test(str);
}

function checkValid(user, password){
    if (validUser(user)){
        if (validPassword(password)){
            return true;
        }
        else{ // invalid password
            document.getElementById("status").innerHTML =
                '<b>Invalid password!</b><br>' +
                '(Should be 8 ASCII characters between 0X21 and 0X7E.)';
            return false;
        }
    }
    else{ // invalid user name
        document.getElementById("status").innerHTML =
            '<b>Invalid user name!</b><br>' +
            '(Should be one word consisted only by letters and numbers.)';
        return false;
    }
}

function hideDetails(){
    if (background_page.connected){
        document.getElementById("show-details").innerHTML = "Show passwords";
        document.getElementById("show-details").onclick = function () {
            showDetails();
        };
        if (document.getElementById("contentTable")){
            // if table exists, delete and create new one
            var element = document.getElementById("contentTable");
            element.parentNode.removeChild(element);
        }
        document.getElementById("table").innerHTML = "";
    }
}

function showDetails(){
    if (background_page.connected){
        document.getElementById("show-details").innerHTML = "Hide passwords";
        document.getElementById("show-details").onclick = function () {
            hideDetails();
        };
        if (JSON.stringify(background_page.fileContent) !== "{}"){
            // background_page.console.log("table: " + JSON.stringify(background_page.fileContent)); // to check details shown in table
            if (document.getElementById("contentTable")){
                // if table exists, delete and create new one
                var element = document.getElementById("contentTable");
                element.parentNode.removeChild(element);
            }
            var table = document.createElement("TABLE");
            table.setAttribute("id", "contentTable");
            document.getElementById("table").appendChild(table);
            // should create table and put in element table.
            // table won't show passwords!! (feel as if it's safer)
            for (var url in background_page.fileContent){
                for (var form in background_page.fileContent[url]){
                    for (var usr in background_page.fileContent[url][form]){
                        var row = document.createElement("TR");
                        row.setAttribute("id", "contable_" + form + "_" + usr);
                        document.getElementById("contentTable").appendChild(row);
                        var url_cell = document.createElement("TD");
                        var url_txt = document.createTextNode(url);
                        url_cell.appendChild(url_txt);
                        document.getElementById("contable_" + form + "_" + usr).appendChild(url_cell);
                        var usr_cell = document.createElement("TD");
                        var usr_txt = document.createTextNode(usr);
                        usr_cell.appendChild(usr_txt);
                        document.getElementById("contable_" + form + "_" + usr).appendChild(usr_cell);
                        var delete_cell = document.createElement("TD");
                        var delete_button = document.createElement("BUTTON");
                        var delete_txt = document.createTextNode("Forget");
                        delete_button.appendChild(delete_txt);
                        delete_button.onclick = function(){
                            // we need to update fileContent and update server!
                            if (background_page.confirm("Delete " + usr + " details for " + url + "?")){
                                var p = background_page.prompt("Please enter password for account");
                                if (p === background_page.password){
                                    delete background_page.fileContent[url][form][usr];
                                    if (!background_page.fileContent[url][form] || JSON.stringify(background_page.fileContent[url][form] === "{}")){
                                        delete background_page.fileContent[url][form];
                                        if (!background_page.fileContent[url] || JSON.stringify(background_page.fileContent[url] === "{}")){
                                            delete background_page.fileContent[url];
                                        }
                                    }
                                    // background_page.console.log(JSON.stringify(background_page.fileContent)); // to see fileContent (make sure details deleted)
                                    background_page.save_details();
                                }
                                else{
                                    background_page.alert("Wrong password given! details were not forgotten");
                                }
                            }
                        };
                        delete_button.setAttribute("class", "forget");
                        delete_cell.appendChild(delete_button);
                        document.getElementById("contable_" + form + "_" + usr).appendChild(delete_cell);
                    }
                }
            }
        }
        else{
            document.getElementById("table").innerHTML = "No details to show yet!";
        }
    }
}

// the extension background page
var background_page = chrome.extension.getBackgroundPage();

document.addEventListener('DOMContentLoaded', function() {
    if (!background_page.connected) {
        displayLogin('block'); // shows the sign-in/up menu
        // make Enter press go from user name field to password
        document.getElementById("user-name").addEventListener("keyup", function (event) {
            if (event.keyCode === 13) {
                // event.preventDefault();
                document.getElementById("user-password").focus();
            }
        });
        // make Enter press send sign-in request
        document.getElementById("user-password").addEventListener("keyup", function (event) {
            if (event.keyCode === 13){
                // event.preventDefault();
                document.getElementById("sign-in").click();
            }
        });

        document.getElementById("sign-in").onclick = function () {
            document.getElementById("sign-in").disabled = true;
            var uname = document.getElementById("user-name").value;
            var password = document.getElementById("user-password").value;
            // check for input validity
            if (checkValid(uname, password)) {
                // if valid, send message to background_page and make him send request to server
                chrome.runtime.sendMessage({
                    user: uname,
                    password: password,
                    request: 'login'
                });
            }
            document.getElementById("sign-in").disabled = false;
        };

        document.getElementById("sign-up").onclick = function () {
            document.getElementById("sign-up").disabled = true;
            var uname = document.getElementById("user-name").value;
            var password = document.getElementById("user-password").value;
            // check for input validity
            if (checkValid(uname, password)) {
                chrome.runtime.sendMessage({
                    // if valid, send message to background_page and make him send request to server
                    user: uname,
                    password: password,
                    request: 'register'
                });
            }
            document.getElementById("sign-up").disabled = false;
        };
    }
    else { // connected when clicked
        document.getElementById('buttons2').style.display = 'block';
        // we are already connected!
        document.getElementById('status').innerHTML = background_page.user + " signed in.";

        document.getElementById("sign-out").onclick = function() {
            if (background_page.connected) {
                background_page.connected = false;
                var content = "";
                // encrypt saved data and send it to server
                for (var url in background_page.fileContent) {
                    for (var form in background_page.fileContent[url]) {
                        for (var usr in background_page.fileContent[url][form]) {
                            content += background_page.CryptoJS.AES.encrypt(url, background_page.password) + " " +
                                background_page.CryptoJS.AES.encrypt(form, background_page.password) + " " +
                                background_page.CryptoJS.AES.encrypt(usr, background_page.password) + " " +
                                background_page.CryptoJS.AES.encrypt(background_page.fileContent[url][form][usr], background_page.password) + "\n";
                        }
                    }
                }
                background_page.socket.emit("server_update", {user: background_page.user, password: background_page.password, content: content});
                // refresh all saved pages on sign out
                background_page.socket.emit("sign_out", {user: background_page.user});
                background_page.chrome.tabs.getAllInWindow(null, function (tabs) {
                    for (var i = 0; i < tabs.length; i++) {
                        var tab_url = tabs[i].url.split('/');
                        tab_url = tab_url[0] + '//' + tab_url[2] + '/';
                        if (background_page.fileContent[tab_url])
                            background_page.chrome.tabs.update(tabs[i].id, {url: tabs[i].url});
                    }
                    background_page.console.log("signed out");
                    background_page.chrome.runtime.reload();
                });
            }
        };

        document.getElementById("delete-account").onclick = function(){
            if (background_page.connected){
                background_page.connected = false;
                if (background_page.confirm("Password Keeper:\nAre you sure you wish to delete your account?")){
                    var finished = false;
                    var p = background_page.prompt("Please Enter your password for your account.\nPressing cancel will result with account not being deleted.");
                    while (!finished){
                        if (p !== null){
                            if (p === background_page.password){
                                if (background_page.confirm("Password Keeper:\nWould you like to save your passwords (non decrypted!!) locally?")){
                                    // user wants a copy
                                    var content = "";
                                    if (background_page.fileContent && JSON.stringify(background_page.fileContent) !== "{}"){
                                        for (var url in background_page.fileContent) {
                                            for (var form in background_page.fileContent[url]) {
                                                for (var usr in background_page.fileContent[url][form]) {
                                                    content += url + " " + form + " " + usr + " " + background_page.fileContent[url][form][usr] + "\n";
                                                }
                                            }
                                        }
                                    }
                                    // background_page.console.log("this is content: " + content); // shows all saved contents
                                    var file = new Blob([content]);
                                    var a = background_page.document.createElement("a");
                                    url = URL.createObjectURL(file);
                                    a.href = url;
                                    a.download = background_page.user + "_passwords.txt";
                                    background_page.document.body.appendChild(a);
                                    a.click();
                                    setTimeout(function() {
                                        background_page.document.body.removeChild(a);
                                        window.URL.revokeObjectURL(url);
                                    }, 0);
                                    background_page.socket.emit('delete_user', {user: background_page.user, password: background_page.password});
                                    background_page.resp = "user deleted";
                                    background_page.chrome.tabs.getAllInWindow(null, function (tabs) {
                                        for (var i = 0; i < tabs.length; i++) {
                                            var tab_url = tabs[i].url.split('/');
                                            tab_url = tab_url[0] + '//' + tab_url[2] + '/';
                                            if (background_page.fileContent[tab_url])
                                                background_page.chrome.tabs.update(tabs[i].id, {url: tabs[i].url});
                                        }
                                        background_page.console.log("Account has been deleted!");
                                        background_page.alert("Password Keeper:\nYour account has been deleted!");
                                        background_page.chrome.runtime.reload();
                                    });
                                    finished = true;
                                }
                                else{
                                    background_page.socket.emit('delete_user', {user: background_page.user, password: background_page.password});
                                    background_page.resp = "user deleted";
                                    background_page.chrome.tabs.getAllInWindow(null, function (tabs) {
                                        for (var i = 0; i < tabs.length; i++) {
                                            var tab_url = tabs[i].url.split('/');
                                            tab_url = tab_url[0] + '//' + tab_url[2] + '/';
                                            if (background_page.fileContent[tab_url])
                                                background_page.chrome.tabs.update(tabs[i].id, {url: tabs[i].url});
                                        }
                                        background_page.console.log("Account has been deleted!");
                                        background_page.alert("Password Keeper:\nYour account has been deleted!");
                                        background_page.chrome.runtime.reload();
                                    });
                                }
                            }
                            else{
                                p = background_page.prompt("Wrong password given!\nPlease Enter your password for your account.\nPressing cancel will result with account not being deleted.");
                            }
                        }
                        else{ // pressed cancel
                            background_page.console.log("Account wasn't deleted");
                            finished = true;
                        }
                    }
                }
                else{
                    background_page.console.log("Account wasn't deleted");
                    background_page.connected = true;
                }
            }
        };

        document.getElementById("show-details").onclick = function () {
            showDetails();
        };

        document.getElementById("save-details").onclick = function () {
            if (background_page.connected){
                if (background_page.confirm("Password Keeper:\nThis will save your password locally non-encrypted! (saved to your default downloads directory)")) {
                    // user wants a copy
                    var finished = false;
                    var p = background_page.prompt("Please Enter your password for your account.\nPressing cancel will result with passwods not being saved!");
                    while (!finished){
                        if (p !== null){
                            if (p === background_page.password){
                                var content = "";
                                if (background_page.fileContent && JSON.stringify(background_page.fileContent) !== "{}") {
                                    for (var url in background_page.fileContent) {
                                        for (var form in background_page.fileContent[url]) {
                                            for (var usr in background_page.fileContent[url][form]) {
                                                content += url + " " + form + " " + usr + " " + background_page.fileContent[url][form][usr] + "\n";
                                            }
                                        }
                                    }
                                }
                                // background_page.console.log("this is content: " + content); // if you want to know what was saved
                                var file = new Blob([content]);
                                var a = background_page.document.createElement("a");
                                url = URL.createObjectURL(file);
                                a.href = url;
                                a.download = background_page.user + "_passwords.txt";
                                background_page.document.body.appendChild(a);
                                a.click();
                                setTimeout(function () {
                                    background_page.document.body.removeChild(a);
                                    window.URL.revokeObjectURL(url);
                                }, 0);
                                background_page.console.log("details were saved locally by request");
                                finished = true;
                            }
                            else{
                                p = background_page.prompt("Wrong password given!\nPlease Enter your password for your account.\nPressing cancel will result with passwods not being saved!");
                            }
                        }
                        else{
                            background_page.console.log("details were not saved");
                            finished = true;
                        }
                    }
                }
            }
        };
    }
});

