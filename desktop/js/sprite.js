// -------------------------------------------------------------------------------
"use strict";
// -------------------------------------------------------------------------------------------------------
// Sprite is an entity in the world that has a rectangular shape and an associated image. The image
//  can be changed during update, but the default implementation does nothing.
// params:
//    id - unique entity identifier
//    x, y - position in world (top left)
//    imageid - image to draw
//    angle - rotation angle of the image - for most uses you don't want rotation
//    bodyless - whether this Sprite has a physical object associated to it
//    isstatic - whether that associated physycal object is defined as static in the world (doesn't move).
//    game - game instance
// -------------------------------------------------------------------------------------------------------
//
function Sprite( params ) {
  this.game = params.game;
  var r = this.game.getSprite( params.imageid );
  if( !r ) {
    console.log( "Sprite id :" + params.id + " references invalid image");
    return;
  }

  // body width/heihgt can be different thatn physical dimensiosn due to margin
  this.margins = {top:r.sprite.top/SCALE,
    left:r.sprite.left/SCALE,
    right:r.sprite.right/SCALE,
    bottom:r.sprite.bottom/SCALE};

  params.width = r.sprite.w/SCALE - this.margins.left - this.margins.right;
  params.height = r.sprite.h/SCALE - this.margins.top - this.margins.bottom;
  params.x += this.margins.left;
  params.y += this.margins.top;
  RectangleEntity.call(this, params);
  this.imageid = params.imageid;
  this.bodyless = params.bodyless;
}

Sprite.prototype = new RectangleEntity();

Sprite.prototype.constructor = Sprite;
    
// -------------------------------------------------------------------------------------------------------
// draw - draw sprite image
// params:
//   ctx: graphic context
//   isSelected: object is selected (usually mouse pressed or touched)
// -------------------------------------------------------------------------------------------------------
//
Sprite.prototype.draw = function(params) {
  // params.ctx.save();

  var r = this.game.getSprite(this.imageid);
  var xpos = this.x - this.width/2;
  var ypos = this.y - this.height/2;

  // rotated sprites based on angle, avoid if angle is cero
  var hasangle = this.angle;
  if(hasangle) {
  // for debugging, it's useful to enable this from time to time
    params.ctx.save();
    params.ctx.translate(this.x * SCALE, this.y * SCALE);
    params.ctx.rotate(this.angle);
    params.ctx.translate(-(this.x) * SCALE, -(this.y) * SCALE);
  }

  // for scaled drawing:
  // params.ctx.drawImage( r.image, r.sprite.x, r.sprite.y, r.sprite.w, r.sprite.h,
  //   (this.x-this.width/2)*SCALE, (this.y-this.height/2)*SCALE,
  //   this.width*SCALE, this.height*SCALE );

  params.ctx.drawImage( r.image,
    xpos*SCALE - this.margins.left*SCALE,
    ypos*SCALE - this.margins.top*SCALE);

  if(hasangle) {
    params.ctx.restore();
  }
  
  RectangleEntity.prototype.draw.call(this, params);
}

// -------------------------------------------------------------------------------------------------------
// createbody - Create underlying Box2D physical object, if it has one.
// -------------------------------------------------------------------------------------------------------
//
Sprite.prototype.createbody = function(world) {

  RectangleEntity.prototype.createbody.call(this, world);

  // move to adjusted position (margins may have affected where it's actually located)
  var pos = world.getposition(this.body);
  this.x = pos.x;
  this.y = pos.y;

}
