// -------------------------------------------------------------------------------
"use strict";
// -------------------------------------------------------------------------------------------------------
// Rectangle is an entity in the world that has a rectangular shape. Update does nothing.  Intended for extension.
// (see Sprite and AnimatedSprite)
// params:
//    id - unique entity identifier
//    x, y - position in world (top left corner)
//    width - width in world units
//    height - height in world units
//    angle - rotation angle of the image - for most uses you don't want rotation
//    bodyless - whether this Sprite has a physical object associated to it
//    isstatic - whether that associated physycal object is defined as static in the world (doesn't move).
//    doesntcollide - whether this object participates or not in collision detections
// -------------------------------------------------------------------------------------------------------
function RectangleEntity(params) {
  Entity.call(this, params);
  if( !params ) return;
  this.width = params.width;
  this.height = params.height;
  this.weight = params.weight;
  this.bullet = params.bullet;
  this.doesntcollide = params.doesntcollide;
  this.color = 'rgb(188,188,100)';
}

RectangleEntity.prototype = new Entity();

RectangleEntity.prototype.constructor = RectangleEntity;
    
RectangleEntity.prototype.draw = function(params) {

  // for debugging, it's useful to enable this from time to time
  params.ctx.save();
  params.ctx.translate(this.x * SCALE, this.y * SCALE);
  params.ctx.rotate(this.angle);
  params.ctx.translate(-(this.x) * SCALE, -(this.y) * SCALE);
  params.ctx.strokeStyle = this.color;
  params.ctx.strokeRect((this.x-this.width/2) * SCALE,
               (this.y-this.height/2) * SCALE,
               this.width*SCALE,
               this.height*SCALE);
  params.ctx.restore();
  
  Entity.prototype.draw.call(this, params);
}

// create a corresponding Box2D body and fixture for this entity
RectangleEntity.prototype.createbody = function(world) {

  if( this.bodyless ) {
    return; // this type of entity doesn't have associated phsyical object
  }

  // safety check
  if( isNaN(this.height) || isNaN(this.width) || isNaN(this.x) || isNaN(this.y) ) {
    console.log("Rectangle: Attempt to create body with invalid definition.");
    return;
  }

  this.body = world.newRectangleBody({x:this.x, y:this.y,
    width:this.width, height:this.height, ref:this, isstatic:this.isstatic,
    doesntcollide:this.doesntcollide, weight: this.weight,
    bullet : this.bullet });
}
