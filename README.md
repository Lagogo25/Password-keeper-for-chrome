# Password keeper for chrome

Use this chrome extension to save all of your web accounts details encrypted on a node server running as an Amazon AWS EC2 instance.

**If you wish to run locally (and not depend on my server, which is fine) you can clone my [node_server](https://github.com/Lagogo25/node_server.git) and run it. Just change the following line in background.js (line 21):
```
var socket = io('http://52.23.199.193:1337');
```
to:
```
var socket = io('http://localhost:1337');
```
Make sure to read node_server.js README to know how to run it.**

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

To use this extension you must be using Google Chrome browser:

```
Google Chrome browser: https://www.google.com/chrome/browser/desktop/index.html
```

### Installing

```
git clone https://github.com/Lagogo25/Password-keeper-for-chrome.git
```

Then on your chrome browser enter the following the address:

```
chrome://extensions
```

Make sure the "Developer mode" box is checked and click "Load unpacked extension...". Find the directory in which you cloned the extension and select it.
Make sure it is Enabled by checking the box.

You should see the key logo on next to your address bar. When clicking it, you should be able to sign in, or sign up.
**Once you sign in, all of your tabs will be reloaded, so make sure to back up whatever work you're doing before!**

## Contributing

At the moment this is an indepent project made mostly for school and private usage.
If one wishes to contribute to the project/server, please contact me by mail: *lagogo@gmail.com*.

## Authors

* **Liraz Reichenstein** - *Full project* - [Lagogo25](https://github.com/Lagogo25)

See also the list of [contributors](https://github.com/Lagogo25/Password-keeper-for-chrome/contributors) who participated in this project.

## License

All code in here is written by me. I put a lot of effort writing this so please don't be rude, if you are using it, please give some credit. (Of course all code beside the one in the imported scripts)

## Acknowledgments

* Great thanks to [Evan Vosberg](https://github.com/brix) and his great Crypto library for javascript: [Crypto-JS](https://github.com/brix/crypto-js) 
* The people of [Socket.io](https://github.com/socketio/socket.io)
* A special thanks to my proffesor, [Dr. Itai Dinur](http://oldweb.cs.bgu.ac.il/faculty/person/dinuri.html) for the idea and guidance along the way.
