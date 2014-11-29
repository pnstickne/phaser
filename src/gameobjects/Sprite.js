/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2014 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

/**
* Sprites are the lifeblood of your game, used for nearly everything visual.
*
* At its most basic a Sprite consists of a set of coordinates and a texture that is rendered to the canvas.
* They also contain additional properties allowing for physics motion (via Sprite.body), input handling (via Sprite.input),
* events (via Sprite.events), animation (via Sprite.animations), camera culling and more. Please see the Examples for use cases.
*
* @class Phaser.Sprite
* @constructor
* @extends PIXI.Sprite
* @param {Phaser.Game} game - A reference to the currently running game.
* @param {number} x - The x coordinate (in world space) to position the Sprite at.
* @param {number} y - The y coordinate (in world space) to position the Sprite at.
* @param {string|Phaser.RenderTexture|Phaser.BitmapData|PIXI.Texture} key - This is the image or texture used by the Sprite during rendering. It can be a string which is a reference to the Cache entry, or an instance of a RenderTexture or PIXI.Texture.
* @param {string|number} frame - If this Sprite is using part of a sprite sheet or texture atlas you can specify the exact frame to use by giving a string or numeric index.
*/
Phaser.Sprite = function (game, x, y, key, frame) {

    x = x || 0;
    y = y || 0;
    key = key || null;
    frame = frame || null;

    /**
    * @property {Phaser.Game} game - A reference to the currently running Game.
    * @protected
    */
    this.game = game;

    /**
    * @property {string} name - The user defined name given to this Sprite.
    * @default
    */
    this.name = '';

    /**
    * @property {number} type - The const type of this object.
    * @readonly
    * @protected
    */
    this.type = Phaser.SPRITE;

    /**
    * @property {number} z - The z-depth value of this object within its Group (remember the World is a Group as well). No two objects in a Group can have the same z value.
    */
    this.z = 0;

    /**
    * @property {Phaser.Events} events - The Events you can subscribe to that are dispatched when certain things happen on this Sprite or its components.
    */
    this.events = new Phaser.Events(this);

    /**
    * @property {Phaser.AnimationManager} animations - This manages animations of the sprite. You can modify animations through it (see Phaser.AnimationManager)
    */
    this.animations = new Phaser.AnimationManager(this);

    /**
    *  @property {string|Phaser.RenderTexture|Phaser.BitmapData|PIXI.Texture} key - This is the image or texture used by the Sprite during rendering. It can be a string which is a reference to the Cache entry, or an instance of a RenderTexture, BitmapData or PIXI.Texture.
    */
    this.key = key;

    PIXI.Sprite.call(this, PIXI.TextureCache['__default']);

    this.transformCallback = this.checkTransform;
    this.transformCallbackContext = this;

    this.position.set(x, y);

    /**
    * The world coordinates of this sprite.
    *
    * This differs from the local x/y coordinates which are relative to the parent.
    *
    * @property {Phaser.Point} world
    */
    this.world = new Phaser.Point(x, y);

    /**
    * Should the sprite be automatically camera culled or not?
    *
    * An auto-culled sprite has its `renderable` property set to 'false' when it leaves the game camera view and 'true'
    * when it reenters the camera view.
    *
    * This is quite an expensive operation, as it has to calculate the bounds of the object every frame, so only enable it if you really need it.
    *
    * @property {boolean} autoCull
    * @default
    */
    this.autoCull = false;

    /**
    * The Input Handler for this object. Must be enabled with `inputEnabled` before use.
    * @property {Phaser.InputHandler|null} input
    */
    this.input = null;

    /**
    * By default Sprites are not part of any physics system and body will be `null`.
    *
    * To enable them for physics you need to call `game.physics.enable(sprite, system)` where `sprite` is this object
    * and `system` is the Physics system you want to use to manage this body. Once enabled you can access all physics related properties via `Sprite.body`.
    *
    * _Important:_ Enabling a Sprite for P2 or Ninja physics will automatically set `Sprite.anchor` to 0.5 so the physics body is centered on the Sprite.
    * If you need a different result then adjust or re-create the Body shape offsets manually, and/or reset the anchor after enabling physics.
    *
    * @property {Phaser.Physics.Arcade.Body|Phaser.Physics.P2.Body|Phaser.Physics.Ninja.Body|null} body
    * @default
    */
    this.body = null;

    /**
    * Is the sprite 'alive'?
    *
    * This is useful for game logic, but does not affect rendering.
    *
    * @property {boolean} alive.
    * @default
    * @see {@link Phaser.Sprite#health}, {@link Phaser.Sprite#damage}
    */
    this.alive = true;

    /**
    * @property {number} health - Health value. Used in combination with damage() to allow for quick killing of Sprites.
    */
    this.health = 1;

    /**
    * To given a Sprite a lifespan, in milliseconds, once 'born' you can set this to a positive value. Handy for particles, bullets, etc.
    *
    * The lifespan is decremented by `game.time.physicsElapsed` (converted to milliseconds) each logic update,
    * and {@link Phaser.Sprite.kill kill} is called once the lifespan reaches 0.
    *
    * @property {number} lifespan
    * @default
    */
    this.lifespan = 0;

    /**
    * If true the Sprite checks if it is still within the world each frame, when it leaves the world it dispatches Sprite.events.onOutOfBounds
    * and optionally kills the sprite (if Sprite.outOfBoundsKill is true). By default this is disabled because the Sprite has to calculate its
    * bounds every frame to support it, and not all games need it. Enable it by setting the value to true.
    * @property {boolean} checkWorldBounds
    * @default
    */
    this.checkWorldBounds = false;

    /**
    * @property {boolean} outOfBoundsKill - If true Sprite.kill is called as soon as Sprite.inWorld returns false, as long as Sprite.checkWorldBounds is true.
    * @default
    */
    this.outOfBoundsKill = false;

    /**
    * @property {boolean} debug - Handy flag to use with Game.enableStep
    * @default
    */
    this.debug = false;

    /**
    * If this object is `fixedToCamera` then this stores the x/y offset that its drawn at, from the top-left of the camera view.
    * @property {Phaser.Point} cameraOffset
    */
    this.cameraOffset = new Phaser.Point();

    /**
    * The Rectangle used to crop the texture.
    * Set this via {@link Phaser.Sprite#crop crop} and use {@link Phaser.Sprite#updateCrop updateCrop} as required.
    * @property {Phaser.Rectangle} cropRect
    * @default
    * @readonly
    */
    this.cropRect = null;

    /**
    * @property {Phaser.Point} scaleMin - Set the minimum scale this Sprite will scale down to. Prevents a parent from scaling this Sprite lower than the given value. Set to `null` to remove.
    */
    this.scaleMin = null;

    /**
    * @property {Phaser.Point} scaleMax - Set the maximum scale this Sprite will scale up to. Prevents a parent from scaling this Sprite higher than the given value. Set to `null` to remove.
    */
    this.scaleMax = null;

    /**
    * A small internal cache:
    *
    * 0 = previous position.x
    * 1 = previous position.y
    * 2 = previous rotation
    * 3 = renderID
    * 4 = fresh? (0 = no, 1 = yes)
    * 5 = outOfBoundsFired (0 = no, 1 = yes)
    * 6 = exists (0 = no, 1 = yes)
    * 7 = fixed to camera (0 = no, 1 = yes)
    * 8 = destroy phase? (0 = no, 1 = yes)
    * @property {Array} _cache
    * @private
    */
    this._cache = [ 0, 0, 0, 0, 1, 0, 1, 0 ];

    /**
    * @property {Phaser.Rectangle} _crop - Internal cache var.
    * @private
    */
    this._crop = null;

    /**
    * @property {Phaser.Rectangle} _frame - Internal cache var.
    * @private
    */
    this._frame = null;

    /**
    * @property {Phaser.Rectangle} _bounds - Internal cache var.
    * @private
    */
    this._bounds = new Phaser.Rectangle();

    this.loadTexture(key, frame);

};

Phaser.Sprite.prototype = Object.create(PIXI.Sprite.prototype);
Phaser.Sprite.prototype.constructor = Phaser.Sprite;

/**
* Internal function called by the World preUpdate cycle.
*
* @method Phaser.Sprite#preUpdate
* @memberof Phaser.Sprite
* @return {boolean} True if the Sprite was rendered, otherwise false.
* @protected
*/
Phaser.Sprite.prototype.preUpdate = function() {    

    if (this._cache[4] === 1 && this.exists)
    {
        this.world.setTo(this.parent.position.x + this.position.x, this.parent.position.y + this.position.y);
        this.worldTransform.tx = this.world.x;
        this.worldTransform.ty = this.world.y;
        this._cache[0] = this.world.x;
        this._cache[1] = this.world.y;
        this._cache[2] = this.rotation;

        if (this.body)
        {
            this.body.preUpdate();
        }

        this._cache[4] = 0;

        return false;
    }

    this._cache[0] = this.world.x;
    this._cache[1] = this.world.y;
    this._cache[2] = this.rotation;

    if (!this.exists || !this.parent.exists)
    {
        //  Reset the renderOrderID
        this._cache[3] = -1;
        return false;
    }

    //  Only apply lifespan decrement in the first updateLogic pass.
    if (this.lifespan > 0 && this.game.updateNumber === 0)
    {
        this.lifespan -= this.game.time.physicsElapsedMS;

        if (this.lifespan <= 0)
        {
            this.kill();
            return false;
        }
    }

    //  Cache the bounds if we need it
    if (this.autoCull || this.checkWorldBounds)
    {
        this._bounds.copyFrom(this.getBounds());

        this._bounds.x += this.game.camera.view.x;
        this._bounds.y += this.game.camera.view.y;

        if (this.autoCull)
        {
            //  Won't get rendered but will still get its transform updated
            if (this.game.world.camera.view.intersects(this._bounds))
            {
                this.renderable = true;
                this.game.world.camera.totalInView++;
            }
            else
            {
                this.renderable = false;
            }
        }

        if (this.checkWorldBounds)
        {
            //  The Sprite is already out of the world bounds, so let's check to see if it has come back again
            if (this._cache[5] === 1 && this.game.world.bounds.intersects(this._bounds))
            {
                this._cache[5] = 0;
                this.events.onEnterBounds.dispatch(this);
            }
            else if (this._cache[5] === 0 && !this.game.world.bounds.intersects(this._bounds))
            {
                //  The Sprite WAS in the screen, but has now left.
                this._cache[5] = 1;
                this.events.onOutOfBounds.dispatch(this);

                if (this.outOfBoundsKill)
                {
                    this.kill();
                    return false;
                }
            }
        }
    }

    this.world.setTo(this.game.camera.x + this.worldTransform.tx, this.game.camera.y + this.worldTransform.ty);

    if (this.visible)
    {
        this._cache[3] = this.game.stage.currentRenderOrderID++;
    }

    this.animations.update();

    if (this.body)
    {
        this.body.preUpdate();
    }

    //  Update any Children
    for (var i = 0, len = this.children.length; i < len; i++)
    {
        this.children[i].preUpdate();
    }

    return true;

};

/**
* Override and this method for custom update logic.
*
* If this sprite has any children you should call update on them too.
*
* @method Phaser.Sprite#update
* @memberof Phaser.Sprite
* @protected
*/
Phaser.Sprite.prototype.update = function() {

};

/**
* Internal function called by the World postUpdate cycle.
*
* @method Phaser.Sprite#postUpdate
* @memberof Phaser.Sprite
* @protected
*/
Phaser.Sprite.prototype.postUpdate = function() {

    if (this.key instanceof Phaser.BitmapData)
    {
        this.key.render();
    }

    if (this.exists && this.body)
    {
        this.body.postUpdate();
    }

    //  Fixed to Camera?
    if (this._cache[7] === 1)
    {
        this.position.x = (this.game.camera.view.x + this.cameraOffset.x) / this.game.camera.scale.x;
        this.position.y = (this.game.camera.view.y + this.cameraOffset.y) / this.game.camera.scale.y;
    }

    //  Update any Children
    for (var i = 0, len = this.children.length; i < len; i++)
    {
        this.children[i].postUpdate();
    }

};

/**
* Changes the underlying Texture.
*
* This causes a WebGL texture update, so use sparingly or in low-intensity portions of your game.
*
* @method Phaser.Sprite#loadTexture
* @memberof Phaser.Sprite
* @param {string|Phaser.RenderTexture|Phaser.BitmapData|PIXI.Texture} key - This is the image or texture used by the Sprite during rendering. It can be a string which is a reference to the Cache entry, or an instance of a RenderTexture, BitmapData or PIXI.Texture.
* @param {string|number} [frame] - If this Sprite is using part of a sprite sheet or texture atlas you can specify the exact frame to use by giving a string or numeric index.
* @param {boolean} [stopAnimation=true] - If an animation is already playing on this Sprite you can choose to stop it or let it carry on playing.
*/
Phaser.Sprite.prototype.loadTexture = function (key, frame, stopAnimation) {

    frame = frame || 0;

    if (stopAnimation || typeof stopAnimation === 'undefined')
    {
        this.animations.stop();
    }

    this.key = key;

    var setFrame = true;
    var smoothed = this.smoothed;

    if (key instanceof Phaser.RenderTexture)
    {
        this.key = key.key;
        this.setTexture(key);
    }
    else if (key instanceof Phaser.BitmapData)
    {
        //  This works from a reference, which probably isn't what we need here
        this.setTexture(key.texture);

        if (this.game.cache.getFrameData(key.key, Phaser.Cache.BITMAPDATA))
        {
            setFrame = !this.animations.loadFrameData(this.game.cache.getFrameData(key.key, Phaser.Cache.BITMAPDATA), frame);
        }
    }
    else if (key instanceof PIXI.Texture)
    {
        this.setTexture(key);
    }
    else
    {
        if (key === null || typeof key === 'undefined')
        {
            this.key = '__default';
            this.setTexture(PIXI.TextureCache[this.key]);
        }
        else if (typeof key === 'string' && !this.game.cache.checkImageKey(key))
        {
            console.warn("Texture with key '" + key + "' not found.");
            this.key = '__missing';
            this.setTexture(PIXI.TextureCache[this.key]);
        }
        else
        {
            this.setTexture(new PIXI.Texture(PIXI.BaseTextureCache[key]));

            setFrame = !this.animations.loadFrameData(this.game.cache.getFrameData(key), frame);
        }
    }
    
    this.texture.baseTexture.dirty();

    if (setFrame)
    {
        this._frame = Phaser.Rectangle.clone(this.texture.frame);
    }

    if (!smoothed)
    {
        this.smoothed = false;
    }

};

/**
* Sets the displayed Texture frame bounds.
*
* This is primarily an internal method used by Image.loadTexture.
*
* @method Phaser.Sprite#setFrame
* @memberof Phaser.Sprite
* @param {Phaser.Frame} frame - The Frame to be used by the texture.
*/
Phaser.Sprite.prototype.setFrame = function(frame) {

    this._frame = frame;

    this.texture.frame.x = frame.x;
    this.texture.frame.y = frame.y;
    this.texture.frame.width = frame.width;
    this.texture.frame.height = frame.height;

    this.texture.crop.x = frame.x;
    this.texture.crop.y = frame.y;
    this.texture.crop.width = frame.width;
    this.texture.crop.height = frame.height;

    if (frame.trimmed)
    {
        if (this.texture.trim)
        {
            this.texture.trim.x = frame.spriteSourceSizeX;
            this.texture.trim.y = frame.spriteSourceSizeY;
            this.texture.trim.width = frame.sourceSizeW;
            this.texture.trim.height = frame.sourceSizeH;
        }
        else
        {
            this.texture.trim = { x: frame.spriteSourceSizeX, y: frame.spriteSourceSizeY, width: frame.sourceSizeW, height: frame.sourceSizeH };
        }

        this.texture.width = frame.sourceSizeW;
        this.texture.height = frame.sourceSizeH;
        this.texture.frame.width = frame.sourceSizeW;
        this.texture.frame.height = frame.sourceSizeH;
    }
    else if (!frame.trimmed && this.texture.trim)
    {
        this.texture.trim = null;
    }

    if (this.cropRect)
    {
        this.updateCrop();
    }

    this.texture._updateUvs();

};

/**
* Resets the Texture frame bounds that are used for rendering.
*
* @method Phaser.Sprite#resetFrame
* @memberof Phaser.Sprite
*/
Phaser.Sprite.prototype.resetFrame = function() {

    if (this._frame)
    {
        this.setFrame(this._frame);
    }

};

/**
* Crops the texture used for display. Cropping takes place from the top-left of the sprite.
*
* This method does not create a copy of `rect` by default: the rectangle can shared between
* multiple sprite and updated in real-time. In this case, `updateCrop` must be called after any modifications
* to the shared/non-copied rectangle before the crop will be updated.
*
* The rectangle object can be a Phaser.Rectangle or any object so long as it has public x, y, width and height properties.
*
* @method Phaser.Sprite#crop
* @memberof Phaser.Sprite
* @param {Phaser.Rectangle} rect - The Rectangle used during cropping. Pass null or no parameters to clear a previously set crop rectangle.
* @param {boolean} [copy=false] - If false Sprite.cropRect will be a reference to the given rect. If true it will copy the rect values into a local Sprite.cropRect object.
*/
Phaser.Sprite.prototype.crop = function(rect, copy) {

    if (typeof copy === 'undefined') { copy = false; }

    if (rect)
    {
        if (copy && this.cropRect !== null)
        {
            this.cropRect.setTo(rect.x, rect.y, rect.width, rect.height);
        }
        else if (copy && this.cropRect === null)
        {
            this.cropRect = new Phaser.Rectangle(rect.x, rect.y, rect.width, rect.height);
        }
        else
        {
            this.cropRect = rect;
        }

        this.updateCrop();
    }
    else
    {
        this._crop = null;
        this.cropRect = null;

        this.resetFrame();
    }

};

/**
* Update the texture crop.
*
* If the rectangle supplied to `crop` has been modified (and was not copied),
* then this method needs to be called to update the internal crop/frame data.
*
* @method Phaser.Sprite#updateCrop
* @memberof Phaser.Sprite
*/
Phaser.Sprite.prototype.updateCrop = function() {

    if (!this.cropRect)
    {
        return;
    }

    this._crop = Phaser.Rectangle.clone(this.cropRect, this._crop);
    this._crop.x += this._frame.x;
    this._crop.y += this._frame.y;

    var cx = Math.max(this._frame.x, this._crop.x);
    var cy = Math.max(this._frame.y, this._crop.y);
    var cw = Math.min(this._frame.right, this._crop.right) - cx;
    var ch = Math.min(this._frame.bottom, this._crop.bottom) - cy;

    this.texture.crop.x = cx;
    this.texture.crop.y = cy;
    this.texture.crop.width = cw;
    this.texture.crop.height = ch;

    this.texture.frame.width = Math.min(cw, this.cropRect.width);
    this.texture.frame.height = Math.min(ch, this.cropRect.height);

    this.texture.width = this.texture.frame.width;
    this.texture.height = this.texture.frame.height;

    this.texture._updateUvs();

};

/**
* Brings a 'dead' sprite back to life.
*
* A resurrected Image has its `alive`, `exists`, and `visible` properties set to true
* and the `onRevived` event will be dispatched.
*
* @method Phaser.Sprite#revive
* @memberof Phaser.Sprite
* @param {number} [health=1] - The health to give the Sprite.
* @return (Phaser.Sprite) This instance.
*/
Phaser.Sprite.prototype.revive = function(health) {

    if (typeof health === 'undefined') { health = 1; }

    this.alive = true;
    this.exists = true;
    this.visible = true;
    this.health = health;

    if (this.events)
    {
        this.events.onRevived.dispatch(this);
    }

    return this;

};

/**
* Kills the sprite.
*
* A killed sprite has its `alive`, `exists`, and `visible` properties all set to false
* and the `onKilled` event will be dispatched.
*
* Killing a sprite is a way to recycle the Image (eg. in a Group/pool) but it doesn't free it from memory.
* Use {@link Phaser.Sprite#destroy} if the sprite is no longer needed.
*
* @method Phaser.Sprite#kill
* @memberof Phaser.Sprite
* @return {Phaser.Sprite} This instance.
*/
Phaser.Sprite.prototype.kill = function() {

    this.alive = false;
    this.exists = false;
    this.visible = false;

    if (this.events)
    {
        this.events.onKilled.dispatch(this);
    }

    return this;

};

/**
* Destroys the sprite.
*
* This removes it from its parent group, destroys the input, event, and animation handlers if present
* and nulls its reference to game, freeing it up for garbage collection.
*
* @method Phaser.Sprite#destroy
* @memberof Phaser.Sprite
* @param {boolean} [destroyChildren=true] - Should every child of this object have its destroy method called?
*/
Phaser.Sprite.prototype.destroy = function(destroyChildren) {

    if (this.game === null || this._cache[8] === 1) { return; }

    if (typeof destroyChildren === 'undefined') { destroyChildren = true; }

    this._cache[8] = 1;

    if (this.events)
    {
        this.events.onDestroy.dispatch(this);
    }

    if (this.parent)
    {
        if (this.parent instanceof Phaser.Group)
        {
            this.parent.remove(this);
        }
        else
        {
            this.parent.removeChild(this);
        }
    }

    if (this.input)
    {
        this.input.destroy();
    }

    if (this.animations)
    {
        this.animations.destroy();
    }

    if (this.body)
    {
        this.body.destroy();
    }

    if (this.events)
    {
        this.events.destroy();
    }

    var i = this.children.length;

    if (destroyChildren)
    {
        while (i--)
        {
            this.children[i].destroy(destroyChildren);
        }
    }
    else
    {
        while (i--)
        {
            this.removeChild(this.children[i]);
        }
    }

    if (this._crop)
    {
        this._crop = null;
    }

    if (this._frame)
    {
        this._frame = null;
    }

    this.alive = false;
    this.exists = false;
    this.visible = false;

    this.filters = null;
    this.mask = null;
    this.game = null;

    this._cache[8] = 0;

};

/**
* Damages the Sprite by removing the given amount of health.
*
* {@link Phaser.Sprite#kill} is called if `health` fals to 0 (or less).
*
* @method Phaser.Sprite#damage
* @memberof Phaser.Sprite
* @param {number} amount - The amount to subtract from the Sprite.health value.
* @return {Phaser.Sprite} This instance.
*/
Phaser.Sprite.prototype.damage = function(amount) {

    if (this.alive)
    {
        this.health -= amount;

        if (this.health <= 0)
        {
            this.kill();
        }
    }

    return this;

};

/**
* Resets the sprite.
*
* This places the sprite at the given x/y world coordinates and then
* sets `alive`, `exists`, `visible`, and `renderable` all to true.
*
* @method Phaser.Sprite#reset
* @memberof Phaser.Sprite
* @param {number} x - The x coordinate (in world space) to position the Sprite at.
* @param {number} y - The y coordinate (in world space) to position the Sprite at.
* @param {number} [health=1] - The health to give the Sprite.
* @return {Phaser.Sprite} This instance.
*/
Phaser.Sprite.prototype.reset = function(x, y, health) {

    if (typeof health === 'undefined') { health = 1; }

    this.world.setTo(x, y);
    this.position.x = x;
    this.position.y = y;
    this.alive = true;
    this.exists = true;
    this.visible = true;
    this.renderable = true;
    this._outOfBoundsFired = false;

    this.health = health;

    if (this.body)
    {
        this.body.reset(x, y, false, false);
    }

    this._cache[4] = 1;

    return this;

};

/**
* Brings the sprite to the top of the display list (ie. Group) it is a child of.
*
* @method Phaser.Sprite#bringToTop
* @memberof Phaser.Sprite
* @return (Phaser.Sprite) This instance.
*/
Phaser.Sprite.prototype.bringToTop = function() {

    if (this.parent)
    {
        this.parent.bringToTop(this);
    }

    return this;

};

/**
* Play an animation based on the given key.
*
* The animation should previously have been added via sprite.animations.add()
* If the requested animation is already playing this request will be ignored:
* to reset an already running animation, do so directly on the Animation object itself.
*
* @method Phaser.Sprite#play
* @memberof Phaser.Sprite
* @param {string} name - The name of the animation to be played, e.g. "fire", "walk", "jump".
* @param {number} [frameRate=null] - The framerate to play the animation at. The speed is given in frames per second. If not provided the previously set frameRate of the Animation is used.
* @param {boolean} [loop=false] - Should the animation be looped after playback. If not provided the previously set loop value of the Animation is used.
* @param {boolean} [killOnComplete=false] - If set to true when the animation completes (only happens if loop=false) the parent Sprite will be killed.
* @return {Phaser.Animation} A reference to playing Animation instance.
*/
Phaser.Sprite.prototype.play = function (name, frameRate, loop, killOnComplete) {

    if (this.animations)
    {
        return this.animations.play(name, frameRate, loop, killOnComplete);
    }

};

/**
* Checks to see if the bounds of this Sprite overlaps with the bounds of the given Display Object.
*
* The display object can be a Sprite, Image, TileSprite or anything that extends those such as a Button.
*
* This check ignores the Sprites hitArea property and runs a Sprite.getBounds comparison on both objects to determine the result.
* Therefore it's relatively expensive to use in large quantities (i.e. with lots of Sprites at a high frequency), but should be fine for low-volume testing where physics isn't required.
*
* @method Phaser.Sprite#overlap
* @memberof Phaser.Sprite
* @param {Phaser.Sprite|Phaser.Image|Phaser.TileSprite|Phaser.Button|PIXI.DisplayObject} displayObject - The display object to check against.
* @return {boolean} True if the bounds of this Sprite intersects at any point with the bounds of the given display object.
*/
Phaser.Sprite.prototype.overlap = function (displayObject) {

    return Phaser.Rectangle.intersects(this.getBounds(), displayObject.getBounds());

};

/**
 * Adjust scaling limits, if set, to this Sprite.
 *
 * @method Phaser.Sprite#checkTransform
 * @private
 * @param {PIXI.Matrix} wt - The updated worldTransform matrix.
 * @protected
 */
Phaser.Sprite.prototype.checkTransform = function (wt) {

    if (this.scaleMin)
    {
        if (wt.a < this.scaleMin.x)
        {
            wt.a = this.scaleMin.x;
        }

        if (wt.d < this.scaleMin.y)
        {
            wt.d = this.scaleMin.y;
        }
    }

    if (this.scaleMax)
    {
        if (wt.a > this.scaleMax.x)
        {
            wt.a = this.scaleMax.x;
        }

        if (wt.d > this.scaleMax.y)
        {
            wt.d = this.scaleMax.y;
        }
    }

};

/**
* Sets the scaleMin and scaleMax values.
*
* These values are used to limit how far this Sprite will scale based on its parent.
* For example if this Sprite has a minScale value of 1 and its parent has a scale value of 0.5, the 0.5 will be ignored and the scale value of 1 will be used.
* By using these values you can carefully control how Sprites deal with responsive scaling.
* 
* If only one parameter is given then that value will be used for both scaleMin and scaleMax:
* setScaleMinMax(1) = scaleMin.x, scaleMin.y, scaleMax.x and scaleMax.y all = 1
*
* If only two parameters are given the first is set as scaleMin.x and y and the second as scaleMax.x and y:
* setScaleMinMax(0.5, 2) = scaleMin.x and y = 0.5 and scaleMax.x and y = 2
*
* If you wish to set scaleMin with different values for x and y then either modify Sprite.scaleMin directly, or pass `null` for the maxX and maxY parameters.
* 
* Call setScaleMinMax(null) to clear both the scaleMin and scaleMax values.
*
* @method Phaser.Sprite#setScaleMinMax
* @memberof Phaser.Sprite
* @param {number|null} minX - The minimum horizontal scale value this Sprite can scale down to.
* @param {number|null} minY - The minimum vertical scale value this Sprite can scale down to.
* @param {number|null} maxX - The maximum horizontal scale value this Sprite can scale up to.
* @param {number|null} maxY - The maximum vertical scale value this Sprite can scale up to.
*/
Phaser.Sprite.prototype.setScaleMinMax = function (minX, minY, maxX, maxY) {

    if (typeof minY === 'undefined')
    {
        //  1 parameter, set all to it
        minY = maxX = maxY = minX;
    }
    else if (typeof maxX === 'undefined')
    {
        //  2 parameters, the first is min, the second max
        maxX = maxY = minY;
        minY = minX;
    }

    if (minX === null)
    {
        this.scaleMin = null;
    }
    else
    {
        if (this.scaleMin)
        {
            this.scaleMin.set(minX, minY);
        }
        else
        {
            this.scaleMin = new Phaser.Point(minX, minY);
        }
    }

    if (maxX === null)
    {
        this.scaleMax = null;
    }
    else
    {
        if (this.scaleMax)
        {
            this.scaleMax.set(maxX, maxY);
        }
        else
        {
            this.scaleMax = new Phaser.Point(maxX, maxY);
        }
    }

};

/**
* The rotation of the sprite, in degrees, from its original orientation.
* 
* Values from 0 to 180 represent clockwise rotation; values from 0 to -180 represent counterclockwise rotation.
* Values outside this range are added to or subtracted from 360 to obtain a value within the range. For example, the statement player.angle = 450 is the same as player.angle = 90.
*
* If you wish to work in radians instead of degrees use the property Image.rotation instead. Working in radians is also a little faster as it doesn't have to convert the angle.
*
* @name Phaser.Sprite#angle
* @property {number} angle - The angle of this Sprite in degrees.
*/
Object.defineProperty(Phaser.Sprite.prototype, "angle", {

    get: function() {

        return Phaser.Math.wrapAngle(Phaser.Math.radToDeg(this.rotation));

    },

    set: function(value) {

        this.rotation = Phaser.Math.degToRad(Phaser.Math.wrapAngle(value));

    }

});

/**
* The delta x value: the difference between world.x now and in the previous step.
*
* Positive if the motion was to the right, negative if to the left.
*
* @name Phaser.Sprite#deltaX
* @property {number} deltaX
* @readonly
*/
Object.defineProperty(Phaser.Sprite.prototype, "deltaX", {

    get: function() {

        return this.world.x - this._cache[0];

    }

});

/**
* The delta y value: the difference between world.y now and in the previous step.
*
* Positive if the motion was downwards, negative if upwards.
*
* @name Phaser.Sprite#deltaY
* @property {number} deltaY
* @readonly
*/
Object.defineProperty(Phaser.Sprite.prototype, "deltaY", {

    get: function() {

        return this.world.y - this._cache[1];

    }

});

/**
* The delta z value: the difference between rotation now and in the previous step.
*
* @name Phaser.Sprite#deltaZ
* @property {number} deltaZ
* @readonly
*/
Object.defineProperty(Phaser.Sprite.prototype, "deltaZ", {

    get: function() {

        return this.rotation - this._cache[2];

    }

});

/**
* True if any part of the Image bounds are within the game world, otherwise false.
*
* @name Phaser.Sprite#inWorld
* @property {boolean} inWorld
* @readonly
*/
Object.defineProperty(Phaser.Sprite.prototype, "inWorld", {

    get: function() {

        return this.game.world.bounds.intersects(this.getBounds());

    }

});

/**
* True if any part of the Image bounds are within the game camera view, otherwise false.
*
* @name Phaser.Sprite#inCamera
* @property {boolean} inCamera - True if the Sprite bounds is within the game camera, even if only partially. Otherwise false if fully outside of it.
* @readonly
*/
Object.defineProperty(Phaser.Sprite.prototype, "inCamera", {

    get: function() {

        if (!this.autoCull && !this.checkWorldBounds)
        {
            this._bounds.copyFrom(this.getBounds());
            this._bounds.x += this.game.camera.view.x;
            this._bounds.y += this.game.camera.view.y;
        }

        return this.game.world.camera.view.intersects(this._bounds);

    }

});

/**
* Gets or sets the current frame index and updates the Texture for display.
*
* @name Phaser.Sprite#frame
* @property {number} frame
*/
Object.defineProperty(Phaser.Sprite.prototype, "frame", {

    get: function () {
        return this.animations.frame;
    },

    set: function (value) {
        this.animations.frame = value;
    }

});

/**
* Gets or sets the current frame by name and updates the Texture for display.
*
* @name Phaser.Sprite#frameName
* @property {string} frameName
*/
Object.defineProperty(Phaser.Sprite.prototype, "frameName", {

    get: function () {
        return this.animations.frameName;
    },

    set: function (value) {
        this.animations.frameName = value;
    }

});

/**
* The render order ID, reset every frame.
* @name Phaser.Sprite#renderOrderID
* @property {number} renderOrderID
* @readonly
* @protected
*/
Object.defineProperty(Phaser.Sprite.prototype, "renderOrderID", {

    get: function() {

        return this._cache[3];

    }

});

/**
* By default a sprite won't process any input events at all. By setting inputEnabled to true the Phaser.InputHandler is
* activated for this object and it will then start to process click/touch events and more.
*
* @name Phaser.Sprite#inputEnabled
* @property {boolean} inputEnabled - Set to true to allow this object to receive input events.
*/
Object.defineProperty(Phaser.Sprite.prototype, "inputEnabled", {

    get: function () {

        return (this.input && this.input.enabled);

    },

    set: function (value) {

        if (value)
        {
            if (this.input === null)
            {
                this.input = new Phaser.InputHandler(this);
                this.input.start();
            }
            else if (this.input && !this.input.enabled)
            {
                this.input.start();
            }
        }
        else
        {
            if (this.input && this.input.enabled)
            {
                this.input.stop();
            }
        }

    }

});

/**
* Control if the core game loop and physics update this Sprite or not.
*
* When set to false the sprite's body will be removed from the physics world (if it has one) and `visible` will be set to false.
* When set to true the body will be re-added (if it had a body) and `visible` will be set to true.
*
* @name Phaser.Sprite#exists
* @property {boolean} exists
*/
Object.defineProperty(Phaser.Sprite.prototype, "exists", {

    get: function () {

        return !!this._cache[6];

    },

    set: function (value) {

        if (value)
        {
            //  exists = true
            this._cache[6] = 1;

            if (this.body && this.body.type === Phaser.Physics.P2JS)
            {
                this.body.addToWorld();
            }

            this.visible = true;
        }
        else
        {
            //  exists = false
            this._cache[6] = 0;

            if (this.body && this.body.type === Phaser.Physics.P2JS)
            {
                this.body.removeFromWorld();
            }

            this.visible = false;

        }
    }

});

/**
* An sprite that is fixed to the camera uses its x/y coordinates as offsets from the top left of the camera; these are stored in Image.cameraOffset.
*
* Note that the cameraOffset values are in addition to any parent in the display list.
* So if this Image was in a Group that has x: 200, then this will be added to the cameraOffset.x
*
* @name Phaser.Sprite#fixedToCamera
* @property {boolean} fixedToCamera
*/
Object.defineProperty(Phaser.Sprite.prototype, "fixedToCamera", {

    get: function () {

        return !!this._cache[7];

    },

    set: function (value) {

        if (value)
        {
            this._cache[7] = 1;
            this.cameraOffset.set(this.x, this.y);
        }
        else
        {
            this._cache[7] = 0;
        }
    }

});

/**
* @borrows Phaser.Image#smoothed as Phaser.Sprite#smoothed
*/
Object.defineProperty(Phaser.Sprite.prototype, "smoothed", {

    get: function () {

        return !this.texture.baseTexture.scaleMode;

    },

    set: function (value) {

        if (value)
        {
            if (this.texture)
            {
                this.texture.baseTexture.scaleMode = 0;
            }
        }
        else
        {
            if (this.texture)
            {
                this.texture.baseTexture.scaleMode = 1;
            }
        }
    }

});

/**
* The position of the Sprite on the x axis relative to the local coordinates of the parent.
*
* @name Phaser.Sprite#x
* @property {number} x - The position of the Sprite on the x axis relative to the local coordinates of the parent.
*/
Object.defineProperty(Phaser.Sprite.prototype, "x", {

    get: function () {

        return this.position.x;

    },

    set: function (value) {

        this.position.x = value;

        if (this.body && this.body.type === Phaser.Physics.ARCADE && this.body.phase === 2)
        {
            this.body._reset = 1;
        }

    }

});

/**
* The position of the Sprite on the y axis relative to the local coordinates of the parent.
*
* @name Phaser.Sprite#y
* @property {number} y - The position of the Sprite on the y axis relative to the local coordinates of the parent.
*/
Object.defineProperty(Phaser.Sprite.prototype, "y", {

    get: function () {

        return this.position.y;

    },

    set: function (value) {

        this.position.y = value;

        if (this.body && this.body.type === Phaser.Physics.ARCADE && this.body.phase === 2)
        {
            this.body._reset = 1;
        }

    }

});

/**
* True if this object is currently being destroyed.
* @name Phaser.Sprite#destroyPhase
* @property {boolean} destroyPhase
* @protected
*/
Object.defineProperty(Phaser.Sprite.prototype, "destroyPhase", {

    get: function () {

        return !!this._cache[8];

    }

});
