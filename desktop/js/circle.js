// -------------------------------------------------------------------------------
"use strict";
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
}

CircleEntity.prototype = new Entity();

CircleEntity.prototype.constructor = CircleEntity;
    
CircleEntity.prototype.draw = function(params) {

  // not actually drawing anything
  Entity.prototype.draw.call(this, params);
}

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
}