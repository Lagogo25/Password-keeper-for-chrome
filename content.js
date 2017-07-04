/**
 * Created by lagogo on 17/06/2017.
 */

function parentForm(elem){
    while (elem.parentNode){
        if (elem.parentNode.nodeName.toLowerCase() === 'form'){
            return elem.parentNode;
        }
        elem = elem.parentNode;
    }
}

var fileContent;

chrome.storage.local.get(['fileContent'], function(items){
    fileContent = items.fileContent;
});


var url = document.URL.split("/"); // will NEED to use to save to file
url = url[0] + "//" + url[2] + "/"; // url[1] = '' !!! (http:// or https://)
var passwords = document.querySelectorAll("input[type=password]"); // all input fields of type password in page
if (Object.keys(passwords).length === 0){
    if (url)
        chrome.runtime.sendMessage({request: 'save_details', url: url});
}
else {
    var parents = [];

    for (var i = 0; i < Object.keys(passwords).length; i++) {
        parents[i] = parentForm(passwords[i]);
    }

    for (var i = 0; i < parents.length; i++) {
        var parent = parents[i];
        if (parent) {
            if (parent.querySelectorAll("input[type=submit]")) {
                parent.addEventListener("submit", function () {
                    var uname, password, parent_id;
                    var inputs = parent.querySelectorAll("input[type=text], input[type=email], input[type=password]"); // all inputs in form which are text/email
                    for (var j = 0; j < Object.keys(inputs).length - 1; j++) {
                        if (inputs[j].type !== 'password' && inputs[j + 1].type === 'password') {
                            uname = inputs[j].value;
                            password = inputs[j + 1].value;
                            parent_id = parent.id;
                            break;
                        }
                    }
                    if (!uname && !password) { // happens a lot on social networks!!
                        for (var k = 0; k < parents.length; k++) {
                            if (parents[k] !== parent) {
                                inputs = parents[k].querySelectorAll("input[type=text], input[type=email], input[type=password]"); // all inputs in form which are text/email
                                for (var l = 0; l < Object.keys(inputs).length - 1; l++) {
                                    if (inputs[l].type !== 'password' && inputs[l + 1].type === 'password') {
                                        uname = inputs[l].value;
                                        password = inputs[l + 1].value;
                                        parent_id = parents[k].id;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    var details = {url: url, parent_id: parent_id, uname: uname, password: password}; // should take values only on submit!
                    // should send details to background, which then should check if new page has no password fields!
                    chrome.runtime.sendMessage({request: "fetch_details", details: details});
                });
                // should auto fill form!!!
                if (fileContent) {
                    if (fileContent && fileContent[url] && fileContent[url][parent.id]) {
                        var users = fileContent[url][parent.id];
                        // get all fields inside form which are text/emails/passwords
                        var inputs = parent.querySelectorAll("input[type=text], input[type=email], input[type=password]");
                        // create a list of available users for input
                        for (var j = 0; j < Object.keys(inputs).length - 1; j++) {
                            // if current field is not a password and next one is, we are probably where we want to be
                            if (inputs[j].type !== 'password' && inputs[j + 1].type === 'password') {
                                var dlist = document.createElement("DATALIST");
                                dlist.setAttribute("id", "datalist");
                                parent.appendChild(dlist);
                                for (var usr in users) {
                                    var children = document.getElementById("datalist").children;
                                    var child;
                                    for (child = 0; child < children.length; child++) {
                                        if (children[child].value === usr)
                                            break;
                                    }
                                    if (child !== children.length)
                                        continue; // means usr is already an option!
                                    var option = document.createElement("OPTION");
                                    option.setAttribute("value", usr);
                                    document.getElementById("datalist").appendChild(option);
                                }
                                inputs[j].setAttribute("list", "datalist");
                                // auto fill with first name saved for the website
                                inputs[j].value = Object.keys(users)[0];
                                inputs[j+1].value = users[inputs[j].value];
                                inputs[j].focus();
                                inputs[j].onblur = function () {
                                    // once user moves from user name field, password will fill automatically
                                    if (users[inputs[j].value])
                                        inputs[j + 1].value = users[inputs[j].value];
                                };
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
}
