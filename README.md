Namerizer
=========

Change the name of your facebook contacts! 

Our chrome extension is available at: http://chrome.google.com/webstore/detail/namerizer/hpciladepbpfoobjnmngnhfbaoofgejh

Namerizer is composed of a chrome extension and a web service.

The extension is written in javascript and modifies the content displayed when you browse facebook. It searches occurrences of names from your friends, and replace them with custom nicknames (id validation is performed, so friends with the same name are not a problem). You can set nicknames by going to a friend's profile and clicking the nickname button in their cover photo.

The web service is written in Go and runs on appengine. It stores all nicknames you've given to other people, and provides this information to the clients running the extension. It also has an API to view the most common nicknames someone has (the chrome extension uses this to show a new field in your friends about section).

Development
-----------

This project was started at a 24 hour Facebook hackathon, version 1 is the last commit made during that hackathon.

We welcome contributors :) Just send a reasonable pull request.
