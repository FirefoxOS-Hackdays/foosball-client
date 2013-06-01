var SliderController = function(slider) {
  this.slider = slider;
  this.startTouch = 0;
  this.timeStart = 0;
  this.currentOffset = 0;

  var isTouch = 'ontouchstart' in window;

  var touchstart = isTouch ? 'touchstart' : 'mousedown';
  var touchmove = isTouch ? 'touchmove' : 'mousemove';
  var touchend = isTouch ? 'touchend' : 'mouseup';

  var self = this;
  this.slider.addEventListener(touchstart, function onTouchStart(event) {
    var touch = event.touches ? event.touches[0] : event;
    self.startTouch = touch.pageY;
    self.currentOffset = 0;
    self.timeStart = Date.now();
  });

  this.slider.addEventListener(touchmove, function onTouchMove(event) {
    var touch = event.touches ? event.touches[0] : event;
    var currentPos = touch.pageY;
    self.currentOffset = self.startTouch - currentPos;
    var currentTime = Date.now();
    var currentTimeOffset = currentTime - self.timeStart;
    var velocity = self.currentOffset / currentTimeOffset;
    if (currentTimeOffset >= 50) {
      // Send event
      self.timeStart = currentTime;
      self.startTouch = currentPos;
      WsController.send({
        action: 'slide',
        speed: velocity
      })
      console.log("MOUSE MOVE " + self.currentOffset/currentTimeOffset);
    }
  });

  this.slider.addEventListener(touchend, function onTouchEnd(event) {
    var touch = event.touches ? event.touches[0] : event;
    self.currentOffset = self.startTouch - touch.pageY;
    var currentTime = Date.now();
    var currentTimeOffset = currentTime - self.timeStart;
    console.log("MOUSE MOVE " + self.currentOffset + " " + currentTimeOffset);
  });
};
