# Unawarewolf

This project is inspired by a real-life board game [One Night Ultimate Werewolf by Bezier games](https://beziergames.com/products/one-night-ultimate-werewolf).

This web implementation allows users to play the game while making cheating much more difficult, and minimizing human error (such as forgetting your own role).
It also allows for situations and card combinations that would be impossible in a real-life game, such as having multiple seers act at the same time.

## Current version
The current version is intended to be played in a local network, with each player sitting in the same room using the app from their smartphones.
All roles from the base game are currently supported.

In the future™, support for remote play could be implemented, and more roles may be added.

## Technology

Back-end:
  - Game logic: Python 3
  - Server functionality: Flask-socketio

Front-end:
  - Client-server communication: Socket.io
  - UI: React.js & vanilla CSS

The app is run in a local network by running the server.py file on the host machine.
