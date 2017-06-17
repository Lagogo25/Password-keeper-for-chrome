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
// var html = document.body.outerHTML; // page full HTML. no need in that...
var url = document.URL.split("/"); // will NEED to use to save to file
url = url[0] + "//" + url[2] + "/"; // url[1] = '' !!! (http:// or https://)
var passwords = document.querySelectorAll("input[type=password]"); // all input fields of type password in page
var parents = [];
for (var i = 0; i < passwords.length; i++) {
    parents[i] = parentForm(passwords[i]);
}
for (var i = 0; i < parents.length; i++){
    var parent = parents[i];
    if (parent) {
        if (parent.querySelectorAll("input[type=submit]")) {
            parent.addEventListener("submit", function () {
                var uname, password, parent_id;
                var inputs = parent.querySelectorAll("input[type=text], input[type=email], input[type=password]"); // all inputs in form which are text/email
                for (var j = 0; j < inputs.length - 1; j++) {
                    if (inputs[j].type !== 'password' && inputs[j + 1].type === 'password') {
                        uname = inputs[j].value;
                        password = inputs[j + 1].value;
                        parent_id = parent.id;
                        break;
                    }
                }
                while (!uname && !password){
                    for (var k = 0; k < parents.length; k++){
                        if (parents[k] !== parent){
                            inputs = parents[k].querySelectorAll("input[type=text], input[type=email], input[type=password]"); // all inputs in form which are text/email
                            for (var j = 0; j < inputs.length - 1; j++) {
                                if (inputs[j].type !== 'password' && inputs[j + 1].type === 'password') {
                                    uname = inputs[j].value;
                                    password = inputs[j + 1].value;
                                    parent_id = parents[k].id;
                                    break;
                                }
                            }
                        }
                    }
                }
                var details = [parent_id, uname, password]; // should take values only on submit!
                // should send details to background, which then should check if new page has no password fields!
                chrome.runtime.sendMessage({request: "fetch_details", details: details});
            });
        }
    }
}
