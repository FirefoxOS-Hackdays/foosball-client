"use strict";

// -- Initial version from seth! (https://github.com/sethladd/box2d-javascript-fun/tree/master/static/07)
// severly modified.
//
// ------------------------------------------------------------------------------------------------

// 
// car - car this wheel belongs to
// x - horizontal position in meters relative to car's center
// y - vertical position in meters relative to car's center
// width - width in meters
// height - height in meters
// revolving - does this wheel revolve when steering?
// powered - is this wheel powered?
//
function Wheel(params){

  this.car=params.car;
  this.revolving=params.revolving;
  this.powered=params.powered;
  this.width = params.width;
  this.height = params.height;
  RectangleEntity.call(this, params);
}

Wheel.prototype = new RectangleEntity();

Wheel.prototype.constructor = Wheel;


// create a corresponding Box2D body and fixture for this entity
//
Wheel.prototype.createbody = function(world) {

  if( this.bodyless ) {
    return; // this type of entity doesn't have associated phsyical object
  }

  // safety checks, because creating bodies with wrong parameters messes things BADLY
  if( isNaN(this.width) || isNaN(this.height) || isNaN(this.x) || isNaN(this.y) ) {
    console.log("Wheel: Attempt to create body with invalid definition.");
    return;
  }
  if( typeof this.car == 'undefined' || !this.car.body ) {
    console.log("Wheel: Attempt to create wheels before body.");
    return;
  }

  //initialize body
  RectangleEntity.prototype.createbody.call(this, world);

  // var def=new b2BodyDef();
  // def.type = b2Body.b2_dynamicBody;
  // def.position=this.car.body.GetWorldPoint(new b2Vec2(this.x, this.y));
  // def.angle=this.car.body.GetAngle();
  // def.userData=this;
  // this.body=world.CreateBody(def);
  
  //initialize shape

  // BIG TODO: move this to World

  //create joint to connect wheel to body
  if(this.revolving){
      var jointdef=new b2RevoluteJointDef();
      jointdef.Initialize(this.car.body, this.body, this.body.GetWorldCenter());
      jointdef.enableMotor=false; //we'll be controlling the wheel's angle manually
  }else{
      var jointdef=new b2PrismaticJointDef();
      jointdef.Initialize(this.car.body, this.body, this.body.GetWorldCenter(), new b2Vec2(1, 0));
      jointdef.enableLimit=true;
      jointdef.lowerTranslation=jointdef.upperTranslation=0;
  }
  // TODO: migrate to world
  world.world.CreateJoint(jointdef);

}

// Wheel.prototype.draw = function(params) {
//   params.ctx.save();
//   params.ctx.translate(this.x * SCALE, this.y * SCALE);
//   params.ctx.rotate(this.angle);
//   params.ctx.translate(-(this.x) * SCALE, -(this.y) * SCALE);
//   params.ctx.fillStyle = 'white';
//   params.ctx.fillRect((this.x-this.width/2) * SCALE,
//                (this.y-this.height/2) * SCALE,
//                (this.width) * SCALE,
//                (this.height) * SCALE);
//   params.ctx.restore();
  
//   RectangleEntity.prototype.draw.call(this, params);
// };

// Wheel.prototype.getLocalVelocity=function(){
//     /*returns get velocity vector relative to car
//     */
//     var res=this.car.body.GetLocalVector(this.car.body.GetLinearVelocityFromLocalPoint(new b2Vec2(this.X, this.y)));
//     return [res.x, res.y];
// };

// Wheel.prototype.getDirectionVector=function(){
//     /*
//     returns a world unit vector pointing in the direction this wheel is moving
//     */
//     return vectors.rotate((this.getLocalVelocity()[1]>0) ? [0, 1]:[0, -1] , this.body.GetAngle()) ;
// };


// Wheel.prototype.getKillVelocityVector=function(){
//     /*
//     substracts sideways velocity from this wheel's velocity vector and returns the remaining front-facing velocity vector
//     */
//     var velocity=this.body.GetLinearVelocity();
//     var sideways_axis=this.getDirectionVector();
//     var dotprod=vectors.dot([velocity.x, velocity.y], sideways_axis);
//     return [sideways_axis[0]*dotprod, sideways_axis[1]*dotprod];
// };

// Wheel.prototype.killSidewaysVelocity=function(){
//     /*
//     removes all sideways velocity from this wheels velocity
//     */
//     var kv=this.getKillVelocityVector();
//     this.body.SetLinearVelocity(new b2Vec2(kv[0], kv[1]));

// };

    
// width - width of the car in meters
// height - height of the car in meters
// x,y - starting position of the car, array [x, y] in meters
// angle - starting angle of the car, degrees
// max_steer_angle - maximum angle the wheels turn when steering, degrees
// max_speed       - maximum speed of the car, km/h
// power - engine force, in newtons, that is applied to EACH powered wheel
// wheels - wheel definitions: [{x, y, rotatable, powered}}, ...] where
//          x is wheel position in meters relative to car body center
//          y is wheel position in meters relative to car body center
//          revolving - boolean, does this turn rotate when steering?
//          powered - is force applied to this wheel when accelerating/braking?
//
function Car(params){

  RectangleEntity.call(this, params);

  //state of car controls
  this.movement=MOVE_NONE;
  
  this.max_steer_angle=params.max_steer_angle;
  this.max_speed=params.max_speed;
  this.power=params.power;
  this.wheel_angle=0;//keep track of current wheel angle relative to car.
                     //when steering left/right, angle will be decreased/increased gradually over 200ms to prevent jerkyness.
  this.width = params.width;
  this.height = params.height;

  this.angle = params.angle;

  //initialize wheels
  this.wheels=[]
  var wheeldef, i;
  for(i=0;i<params.wheels.length;i++){
      wheeldef=params.wheels[i];
      // set position relative to car
      wheeldef.x = this.x + this.width/2 + wheeldef.x - wheeldef.width/2;
      wheeldef.y = this.y + this.height/2 + wheeldef.y - wheeldef.height/2;
      wheeldef.doesntcollide = true;
      wheeldef.car = this;
      wheeldef.angle = params.angle;
      this.wheels.push(new Wheel(wheeldef));
  }
}

Car.prototype = new RectangleEntity();

Car.prototype.constructor = Car;

// create a corresponding Box2D body and fixture for this entity
Car.prototype.createbody = function(world) {

  if( this.bodyless ) {
    return; // this type of entity doesn't have associated phsyical object
  }

  // safety check
  if( isNaN(this.width) || isNaN(this.height) || isNaN(this.x) || isNaN(this.y) ) {
    console.log("Car: Attempt to create body with invalid definition.");
    return;
  }

  RectangleEntity.prototype.createbody.call(this, world);

  //initialize body
  // var def=new b2BodyDef();
  // def.type = b2Body.b2_dynamicBody;
  // def.position=new b2Vec2(this.x, this.y);
  // def.angle=this.angle*(Math.PI/180); // degrees to radians
  // def.linearDamping=2;  //gradually reduces velocity, makes the car reduce speed slowly if neither accelerator nor brake is pressed
  // def.bullet=true; //dedicates more time to collision detection - car travelling at high speeds at low framerates otherwise might teleport through obstacles.
  // def.angularDamping=2;
  // def.userData=this;
  // this.body=world.CreateBody(def);
  
  //initialize shape
  // var fixdef= new b2FixtureDef();
  // fixdef.density = 1.0;
  // fixdef.friction = 0.3; //friction when rubbing agaisnt other shapes
  // fixdef.restitution = 0.4;  //amount of force feedback when hitting something. >0 makes the car bounce off, it's fun!
  // fixdef.shape=new b2PolygonShape;
  // fixdef.shape.SetAsBox(this.width/2, this.height/2);
  // this.body.CreateFixture(fixdef);

  // create wheels
  for(var w in this.wheels) {
    this.wheels[w].createbody(world);
  }
  
}

Car.prototype.draw = function(params) {
  // may need to take into account center of mass {x: body.GetWorldCenter().x, y: body.GetWorldCenter().y}
  // var x = this.x, y = this.y, angle = this.angle;
  // params.ctx.save();
  // params.ctx.translate(x * SCALE, y * SCALE);
  // params.ctx.rotate(angle);
  // // the drawing is centered in the middle of the car now

  // params.ctx.beginPath();
  // params.ctx.fillStyle = 'black';
  // params.ctx.moveTo(-(this.width/2) * SCALE+1, -(this.height/2) * SCALE+1);
  // params.ctx.lineTo( (this.width/2) * SCALE+1, -(this.height/2) * SCALE+1 );
  // params.ctx.lineTo( (this.width/2) * SCALE+1, (this.height/2) * SCALE+1);
  // params.ctx.lineTo(-(this.width/2) * SCALE+1, (this.height/2) * SCALE+1);
  // params.ctx.lineTo(-(this.width/2) * SCALE+1, -(this.height/2) * SCALE+1);
  // params.ctx.closePath();
  // params.ctx.fill();
  // params.ctx.stroke();

  // params.ctx.fillStyle = 'green';
  // params.ctx.beginPath();
  // params.ctx.moveTo(-(this.width/2) * SCALE, -(this.height/2) * SCALE);
  // params.ctx.lineTo( (this.width/2) * SCALE, -(this.height/2) * SCALE );
  // params.ctx.lineTo( (this.width/2) * SCALE, (this.height/2) * SCALE);
  // params.ctx.lineTo(-(this.width/2) * SCALE, (this.height/2) * SCALE);
  // params.ctx.lineTo(-(this.width/2) * SCALE, -(this.height/2) * SCALE);
  // params.ctx.closePath();
  // params.ctx.fill();
  // params.ctx.stroke();


  // params.ctx.beginPath();
  // params.ctx.moveTo(0, -(2*this.height/3) * SCALE);
  // params.ctx.lineTo( (this.width/3) * SCALE, -(this.height/4) * SCALE);
  // params.ctx.lineTo(-(this.width/3) * SCALE, -(this.height/4) * SCALE);
  // params.ctx.lineTo(0, -(2*this.height/3) * SCALE);
  // params.ctx.closePath();
  // params.ctx.fill();
  // params.ctx.stroke();

  // params.ctx.restore();
  
  RectangleEntity.prototype.draw.call(this, params);
};

Car.prototype.getPoweredWheels=function(){
    //return array of powered wheels
    var retv=[];
    for(var i=0;i<this.wheels.length;i++){
        if(this.wheels[i].powered){
            retv.push(this.wheels[i]);
        }
    }
    return retv;
};

// Car.prototype.getLocalVelocity=function(){
//     /*
//     returns car's velocity vector relative to the car
//     */
//     var retv=this.body.GetLocalVector(this.body.GetLinearVelocityFromLocalPoint(new b2Vec2(0, 0)));
//     return [retv.x, retv.y];
// };

Car.prototype.getRevolvingWheels=function(){
    //return array of wheels that turn when steering
    var retv=[];
    for(var i=0;i<this.wheels.length;i++){
        if(this.wheels[i].revolving){
            retv.push(this.wheels[i]);
        }
    }
    return retv;
};

Car.prototype.getSpeedKMH=function(){
    var velocity=this.body.GetLinearVelocity();
    var len=vectors.len([velocity.x, velocity.y]);
    return (len/1000)*3600;
};

Car.prototype.setSpeed=function(speed){
    /*
    speed - speed in kilometers per hour
    */
    var velocity=this.body.GetLinearVelocity();
    velocity=vectors.unit([velocity.x, velocity.y]);
    velocity=new b2Vec2(velocity[0]*((speed*1000.0)/3600.0),
                              velocity[1]*((speed*1000.0)/3600.0));
    this.body.SetLinearVelocity(velocity);

};

Car.prototype.update = function(msDuration, world){

        //1. KILL SIDEWAYS VELOCITY
        
        //kill sideways velocity for all wheels
        var i;
        for(i=0;i<this.wheels.length;i++){
            this.killOrthogonalVelocity(this.wheels[i].body);
        }
    
        //2. SET WHEEL ANGLE


        //calculate the change in wheel's angle for this update, assuming the wheel will reach is maximum angle from zero in 200 ms
        var incr=(this.max_steer_angle/500) * msDuration;
        
        if(this.movement & MOVE_RIGHT ){
            this.wheel_angle=Math.min(this.wheel_angle+incr, this.max_steer_angle); //increment angle without going over max steer
        }else if(this.movement & MOVE_LEFT){
            this.wheel_angle=Math.max(this.wheel_angle-incr, -this.max_steer_angle); //decrement angle without going over max steer
        }else{
          // if left/right is not pressed, gradually stabilize wheels
            if( this.wheel_angle<0 ) this.wheel_angle=Math.min(this.wheel_angle+incr, 0)
            else this.wheel_angle=Math.max(this.wheel_angle-incr, 0)
        }

        //update revolving wheels
        var rwheels=this.getRevolvingWheels();
        for(i=0;i<rwheels.length;i++){
            world.setangle(rwheels[i].body, this.angle + this.wheel_angle*Math.PI/180);
        }

        var force = 0;
        if(this.movement & MOVE_UP) {
          force = -SCALE;
        } else if(this.movement & MOVE_DOWN) {
          force = SCALE;
        }

        var velocity=this.body.GetLinearVelocity(); // velocity vector

        var pwheels=this.getPoweredWheels();
        for(i=0;i<pwheels.length;i++){
          var b = pwheels[i].body;
          var direction = b.GetTransform().R.col2.Copy(); 
          //var direction = new b2Vec2(1.0,0.0);
          direction.x = direction.x * force*(msDuration/10); /* multiplicar por velocidad */
          direction.y = direction.y * force*(msDuration/10); /* multiplicar por velocidad */
          b.ApplyForce(direction, b.GetPosition()); // aplicar fuerza en direccion a rueda
        }


        Entity.prototype.update.call(this, msDuration, world);
        for(var i in this.wheels) {
          this.wheels[i].update(msDuration, world);
        }

};

//This function applies a "friction" in a direction orthogonal to the body's axis, effectively making it move 'straight'.
// @see http://www.emanueleferonato.com/2009/04/06/two-ways-to-make-box2d-cars/
Car.prototype.killOrthogonalVelocity = function(targetBody){
  var localPoint = new b2Vec2(0,0);
  var velocity = targetBody.GetLinearVelocityFromLocalPoint(localPoint);
 
  var sidewaysAxis = targetBody.GetTransform().R.col2.Copy();
  sidewaysAxis.Multiply(b2Math.Dot(velocity,sidewaysAxis))

  targetBody.SetLinearVelocity(sidewaysAxis);//targetBody.GetWorldPoint(localPoint));
}

