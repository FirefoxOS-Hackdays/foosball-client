
var WsConnector = new function () {

  var socket = new WebSocket('ws://proyectillos.com:8081/');
  var players = [];

  socket.onopen = function () {
    socket.send(JSON.stringify({action: 'create-game'}));
  };

  var shaking = false;
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
        direction: message.speed > 0 ? -1 : 1,
        force: message.speed
      });
    }

    if (message.action === 'shake') {
      if (shaking) {
        return;
      }
      shaking = true;
      setTimeout(function () {
        shaking = false;
      }, 1000)

      the_game.events.push({
        type: 'ball',
        force: 10,
        angle: {
          x: Math.random()*2 - 1,
          y: Math.random()*2 - 1
        }
      });

      //$('canvas').css({ "position": "relative" });
      for (var x = 1; x <= 3; x++) {
        $('canvas').animate({ left: -25 }, 10).animate({ left: 0 }, 50).animate({ left: 25 }, 10).animate({ left: 0 }, 50);
      }
    }
  };
};

