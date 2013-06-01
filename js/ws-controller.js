var WsController = (function() {

  var controller;
  var initialized = false;

  var init = function ws_init(url, callback) {
    if (initialized) {
      callback();
      return;
    }

    initialized = true;
    controller = new WebSocket(url);
    controller.onopen = function onOpen() {
      callback();
    };
  };

  var send = function ws_send(message) {
    if (typeof message === 'string') {
      controller.send(message);
      return;
    }

    controller.send(JSON.stringify(message));
  };

  var disconnect = function ws_disconnect() {

  };

  var listen = function ws_listen(callback) {
    controller.onmessage = function(event) {
      callback(JSON.parse(event.data));
    }
  };

  return {
    init: init,
    send: send,
    listen: listen,
    disconnect: disconnect
  };
})();
