# Matti wird Millionär
[![CodeFactor](https://www.codefactor.io/repository/github/logianer/mattiwirdmillionaer/badge)](https://www.codefactor.io/repository/github/logianer/mattiwirdmillionaer)   
Here is the code of the #missionsilent-Project "Matti wird Millionär"   
 
## 0. Dependencies
- [OBS-Studio](https://obsproject.com/)
  - [obs-websocket](https://obsproject.com/forum/resources/obs-websocket-remote-control-obs-studio-from-websockets.466/)
  - [move-transition](https://obsproject.com/forum/resources/move-transition.913/)

The last 2 ones are plugins for obs, move-transition makes these cool transitions and logging in the answers so easy and obs-websocket creates a connection between the nodejs server and the program.

## 1. Installation
Before you start the nodejs server, please make sure that you have imported the scene-collection (`ScenesImport.json`) into OBS via `Scene Collection > Import`.  Now open the scene collection.   
You can now install the required modules using the command `npm install` in the directory of the nodejs-files.   

## 2. Usage
To run the server just type `node index.js` and open the webpage `http://localhost:3000/moderator?token=missionsilent`, You'll se the Admin Interface.  
The questions are stored in `questions.json`

### 3. Notes
The whole project is in german as the streamer this was made for also streams in german. If you want to take the time you could translate the whole thing, make a PR and I'll open a new branch and credit you properly of course..

