
var WsConnector = new function () {

  var socket = new WebSocket('ws://localhost:8081/');
  var players = [];

  socket.onopen = function () {
    socket.send(JSON.stringify({action: 'create-game'}));
  };

  socket.onmessage = function (message) {

    console.log(message.data);
    message = JSON.parse(message.data);

    console.log(message);

    if (message.action === 'game-created') {
      alert('Game PIN: ' + message.token);
    }

    if (message.action === 'player-joined') {
      players[message.playerNum] = true;
    }

    if (message.action === 'slide') {
      the_game.events.push({
        type: 'move',
        player: message.playerNum + 1,
        direction: 1,
        force: message.speed
      });
    }
  };
};

