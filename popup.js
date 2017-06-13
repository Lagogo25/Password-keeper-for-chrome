function displayLogin(state){
    document.getElementById("user-box").style.display = state;
    document.getElementById("pass-box").style.display = state;
    document.getElementById("buttons").style.display = state;
}
var background_page = chrome.extension.getBackgroundPage();

document.addEventListener('DOMContentLoaded', function() {
    if (!background_page.connected) {
        displayLogin('block');
        document.getElementById("sign-in").onclick = function () {
            document.getElementById("sign-in").disabled = true;
            document.getElementById("sign-in").disabled = true;
            chrome.runtime.sendMessage({
                user: document.getElementById("user-name").value,
                password: document.getElementById("user-password").value,
                request: 'login'
            });
            document.getElementById("sign-in").disabled = false;
        };
        document.getElementById("sign-up").onclick = function () {
            document.getElementById("sign-up").disabled = true;
            chrome.runtime.sendMessage({
                user: document.getElementById("user-name").value,
                password: document.getElementById("user-password").value,
                request: 'register'
            });
            document.getElementById("sign-up").disabled = false;
        };
    }
    else
        {
            // we are already connected!
            // should add a sign out option (will send file to server and return to default)
            document.getElementById('status').innerHTML = background_page.user + " signed in";
        }
});
