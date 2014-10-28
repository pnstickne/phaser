/**
 * Renders a layer to the screen using Sprites.
 *
 * This class will be created by the Tilemap.
 *
 * @class TilemapSpriteRenderer
 * @extends Phaser.Group
 * @constructor
 */
//
// TODO: Add chunk prerendering?
//
// for discussions about this implementation:
//   see: https://github.com/GoodBoyDigital/pixi.js/issues/48
//   and: https://github.com/photonstorm/phaser/issues/1145
Phaser.TilemapSpriteRenderer = function (game, tilemap, index, width, height) {
    Phaser.Group.call(this, game);

    // Ignore..
    width = width;
    height = height;

    this.index = index;

    /**
     * The const type of this object.
     *
     * @property type
     * @type Number
     * @default
     */
    this.type = Phaser.TILEMAPLAYER;

    /**
    * An object that is fixed to the camera ignores the position of any ancestors in the display list
    * and uses its x/y coordinates as offsets from the top left of the camera.
    *
    * @property {boolean} fixedToCamera - Fixes this object to the Camera.
    * @default
    */
    this.fixedToCamera = false;

    /**
    * @property {Phaser.Point} cameraOffset - If this object is fixed to the camera then use this Point
    * to specify how far away from the Camera x/y it's rendered.
    */
    this.cameraOffset = new Phaser.Point(0, 0);

    /**
     * The scroll speed of the layer relative to the camera
     * (e.g. a scrollFactor of 0.5 scrolls half as quickly as the
     * 'normal' layers do)
     *
     * @property scroll
     * @type Phaser.Point
     * @default new Phaser.Point(1, 1)
     */
    // TODO: This doesn't actually work yet!
    this.scrollFactor = new Phaser.Point(1, 1);

    var layer = tilemap.getTileLayer(index);

    this.layer = layer;
    this.map = layer.tilemap;

    /**
     * The size of the layer
     *
     * @property size
     * @type Phaser.Point
     * @default new Phaser.Point(1, 1)
     */
    this.size = new Phaser.Point(layer.width || 0, layer.height || 0);

    // translate some tiled properties to our inherited properties
    this.x = layer.x || 0;
    this.y = layer.y || 0;
    this.alpha = layer.opacity !== undefined ? layer.opacity : 1;
    this.visible = layer.visible !== undefined ? layer.visible : true;

    // some private trackers
    this._buffered = { left: false, right: false, top: false, bottom: false };
    this._scroll = new Phaser.Point(); // the current scroll position
    this._scrollDelta = new Phaser.Point(); // the current delta of scroll since the last sprite move
    this._renderArea = new Phaser.Rectangle(); // the area to render in tiles

    this.rayStepRate = 4;

    /**
    * @property {object} _mc - Local map data and calculation cache.
    * @private
    */
    this._mc = {
        cw: layer.tileWidth,
        ch: layer.tileHeight,
        tx: 0,
        ty: 0,
        tw: 0,
        th: 0
    };

    // should we clear and rerender all the tiles
    this.dirty = true;

    // if batch is true, store children in a spritebatch
    //if (this.properties.batch) {
        //this.container = this.addChild(new Phaser.SpriteBatch());
    //} else {
    this.container = this;
    //}

    // This would ideally be optimized to control the creation/spawning of Sprites.
    // It will make a difference on more constrained devices.
    this.tiles = [];

    // Note: current layer guarantees data[0..height][0..width], possibly null.
    for (var y = 0; y < layer.data.length; y++) {
        var srcRow = layer.data[y];
        var row = [];
        for (var x = 0; x < srcRow.length; x++)
        {
            var srcTile = srcRow[x]; // Maybe null

            // Could optimize to null-for-non-existant, but this is simple with
            // updateFromTile also controlling visibility.
            var tileSprite = new Phaser.TileSprite(this.game);
            tileSprite.updateFromTile(srcTile);

            row.push(tileSprite);
        }

        this.tiles.push(row);
    }

    this._results = [];

};

Phaser.TilemapSpriteRenderer.prototype = Object.create(Phaser.Group.prototype);
Phaser.TilemapSpriteRenderer.prototype.constructor = Phaser.TilemapSpriteRenderer;

Phaser.TilemapSpriteRenderer.prototype.setupRenderArea = function () {

    var scaledTileWidth = this.layer.tileWidth * this.game.camera.scale.x;
    var scaledTileHeight = this.layer.tileHeight * this.game.camera.scale.y;

    // calculate the X/Y start of the render area as the tile location of the top-left of the camera view.
    this._renderArea.x = this.game.math.clampBottom(this.game.math.floor(this._scroll.x / scaledTileWidth), 0);
    this._renderArea.y = this.game.math.clampBottom(this.game.math.floor(this._scroll.y / scaledTileHeight), 0);

    // Maybe come from constructor args?
    var width = this.map.widthInPixels;
    var height = this.map.heightInPixels;

    // the width of the render area is the camera view width in tiles
    this._renderArea.width = this.game.math.ceil(this.game.camera.view.width / scaledTileWidth);

    // ensure we don't go outside the map width
    this._renderArea.width = (this._renderArea.x + this._renderArea.width > width) ?
        (width - this._renderArea.x) : this._renderArea.width;

    // the height of the render area is the camera view height in tiles
    this._renderArea.height = this.game.math.ceil(this.game.camera.view.height / scaledTileHeight);

    // ensure we don't go outside the map height
    this._renderArea.height = (this._renderArea.y + this._renderArea.height > height) ?
        (height - this._renderArea.y) : this._renderArea.height;

    // Have issues with not all tiles being readied on scroll. Not sure.
    this._renderArea.x = 0;
    this._renderArea.y = 0;
    this._renderArea.width = this.layer.width;
    this._renderArea.height = this.layer.height;
};

/**
 * Sets the world size to match the size of this layer.
 *
 * @method resizeWorld
 */
Phaser.TilemapSpriteRenderer.prototype.resizeWorld = function () {
    this.game.world.setBounds(0, 0, this.widthInPixels, this.heightInPixels);
};

/**
* Gets all tiles that intersect with the given line.
*
* @method
* @param {Phaser.Line} line - The line used to determine which tiles to return.
* @param {number} [stepRate] - How many steps through the ray will we check? If undefined or null it uses TilemapLayer.rayStepRate.
* @param {boolean} [collides=false] - If true only return tiles that collide on one or more faces.
* @param {boolean} [interestingFace=false] - If true only return tiles that have interesting faces.
* @return {array<Phaser.Tile>} An array of Phaser.Tiles.
*/
Phaser.TilemapSpriteRenderer.prototype.getRayCastTiles = function (line, stepRate, collides, interestingFace) {

    if (typeof stepRate === 'undefined' || stepRate === null) { stepRate = this.rayStepRate; }
    if (typeof collides === 'undefined') { collides = false; }
    if (typeof interestingFace === 'undefined') { interestingFace = false; }

    //  First get all tiles that touch the bounds of the line
    var tiles = this.getTiles(line.x, line.y, line.width, line.height, collides, interestingFace);

    if (tiles.length === 0)
    {
        return [];
    }

    //  Now we only want the tiles that intersect with the points on this line
    var coords = line.coordinatesOnLine(stepRate);
    var total = coords.length;
    var results = [];

    for (var i = 0; i < tiles.length; i++)
    {
        for (var t = 0; t < total; t++)
        {
            if (tiles[i].containsPoint(coords[t][0], coords[t][1]))
            {
                results.push(tiles[i]);
                break;
            }
        }
    }

    return results;

};

/**
* Get all tiles that exist within the given area, defined by the top-left corner, width and height. Values given are in pixels, not tiles.
* @method
* @param {number} x - X position of the top left corner.
* @param {number} y - Y position of the top left corner.
* @param {number} width - Width of the area to get.
* @param {number} height - Height of the area to get.
* @param {boolean} [collides=false] - If true only return tiles that collide on one or more faces.
* @param {boolean} [interestingFace=false] - If true only return tiles that have interesting faces.
* @return {array<Phaser.Tile>} An array of Phaser.Tiles.
*/
Phaser.TilemapSpriteRenderer.prototype.getTiles = function (x, y, width, height, collides, interestingFace) {

    //  Should we only get tiles that have at least one of their collision flags set? (true = yes, false = no just get them all)
    if (typeof collides === 'undefined') { collides = false; }
    if (typeof interestingFace === 'undefined') { interestingFace = false; }

    // adjust the x,y coordinates for scrollFactor
    //x = this._fixX(x);
    //y = this._fixY(y);

    if (width > this.layer.widthInPixels)
    {
        width = this.layer.widthInPixels;
    }

    if (height > this.layer.heightInPixels)
    {
        height = this.layer.heightInPixels;
    }

    //  Convert the pixel values into tile coordinates
    this._mc.tx = this.game.math.snapToFloor(x, this._mc.cw) / this._mc.cw;
    this._mc.ty = this.game.math.snapToFloor(y, this._mc.ch) / this._mc.ch;
    this._mc.tw = (this.game.math.snapToCeil(width, this._mc.cw) + this._mc.cw) / this._mc.cw;
    this._mc.th = (this.game.math.snapToCeil(height, this._mc.ch) + this._mc.ch) / this._mc.ch;

    //  This should apply the layer x/y here
    this._results.length = 0;

    for (var wy = this._mc.ty; wy < this._mc.ty + this._mc.th; wy++)
    {
        for (var wx = this._mc.tx; wx < this._mc.tx + this._mc.tw; wx++)
        {
            if (this.layer.data[wy] && this.layer.data[wy][wx])
            {
                if ((!collides && !interestingFace) || this.layer.data[wy][wx].isInteresting(collides, interestingFace))
                {
                    this._results.push(this.layer.data[wy][wx]);
                }
            }
        }
    }

    return this._results;

};

/**
 * Automatically called by Tilemap.postUpdate. Handles scrolling the layer and updating the scale
 *
 * @method postUpdate
 */
Phaser.TilemapSpriteRenderer.prototype.postUpdate = function () {
    Phaser.Group.prototype.postUpdate.call(this);

    if (this.fixedToCamera) {
        this.position.x = (this.game.camera.view.x + this.cameraOffset.x) / this.game.camera.scale.x;
        this.position.y = (this.game.camera.view.y + this.cameraOffset.y) / this.game.camera.scale.y;
    }

    // TODO: this seems to not work properly when scale changes on the fly. Look into that...
    if (this.dirty || this.layer.dirty) {
        // no longer dirty
        this.layer.dirty = false;
        this.dirty = false;

        // setup the render area, and scaled tilesize
        this.setupRenderArea();

        // resize the world to the new size
        // TODO: Seems dangerous to do this here, may break if user wants to manually set bounds
        // and this reset it each time scale changes.
        this.resizeWorld();

        // render the tiles on the screen
        this.setupTiles();
    }

    this.scrollX = this.game.camera.x;
    this.scrollY = this.game.camera.y;

    this.updatePan();
};

/**
 * Clears the current tiles and sets up the render area
 *
 * @method setupTiles
 * @private
 */
Phaser.TilemapSpriteRenderer.prototype.setupTiles = function () {
    // clear all the tiles
    this.clearTiles();

    // setup a tile for each location in the renderArea
    for (var x = this._renderArea.x; x < this._renderArea.right; ++x) {
        for (var y = this._renderArea.y; y < this._renderArea.bottom; ++y) {
            this.moveTileSprite(-1, -1, x, y);
        }
    }

    // reset buffered status
    this._buffered.left = this._buffered.right = this._buffered.top = this._buffered.bottom = false;

    // reset scroll delta
    this._scrollDelta.x = this._scroll.x % this.map.scaledTileWidth;
    this._scrollDelta.y = this._scroll.y % this.map.scaledTileHeight;
};

/**
 * Clears all the tiles currently used to render the layer
 *
 * @method clearTiles
 * @return {TilemapSpriteRenderer} Returns itself.
 * @chainable
 */
Phaser.TilemapSpriteRenderer.prototype.clearTiles = function () {

    var c = this.container.children.length;
    while (c--) {
        var child = this.container.children[c];
        if (child.type === Phaser.TILESPRITE) {
            this.clearTile(this.child);
        }
    }

    return this;
};

Phaser.TilemapSpriteRenderer.prototype.clearTile = function (tile) {
    if (!tile || tile.parent !== this.container) {
        return;
    }

    this.container.removeChild(tile);
};

/**
 * Moves a tile sprite from one position to another, and creates a new tile
 * if the old position didn't have a sprite
 *
 * @method moveTileSprite
 * @param fromTileX {Number} The x coord of the tile in units of tiles (not pixels) to move from
 * @param fromTileY {Number} The y coord of the tile in units of tiles (not pixels) to move from
 * @param toTileX {Number} The x coord of the tile in units of tiles (not pixels) to move to
 * @param toTileY {Number} The y coord of the tile in units of tiles (not pixels) to move to
 * @return {Tile} The sprite to display
 */
Phaser.TilemapSpriteRenderer.prototype.moveTileSprite = function (fromTileX, fromTileY, toTileX, toTileY) {
    // remove the old tile that is no longer needed to be shown
    this.clearTile(this.tiles[fromTileY] && this.tiles[fromTileY][fromTileX]);

    // add the tile we need to show
    if (this.tiles[toTileY] && this.tiles[toTileY][toTileX]) {
        this.container.addChild(this.tiles[toTileY][toTileX]);
    }
};

/**
 * Pans the layer around, rendering stuff if necessary
 *
 * @method updatePan
 * @return {TilemapSpriteRenderer} Returns itself.
 * @chainable
 */
Phaser.TilemapSpriteRenderer.prototype.updatePan = function () {
    // First, check if we need to build a buffer around the viewport
    // usually this happens on the first pan after a full render
    // caused by a viewport resize. We do this buffering here instead
    // of in the initial render because in the initial render, the buffer
    // may try to go negative which has no tiles. Plus doing it here
    // reduces the number of tiles that need to be created initially.

    // moving world right, so left will be exposed
    if (this._scrollDelta.x > 0 && !this._buffered.left) {
        this._buffered.left = true;
        this._renderLeft(true);
    }
    // moving world left, so right will be exposed
    else if (this._scrollDelta.x < 0 && !this._buffered.right) {
        this._buffered.right = true;
        this._renderRight(true);
    }

    // moving world down, so top will be exposed
    if (this._scrollDelta.y > 0 && !this._buffered.top) {
        this._buffered.top = true;
        this._renderUp(true);
    }
    // moving world up, so bottom will be exposed
    else if (this._scrollDelta.y < 0 && !this._buffered.bottom) {
        this._buffered.bottom = true;
        this._renderDown(true);
    }

    // Here is where the actual panning gets done, we check if the pan
    // delta is greater than a scaled tile and if so pan that direction.
    // The reason we do it in a while loop is because the delta can be
    // large than 1 scaled tile and may require multiple render pans
    // (this can happen if you can .pan(x, y) with large values)

    // moved position right, so render left
    while (this._scrollDelta.x >= this.map.scaledTileWidth) {
        this._renderLeft();
        this._scrollDelta.x -= this.map.scaledTileWidth;
    }

    // moved position left, so render right
    while (this._scrollDelta.x <= -this.map.scaledTileWidth) {
        this._renderRight();
        this._scrollDelta.x += this.map.scaledTileWidth;
    }

    // moved position down, so render up
    while (this._scrollDelta.y >= this.map.scaledTileHeight) {
        this._renderUp();
        this._scrollDelta.y -= this.map.scaledTileHeight;
    }

    // moved position up, so render down
    while (this._scrollDelta.y <= -this.map.scaledTileHeight) {
        this._renderDown();
        this._scrollDelta.y += this.map.scaledTileHeight;
    }
};

/**
 * Renders tiles to the left, pulling from the far right
 *
 * @method _renderLeft
 * @param [forceNew=false] {Boolean} If set to true, new tiles are created instead of trying to recycle
 * @private
 */
Phaser.TilemapSpriteRenderer.prototype._renderLeft = function (forceNew) {
    this._renderArea.x--;

    //move all the far right tiles to the left side
    for (var i = 0; i < this._renderArea.height; ++i) {
        this.moveTileSprite(
            forceNew ? -1 : this._renderArea.right,
            forceNew ? -1 : this._renderArea.top + i,
            this._renderArea.left,
            this._renderArea.top + i
        );
    }

    if (forceNew) {
        this._renderArea.width++;
    }
};

/**
 * Renders tiles to the right, pulling from the far left
 *
 * @method _renderRight
 * @param [forceNew=false] {Boolean} If set to true, new tiles are created instead of trying to recycle
 * @private
 */
Phaser.TilemapSpriteRenderer.prototype._renderRight = function (forceNew) {
    //move all the far left tiles to the right side
    for (var i = 0; i < this._renderArea.height; ++i) {
        this.moveTileSprite(
            forceNew ? -1 : this._renderArea.left,
            forceNew ? -1 : this._renderArea.top + i,
            this._renderArea.right,
            this._renderArea.top + i
        );
    }

    if (!forceNew) {
        this._renderArea.x++;
    }

    if (forceNew) {
        this._renderArea.width++;
    }
};

/**
 * Renders tiles to the top, pulling from the far bottom
 *
 * @method _renderUp
 * @param [forceNew=false] {Boolean} If set to true, new tiles are created instead of trying to recycle
 * @private
 */
Phaser.TilemapSpriteRenderer.prototype._renderUp = function (forceNew) {
    this._renderArea.y--;

    //move all the far bottom tiles to the top side
    for (var i = 0; i < this._renderArea.width; ++i) {
        this.moveTileSprite(
            forceNew ? -1 : this._renderArea.left + i,
            forceNew ? -1 : this._renderArea.bottom,
            this._renderArea.left + i,
            this._renderArea.top
        );
    }

    if (forceNew) {
        this._renderArea.height++;
    }
};

/**
 * Renders tiles to the bottom, pulling from the far top
 *
 * @method _renderDown
 * @param [forceNew=false] {Boolean} If set to true, new tiles are created instead of trying to recycle
 * @private
 */
Phaser.TilemapSpriteRenderer.prototype._renderDown = function (forceNew) {
    //move all the far top tiles to the bottom side
    for (var i = 0; i < this._renderArea.width; ++i) {
        this.moveTileSprite(
            forceNew ? -1 : this._renderArea.left + i,
            forceNew ? -1 : this._renderArea.top,
            this._renderArea.left + i,
            this._renderArea.bottom
        );
    }

    if (!forceNew) {
        this._renderArea.y++;
    }

    if (forceNew) {
        this._renderArea.height++;
    }
};

/**
 * Destroys the tile layer completely
 *
 * @method destroy
 */
Phaser.TilemapSpriteRenderer.prototype.destroy = function () {
    Phaser.Group.prototype.destroy.apply(this, arguments);

    this.state = null;
    this.name = null;
    this.size = null;
    this.properties = null;
    this.type = null;
    this.position.x = null;
    this.position.y = null;
    this.alpha = null;
    this.visible = null;
    this.preRender = null;
    this.chunkSize = null;

    this._buffered = null;
    this._scroll = null;
    this._renderArea = null;
};

Object.defineProperty(Phaser.TilemapSpriteRenderer.prototype, 'scrollX', {
    get: function () {
        return this._scroll.x;
    },
    set: function (value) {
        if (value !== this._scroll.x) {
            this._scrollDelta.x -= value - this._scroll.x;
            this._scroll.x = value;
        }
    }
});

Object.defineProperty(Phaser.TilemapSpriteRenderer.prototype, 'scrollY', {
    get: function () {
        return this._scroll.y;
    },
    set: function (value) {
        if (value !== this._scroll.y) {
            this._scrollDelta.y -= value - this._scroll.y;
            this._scroll.y = value;
        }
    }
});

Object.defineProperty(Phaser.TilemapSpriteRenderer.prototype, 'widthInPixels', {
    get: function () {
        return this.size.x * this.map.scaledTileWidth;
    }
});

Object.defineProperty(Phaser.TilemapSpriteRenderer.prototype, 'heightInPixels', {
    get: function () {
        return this.size.y * this.map.scaledTileHeight;
    }
});

/**
* @name Phaser.TilemapLayer#collisionWidth
* @property {number} collisionWidth - The width of the collision tiles.
*/
Object.defineProperty(Phaser.TilemapSpriteRenderer.prototype, 'collisionWidth', {

    get: function () {
        return this._mc.cw;
    },

    set: function (value) {

        this._mc.cw = value;

        // this.dirty = true;

    }

});

/**
* @name Phaser.TilemapLayer#collisionHeight
* @property {number} collisionHeight - The height of the collision tiles.
*/
Object.defineProperty(Phaser.TilemapSpriteRenderer.prototype, 'collisionHeight', {

    get: function () {
        return this._mc.ch;
    },

    set: function (value) {

        this._mc.ch = value;

        // this.dirty = true;

    }

});
