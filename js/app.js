
var WS_URL = 'ws://proyectillos.com:8081';
var sliderElement,
    joinRoom,
    roomNumber,
    joinView,
    gameView,
    playerNumber,
    initX,
    initY,
    initY,
    initTime;

var initContainers = function app_initContainers() {
  sliderElement = document.getElementById('slider');
  joinRoom = document.getElementById('join-room');
  roomNumber = document.getElementById('room-number');
  joinView = document.getElementById('join-view');
  gameView = document.getElementById('game-view');
};

var initHarlemShake = function initHarlemShake() {
  var i = 0;
  window.addEventListener("devicemotion", function (e) {
    if (e.accelerationIncludingGravity) {
      var currentX = e.accelerationIncludingGravity.x;
      var currentY = e.accelerationIncludingGravity.y;
      var currentZ = e.accelerationIncludingGravity.z;
      if (!initX) {
        initTime = Date.now();
        initX = currentX;
        initY = currentY;
        initZ = currentZ;
        return;
      }

      var shakingX = (currentX - initX) > 70;
      var shakingY = (currentY - initY) > 40;
      var shakingZ = (currentZ - initZ) > 10;

      if (shakingX && shakingY) {
        WsController.send({
          action: 'shake',
          power: 1
        })
      }

      if (initZ < 0 && shakingZ && !shakingX && !shakingY) {
        WsController.send({
          action: 'shoot',
          power: 1
        })
      }

      initX = currentX;
      initY = currentY;
      initZ = currentZ;
    }
  });
}

window.addEventListener('DOMContentLoaded', function onDOMLoaded() {
  initContainers();
  var slider = SliderController(sliderElement);

  joinRoom.onclick = function onClick(event) {
    WsController.init(WS_URL, function onConnect() {
      WsController.listen(function onMessage(msg) {
        if (msg.action === 'player-joined') {
          var color = msg.playerNum === 0 ? 'red' : 'green';
          sliderElement.classList.add(color);
        }
      });

      initHarlemShake();

      WsController.send({
        action: 'join-game',
        token: roomNumber.value
      });

      gameView.classList.remove('hidden');
      joinView.classList.add('hidden');
      gameView.classList.remove('fadeOut');

    });
  };
});
