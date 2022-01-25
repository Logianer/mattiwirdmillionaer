const http = require('http')
const express = require('express')
const path = require('path');
const jsondb = require('simple-json-db');
quests = new jsondb("questions.json")
const OBSWebSocket = require('obs-websocket-js');
const obs = new OBSWebSocket();
const tmi = require('tmi.js');
obs.connect({
  address: 'localhost:4444'
});
// DOCS: https://github.com/obsproject/obs-websocket/blob/4.x-current/docs/generated/protocol.md
const {
  promisify
} = require('util');
const app = express()
const server = http.createServer(app)
const io = require('socket.io')(server)

const port = process.env.PORT || 3000
var hostSecret = "missionsilent",
  questindex = 3,
  numberofvote = 0,
  login = null,
  money = {
    amount: 0,
    safeAmount: 0
  },
  client = null,
  votes = {}
server.listen(port, () => {
  console.log(`Server is up on port ${port}!`)
})
const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}
app.use(express.static("static"))
app.get("/moderator", (req, res) => {
  if(req.query.token != hostSecret) return res.status(401).send('Unauthorized');
  res.sendFile(__dirname + "/game/host.start.html")
})
async function timer(time) {
  while(time >= 0) {
    obs.send("SetTextGDIPlusProperties", {
      source: "VoteTimer",
      text: new Date(time * 1000).toISOString().substr(14, 5)
    })
    await sleep(1000)
    time--
  }
  obs.send("SetTextGDIPlusProperties", {
    source: "VoteTimer",
    text: `${Object.keys(votes).length} Stimmen`
  })
}

function votechatlistener() {
  client = new tmi.Client({
    channels: ['matthias_berger']
  });
  client.connect();
  client.on('message', (channel, tags, message, self) => {
    if(!message.startsWith("#vote")) return;
    if(!message.split(" ")[1]) return;
    votes[tags.username] = message.split(" ")[1].toUpperCase()
  });
}

function joker5050() {
  quest = quests.get("questions")[questindex]
  rnd1 = parseInt(Math.random() * 3)
  while(rnd1 == quest.rightAnswer) {
    rnd1 = parseInt(Math.random() * 3)
  }
  rnd2 = parseInt(Math.random() * 3)
  while(rnd2 == rnd1 || rnd2 == quest.rightAnswer) {
    rnd2 = parseInt(Math.random() * 3)
  }
  changeAnswer(rnd1, "")
  changeAnswer(rnd2, "")
  playSound("results")
}
async function jokervote() {
  numberofvote++
  obs.send("SetSceneItemRender", {
    'scene-name': "Hintergrund+UI",
    source: "JokerPub" + numberofvote,
    render: false
  })
  quest = quests.get("questions")[questindex]
  timer(60)
  playSound("voting", false, true)
  obs.send("SetSceneItemRender", {
    'scene-name': "Publikumsjoker",
    source: "Chart",
    render: false
  })
  obs.send("SetCurrentScene", {
    'scene-name': "Publikumsjoker"
  })
  votechatlistener()
  await sleep(62 * 1000)
  client.disconnect();
  vals = Object.values(votes)
  voteRes = []
  voteRes[0] = vals.filter(v => v == "A").length / vals.length // Antworten mit A : Antworten insg. => prozentsatz
  voteRes[1] = vals.filter(v => v == "B").length / vals.length
  voteRes[2] = vals.filter(v => v == "C").length / vals.length
  voteRes[3] = vals.filter(v => v == "D").length / vals.length
  voteRes.forEach((item, i) => {
    voteRes[i] = Math.round(item * 100)
  });
  console.log(await obs.send("SetSourceSettings", {
    sourceName: "Chart",
    sourceSettings: {
      url: `https://quickchart.io/chart/render/zm-dea5bdef-e6af-4f8f-aed8-83e71d4c7d68?data1=${voteRes.join(",")}`
    }
  }));
  obs.send("SetSceneItemRender", {
    'scene-name': "Publikumsjoker",
    source: "Chart",
    render: true
  })
  playSound(null, false, true)
  playSound("results")
  await sleep(2000)
  playSound("bg", true, true)
}

function changeAnswerState(answerID, state) {
  answer = ["A", "B", "C", "D"]
  states = ["Normal", "Log", "Right"]
  obs.send("SetSourceFilterVisibility", {
    sourceName: "Frage",
    filterName: `Ans${answer[answerID]}${states[state]}`,
    filterEnabled: true
  })
}
async function changeMoneyDisplay(index) {
  var tree = [0, 1, 2, 5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 85, 100]
  money.amount = tree[index]
  money.safeAmount = tree[index - (index % 5)] // finde die nächste sicherheitsstufe
  obs.send("SetSceneItemRender", {
    'scene-name': "Hintergrund+UI",
    source: "Gelder",
    render: false
  })
  obs.send("SetTextGDIPlusProperties", {
    source: "GeldText",
    text: `€ ${money.amount}`
  })
  t = ``
  if(money.amount != 100) t = `€ ${money.safeAmount}`
  obs.send("SetTextGDIPlusProperties", {
    source: "GeldTextSafe",
    text: t
  })
  await sleep(300)
  obs.send("SetSceneItemRender", {
    'scene-name': "Hintergrund+UI",
    source: "Gelder",
    render: true
  })
}

function win() {
  obs.send("SetSceneItemRender", {
    'scene-name': "Hintergrund+UI",
    source: "GeldBetrag",
    render: false
  })
  obs.send("SetTextGDIPlusProperties", {
    source: "GeldText",
    text: `€ ${money.amount}`
  })
  obs.send("SetCurrentScene", {
    'scene-name': "Gewinn"
  })
  playSound(null, false, true)
  playSound("winner", false, false)
  return;
}
async function playSound(shortname = null, loop = false, isMusic = false) {
  var dict = {
    "lobby": "music.lobby.mp3",
    "bg": "music.background.mp3",
    "start": "music.start.mp3",
    "winner": "music.youWonDaFuckinGame.mp3",
    "false": "sound.falseAnswer.mp3",
    "login": "sound.loggedIn.mp3",
    "results": "sound.pollResults.mp3",
    "true": "sound.trueAnswer.mp3",
    "voting": "music.voting.mp3"
  }
  sourceName = "Sounds"
  if(isMusic) sourceName = "Musik"
  obs.send("StopMedia", {
    sourceName
  })
  if(shortname == null) return;
  await sleep(200)
  obs.send("SetSourceSettings", {
    sourceName,
    sourceSettings: {
      looping: loop,
      local_file: `https://raw.githubusercontent.com/Logianer/mattiwirdmillionaer/main/static/${dict[shortname]}`
    }
  })
  console.log("playing sound " + dict[shortname]);
  await sleep(200)
  obs.send("PlayPauseMedia", {
    sourceName,
    playPause: false // aka. "kein pause"
  })
}

function changeQuestion(text) {
  obs.send("SetTextGDIPlusProperties", {
    source: "FragenText",
    text
  })
}

function changeAnswer(answerID, text) {
  answer = ["A", "B", "C", "D"]
  obs.send("SetTextGDIPlusProperties", {
    source: `Ans${answer[answerID]}Text`,
    text
  })
}

function setupNewQuestion(index) {
  quest1 = quests.get("questions")[index]
  changeQuestion(quest1.title)
  for(var i = 0; i < 4; i++) {
    changeAnswerState(i, 0)
    changeAnswer(i, quest1.answers[i])
  }
}
io.on("connection", async (socket) => {
  socket.on("start", async () => {
    setupNewQuestion(questindex)
    changeMoneyDisplay(0)
    playSound("start", false, true)
    await sleep(25 * 1000)
    playSound("bg", true, true)
  })
  socket.on("answer", async (id) => {
    login = id
    playSound("login")
    for(var i = 0; i < 4; i++) {
      changeAnswerState(i, 0)
    }
    await sleep(500)
    changeAnswerState(id, 1)
  })
  socket.on("resolve", () => {
    quest = quests.get("questions")[questindex]
    if(quest.rightAnswer == login) {
      changeMoneyDisplay(questindex + 1)
      playSound("true")
      changeAnswerState(login, 2)

    } else {
      playSound("false")
      changeAnswerState(quest.rightAnswer, 2)
    }
  })
  socket.on("next", async () => {
    quest = quests.get("questions")[questindex]
    if(quest.rightAnswer != login) {
      obs.send("SetSceneItemRender", {
        'scene-name': "Hintergrund+UI",
        source: "GeldBetrag",
        render: false
      })
      obs.send("SetTextGDIPlusProperties", {
        source: "GeldText",
        text: `€ ${money.safeAmount}`
      })
      obs.send("SetCurrentScene", {
        'scene-name': "Gewinn"
      })
      playSound(null, false, true)
      playSound("winner", false, false)
      return;
    }
    login = null
    questindex++
    if(quests.get("questions").length == questindex) {
      win()
      return;
    }
    obs.send("SetSceneItemRender", {
      'scene-name': "Gameboard",
      source: "Frage",
      render: false
    })
    await sleep(500)
    setupNewQuestion(questindex)
  })
  socket.on("questionVisibility", (vis) => {
    obs.send("SetSceneItemRender", {
      'scene-name': "Gameboard",
      source: "Frage",
      render: vis
    })
  })
  socket.on("panic", () => {
    obs.send("SetCurrentScene", {
      'scene-name': "Gameboard"
    })
  })
  socket.on("joker", (id) => {
    id = parseInt(id)
    if(id == 1) return joker5050();
    if(id == 0) return jokervote();
  })
})
obs.on("ConnectionOpened", () => {
  playSound("lobby", true, true)
  changeMoneyDisplay(0)
  obs.send("SetSceneItemRender", {
    'scene-name': "Gameboard",
    source: "Frage",
    render: false
  })
})
