/* global SCALE, Sprite, World, RectangleEntity, CircleEntity,
   requestAnimFrame, $, statustext, MOVE_LEFT, MOVE_RIGHT,
   MOVE_UP, MOVE_DOWN, MARGIN_VERT, MARGIN_HORIZ */
function Game(params) {
  'use strict';
  // create bound functions for callbacks, that refernce the 'this' object
  this.boundrender = this.render.bind(this);
  this.boundupdate = this.update.bind(this);

  // these define the frames per second both for rendering and updating
  this.updateDelay = 25; /* ~40 updates per second */
  this.renderDelay = 16; /* ~60 fps */

  // target drawing area
  this.canvas = params.canvas;

  // Total drawable entities
  this.entities = [];

  // Subgroups of entities, included in [entities]
  this.usercontrolled = [];

  // world dimensions (in world units)
  // - recalculated after loading maps
  this.map_width = 800 / SCALE;
  this.map_height = 480 / SCALE;

  // world viewport dimensions (in world units)
  // (!) these are recalculated every frame
  this.minimum_world_y = 0;
  this.minimum_world_x = 0;
  this.maximum_world_y = 300;
  this.maximum_world_x = 300;

  // for drag and drop, touch, selection etc
  this.mouseX = undefined;
  this.mouseY = undefined;
  this.mousePVec = undefined;
  this.isMouseDown = undefined;
  this.selectedEntity = undefined;
  this.controllingEntity = 0; // selected entity if it's one of the user controlled ones

  // ground layer, not included in [entities]
  // this.ground_tiles = [];
  this.tile_sizex_px = 32;
  this.tile_sizey_px = 32;
  this.tile_sizex_world = 32/SCALE;
  this.tile_sizey_world = 32/SCALE;

  // possible actions
  this.ACTION_PULL = 'pull';
  this.ACTION_BOMB = 'bomb';
  this.action = this.ACTION_PULL;

  // all the following will most probably be replaced at some point...
  this.last_created_in = -1; // used for creating elements at a pace

  // Pause world update
  this.pause = false;

  // Toggle debug view of underlying physics engine objects
  this.displayDebugInfo = false;

  // ground layers
  this.layers = [];
  // this.layers.push( this.ground_tiles );

  // reference to the drawing context
  this.ctx = this.canvas.getContext("2d");

  // mozilla - disable smooth resampling, just in case
  this.ctx.mozImageSmoothingEnabled=false;

  // physical world
  this.myworld = undefined;

  // current intensity (from user pressing key)
  this.pressStartedBall = 0;
  this.pressStartedPlayer1 = 0;
  this.pressStartedPlayer2 = 0;
  this.player1Direction = 0;
  this.player2Direction = 0;
  this.ballDirection = 0;

  // sizes
  this.PLAYER_WIDTH = 50 / SCALE;
  this.PLAYER_HEIGHT = 100 / SCALE;
  this.BALL_RADIUS = this.PLAYER_HEIGHT/8;
  this.GOAL_SIZE = this.BALL_RADIUS * 10;

  // events received from players
  this.events = [];
}

// --------------------------------------------------------------------------------------------
// Create world and shapes
// --------------------------------------------------------------------------------------------

Game.prototype.init = function() {

  var _this = this;

  // register keyboard and mouse listeners
  this.registerListeners();

  // Create a world that has no gravity, to simulate a top view
  this.myworld = new World();
  // choose implementation
  this.myworld.useBox2D();
  // this.myworld.useChipmunk();
  // do it...
  this.myworld.createworld({ gravity:{x:0,y:0} });

  // create objects

  this.player1 = new RectangleEntity({
    id: 100,
    x: (1*this.map_width)/5 - this.PLAYER_WIDTH,
    y: this.map_height/2 - this.PLAYER_HEIGHT/2,
    width: this.PLAYER_WIDTH,
    height: this.PLAYER_HEIGHT,
    angle: 0,
    bodyless: false,
    doesntcollide: false,
    isstatic: false,
    weight: 2
  });

  this.player2 = new RectangleEntity({
    id: 101,
    x: this.map_width - (1*this.map_width)/5,
    y: this.map_height/2 - this.PLAYER_HEIGHT/2,
    width: this.PLAYER_WIDTH,
    height: this.PLAYER_HEIGHT,
    angle: 0,
    bodyless: false,
    doesntcollide: false,
    isstatic: false,
    weight: 2
  });


  this.entities.push( this.player1 );
  this.entities.push( this.player2 );

  this.ball = new CircleEntity({
    id: 200,
    x: this.map_width/2,
    y: this.map_height/2,
    radius: this.BALL_RADIUS,
    angle: 0,
    bodyless: false,
    isstatic: false,
    bullet: true
  });
  this.entities.push( this.ball );

  // {x, y, w, h, isstatic, angle, ref}
  //create margins

  var bottom = new RectangleEntity({
    x: this.map_width / 2,
    y: this.map_height,
    width: this.map_width,
    height: 50 / SCALE,
    isstatic:true });

  var top = new RectangleEntity({
    x: this.map_width / 2,
    y: 0,
    width: this.map_width,
    height: 50 / SCALE,
    isstatic: true});

  var verticalSegmentSize = this.map_height / 2 - this.GOAL_SIZE / 2;
  var leftA = new RectangleEntity({
    x: 0,
    y: verticalSegmentSize / 2,
    width: 50 / SCALE,
    height: verticalSegmentSize,
    isstatic: true});

  var leftB = new RectangleEntity({
    id: 50,
    x: 0,
    y: this.map_height - verticalSegmentSize / 2,
    width: 50 / SCALE,
    height: verticalSegmentSize,
    angle: 0,
    doesntcollide: false,
    bodyless: false,
    isstatic: true});

  var rightA = new RectangleEntity({
    x: this.map_width,
    y: verticalSegmentSize / 2,
    width: 50 / SCALE,
    height: verticalSegmentSize,
    isstatic: true});

  var rightB = new RectangleEntity({
    x: this.map_width,
    y: this.map_height - verticalSegmentSize / 2,
    width: 50 / SCALE,
    height: verticalSegmentSize,
    isstatic: true});

  bottom.createbody(this.myworld);
  top.createbody(this.myworld);
  leftA.createbody(this.myworld);
  leftB.createbody(this.myworld);
  rightA.createbody(this.myworld);
  rightB.createbody(this.myworld);

  var disableVerticalMovement = function (body) {
    var jointDef = new Box2D.Dynamics.Joints.b2PrismaticJointDef(
      body);
    jointDef.collideConnected = true;
    // lock to X-axis, relative to top wall of game
    jointDef.Initialize(body,
      top.body, body.GetWorldCenter(), new b2Vec2(0, 1));
    _this.myworld.world.CreateJoint(jointDef);
  };

  // now, for every entity, create a world body and add it to the world,
  // with corresponding fixture
  for(var i in this.entities) {
      this.entities[i].createbody(this.myworld);
  }

  disableVerticalMovement(this.player1.body);
  disableVerticalMovement(this.player2.body);

  //setup debug draw
  this.myworld.setdebug({ canvas:this.canvas });

  // launch renderers

  // model update callback
  requestAnimFrame(this.boundrender); //, this.renderDelay);

  // render callback
  setTimeout(this.boundupdate, this.updateDelay);

  // start by throwing new ball
  this.newBall();
};

// ----------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------

Game.prototype.registerListeners = function() {
  var _this = this;

  // register mouse and keyboard listeners

  // $(document).mousemove( (function(e) {
  //   if(e.originalEvent.touches && e.originalEvent.touches.length) {
  //     e = e.originalEvent.touches[0];
  //   } else if(e.originalEvent.changedTouches && e.originalEvent.changedTouches.length) {
  //     e = e.originalEvent.changedTouches[0];
  //   }
  //   var canvasPosition = this.getElementPosition(this.canvas);

  //   // remember current mouse position
  //   this.mouseX = (e.clientX - canvasPosition.x);
  //   this.mouseY = (e.clientY - canvasPosition.y);
  // }).bind(this) );
  this.canvas.onmousemove = (function(e) {
    // remember current mouse position
    var canvasPosition = this.getElementPosition(this.canvas);
    this.mouseX = (e.clientX - canvasPosition.x);
    this.mouseY = (e.clientY - canvasPosition.y);
  }).bind(this);

  $(document).mousedown( (function(e) {
    this.isMouseDown = true;
    return false;
  }).bind(this) );

  $(document).mouseup( (function(e) {
    this.isMouseDown = false;
    // this.mouseX = undefined;
    // this.mouseY = undefined;
  }).bind(this) );

  // equivalent touch listeners
  this.canvas.ontouchstart = (function(e) {
    //this.isMouseDown = true;

    // if( e.preventDefault ) e.preventDefault();
    if( e.originalEvent ) {
      e = e.originalEvent;
    }

    if( e.touches && e.touches.length) {
      e = e.touches[0];
    } else if( e.changedTouches && e.changedTouches.length) {
      e = e.changedTouches[0];
    }

    // remember current mouse position
    var canvasPosition = this.getElementPosition(this.canvas);
    this.mouseX = (e.clientX - canvasPosition.x);
    this.mouseY = (e.clientY - canvasPosition.y);
    return false; // swallow event if it touches an entity TODO: "if!!"
  }).bind(this);

  this.canvas.ontouchmove = (function(e) {
    // if( e.originalEvent && e.originalEvent.touches && e.originalEvent.touches.length ) {
    //   e = e.originalEvent.touches[0];
    // } else if( e.originalEvent && e.originalEvent.changedTouches && e.originalEvent.changedTouches.length ) {
    //   e = e.originalEvent.changedTouches[0];
    // }
    // // remember current mouse position
    // var canvasPosition = this.getElementPosition(this.canvas);
    // this.mouseX = (e.clientX - canvasPosition.x);
    // this.mouseY = (e.clientY - canvasPosition.y);
  }).bind(this);


  this.canvas.ontouchend = (function(e) {

    // if( e.preventDefault ) e.preventDefault();
    // this.isMouseDown = false;
    // this.mouseX = undefined;
    // this.mouseY = undefined;
    // return false;
  }).bind(this);

  this.canvas.ontouchcancel = (function(e) {
    // this.isMouseDown = false;
    // this.mouseX = undefined;
    // this.mouseY = undefined;
    // return false;
  }).bind(this);


  $(document).bind("mousewheel", (function(e) {
    // cope with browser diferences in the way wheel delta is returned
    e = window.event;

    var wheelDelta = e.detail ? e.detail * -1 : e.wheelDelta / 40;

    var wheelDeltaX = 0;
    if( e.detail.wheelDeltaX ) wheelDeltaX = e.detail.wheelDeltaX * -1;
    else if( e.wheelDeltaX ) wheelDeltaX = e.wheelDeltaX / 40;

    var wheelDeltaY = 0;
    if( e.detail.wheelDeltaY ) wheelDeltaY = e.detail.wheelDeltaY * -1;
    else if( e.wheelDeltaY ) wheelDeltaY = e.wheelDeltaY / 40;

    statustext.innerHTML = "wheel " + wheelDeltaX + "/" + wheelDeltaY;

  }).bind(this));


  // register keypresses
  $(document).keydown(function (e) {
    var pressedBall = false;
    var pressedPlayer1 = false;
    var pressedPlayer2 = false;
    var pressedSpace = false;
    switch(e.keyCode) {
      case 37: /* left */
        _this.ballDirection |= MOVE_LEFT;
        pressedBall = true;
        break;
      case 38: /* up */
        _this.ballDirection |= MOVE_UP;
        pressedBall = true;
        break;
      case 39: /* right */
        _this.ballDirection |= MOVE_RIGHT;
        pressedBall = true;
        break;
      case 40: /* down */
        _this.ballDirection |= MOVE_DOWN;
        pressedBall = true;
        break;
      case 65: // a
        _this.player1Direction = -1;
        pressedPlayer1 = true;
        break;
      case 83: // s
        _this.player2Direction = -1;
        pressedPlayer2 = true;
        break;
      case 90: // z
        _this.player1Direction = 1;
        pressedPlayer1 = true;
        break;
      case 88: // x
        _this.player2Direction = 1;
        pressedPlayer2 = true;
        break;
      case 32: // space
        pressedSpace = true;
        break;
    }
    if (pressedBall && !_this.pressStartedBall) {
        _this.pressStartedBall = new Date().getTime();
        return false;
    }
    if (pressedPlayer1 && !_this.pressStartedPlayer1) {
        _this.pressStartedPlayer1 = new Date().getTime();
        return false;
    }
    if (pressedPlayer2 && !_this.pressStartedPlayer2) {
        _this.pressStartedPlayer2 = new Date().getTime();
        return false;
    }
    if (pressedSpace) {
      _this.newBall();
        return false;
    }
    return true;
  });

  $(document).keyup(function (e) {
    var entity = this.player1;
    var pressedBall = false;
    var pressedPlayer1 = false;
    var pressedPlayer2 = false;
    var pressedSpace = false;
    switch(e.keyCode) {
      case 37: /* left */
      case 38: /* up */
      case 39: /* right */
      case 40: /* down */
      case 32: /* space */
        pressedBall = true;
        break;
      case 65: // a
      case 90: // z
        pressedPlayer1 = true;
        break;
      case 83: // s
      case 88: // x
        pressedPlayer2 = true;
        break;
      case 32: // space
        pressedSpace = true;
        console.log('space');
        break;
    }

    // Simulate the events that the phones will send

    if (pressedBall && _this.ballDirection) {
      _this.events.push({
        type: 'ball',
        force: new Date().getTime() - _this.pressStartedBall,
        angle: { x: (_this.ballDirection & MOVE_LEFT) ? -1 :
                   ((_this.ballDirection & MOVE_RIGHT) ? 1 : 0),
                 y: (_this.ballDirection & MOVE_UP) ? -1 :
                   ((_this.ballDirection & MOVE_DOWN) ? 1 : 0) }
      });
      _this.pressStartedBall = 0;
      _this.ballDirection = 0;
      return false;
    }

    if (pressedPlayer1) {
      _this.events.push({
        type: 'move',
        player: 1,
        direction: _this.player1Direction,
        force: new Date().getTime() - _this.pressStartedPlayer1});
      _this.pressStartedPlayer1 = 0;
      return false;
    }

    if (pressedPlayer2) {
      _this.events.push({
        type: 'move',
        player: 2,
        direction: _this.player2Direction,
        force: new Date().getTime() - _this.pressStartedPlayer2});
      _this.pressStartedPlayer2 = 0;
      return false;
    }
    return true;
  });
};

// ------------------------
// Throw new ball
// ------------------------
Game.prototype.newBall = function () {
  var body = this.ball.body;
  var initSpeed = 1000;
  this.myworld.setposition(body, {x: this.map_width/2, y: this.map_height/2});
  this.myworld.setvelocity(body, {x: Math.random()*initSpeed - initSpeed/2,
                                  y: Math.random()*initSpeed - initSpeed/2});
  this.myworld.setangularvelocity(body, 0);
};

// ------------------
// Movement of paddle
// ------------------
// direction = 1, -1
// force = number
Game.prototype.movePlayer = function (body, direction, force) {
  force = 10 + force/4;
  var pos = body.GetPosition();
  body.ApplyImpulse(
    new b2Vec2(0, force * direction),
    new b2Vec2(0, 0)); // todo move this to World.js
};

// ----------------------------------------------------------------------------------------
//
// World update callback
//
// ----------------------------------------------------------------------------------------
Game.prototype.update = function() {
  var _this = this;
  // Calculate time elapsed since las update
  //
  var fps;
  var animStart=new Date().getTime();
  var elapsedMs = 1; // some default values so that 1st iteration doesn't crash
  if( typeof this.previousUpdateTime !== 'undefined') {
    elapsedMs = animStart-this.previousUpdateTime;
    if(elapsedMs !== 0) fps = (1000 / elapsedMs); // average
  }
  this.previousUpdateTime = animStart;

  if( !this.pause ) {

    // Execute physics engine
    //
    this.myworld.step( elapsedMs );

    // process user interactions
    //
    if(this.isMouseDown) {
      if(!this.myworld.isjoinedtomouse()) {
        if( this.action == this.ACTION_PULL ) {
           var foundbody = this.getBodyAtMouse();
           if(foundbody) {
              this.myworld.jointomouse({
                x: this.mouseX / SCALE + this.minimum_world_x,
                y: this.mouseY / SCALE + this.minimum_world_y,
                body: foundbody
              });
            }
          }
       }
    }

    // Process events
    this.events.forEach(function (e) {
      if (e.type === 'ball') {
        _this.ball.body.ApplyImpulse(
          new b2Vec2(e.force * e.angle.x, e.force * e.angle.y),
          new b2Vec2(0, 0)); // todo move impulse function to World.js
      } else if (e.type === 'move') {
        if (e.player === 1) {
          _this.movePlayer(_this.player1.body, e.direction, e.force);
        } else if (e.player === 2) {
          _this.movePlayer(_this.player2.body, e.direction, e.force);
        }
      }
    });
    this.events = [];

    // Make ball 'fall' to center
    var ballPos = this.ball.body.GetPosition();
    var ballImpulseX = 0;
    if (ballPos.x < this.map_width/2 && ballPos.x > this.BALL_RADIUS*2) {
      ballImpulseX = -0.1;
    } else if (ballPos.x > this.map_width/2 &&
      ballPos.x < this.map_width - this.BALL_RADIUS*2) {
      ballImpulseX = 0.1;
    } 
    var ballImpulseY = 0;
    if (ballPos.y < this.map_height/2 - this.BALL_RADIUS*2) {
      ballImpulseY = 0.1;
    } else if (ballPos.y > this.map_height/2 + this.BALL_RADIUS*2) {
      ballImpulseY = -0.1;
    } 
    if (ballImpulseX || ballImpulseY) {
      this.ball.body.ApplyImpulse(
        new Box2D.Common.Math.b2Vec2(ballImpulseX, ballImpulseY),
        new Box2D.Common.Math.b2Vec2(0, 0)); // todo move this to World.js
    }

    if( this.myworld.isjoinedtomouse() ) {
       if(this.isMouseDown) {
          var pos = { x: this.mouseX / SCALE + this.minimum_world_x,
                      y: this.mouseY / SCALE + this.minimum_world_y };
          this.myworld.movejoinedmouse( pos );
       } else {
          this.myworld.unjoinfrommouse();
       }
    }

    // Remove forces applie so far, otherwise they pile up
    //
    this.myworld.clearforces();

    // Copy changes occured in the physics engine to the drawing this.entities
    // and execute AI if they have any
    //
    for(var e in this.entities) {
      this.entities[e].update(elapsedMs, this.myworld);
    }

    // Check game over
    if (ballPos.x < 0 || ballPos.x > this.map_width) {
      console.log('GAME OVER');
      this.myworld.setposition(this.ball.body, {x: this.map_width/2, y: this.map_height/2});
      this.myworld.setvelocity(this.ball.body, {x: 0, y:0});
      this.myworld.setangularvelocity(this.ball.body, 0);
    }
  } // if not pause

  // request next update
  setTimeout( this.boundupdate, this.updateDelay );
}; // update()


// ----------------------------------------------------------------------------------------------
// Helpers for pulling of an object
// ----------------------------------------------------------------------------------------------

Game.prototype.getBodyAtMouse = function() {

  var selected = this.myworld.bodyatmouse( {x:this.mouseX/SCALE + this.minimum_world_x, y: this.mouseY/SCALE + this.minimum_world_y } );

  if( selected ) {
    // if it's one of the user-controlled this.entities, switch to it
    var ref = this.myworld.getreffrombody(selected);
    if( ref ) {
      this.selectedEntity = ref;
      for(var e in this.usercontrolled ) {
        if( this.usercontrolled[e] == this.selectedEntity ) {
          this.controllingEntity = e;
        }
      }
    }
  }

  return selected;
};



// ----------------------------------------------------------------------------------------
//
// Rendering callback
//
// ----------------------------------------------------------------------------------------

Game.prototype.render = function() {

  // Calculate time since las frame was rendered
  //
  var animStart=new Date().getTime();
  var elapsedMs = 1; // some default values so that 1st iteration doesn't crash
  var fps = 1;
  if( typeof this.previousRenderTime !== 'undefined') {
    elapsedMs = animStart-this.previousRenderTime;
    if(elapsedMs !== 0) fps = (1000 / elapsedMs); // average
  }
  this.previousRenderTime = animStart;

  // Adjust canvas size if window size has changed
  //
  var neww = window.innerWidth;
  var newh = window.innerHeight- $('#game').position().top-2;
  var newcanvaswidth  = Math.floor(neww <= this.map_width * SCALE ?
                                      neww : this.map_width * SCALE);
  var newcanvasheight = Math.floor(newh <= this.map_height * SCALE ?
                                      newh : this.map_height * SCALE);

  if( this.canvas.width != newcanvaswidth ||
      this.canvas.height != newcanvasheight ) {
    // assigning a value the canvas clears it, which is expensive,
    // only do it if it's changed
    this.canvas.width = newcanvaswidth;
    this.canvas.height = newcanvasheight;
  }

  // Set scroll position to follow mouse
  //
  if( this.mouseY < 64 ) {
    this.minimum_world_y = Math.min(
                  Math.max(0, this.minimum_world_y - 10 / SCALE ),
                  this.map_height - this.canvas.height / SCALE );   
  }
  if( this.mouseY > (this.canvas.height-64) ) {
    this.minimum_world_y = Math.min(
                  Math.max(0, this.minimum_world_y + 10 / SCALE ),
                  this.map_height - this.canvas.height / SCALE );   
  }

  if( this.mouseX < 64 ) {
    this.minimum_world_x = Math.min(
                  Math.max(0, this.minimum_world_x - 10 / SCALE ),
                  this.map_width - this.canvas.width / SCALE );   
  }
  if( this.mouseX > (this.canvas.width-64) ) {
    this.minimum_world_x = Math.min(
                  Math.max(0, this.minimum_world_x + 10 / SCALE ),
                this.map_width - this.canvas.width / SCALE );
  }

  this.maximum_world_y = this.minimum_world_y + this.canvas.height / SCALE;
  this.maximum_world_x = this.minimum_world_x + this.canvas.width / SCALE;


  this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);

  this.ctx.save();

  // Scroll world
  //
  this.ctx.translate(-Math.floor(this.minimum_world_x * SCALE),
                     -Math.floor(this.minimum_world_y * SCALE) );

  // we actually paint some areas that are outside of the viewport because
  // sprites are bigger than their physical bodies
  //
  var MARGIN_HORIZ = 60/SCALE;
  var MARGIN_VERT = 120/SCALE;

  // draw background tiles ("ground" layer)
  //
  if( !this.displayDebugInfo ) {

    this.player1.draw({ ctx : this.ctx });
    this.player2.draw({ ctx : this.ctx });
    this.ball.draw({ ctx : this.ctx });

    for(var layerid in this.layers) {
      var layer = this.layers[layerid];
      var initialrow = Math.max( 0,
                         Math.floor((this.minimum_world_y - MARGIN_VERT) /
                                    (layer.tile_sizey / SCALE)) );
      var lastrow = Math.min( layer.height-1,
                         Math.floor((this.maximum_world_y + MARGIN_VERT) /
                                     (layer.tile_sizey / SCALE)) + 1 );
      var initialcol = Math.max( 0,
                         Math.floor((this.minimum_world_x - MARGIN_HORIZ) /
                                     (layer.tile_sizex / SCALE)) );
      var lastcol = Math.min( layer.width-1,
                         Math.floor((this.maximum_world_x + MARGIN_HORIZ) /
                                     (layer.tile_sizex / SCALE)) + 1 );
      var i, j, gid, r;
      for(i=initialrow; i<=lastrow; i++) {
        for(j=initialcol; j<=lastcol; j++) {
          gid = layer.data[i*layer.width + j];
          r = this.getSprite(gid);
          this.ctx.drawImage( r.image, r.sprite.x, r.sprite.y,
                              r.sprite.w, r.sprite.h,
                              j*layer.tile_sizex, i*layer.tile_sizey,
                              r.sprite.w, r.sprite.h );
        }
      }
    }
  }

  // Find all elements that are visible
  // 
  // find all entities that are visible, based on their physical bodies' location
  var visible = this.myworld.bodiesatrect({
    x: this.minimum_world_x-MARGIN_HORIZ,
    y: this.minimum_world_y-MARGIN_VERT,
    width: this.maximum_world_x+MARGIN_HORIZ,
    height: this.maximum_world_y+MARGIN_VERT,
    selectstatics: true,
    returnrefs: true});

  // TODO: move this to separate array... or something
  // add the 'bodyless' sprites as they will have not appeared in the above query
  //
  for(var entityNumber in this.entities) {
    var entity = this.entities[entityNumber];
    if( entity.bodyless ) {
      visible.push(entity);
    }
  }

  // sort elements based on y coordinate, to make elements below appear on top of previous, to get Zelda-like fake perspective
  // TODO: utilizar un arbol o algo que ya esté ordenado durante la insercion
  //
  visible.sort((function(a, b) {

    var bb1_y = a.y - a.height/2;
    var bb2_y = b.y - b.height/2;
    if( a.body ) {
      var bb = this.myworld.getboundingbox(a.body);
      bb1_y = bb.y0;
    }
    if( b.body ) {
      var bb = this.myworld.getboundingbox(b.body);
      bb2_y = bb.y0;
    }

    var val1 = bb1_y - bb2_y;
    if( val1 < 0 ) return -1;
    else if( val1 > 0 ) return 1;

    var bb1_x = a.x - a.width/2;
    var bb2_x = b.x - b.width/2;
    if( a.body ) {
      var bb = this.myworld.getboundingbox(a.body);
      bb1_x = bb.x0;
    }
    if( b.body ) {
      var bb = this.myworld.getboundingbox(b.body);
      bb2_x = bb.x0;
    }

    var val2 = bb1_x - bb2_x;
    if( val2 < 0 ) return -1;
    else if( val2 > 0 ) return 1;

    return 0; // equal
  }).bind(this));

  // Finally, draw all those entities, in order
  //
  var parametros = { ctx: this.ctx, isSelected: false };
  for(var i in visible) {
    entity = visible[i];
    parametros.isSelected = (this.selectedEntity == entity);
    if( !this.displayDebugInfo ) entity.draw(parametros);
  }

  // draw user interactions
  //
  if( this.myworld.isjoinedtomouse() ) {
      this.ctx.beginPath();
      var v = this.myworld.getjoinmousepos_origin();
      this.ctx.moveTo(v.x*SCALE, v.y*SCALE);
      this.ctx.strokeStyle = 'yellow';
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = 'round';
      this.ctx.miterLimit = 4;
      this.ctx.lineTo(this.mouseX + this.minimum_world_x*SCALE, this.mouseY + this.minimum_world_y*SCALE);
      this.ctx.closePath();
      this.ctx.stroke();
  }

  // debug info, fps
  if( this.displayDebugInfo ) {
    this.myworld.world.DrawDebugData();
  }

  // draw stats and other info
  //
  this.ctx.restore();
  this.ctx.fillStyle = '#EEEEEE';
  this.ctx.fillRect(25,38,44,-22);
  this.ctx.fillRect(25,52,64,-10);
  this.ctx.fillRect(25,64,64,-10);
  this.ctx.fillStyle = 'black';
  this.ctx.fillText('FPs: ' + parseInt(fps, 10), 25, 25);
  this.ctx.fillText(this.entities.length, 25, 35);
  this.ctx.fillText(this.action, 26, 62);
  if( this.mouseX && this.mouseY ) {
    this.ctx.fillText(this.mouseX.toFixed(2) + '-' +
                      this.mouseY.toFixed(2), 25, 50);
  }

  // request next render
  requestAnimFrame(this.boundrender);
}


//http://js-tut.aardon.de/js-tut/tutorial/position.html
Game.prototype.getElementPosition = function(element) {
  var elem=element, tagname="", x=0, y=0;
 
  while((typeof(elem) == "object") && (typeof(elem.tagName) != "undefined")) {
     y += elem.offsetTop;
     x += elem.offsetLeft;
     tagname = elem.tagName.toUpperCase();

     if(tagname == "BODY")
        elem=0;

     if(typeof(elem) == "object") {
        if(typeof(elem.offsetParent) == "object")
           elem = elem.offsetParent;
     }
  }

  return {x: x, y: y};
};

// -------------------------------------------------------------------------------

Game.prototype.toggleSelected = function() {

  this.usercontrolled[this.controllingEntity].movement = MOVE_NONE;
  this.controllingEntity = (this.controllingEntity+1)%this.usercontrolled.length;
};


Game.prototype.toggleAction = function() {
  if( this.action === this.ACTION_PULL ) this.action = this.ACTION_BOMB;
  else this.action = this.ACTION_PULL;
};

Game.prototype.togglePause = function() {
  this.pause = !this.pause;
};

// -------------------------------------------------------------------------------

Game.prototype.toggledebug = function() {
  if(this.displayDebugInfo) this.displayDebugInfo = false;
  else this.displayDebugInfo = true;
};

