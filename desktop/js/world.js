(function(){
/*
	world

	This is an intentionally lame abstraction of the functionality I use from Box2D, in an effort to be able to switch to any other
	engine easily. Right now it abstracts Box2D and Chipmunk.

	why aren't you using inheritance?
	  Because I like to see both implementations side by side.

	when are you going to implement x & y feature?
	  Just ask...

	some functions use name parameters and some others don't, why?
	  where it isn't very obvious what the parameter order will be, I prefer named parameters

The MIT License (MIT)

Copyright (c) 2012 Oscar Amat

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


*/

// just in case its redefined elsewhere... paranoid much
var undefined; 

// Available engines
var CHIPMUNK = 1;
var BOX2D = 2;


World = function () {
	this.engine = BOX2D;
};

World.prototype.useBox2D = function() {
	this.engine = BOX2D;
} 

World.prototype.useChipmunk = function() {
	this.engine = CHIPMUNK;
} 

// Create a world instance with the given gravity
// Hint: use gravity of {x:0,y:0} for top-view worlds.
// { gravity: {x:nnn, y:yyy} }
//
World.prototype.createworld = function(params) {
	if( this.engine == BOX2D ) {
		this.world = new b2World(
		    new b2Vec2(params.gravity.x, params.gravity.y)    // gravity vector
		 	, true                 // allow sleeping bodies
		);

	} else if( this.engine == CHIPMUNK ) {
		this.space = new cp.Space();
		this.space.gravity = cp.v(params.gravity.x, params.gravity.y);
		this.space.iterations = 10;
	}
}


// Prepare debug rendering.
// Note: this is more a 'box2d' thing, keeping it for the time being but may be moved elsewhere.
// { canvas:<canvas_selement> }
//
World.prototype.setdebug = function(params) {
	if( this.engine == BOX2D ) {
		//setup debug draw
		var debugDraw = new b2DebugDraw();
		debugDraw.SetSprite(params.canvas.getContext("2d"));
		debugDraw.SetDrawScale(SCALE);
		debugDraw.SetFillAlpha(1.0);
		debugDraw.SetLineThickness(1.0);
		debugDraw.SetFlags(
				b2DebugDraw.e_centerOfMassBit | b2DebugDraw.e_pairBit | /*b2DebugDraw.e_aabbBit |*/
				b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
		this.world.SetDebugDraw(debugDraw);
	} else if( this.engine == CHIPMUNK ) {
		// TODO
	}
}



// Create a rectangular body
// {x:nnnn, y:nnnn, width:nnnn, height:nnnn, isstatic:true/false, angle:nnn, ref:xxxx}
// Note: angle in radians
//       ref is any thing you need to link this body with your model, you can retrieve it using getreffrombody(body)
// Returns body instance.
//
World.prototype.newRectangleBody = function (params) {

	if( this.engine == BOX2D ) {
		var fixDef = new b2FixtureDef;
		fixDef.density = 1.0;
		fixDef.friction = 2.0;
		fixDef.restitution = 0;
		var bodyDef = new b2BodyDef;
		bodyDef.linearDamping = 16;  // -/these simulates floor friction, otherwise objects behave like in space
		bodyDef.angularDamping = 16; // /

		if( params.bullet ) {
			bodyDef.bullet = true;
		}

		if( params.weight) {
			bodyDef.linearDamping = params.weight;
		}

		fixDef.shape = new b2PolygonShape();
		if( params.isstatic ) {
			bodyDef.type = b2Body.b2_staticBody;
			var center = new b2Vec2(params.height/2, params.width/2);
			fixDef.shape.SetAsBox(params.width/2, params.height/2);
			bodyDef.position.x = params.x;
			bodyDef.position.y = params.y;
		}
		else {
			bodyDef.type = b2Body.b2_dynamicBody;
			var center = new b2Vec2(params.height/2, params.width/2);
			fixDef.shape.SetAsBox(params.width/2, params.height/2);
			bodyDef.position.x = params.x+params.width/2;
			bodyDef.position.y = params.y+params.height/2;
		}


		// prevent this entity from colliding (but still affects forces)
		if( params.doesntcollide ) {
			fixDef.isSensor = true;
		}

		bodyDef.userData = params.ref;
		var body = this.world.CreateBody(bodyDef);
		body.CreateFixture(fixDef);
		if( params.angle ) this.world.setangle(body, params.angle );
		return body;

	} else if( this.engine == CHIPMUNK ) {
		var mass = 1;
    var moment = cp.momentForBox(mass, params.width, params.height);
    var body;
    var shape;
    if( params.isstatic ) {
      body = new cp.Body(Infinity, Infinity); // TODO rethink whole static thing in Chipmunk, doesn't look right...
      body.setPos( cp.v(params.x, params.y) );
      shape = new cp.BoxShape(body, params.width, params.height);
      // if we don't add the body it won't collide
      this.space.addStaticShape(shape);
    } else {
      body = this.space.addBody(new cp.Body(mass, moment));
      body.setPos( cp.v(params.x, params.y) );
      body.setVelocity( cp.v(0,0) );
      shape = new cp.BoxShape(body, params.width, params.height);
      this.space.addShape(shape);
    }

		body.setAngle(0);
		body.ref = params.ref;
		return body;
	}

}

// Create a circular body
// {x:nnnn, y:nnnn, radius, isstatic:true/false, angle:nnn, ref:xxxx}
// Note: angle in radians
//       ref is any thing you need to link this body with your model, you can retrieve it using getreffrombody(body)
// Returns body instance.
//
World.prototype.newCircleBody = function (params) {

	if( this.engine == BOX2D ) {
		var fixDef = new b2FixtureDef;
		fixDef.density = 1.0;
		fixDef.friction = 0.5; // friction only applies against other objects
		fixDef.restitution = 0.9; // how much does it bounce
		var bodyDef = new b2BodyDef;
		bodyDef.linearDamping = 2;  // -/these simulates floor friction
		bodyDef.angularDamping = 2; // /

		if( params.weight) {
			bodyDef.linearDamping = params.weight;
		}

		if( params.isstatic ) bodyDef.type = b2Body.b2_staticBody;
		else bodyDef.type = b2Body.b2_dynamicBody;

		fixDef.shape = new b2CircleShape(params.radius);
		if( params.bullet ) {
			bodyDef.bullet = true;
		}

		// prevent this entity from colliding (but still affects forces)
		if( params.doesntcollide ) {
			fixDef.isSensor = true;
		}

		bodyDef.position.x = params.x;
		bodyDef.position.y = params.y;
		bodyDef.userData = params.ref;
		var body = this.world.CreateBody(bodyDef);
		body.CreateFixture(fixDef);
		if( params.angle ) this.world.setangle(body, params.angle );
		return body;

	} else if( this.engine == CHIPMUNK ) {
		// TODO: implement
	}
};

// body, velocity
// velocity is {x:n, y:n}
//
World.prototype.setvelocity = function(body, velocity) {
	if( this.engine == BOX2D ) {
		velocity.x /= 10;
		velocity.y /= 10; // scale is different in Box2D vs Chipmunk
		body.SetAwake(true);
		body.SetLinearVelocity(velocity);

	} else if( this.engine == CHIPMUNK ) {
		velocity.x /= 20000;
		velocity.y /= 20000; // scale is different in Box2D vs Chipmunk
		body.setVelocity(velocity);
	}
}

// body, angularvelocity
// velocity is a number
//
World.prototype.setangularvelocity = function(body, velocity) {
	if( this.engine == BOX2D ) {
		// TODO: not sure you can do this...

	} else if( this.engine == CHIPMUNK ) {
		body.w = 0;
	}
}



// Joins two bodies with a distance constraint so that they try to keep their centers at
//   a constant distance. If one is pushed, the other one 'follows'.
// body1, body2
// Note: The actual physical constraint 
//
World.prototype.joinBodies = function(body1, body2) {
	if( this.engine == BOX2D ) {
		var distDef = new b2DistanceJointDef();
		var anchor1 = body1.GetWorldCenter();
		var anchor2 = body2.GetWorldCenter();
		distDef.Initialize(body1, body2, anchor1, anchor2);
		distDef.collideConnected = true;
		distDef.dampingRatio = 0.5;
		this.world.CreateJoint(distDef);

	} else if( this.engine == CHIPMUNK ) {
		var joint = new cp.PivotJoint(body1, body2, cp.v(0,0), cp.v(0,0));
		joint.maxForce = 50;
		joint.errorBias = Math.pow(1 - 0.15, 60);
		this.space.addConstraint(joint);
		// this.space.addConstraint(new cp.DampedSpring(body1, body2, cp.v(0,0), cp.v(0,0), 20, 5, 0.3));
	}

}


// Join a body to the 'mouse body'. The mouse body is a body created and destroyed if necessary that
//   is linked to the given body. The joint between the original body and the mouse body 'pulls' the
//   original body.
// {x:nnnn, y:nnnn, body:<body>}
//
World.prototype.jointomouse = function(params) {
	if( this.engine == BOX2D ) {
		var md = new b2MouseJointDef();
		md.bodyA = this.world.GetGroundBody();
		md.bodyB = params.body;
		md.target.Set(params.x, params.y);
		md.collideConnected = true;
		md.maxForce = 3000.0 * params.body.GetMass();
		this.mousejoint = this.world.CreateJoint(md);
		params.body.SetAwake(true);

	} else if( this.engine == CHIPMUNK ) {
		if( this.mouseBody ) {
			this.mouseBody.setPos(cp.v(params.x, params.y));
		} else {
			this.mouseBody = new cp.Body(params.x, params.y);
			// this.space.addBody(this.mouseBody);
		}
		this.mousejoint = new cp.PivotJoint(this.mouseBody, params.body, cp.v(0,0), params.body.world2Local({x:params.x, y:params.y}));
		this.mousejoint.maxForce = 50;
		// this.mousejoint.errorBias = Math.pow(1 - 0.15, 60);
		this.space.addConstraint(this.mousejoint);
	}
}


// Get current position of the body that the 'mouse body' is linked to.
// returns {x, y}
//
World.prototype.getjoinmousepos_dest = function() {
	if( this.mousejoint ) {
		if( this.engine == BOX2D ) {
			 // TODO: this concept doesn't exist in Box2D???
			return this.mousejoint.m_bodyB.GetPosition();

		} else if( this.engine == CHIPMUNK ) {
			return this.mousejoint.a.p;
		}
	}
	return {x:0, y:0};
}

// Get current position of the 'mouse body' that is used to pull objects.
// returns {x, y}
//
World.prototype.getjoinmousepos_origin = function() {
	if( this.mousejoint ) {
		if( this.engine == BOX2D ) {
			return this.mousejoint.m_bodyB.GetPosition();

		} else if( this.engine == CHIPMUNK ) {
			return this.mousejoint.b.p;
		}
	}
	return {x:0, y:0};
}


// Test whether the join that is used to pull objets with the mouse is enabled
// returns true or false
//
World.prototype.isjoinedtomouse = function() {
	if( this.mousejoint ) return true;
	return false;
}

// Destroy the joint used to pull objects with a mouse, if any is set.
//
World.prototype.unjoinfrommouse = function() {
	if( this.mousejoint ) {
		if( this.engine == BOX2D ) {
	        this.world.DestroyJoint(this.mousejoint);

		} else if( this.engine == CHIPMUNK ) {
			this.space.removeConstraint(this.mousejoint);
		}

	}
    this.mousejoint = undefined;
}


// Set position of the mouse body that is used to pull objects with the mouse.
// {x:nnnn, y:nnnn}
//
World.prototype.movejoinedmouse = function(params) {

	if( this.mousejoint ) {
		if( this.engine == BOX2D ) {
			this.mousejoint.SetTarget(new b2Vec2(params.x, params.y));
		}

		if( this.engine == CHIPMUNK ) {
			this.mouseBody.setPos(cp.v(params.x, params.y));
			this.mousejoint.b.w = 0; // angular velocity, otherwise things keep rotating forever

			// this.mouseBody.p = cp.v(params.x, params.y);
			// Move mouse body toward the mouse
			// var newPoint = cp.v.lerp(this.mouseBody.p, cp.v(params.x, params.y), 0.25);
			// this.mouseBody.v = cp.v.mult(cp.v.sub(newPoint, this.mouseBody.p), 60);
			// this.mouseBody.p = newPoint;
		}
	}

}



// {x,y} in world coordinates
World.prototype.bodyatmouse = function(params) {

	// find bodies around the mouse
	var selected = this.bodiesatrect( {x: params.x - 0.001, y: params.y - 0.001, height: 0.003, width: 0.003,
	                                   selectstatics: false, returnrefs: false } );

	// pinpoint if they actually touch the mouse
	var pvec = {};
	pvec.x = params.x;
	pvec.y = params.y;

	for(var s in selected) {
		var body = selected[s];

		if( this.engine == BOX2D ) {
	    	if(body.GetFixtureList().GetShape().TestPoint(body.GetTransform(), pvec )) {
				return body;
			}
		}

		if( this.engine == CHIPMUNK ) {
			if (body.shapeList[0].pointQuery(pvec)) {
				return body;
			}
		}
	}

	return undefined;
}

// {x, y, height, width, returnrefs, selectstatics}
// A few options to make this more versatile
//   -if selectstatics = true then include static objects, otherwise only dynamic
//   -if returnrefs = true then return an array of entities found (i.e. the refs that bodies contain)
//    else                 then return an array of bodies
//
World.prototype.bodiesatrect = function(params) {

	// Query the world for overlapping shapes.
	var selectedbodies = [];

	if( this.engine == BOX2D ) {
		var aabb = new b2AABB();
		aabb.lowerBound.Set(params.x, params.y);
		aabb.upperBound.Set(params.x + params.width, params.y + params.height);

		this.world.QueryAABB(
			function(fixture) {
			  	if(params.selectstatics || fixture.GetBody().GetType() != b2Body.b2_staticBody) {
			  		var body = fixture.GetBody();
					if(!params.returnrefs) {
						selectedbodies.push(body);
					} else {
						var ref = this.getreffrombody(body); // "refless" bodies are not returned
						if(ref) selectedbodies.push(ref);    // in this case
					}
			    }
				return true;
			}.bind(this),           // TODO: not create a bound function each time?
			aabb );
	}

	if( this.engine == CHIPMUNK ) {
		var bb = new cp.BB(params.x, params.y, params.x + params.width, params.y + params.height);
		this.space.bbQuery(bb, cp.ALL_LAYERS, cp.NO_GROUP, function(shape) {
			var body = shape.body;
			if(params.selectstatics || !body.isStatic()) {
				if(!params.returnrefs) {
					selectedbodies.push(body);
				} else {
					selectedbodies.push(body.ref);
				}
			}
		});
	}

  return selectedbodies;
}




// body --> ref
World.prototype.getreffrombody = function(body) {
	if( this.engine == BOX2D ) {
		return body.GetUserData();
	}

	if( this.engine == CHIPMUNK ) {
		return body.ref;
	}
}


// body --> {x0:n,y0:n,x1:n,y1:n}
World.prototype.getboundingbox = function(body) {
	if( this.engine == BOX2D ) {
		var aabb = body.GetFixtureList().GetAABB();
		return { x0:aabb.upperBound.x, y0:aabb.upperBound.y, x1:aabb.lowerBound.x, y1:aabb.lowerBound.y };
	}
	if( this.engine == CHIPMUNK ) {
		var shape = body.shapeList[0];
		var bb = shape.getBB();
		return { x0:bb.l, y0:bb.b, x1:bb.r, y1:bb.t };
	}
}


// body --> {x,y}
World.prototype.getposition = function(body) {
	if( this.engine == BOX2D ) {
		return body.GetPosition();

	} else if( this.engine == CHIPMUNK ) {
		return body.p;
	}
};

// body, { x: xxx, y : yyy }
World.prototype.setposition = function(body, point) {
	if( this.engine == BOX2D ) {
		body.SetPosition(new b2Vec2(point.x, point.y));
	} else if( this.engine == CHIPMUNK ) {
		body.setPos(cp.v(point.x, point.y));
	}
}

// body --> angle
World.prototype.getangle = function(body) {
	if( this.engine == BOX2D ) {
		return body.GetAngle();

	} else if( this.engine == CHIPMUNK ) {
		return body.a;
	}
}

// body, a
World.prototype.setangle = function(body, angle) {
	if( this.engine == BOX2D ) {
		return body.SetAngle(angle);

	} else if( this.engine == CHIPMUNK ) {
		return body.setAngle(angle);
	}
}


// calculate physics
World.prototype.step = function(elapsedMs) {
	if( this.engine == BOX2D ) {
	    var tick = elapsedMs / 1000;
	    if( tick >= 1/30 ) tick = 1/30; // too slow, do our best :(
		this.world.Step(
		    tick /*1 / 60*/   //frame-rate
			,  8       //velocity iterations, increase/decrease for performance vs accuracy
			,  3       //position iterations
		);

	} else if( this.engine == CHIPMUNK ) {
		this.space.step(elapsedMs);
	}
}


// clear all forces from all bodies
World.prototype.clearforces = function() {
	if( this.engine == BOX2D ) {
		this.world.ClearForces();

	} else if( this.engine == CHIPMUNK ) {
		this.space.eachBody( function(body) {
			body.resetForces();
		})
	}
}


})();