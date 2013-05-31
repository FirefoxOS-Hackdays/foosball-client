// Modeled following  https://github.com/sethladd/box2d-javascript-fun/tree/master/static/07 
"use strict";

// Initialize this Entity with basic values common to all entities
//  id, x, y, center, isstatic
//
function Entity( params ) {

  if( ! params ) {
    return;          // ok... not sure about this, prototype calls it when building the hierarchy
  }

  this.id = params.id;
  this.x = params.x;
  this.y = params.y;
  this.angle = params.angle ? params.angle : 0;
  this.center = params.center ? params.center : {x:null, y:null};
  this.isstatic = params.isstatic ? true : false;
}
 
// Change internal variables as needed, prepare for next draw
//   
Entity.prototype.update = function(elapsedMs, world) {
  // copy from physical body
  if( !this.bodyless && this.body ) {
    var pos = world.getposition(this.body);
    this.x = pos.x;
    this.y = pos.y;
    // this.center = {x: this.body.GetWorldCenter().x, y: this.body.GetWorldCenter().y}; // TODO CHECK
    this.center = world.getposition(this.body);
    this.angle = world.getangle(this.body);
  }
}
 
// draw this entity -- subclases must draw themselves, this only draws center points   
// params:
//   ctx: graphic context
//   isSelected: object is selected (usually mouse pressed or touched)
//
Entity.prototype.draw = function(params) {

  if( params.isSelected && !this.bodyless ) {
    params.ctx.save();
    params.ctx.strokeStyle = 'yellow';
    params.ctx.beginPath();
    // var pos = world.getposition(this.body);
    params.ctx.arc(this.x * SCALE, this.y * SCALE, 20+20*Math.random() /* radius */, 0 /* starting angle */, Math.PI * 2 /* a circle */, true /* antiClockwise */);
    params.ctx.closePath();
    params.ctx.stroke();
    params.ctx.restore();
  }

  // // draw angle (I activate this from time to time, for testing)
  // if( this.body ) {
  //   ctx.save();
  //   ctx.strokeStyle = 'red';
  //   ctx.beginPath();
  //   ctx.moveTo(this.body.GetPosition().x*SCALE, this.body.GetPosition().y*SCALE);
  //   var x = -Math.sin(this.body.GetAngle()), y = Math.cos(this.body.GetAngle());
  //   ctx.lineTo(this.body.GetPosition().x*SCALE + x*SCALE, this.body.GetPosition().y*SCALE + y*SCALE );
  //   ctx.closePath();
  //   ctx.stroke();
  //   ctx.restore();
  // }
  
}

