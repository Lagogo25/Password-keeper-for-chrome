/**
 * Created by lagogo on 19/06/2017.
 */

// chrome.runtime.sendMessage({request: "save_details", data: "hi"});
// alert("hi");

window.onload = function() {
    alert('hi!');
    var inputs = document.querySelectorAll("input[type=password]"); // all input fields of type password in page
//if (inputs){
// alert(inputs);
    var vals = [];
    for (var i = 0; i < Object.keys(inputs).length; i++) {
        vals[i] = inputs[i].id;
    }
    chrome.runtime.sendMessage({request: "save_details", data: vals});
};
