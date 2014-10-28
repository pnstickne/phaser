/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2014 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

/**
* A TilemapLayer is a Phaser.Image/Sprite that renders a specific TileLayer of a Tilemap.
*
* Since a TilemapLayer is a Sprite it can be moved around the display, added to other groups or display objects, etc.
*
* @class Phaser.TilemapLayer
* @extends {Phaser.Image}
* @constructor
* @param {Phaser.Game} game - Game reference to the currently running game.
* @param {Phaser.Tilemap} tilemap - The tilemap to which this layer belongs.
* @param {integer} index - The index of the TileLayer to render within the Tilemap.
* @param {number} width - Width of the renderable area of the layer.
* @param {number} height - Height of the renderable area of the layer.
*/
Phaser.TilemapLayer = function (game, tilemap, index, width, height) {

    /**
    * A reference to the currently running Game.
    * @member {Phaser.Game}
    * @protected
    * @readonly
    */
    this.game = game;

    /**
    * The Tilemap to which this layer is bound.
    * @member {Phaser.Tilemap}
    * @protected
    * @readonly
    */
    this.map = tilemap;

    /**
    * The layer object within the Tilemap that this layer represents.
    * @member {Phaser.TileLayer}
    * @protected
    * @readonly
    */
    this.layer = tilemap.layers[index];

    /**
    * Used to track layer/render update requirements.
    * @member {integer}
    * @private
    */
    this._layerChangeCount = -1;

    /**
    * The canvas to which this TilemapLayer draws.
    * @member {HTMLCanvasElement}
    * @protected
    */
    this.canvas = Phaser.Canvas.create(width, height, '', true);

    /**
    * The 2d context of the canvas.
    * @member {CanvasRenderingContext2D}
    * @private
    */
    this.context = this.canvas.getContext('2d');

    /**
    * Required Pixi var.
    * @member {PIXI.BaseTexture}
    * @protected
    */
    this.baseTexture = new PIXI.BaseTexture(this.canvas);

    /**
    * Required Pixi var.
    * @member {PIXI.Texture}
    * @protected
    */
    this.texture = new PIXI.Texture(this.baseTexture);

    /**
    * Dimensions of the renderable area.
    * @member {Phaser.Frame}
    */
    this.textureFrame = new Phaser.Frame(0, 0, 0, width, height, 'tilemapLayer', game.rnd.uuid());

    Phaser.Image.call(this, this.game, 0, 0, this.texture, this.textureFrame);

    /**
    * The name of the layer.
    * @member {string}
    */
    this.name = '';

    /**
    * The const type of this object.
    * @member {number}
    * @readonly
    * @protected
    * @default Phaser.TILEMAPLAYER
    */
    this.type = Phaser.TILEMAPLAYER;

    /**
    * An object that is fixed to the camera ignores the position of any ancestors in the display list and uses its x/y coordinates as offsets from the top left of the camera.
    * @member {boolean}
    * @default
    */
    this.fixedToCamera = true;

    /**
    * If this object is fixed to the camera then use this Point to specify how far away from the Camera x/y it's rendered.
    * @member {Phaser.Point}
    */
    this.cameraOffset = new Phaser.Point(0, 0);

    /**
    * If no tileset is given the tiles will be rendered as rectangles in this color. Provide in hex or rgb/rgba string format.
    * @member {string}
    * @default
    */
    this.tileColor = 'rgb(255, 255, 255)';

    /**
    * If set to true the collideable tile edges path will be rendered. Only works when game is running in Phaser.CANVAS mode.
    * @member {boolean}
    * @default
    */
    this.debug = false;

    /**
    * If debug is true then the tileset is rendered with this alpha level, to make the tile edges clearer.
    * @member {number}
    * @default
    */
    this.debugAlpha = 0.5;

    /**
    * If debug is true this is the color used to outline the edges of collidable tiles. Provide in hex or rgb/rgba string format.
    * @member {string}
    * @default
    */
    this.debugColor = 'rgba(0, 255, 0, 1)';

    /**
    * If true the debug tiles are filled with debugFillColor AND stroked around.
    * @member {boolean}
    * @default
    */
    this.debugFill = false;

    /**
    * If debugFill is true this is the color used to fill the tiles. Provide in hex or rgb/rgba string format.
    * @member {string}
    * @default
    */
    this.debugFillColor = 'rgba(0, 255, 0, 0.2)';

    /**
    * If debug is true this is the color used to outline the edges of tiles that have collision callbacks. Provide in hex or rgb/rgba string format.
    * @member {string}|
    * @default
    */
    this.debugCallbackColor = 'rgba(255, 0, 0, 1)';

    /**
    * Speed at which this layer scrolls horizontally, relative to the camera (e.g. scrollFactorX of 0.5 scrolls half as quickly as the 'normal' camera-locked layers do).
    *
    * @member {number}
    * @public
    * @default 1
    */
    this.scrollFactorX = 1;

    /**
    * Speed at which this layer scrolls vertically, relative to the camera (e.g. scrollFactorY of 0.5 scrolls half as quickly as the 'normal' camera-locked layers do)
    * @member {number}
    * @public
    * @default 1
    */
    this.scrollFactorY = 1;

    /**
    * If true the tiles will be re-rendered, even if such is not believed to be required.
    * @member {boolean} dirty
    * @protected
    */
    this.dirty = true;

    /**
    * When ray-casting against tiles this is the number of steps it will jump. For larger tile sizes you can increase this to improve performance.
    * @member {number}
    * @default
    */
    this.rayStepRate = 4;

    /**
    * Flag controlling if the layer tiles wrap at the edges.
    * @member {boolean}
    * @default
    * @private
    */
    this._wrap = false;

    /**
    * Local map data and calculation cache.
    * @member {object} _mc
    * @private
    */
    this._mc = {

        // Collision width/height (pixels)
        cw: tilemap.tileWidth,
        ch: tilemap.tileHeight,

    };

    /**
    * The current canvas left after scroll is applied.
    * @member {number}
    * @private
    */
    this._scrollX = 0;

    /**
    * The current canvas top after scroll is applied.
    * @member {number}
    * @private
    */
    this._scrollY = 0;

    /**
    * Used to bypass rendering if possible. The values correspond to `[scroll-x (int), scroll-y (int), canvas-width, canvas-height]`.
    * @member {number[]}
    * @private
    */
    this._prevDraw = [0, 0, 0, 0];

    /**
    * Used for caching the tiles / array of tiles.
    * @member {Phaser.Tile[]}
    * @private
    */
    this._results = [];

};

Phaser.TilemapLayer.prototype = Object.create(Phaser.Image.prototype);
Phaser.TilemapLayer.prototype.constructor = Phaser.TilemapLayer;

/**
* The index of this layer within the Tilemap.
*
* @member {integer} #index
* @memberof Phaser.TilemapLayer
* @readonly
* @deprecated Use {@link Phaser.TilemapLayer#layerIndex}.
*/
Object.defineProperty(Phaser.TilemapLayer.prototype, 'index', {

    get: function () {
        return this.layer.layerIndex;
    }

});

/**
* The index of this layer within the Tilemap.
*
* @member {integer} #layerIndex
* @memberof Phaser.TilemapLayer
* @readonly
*/
Object.defineProperty(Phaser.TilemapLayer.prototype, 'layerIndex', {

    get: function () {
        return this.layer.layerIndex;
    }

});

/**
* Automatically called by World.postUpdate. Handles cache updates.
*
* @method
* @memberof Phaser.TilemapLayer
* @protected
*/
Phaser.TilemapLayer.prototype.postUpdate = function () {

    Phaser.Image.prototype.postUpdate.call(this);

    //  Stops you being able to auto-scroll the camera if it's not following a sprite
    var camera = this.game.camera;
    this.scrollX = camera.x * this.scrollFactorX;
    this.scrollY = camera.y * this.scrollFactorY;

    if (!this._foo) {
        debugger;
        this._foo = 1;
    }

    this.render();

    //  Fixed to Camera?
    if (this._cache[7] === 1)
    {
        this.position.x = (camera.view.x + this.cameraOffset.x) / camera.scale.x;
        this.position.y = (camera.view.y + this.cameraOffset.y) / camera.scale.y;
    }

    //  Update any Children
    // for (var i = 0, len = this.children.length; i < len; i++)
    // {
        // this.children[i].postUpdate();
    // }

};

/**
* Sets the world size to match the size of this layer.
*
* @method
* @memberof Phaser.TilemapLayer
* @public
*/
Phaser.TilemapLayer.prototype.resizeWorld = function () {

    this.game.world.setBounds(0, 0, this.layer.widthInPixels, this.layer.heightInPixels);

};

/**
* Take an x coordinate that doesn't account for scrollFactorX and 'fix' it into a scrolled local space.
*
* @method
* @memberof Phaser.TilemapLayer
* @private
* @param {number} x - x coordinate in camera space
* @return {number} x coordinate in scrollFactor-adjusted dimensions
*/
Phaser.TilemapLayer.prototype._fixX = function(x) {

    if (x < 0)
    {
        x = 0;
    }

    if (this.scrollFactorX === 1)
    {
        return x;
    }

    return this._scrollX + (x - (this._scrollX / this.scrollFactorX));

};

/**
* Take an x coordinate that _does_ account for scrollFactorX and 'unfix' it back to camera space.
*
* @method
* @memberof Phaser.TilemapLayer
* @private
* @param {number} x - x coordinate in scrollFactor-adjusted dimensions
* @return {number} x coordinate in camera space
*/
Phaser.TilemapLayer.prototype._unfixX = function(x) {

    if (this.scrollFactorX === 1)
    {
        return x;
    }

    return (this._scrollX / this.scrollFactorX) + (x - this._scrollX);

};

/**
* Take a y coordinate that doesn't account for scrollFactorY and 'fix' it into a scrolled local space.
*
* @method
* @memberof Phaser.TilemapLayer
* @private
* @param {number} y - y coordinate in camera space
* @return {number} y coordinate in scrollFactor-adjusted dimensions
*/
Phaser.TilemapLayer.prototype._fixY = function(y) {

    if (y < 0)
    {
        y = 0;
    }

    if (this.scrollFactorY === 1)
    {
        return y;
    }

    return this._scrollY + (y - (this._scrollY / this.scrollFactorY));

};

/**
* Take a y coordinate that _does_ account for scrollFactorY and 'unfix' it back to camera space.
*
* @method
* @memberof Phaser.TilemapLayer
* @private
* @param {number} y - y coordinate in scrollFactor-adjusted dimensions
* @return {number} y coordinate in camera space
*/
Phaser.TilemapLayer.prototype._unfixY = function(y) {

    if (this.scrollFactorY === 1)
    {
        return y;
    }

    return (this._scrollY / this.scrollFactorY) + (y - this._scrollY);

};

/**
* Convert a pixel value to a tile coordinate.
*
* @method
* @public
* @param {number} x - X position of the point in target tile (in pixels).
* @return {integer} The X map location of the tile.
*/
Phaser.TilemapLayer.prototype.getTileX = function (x) {

    // var tileWidth = this.tileWidth * this.scale.x;
    return Math.floor(this._fixX(x) / this.layer.tileWidth);

};

/**
* Convert a pixel value to a tile coordinate.
*
* @method
* @public
* @param {number} y - Y position of the point in target tile (in pixels).
* @return {integer} The Y map location of the tile.
*/
Phaser.TilemapLayer.prototype.getTileY = function (y) {

    // var tileHeight = this.tileHeight * this.scale.y;
    return Math.floor(this._fixY(y) / this.layer.tileHeight);

};

/**
* Convert a pixel value to a tile coordinate.
*
* @method
* @public
* @param {number} x - X position of the point in target tile (in pixels).
* @param {number} y - Y position of the point in target tile (in pixels).
* @param {(Phaser.Point|object)} [point=(new Point)] - The Point/object to update.
* @return {(Phaser.Point|object)} A Point/object with its `x` and `y` properties set.
*/
Phaser.TilemapLayer.prototype.getTileXY = function (x, y, point) {

    if (!point)
    {
        point = new Phaser.Point();
    }

    point.x = this.getTileX(x);
    point.y = this.getTileY(y);

    return point;

};

/**
* Gets all tiles that intersect with the given line.
*
* *See {@link Phaser.TileLayer} for restrictions on Tile usage.*
*
* @method Phaser.TilemapLayer#getRayCastTiles
* @memberof Phaser.TilemapLayer
* @public
* @param {Phaser.Line} line - The line used to determine which tiles to return.
* @param {number} [stepRate=(rayStepRate)] - How many steps through the ray will we check? Defaults to `rayStepRate`.
* @param {boolean} [collides=false] - If true only return tiles that collide on one or more faces.
* @param {boolean} [interestingFace=false] - If true only return tiles that have interesting faces.
* @return {array<Phaser.Tile>} An array of Phaser.Tiles.
*/
Phaser.TilemapLayer.prototype.getRayCastTiles = function (line, stepRate, collides, interestingFace) {

    if (!stepRate) { stepRate = this.rayStepRate; }
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
            var tile = tiles[i];
            var coord = coords[t];
            if (this.layer.cellContainsCoordinate(tile.x, tile.y, coord[0], coord[1]))
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
*
* *See {@link Phaser.TileLayer} for restrictions on Tile usage.*
*
* @method Phaser.TilemapLayer#getTiles
* @memberof Phaser.TilemapLayer
* @public
* @param {number} x - X position of the top left corner (in pixels).
* @param {number} y - Y position of the top left corner (in pixels).
* @param {number} width - Width of the area to get (in pixels).
* @param {number} height - Height of the area to get (in pixels).
* @param {boolean} [collides=false] - If true only return tiles that collide on one or more faces.
* @param {boolean} [interestingFace=false] - If true only return tiles that have interesting faces.
* @return {array<Phaser.Tile>} An array of Phaser.Tiles.
*/
Phaser.TilemapLayer.prototype.getTiles = function (x, y, width, height, collides, interestingFace) {

    //  Should we only get tiles that have at least one of their collision flags set? (true = yes, false = no just get them all)
    if (typeof collides === 'undefined') { collides = false; }
    if (typeof interestingFace === 'undefined') { interestingFace = false; }

    // adjust the x,y coordinates for scrollFactor
    x = this._fixX(x);
    y = this._fixY(y);

    //  Convert the pixel values into tile coordinates
    var tx = Math.floor(x / this._mc.cw);
    var ty = Math.floor(y / this._mc.ch);
    //  Don't just use ceil(width/cw) to allow account for x/y diff within cell
    var tw = Math.ceil((x + width) / this._mc.cw) - tx;
    var th = Math.ceil((y + height) / this._mc.ch) - ty;

    var acceptMask = Phaser.Tile.COLLIDE_ALL | Phaser.Tile.FACE_ALL;
    if (collides || interestingFace)
    {
        acceptMask = 0;
        if (collides) {
            acceptMask |= Phaser.Tile.COLLIDE_ALL;
        }
        if (interestingFace) {
            acceptMask |= Phaser.Tile.FACE_ALL;
        }
    }

    return this.layer.getExistingTiles(
        tx, ty, tw, th,
        this._results, acceptMask);

};

/**
* Flag controlling if the layer tiles wrap at the edges. Only works if the World size matches the Map size.
*
* @member {boolean} #wrap
* @memberof Phaser.TilemapLayer
* @public
* @default false
*/
Object.defineProperty(Phaser.TilemapLayer.prototype, "wrap", {

    get: function () {
        return this._wrap;
    },

    set: function (value) {
        this._wrap = value;
    }

});

/**
* Shifts the contents of the canvas - does extra math so that different browsers agree on the result. The specified (x/y) will be shifted to (0,0) after the copy. The newly exposed canvas area will need to be filled in.
* @private
*/
Phaser.TilemapLayer.prototype._shiftCanvas = function (context, x, y)
{
    var copyW = context.canvas.width - Math.abs(x);
    var copyH = context.canvas.height - Math.abs(y);

    //  When x/y non-negative
    var dx = 0;
    var dy = 0;
    var sx = x;
    var sy = y;

    if (x < 0)
    {
        dx = -x;
        sx = 0;
    }

    if (y < 0)
    {
        dy = -y;
        sy = 0;
    }

    context.drawImage(context.canvas, dx, dy, copyW, copyH, sx, sy, copyW, copyH);
};

/**
* Render tiles in the given area given by the virtual tile coordinates biased by the given scroll factor.
* This will constrain the tile coordinates based on wrapping but not physical coordinates.
* @private
*/
Phaser.TilemapLayer.prototype._renderArea = function (scrollX, scrollY, left, top, right, bottom) {

    var context = this.context;

    var width = this.layer.width;
    var height = this.layer.height;
    var tw = this.layer.tileWidth;
    var th = this.layer.tileHeight;

    var set = null;
    var lastIndex = NaN;
    var lastAlpha = NaN;
   
    // top-left pixel of top-left cell
    var baseX = (left * tw) - scrollX;
    var baseY = (top * th) - scrollY;

    // Fix vx/vy such it is normalized [0..width/height). This allows a simple conditional and decrement to always keep in range [0..width/height) during the loop. The major offset bias is to take care of negative values.
    var vx = (left + (20000 * width)) % width;
    var vy = (top + (20000 * height)) % height;

    // tx/ty - are pixel coordinates where tile is drawn
    // x/y - is cell location, normalized [0..width/height) in loop
    // xmax/ymax - remaining cells to render on column/row
    var tx, ty, x, y, xmax, ymax;

    context.fillStyle = this.tileColor;

    for (y = vy, ymax = bottom - top, ty = baseY;
        ymax >= 0;
        y++, ymax--, ty += th)
    {

        if (y >= height)
        {
            y -= height;
        }

        var row = this.layer.data[y];

        for (x = vx, xmax = right - left, tx = baseX;
            xmax >= 0;
            x++, xmax--, tx += tw)
        {

            if (x >= width)
            {
                x -= width;
            }

            var tile = row[x];
            if (!tile)
            {
                continue;
            }

            var index = tile.tileIndex;

            if (index >= 0)
            {
                if (index !== lastIndex)
                {
                    set = this.map.tilesets[this.map.tiles[index][2]];
                    lastIndex = index;
                }

                //  Setting the globalAlpha is "surprisingly expensive" in Chrome (38)
                if (tile.alpha !== lastAlpha && !this.debug)
                {
                    context.globalAlpha = tile.alpha;
                    lastAlpha = tile.alpha;
                }

                set.draw(context, tx, ty, index);

                if (tile.debug)
                {
                    context.fillStyle = 'rgba(0, 255, 0, 0.4)';
                    context.fillRect(tx, ty, tw, th);
                }
            }
           
        }

    }

};

/**
* Shifts the canvas and render damaged edge tiles.
* @private
*/
Phaser.TilemapLayer.prototype._renderShift = function (scrollX, scrollY, shiftX, shiftY) {

    var canvasWidth = this.canvas.width;
    var canvasHeight = this.canvas.height;

    var tw = this.layer.tileWidth;
    var th = this.layer.tileHeight;

    // Only cells with coordinates in the "plus" formed by `left <= x <= right` OR `top <= y <= bottom` are drawn. These coordinates may be outside the layer bounds.

    // Start in pixels
    var left = 0;
    var right = -tw;
    var top = 0;
    var bottom = -th;

    if (shiftX < 0) // layer moving left, damage right
    {
        left = canvasWidth + shiftX; // shiftX neg.
        right = canvasWidth - 1;
    }
    else if (shiftX > 0)
    {
        // left -> 0
        right = shiftX;
    }

    if (shiftY < 0) // layer moving down, damage top
    {
        top = canvasHeight + shiftY; // shiftY neg.
        bottom = canvasHeight - 1;
    }
    else if (shiftY > 0)
    {
        // top -> 0
        bottom = shiftY;
    }

    this._shiftCanvas(this.context, shiftX, shiftY);

    // Transform into tile-space
    left = Math.floor((left + scrollX) / tw);
    right = Math.floor((right + scrollX) / tw);
    top = Math.floor((top + scrollY) / th);
    bottom = Math.floor((bottom + scrollY) / th);

    if (shiftX !== 0)
    {
        // Clear left or right edge
        this.context.clearRect(((left * tw) - scrollX), 0, (right - left + 1) * tw, canvasHeight);
    }
    if (shiftY !== 0)
    {
        // Clear top or bottom edge
        this.context.clearRect(0, ((top * th) - scrollY), canvasWidth, (bottom - top + 1) * th);
    }

    //console.log("l:" + left + " r:" + right + " t:" + top + " b:" + bottom);

    if (left <= right)
    {
        var trueTop = Math.floor((0 + scrollY) / th);
        var trueBottom = Math.floor((canvasHeight - 1 + scrollY) / th);
        this._renderArea(scrollX, scrollY, left, trueTop, right, trueBottom);
    }
    if (top <= bottom)
    {
        var trueLeft = Math.floor((0 + scrollX) / tw);
        var trueRight = Math.floor((canvasWidth - 1 + scrollX) / tw);
        this._renderArea(scrollX, scrollY, trueLeft, top, trueRight, bottom);
    }

};

/**
* Clear and render the entire canvas.
* @private
*/
Phaser.TilemapLayer.prototype._renderFull = function (scrollX, scrollY)
{

    var context = this.context;
    var canvasWidth = this.canvas.width;
    var canvasHeight = this.canvas.height;

    var tw = this.layer.tileWidth;
    var th = this.layer.tileHeight;

    var left = Math.floor(scrollX / tw);
    var right = Math.floor((canvasWidth - 1 + scrollX) / tw);
    var top = Math.floor(scrollY / th);
    var bottom = Math.floor((canvasHeight - 1 + scrollY) / th);

    context.clearRect(0, 0, canvasWidth, canvasHeight);

    this._renderArea(scrollX, scrollY, left, top, right, bottom);

};

/**
* Renders the tiles to the layer canvas and pushes to the display.
*
* @protected
*/
Phaser.TilemapLayer.prototype.render = function () {

    var redrawAll = false;

    if (!this.visible)
    {
        return;
    }

    if (this.layer.changeCount > this._layerChangeCount)
    {
        //  Underlying TileLayer changed
        this._layerChangeCount = this.layer.changeCount;
        redrawAll = true;
    }

    if (this.debug)
    {
        redrawAll = true;
    }

    var canvasWidth = this.canvas.width;
    var canvasHeight = this.canvas.height;

    //  Scrolling bias; whole pixel only
    var scrollX = this._scrollX | 0;
    var scrollY = this._scrollY | 0;

    var prev = this._prevDraw;

    var shiftX = prev[0] - scrollX; // Negative when scrolling right/down
    var shiftY = prev[1] - scrollY;

    if (!this.dirty && !redrawAll &&
        shiftX === 0 && shiftY === 0 &&
        prev[2] === canvasWidth && prev[3] === canvasHeight)
    {
        //  No reason to redraw map, looking at same thing and not invalidated.
        return;
    }

    prev[0] = scrollX;
    prev[1] = scrollY;
    prev[2] = canvasWidth;
    prev[3] = canvasHeight;

    if (this.debug)
    {
        this.context.globalAlpha = this.debugAlpha;
    }

    if (redrawAll)
    {
        this._renderFull(scrollX, scrollY);
    }
    else
    {
        this._renderShift(scrollX, scrollY, shiftX, shiftY);
    }

    if (this.debug)
    {
        this.context.globalAlpha = 1;
        this.renderDebug(scrollX, scrollY);
    }

    this.baseTexture.dirty();

    this.dirty = false;

    return true;

};

/**
* Renders a collision debug overlay on-top of the canvas. Called automatically by render when `debug` is true.
*
* @method
* @protected
*/
Phaser.TilemapLayer.prototype.renderDebug = function (scrollX, scrollY) {

    var context = this.context;
    var canvasWidth = this.canvas.width;
    var canvasHeight = this.canvas.height;

    var width = this.layer.width;
    var height = this.layer.height;
    var tw = this.layer.tileWidth;
    var th = this.layer.tileHeight;

    var left = Math.floor(scrollX / tw);
    var right = Math.floor((canvasWidth - 1 + scrollX) / tw);
    var top = Math.floor(scrollY / th);
    var bottom = Math.floor((canvasHeight - 1 + scrollY) / th);

    var baseX = (left * tw) - scrollX;
    var baseY = (top * th) - scrollY;

    var vx = (left + (20000 * width)) % width;
    var vy = (top + (20000 * height)) % height;

    var tx, ty, x, y, xmax, ymax;

    context.strokeStyle = this.debugColor;
    context.fillStyle = this.debugFillColor;

    for (y = vy, ymax = bottom - top, ty = baseY;
        ymax >= 0;
        y++, ymax--, ty += th)
    {

        if (y >= height)
        {
            y -= height;
        }

        var row = this.layer.data[y];

        for (x = vx, xmax = right - left, tx = baseX;
            xmax >= 0;
            x++, xmax--, tx += tw)
        {

            if (x >= width)
            {
                x -= width;
            }

            var tile = row[x];
            if (!tile)
            {
                continue;
            }

            var index = tile.tileIndex;

            if (index > -1 && tile.collides)
            {

                if (this.debugFill)
                {
                    context.fillRect(tx, ty, this._mc.cw, this._mc.ch);
                }

                context.beginPath();

                if (tile.faceTop)
                {
                    context.moveTo(tx, ty);
                    context.lineTo(tx + this._mc.cw, ty);
                }

                if (tile.faceBottom)
                {
                    context.moveTo(tx, ty + this._mc.ch);
                    context.lineTo(tx + this._mc.cw, ty + this._mc.ch);
                }

                if (tile.faceLeft)
                {
                    context.moveTo(tx, ty);
                    context.lineTo(tx, ty + this._mc.ch);
                }

                if (tile.faceRight)
                {
                    context.moveTo(tx + this._mc.cw, ty);
                    context.lineTo(tx + this._mc.cw, ty + this._mc.ch);
                }

                context.stroke();
            }
           
        }

    }

};

/**
* Scrolls the map horizontally or returns the current x position.
*
* @member {number} #scrollX
* @memberof Phaser.TilemapLayer
* @public
*/
Object.defineProperty(Phaser.TilemapLayer.prototype, "scrollX", {

    get: function () {
        return this._scrollX;
    },

    set: function (value) {
        this._scrollX = value;
    }

});

/**
* Scrolls the map vertically or returns the current y position.
*
* @member {number} #scrollY
* @memberof Phaser.TilemapLayer
* @public
*/
Object.defineProperty(Phaser.TilemapLayer.prototype, "scrollY", {

    get: function () {
        return this._scrollY;
    },

    set: function (value) {
        this._scrollY = value;
    }

});

/**
* The width of the collision tiles (in pixels).
*
* @member {number} #collisionWidth
* @memberof Phaser.TilemapLayer
* @public
*/
Object.defineProperty(Phaser.TilemapLayer.prototype, "collisionWidth", {

    get: function () {
        return this._mc.cw;
    },

    set: function (value) {
        this._mc.cw = value;
        this.dirty = true;
    }

});

/**
* The height of the collision tiles (in pixels).
*
* @member {number} #collisionHeight
* @memberof Phaser.TilemapLayer
* @public
*/
Object.defineProperty(Phaser.TilemapLayer.prototype, "collisionHeight", {

    get: function () {
        return this._mc.ch;
    },

    set: function (value) {
        this._mc.ch = value;
        this.dirty = true;
    }

});
