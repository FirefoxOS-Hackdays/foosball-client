/* global Entity, SCALE, console */
// -------------------------------------------------------------------------------
'use strict';
// -------------------------------------------------------------------------------------------------------
// Circle is an entity in the world that has a circular shape. Update does nothing. Intended for extension.
// params:
//    id - unique entity identifier
//    x, y - position in world (center)
//    radius - circle radius
//    angle - rotation angle of the image - for most uses you don't want rotation
//    bodyless - whether this Sprite has a physical object associated to it
//    isstatic - whether that associated physycal object is defined as static in the world (doesn't move).
// -------------------------------------------------------------------------------------------------------
// id, x, y, center, radius
function CircleEntity( params ) {
  Entity.call(this, params);
  this.radius = params.radius;
  this.weight = params.weight;
  this.bullet = params.bullet;
  this.simulated3Drotation = { x: 0, y: 0};
}

CircleEntity.prototype = new Entity();

CircleEntity.prototype.constructor = CircleEntity;

CircleEntity.prototype.draw = function(params) {

  // not actually drawing anything
  Entity.prototype.draw.call(this, params);

  // in pixels
  var x = this.x * SCALE;
  var y = this.y * SCALE;
  var radius = this.radius * SCALE;

  params.ctx.save();
  // params.ctx.fillStyle = 'red';
  // params.ctx.strokeStyle = 'white';
  // params.ctx.beginPath();
  // // var pos = world.getposition(this.body);
  // params.ctx.arc(x, y, radius, 0 /* starting angle */,
  //   Math.PI * 2 /* a circle */, true /* antiClockwise */);
  // params.ctx.closePath();
  // params.ctx.stroke();

  var x1 = x;
  var x2 = x;
  var y1 = y;
  var y2 = y;
  var r1 = radius;
  var r2 = radius * 0.2;
  // first circle
  var radialGradient1 = params.ctx.createRadialGradient(x1, y1, r1, x2, y2, r2);
  // radialGradient1.addColorStop(0, 'rgba(0, 0, 0, 1.0)'); // transparent rectangle
  radialGradient1.addColorStop(0.2, 'rgb(0, 200, 235)');
  radialGradient1.addColorStop(1, 'rgb(0, 210, 245)');
  params.ctx.fillStyle = radialGradient1;
  params.ctx.beginPath();
  params.ctx.arc(x1, y1, radius, 0, Math.PI * 2);
  params.ctx.closePath();
  params.ctx.fill();

  // simulated reflection
  var radialGradient3 = params.ctx.createRadialGradient(x1, y1, r1, x2, y2, r2);
  radialGradient3.addColorStop(0.2, 'rgba(200, 220, 210, 0.8)');
  radialGradient3.addColorStop(1, 'rgba(200, 235, 230, 0.8)');
  params.ctx.fillStyle = radialGradient3;
  params.ctx.beginPath();
  params.ctx.arc(x1, y1, radius, 0, Math.PI * 2);
  params.ctx.clip();
  params.ctx.beginPath();
  var incX = Math.abs(this.simulated3Drotation.x * SCALE) % (4*radius);
  var incY = Math.abs(this.simulated3Drotation.y * SCALE) % (4*radius);
  params.ctx.arc(x1 + (2*radius - incX), y1 + (2*radius - incY), radius,
    0, Math.PI * 2);
  params.ctx.closePath();
  params.ctx.fill();


  params.ctx.restore();
};

// create a corresponding Box2D body and fixture for this entity
CircleEntity.prototype.createbody = function(world) {

  if( this.bodyless ) {
    return; // this type of entity doesn't have associated phsyical object
  }

  // safety check
  if( isNaN(this.radius) || isNaN(this.x) || isNaN(this.y) ) {
    console.log("Circle: Attempt to create body with invalid definition.");
    return;
  }

  this.body = world.newCircleBody({x: this.x, y: this.y, radius: this.radius,
    ref: this, isstatic: this.isstatic, doesntcollide: this.doesntcollide,
    weight: this.weight, bullet: this.bullet });
};