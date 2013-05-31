"use strict";

// id, x, y, center, points, bodyless, isstatic
function PolygonEntity( params ) {
  Entity.call(this, params);
  this.points = points;
  this.bodyless = bodyless;
  this.isstatic = isstatic;
}

PolygonEntity.prototype = new Entity();

PolygonEntity.prototype.constructor = PolygonEntity;

PolygonEntity.prototype.draw = function(params) {

  // for debugging, it's useful to enable this from time to time

  // params.ctx.save();
  // params.ctx.translate(this.x * SCALE, this.y * SCALE);
  // params.ctx.rotate(this.angle);
  // params.ctx.translate(-(this.x) * SCALE, -(this.y) * SCALE);
  // params.ctx.fillStyle = 'red';
  // params.ctx.beginPath();
  // params.ctx.moveTo((this.x + this.points[0].x) * SCALE, (this.y + this.points[0].y) * SCALE);
  // for (var i = 1; i < this.points.length; i++) {
  //    params.ctx.lineTo((this.points[i].x + this.x) * SCALE, (this.points[i].y + this.y) * SCALE);
  // }
  // params.ctx.lineTo((this.x + this.points[0].x) * SCALE, (this.y + this.points[0].y) * SCALE);
  // params.ctx.closePath();
  // params.ctx.fill();
  // params.ctx.stroke();
  // params.ctx.restore();
  
  Entity.prototype.draw.call(this, params);
}

// Create a box2d body for this shape
//
PolygonEntity.prototype.createbody = function(world) {

  if( this.bodyless ) {
    return; // this type of entity doesn't have associated phsyical object
  }

  // safety check
  if( !this.points || isNaN(this.x) || isNaN(this.y) ) {
    console.log("Sprite: Attempt to create body with invalid definition.");
    return;
  }

  var fixDef = new b2FixtureDef;
  fixDef.density = 1.0;
  fixDef.friction = 0.5;
  fixDef.restitution = 0.2;

  var bodyDef = new b2BodyDef;
  bodyDef.linearDamping = 16;  // -/these simulates floor friction, otherwise objects behave like in space
  bodyDef.angularDamping = 16; // /

  if( this.weight) {
    bodyDef.linearDamping += 16 + this.weight;
  }

  if( this.isstatic ) bodyDef.type = b2Body.b2_staticBody;
  else bodyDef.type = b2Body.b2_dynamicBody;

  var points = [];
  for (var i = 0; i < this.points.length; i++) {
      var vec = new b2Vec2();
      vec.Set(this.points[i].x, this.points[i].y);
      points[i] = vec;
  }
  fixDef.shape = new b2PolygonShape;
  fixDef.shape.SetAsArray(points, points.length);

  bodyDef.position.x = this.x;
  bodyDef.position.y = this.y;
  bodyDef.userData = this;
  this.body = world.CreateBody(bodyDef);
  this.body.CreateFixture(fixDef);
}
