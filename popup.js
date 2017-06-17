function displayLogin(state){
    document.getElementById("user-box").style.display = state;
    document.getElementById("pass-box").style.display = state;
    document.getElementById("buttons").style.display = state;
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

var background_page = chrome.extension.getBackgroundPage();

document.addEventListener('DOMContentLoaded', function() {
    if (!background_page.connected) {
        displayLogin('block');
        document.getElementById("sign-in").onclick = function () {
            document.getElementById("sign-in").disabled = true;
            var uname = document.getElementById("user-name").value;
            var password = document.getElementById("user-password").value;
            // check for input validity
            if (checkValid(uname, password)) {
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
                    user: uname,
                    password: password,
                    request: 'register'
                });
            }
            document.getElementById("sign-up").disabled = false;
        };
    }
    else {
        document.getElementById('sign-out').style.display = 'block';
        // we are already connected!
        // should add a sign out option (will send file to server and return to default)
        // on sign out should send file to server, disconnect, and change connected to false (chrome.runtime.reload()?)
        document.getElementById('status').innerHTML = background_page.user + " signed in.";
        document.getElementById('sign-out').onclick = function () {
            // should send file to server
            chrome.runtime.sendMessage({
                // should send file to server (will happen in background)
                request: 'update_server'
            });
        };
    }

    document.getElementById("user-name").addEventListener("keyup", function (event) {
        // event.preventDefault();
        if (event.keyCode === 13) {
            // alert("enter was pressed!");
            document.getElementById("user-password").focus();
        }
    });

    document.getElementById("user-password").addEventListener("keyup", function (event) {
        // event.preventDefault();
        if (event.keyCode === 13){
            document.getElementById("sign-in").click();
        }
    });
});


