// -------------------------------------------------------------------------------
"use strict";
// -------------------------------------------------------------------------------------------------------
// AnimatedSprite is a sprite that has the concept of 'animation sets', for all possible directions it
//  can be facing, and based on time and movement one of the images in the current set is chosen/drawn.
// params:
//    id - unique entity identifier
//    spritesup, spritesleft, spritesdown, spritesright - images to use when facing each direction
//    optional parameters:
//      spritesupleft, spritesdownleft, spritesdownright, spritesupright - images to use for diagonals
//      spritesstanding - images to use when not moving if this sprite has the 'standing' concept
//    speed - meters per secondç
//    game - the 'game' instance, used to get resources
//
// * Note: when not moving and not 'standing' set of sprites defined, then the FIRST sprite of each
//         set is used.
// -------------------------------------------------------------------------------------------------------
function AnimatedSprite(pars){

    if( pars.weight ) {
      this.weight = pars.weight;
    }

    // animation sets - each of these is a set of 'imageids' than can be looked up from sprite-definitons.js
    this.spritesstanding = pars.spritesstanding;
    this.spritesleft = pars.spritesleft;
    this.spritesright = pars.spritesright;
    this.spritesup = pars.spritesup;
    this.spritesdown = pars.spritesdown;
    if( pars.spritesupleft ) this.spritesupleft = pars.spritesupleft;
    else this.spritesupleft = pars.spritesleft;
    if( pars.spritesupright) this.spritesupright = pars.spritesupright;
    else this.spritesupright = pars.spritesright;
    if( pars.spritesdownleft ) this.spritesdownleft = pars.spritesdownleft;
    else this.spritesdownleft = pars.spritesleft;
    if( pars.spritesdownright ) this.spritesdownright = pars.spritesdownright;
    else this.spritesdownright = pars.spritesright;

    // speed
    this.speed = pars.speed;

    // game itself
    this.game = pars.game;

    // current animation
    this.elapsedMsTotal = Math.random()*1000; // add a bit of randomness so that they don't all look the same
    this.currentspriteset =  this.spritesleft;
    this.currentspriteinset = 0;

    this.movement = MOVE_NONE;

    // get dimensions from first sprite - TODO: CURRENTLY, AnimatedSprites must have images of same size or this will not really work
    var r = this.game.getSprite(this.spritesleft[0]);
    pars.width = (r.sprite.w-r.sprite.left-r.sprite.right) / SCALE;  // units in box2d's 'meters'
    pars.height = (r.sprite.h-r.sprite.bottom-r.sprite.top) / SCALE;
    // pars.x += r.sprite.left/SCALE;
    // pars.y += r.sprite.top/SCALE;
    RectangleEntity.call(this, pars );
}

AnimatedSprite.prototype = new RectangleEntity();

AnimatedSprite.prototype.constructor = AnimatedSprite;

// -------------------------------------------------------------------------------------------------------
// draw - draw current sprite image
// params:
//   ctx: graphic context
//   isSelected: object is selected (usually mouse pressed or touched)
// -------------------------------------------------------------------------------------------------------
//
AnimatedSprite.prototype.draw = function(params) {

  // draw the sprite
  var r = this.game.getSprite(this.currentspriteset[this.currentspriteinset]);
  params.ctx.drawImage( r.image,
    (this.x-this.width/2)*SCALE-r.sprite.left,
    (this.y-this.height/2)*SCALE-r.sprite.top );

  // this snippet is useful when trying to figure out what direction it's facing
    // params.ctx.fillStyle = 'yellow';
    // params.ctx.fillText( ""+a,  (this.x-this.width/2)*SCALE-r.sprite.left, (this.y-this.height/2)*SCALE-r.sprite.top );

  // finish by calling parent
  RectangleEntity.prototype.draw.call(this, params);
}

// -------------------------------------------------------------------------------------------------------
// update - Calculate next animation state and animation sets based on direction, update model and move.
// -------------------------------------------------------------------------------------------------------
//
AnimatedSprite.prototype.update=function(elapsedMs, world){

  // stop
  // killOrthogonalVelocity(this.body);
  this.elapsedMsTotal += elapsedMs;

 // choose increment based on time since las update, independent from frame rate
  var incr = this.speed * elapsedMs;
  var pos = world.getposition(this.body);
  this.x = pos.x;
  this.y = pos.y;

  // calculate movement vector
  var direction = {x:0, y:0};
  if( this.movement & MOVE_RIGHT ) direction.x = incr; 
  else if( this.movement & MOVE_LEFT ) direction.x = -incr; 
  if( this.movement & MOVE_UP ) direction.y = -incr; 
  else if( this.movement & MOVE_DOWN ) direction.y = incr; 

  // update parent model
  RectangleEntity.prototype.update.call(this, elapsedMs, world);
  var bodypos = world.getposition(this.body);

  // Choose next sprite based on angle the user is facing
  // For any x and y not both equal to zero, atan2(y, x) is the angle in radians between the positive x-axis
  // of a plane and the point given by the coordinates (x, y) on it. The angle is positive for counter-clockwise
  // angles (upper half-plane, y > 0), and negative for clockwise angles (lower half-plane, y < 0).
  //
  // ex. atan2(1, 1) = π/4 and atan2(−1, −1) = −3π/4.
  if( direction.x == 0 && direction.y == 0) {
    this.nextanimation();
    return; // no movement, and it saves breaking atan2
  }

  // Understanding forces: http://www.emanueleferonato.com/2010/02/16/understanding-box2d-applicable-forces/
  // this.body.ApplyForce(direction, bodypos); // aplicar fuerza en direccion a donde queremos que se mueva
  // this.body.ApplyImpulse(direction, bodypos); // aplicar fuerza en direccion a donde queremos que se mueva
  world.setvelocity(this.body, direction);
  world.setangularvelocity(this.body, 0);

  var a = Math.atan2(direction.y, direction.x); // javascript's atan2 receives y, x parameters instead of x,y...
  world.setangle(this.body, a - Math.PI/2 );

  // choose sprite set based on angle
  // (add Math.PI to make it always positive, multiply for 4 to have 8 possible results)
  var a = world.getangle(this.body);
  // normalize angle, atan2 range is -pi, +pi
  a = Math.atan2( -Math.sin(a), Math.cos(a) );
  // for reference, results anti-clockwise:
  // [ math.atan2(0,1), math.atan2(1,1), math.atan2(1,0), math.atan2(1,-1), math.atan2(0,-1), math.atan2(-1,-1), math.atan2(-1,0), math.atan2(-1,1) ];
  // [0.0, 0.78539816339744828, 1.5707963267948966, 2.3561944901923448, 3.1415926535897931, -2.3561944901923448, -1.5707963267948966, -0.78539816339744828]

  /*  This is the angle value (multiple of PI) and the dirction the character is facing

                   -7/8 1 7/8
                 -6/8\  |  /6/8
               -5/8-_ \ | / _- 5/8
                     -_\|/_-
              -4/8------+------ 4/8
              -3/8   _-/|\-_  3/8
               -2/8_- / | \ -_ 2/8
                     /  |  \ 1/4
                 -1/8   0 1/8
                      
  */
  if( a > -1*Math.PI/8 && a < 1*Math.PI/8) this.currentspriteset = this.spritesdown;
  else if( a >= 1*Math.PI/8 && a < 3*Math.PI/8) this.currentspriteset = this.spritesdownright;
  else if( a >= 3*Math.PI/8 && a < 5*Math.PI/8) this.currentspriteset = this.spritesright;
  else if( a >= 5*Math.PI/8 && a < 7*Math.PI/8) this.currentspriteset = this.spritesupright;
  else if( a >= 7*Math.PI/8 || a < -7*Math.PI/8) this.currentspriteset = this.spritesup;
  else if( a < -5*Math.PI/8 && a >= -7*Math.PI/8) this.currentspriteset = this.spritesupleft;
  else if( a < -3*Math.PI/8 && a >= -5*Math.PI/8) this.currentspriteset = this.spritesleft;
  else if( a < -1*Math.PI/8 && a >= -3*Math.PI/8) this.currentspriteset = this.spritesdownleft;
  this.nextanimation();

};

AnimatedSprite.prototype.nextanimation = function () {
   // choose current sprite inside this spriteset, based on time since last frame
  if( this.movement == MOVE_NONE && this.spritesstanding ) {
    // sprite has animation for when standing
    this.currentspriteset = this.spritesstanding;
    this.currentspriteinset = Math.floor(this.elapsedMsTotal/150) % this.spritesstanding.length;
  } else if( this.movement != MOVE_NONE ) { // current frame on current animation
    this.currentspriteinset = Math.floor(this.elapsedMsTotal/150) % this.currentspriteset.length;
  } else if( this.movement == MOVE_NONE ) {
    this.currentspriteinset = 0; // default pos on current animation
  } 
}


// -------------------------------------------------------------------------------------------------------
// createbody - Create underlying Box2D physical object, if it has one.
// -------------------------------------------------------------------------------------------------------
//
AnimatedSprite.prototype.createbody = function(world) {

  RectangleEntity.prototype.createbody.call(this, world);

  // move to adjusted position (margins may have affected where it's actually located)
  var pos = world.getposition(this.body);
  this.x = pos.x;
  this.y = pos.y;

}
