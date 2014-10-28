/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2014 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

/**
* Creates a new Phaser.Tilemap object. The map can either be populated with data from a Tiled JSON file or from a CSV file.
* To do this pass the Cache key as the first parameter. When using Tiled data you need only provide the key.
* When using CSV data you must provide the key and the tileWidth and tileHeight parameters.
* If creating a blank tilemap to be populated later, you can either specify no parameters at all and then use `Tilemap.create` or pass the map and tile dimensions here.
* Note that all Tilemaps use a base tile size to calculate dimensions from, but that a TilemapLayer may have its own unique tile size that overrides it.
* A Tile map is rendered to the display using a TilemapLayer. It is not added to the display list directly itself.
* A map may have multiple layers. You can perform operations on the map data such as copying, pasting, filling and shuffling the tiles around.
*
* @class Phaser.Tilemap
* @constructor
* @param {Phaser.Game} game - Game reference to the currently running game.
* @param {string} [key] - The key of the tilemap data as stored in the Cache. If you're creating a blank map either leave this parameter out or pass `null`.
* @param {number} [tileWidth=32] - The pixel width of a single map tile. If using CSV data you must specify this. Not required if using Tiled map data.
* @param {number} [tileHeight=32] - The pixel height of a single map tile. If using CSV data you must specify this. Not required if using Tiled map data.
* @param {number} [width=10] - The width of the map in tiles. If this map is created from Tiled or CSV data you don't need to specify this.
* @param {number} [height=10] - The height of the map in tiles. If this map is created from Tiled or CSV data you don't need to specify this.
*/
Phaser.Tilemap = function (game, key, tileWidth, tileHeight, width, height) {

    /**
    * @property {Phaser.Game} game - A reference to the currently running Game.
    */
    this.game = game;

    /**
    * @property {string} key - The key of this map data in the Phaser.Cache.
    */
    this.key = key;

    var data = Phaser.TilemapParser.parse(this.game, key, tileWidth, tileHeight, width, height);

    if (data === null)
    {
        return;
    }

    /**
    * @property {number} width - The width of the map (in tiles).
    */
    this.width = data.width;

    /**
    * @property {number} height - The height of the map (in tiles).
    */
    this.height = data.height;

    /**
    * @property {number} tileWidth - The base width of the tiles in the map (in pixels).
    */
    this.tileWidth = data.tileWidth;

    /**
    * @property {number} tileHeight - The base height of the tiles in the map (in pixels).
    */
    this.tileHeight = data.tileHeight;

    /**
    * @property {string} orientation - The orientation of the map data (as specified in Tiled), usually 'orthogonal'.
    */
    this.orientation = data.orientation;

    /**
    * @property {number} format - The format of the map data, either Phaser.Tilemap.CSV or Phaser.Tilemap.TILED_JSON.
    */
    this.format = data.format;

    /**
    * @property {number} version - The version of the map data (as specified in Tiled, usually 1).
    */
    this.version = data.version;

    /**
    * @property {object} properties - Map specific properties as specified in Tiled.
    */
    this.properties = data.properties;

    /**
    * @property {number} widthInPixels - The width of the map in pixels based on width * tileWidth.
    */
    this.widthInPixels = data.widthInPixels;

    /**
    * @property {number} heightInPixels - The height of the map in pixels based on height * tileHeight.
    */
    this.heightInPixels = data.heightInPixels;

    /**
    * @property {array} layers - An array of Tilemap layer data.
    */
    this.layers = [];

    /**
    * @property {array} tilesets - An array of Tilesets.
    */
    this.tilesets = data.tilesets;

    /**
    * @property {array} tiles - The super array of Tiles.
    */
    this.tiles = data.tiles;

    /**
    * @property {array} objects - An array of Tiled Object Layers.
    */
    this.objects = data.objects;

    /**
    * @property {array} collision - An array of collision data (polylines, etc).
    */
    this.collision = data.collision;

    /**
    * @property {array} images - An array of Tiled Image Layers.
    */
    this.images = data.images;

    /**
    * @property {integer} currentLayer - The current layer index. (Null before any layers have been added.)
    */
    this.currentLayer = null;

    /**
    * @property {array} debugMap - Map data used for debug values only.
    */
    this.debugMap = [];

    /**
    * @property {array} _results - Internal var.
    * @private
    */
    this._results = [];

    for (var i = 0, len = data.layers.length; i < len; i++)
    {
        this.addTileLayer(data.layers[i]);
    }

};

/**
* @constant
* @type {number}
*/
Phaser.Tilemap.CSV = 0;

/**
* @constant
* @type {number}
*/
Phaser.Tilemap.TILED_JSON = 1;

/**
* @constant
* @type {number}
*/
Phaser.Tilemap.NORTH = 0;

/**
* @constant
* @type {number}
*/
Phaser.Tilemap.EAST = 1;

/**
* @constant
* @type {number}
*/
Phaser.Tilemap.SOUTH = 2;

/**
* @constant
* @type {number}
*/
Phaser.Tilemap.WEST = 3;

Phaser.Tilemap.prototype = {

    /**
    * Sets the tile tilemap size, tile size, and creates one blank layer to fill the tilemap.
    * This removes all existing layers.
    *
    * @method Phaser.Tilemap#create
    * @param {string} name - The name of the default layer of the map.
    * @param {number} width - The width of the map in tiles.
    * @param {number} height - The height of the map in tiles.
    * @param {number} tileWidth - The width of the tiles the map uses for calculations.
    * @param {number} tileHeight - The height of the tiles the map uses for calculations.
    * @param {(Phaser.Group|null)} [group=world] - Optional Group to add the layer to. If not specified it will be added to the World group. If null, will not add to any group.
    * @return {Phaser.TilemapLayer} The TilemapLayer object, which extends Phaser.Sprite.
    */
    create: function (name, width, height, tileWidth, tileHeight, group) {

        this.width = width;
        this.height = height;

        this.setTileSize(tileWidth, tileHeight);

        this.removeAllLayers();

        return this.createBlankLayer(name, width, height, tileWidth, tileHeight, group);

    },

    /**
    * Sets the base tile size for the map.
    *
    * @method Phaser.Tilemap#setTileSize
    * @param {number} tileWidth - The width of the tiles the map uses for calculations.
    * @param {number} tileHeight - The height of the tiles the map uses for calculations.
    */
    setTileSize: function (tileWidth, tileHeight) {

        this.tileWidth = tileWidth | 0;
        this.tileHeight = tileHeight | 0;
        this.widthInPixels = (this.width * tileWidth) | 0;
        this.heightInPixels = (this.height * tileHeight) | 0;

    },

    /**
    * Adds an image to the map to be used as a tileset. A single map may use multiple tilesets.
    * Note that the tileset name can be found in the JSON file exported from Tiled, or in the Tiled editor.
    *
    * @method Phaser.Tilemap#addTilesetImage
    * @param {string} tileset - The name of the tileset as specified in the map data.
    * @param {string} [key] - The key of the Phaser.Cache image used for this tileset. If not specified it will look for an image with a key matching the tileset parameter.
    * @param {number} [tileWidth=32] - The width of the tiles in the Tileset Image. If not given it will default to the map.tileWidth value, if that isn't set then 32.
    * @param {number} [tileHeight=32] - The height of the tiles in the Tileset Image. If not given it will default to the map.tileHeight value, if that isn't set then 32.
    * @param {number} [tileMargin=0] - The width of the tiles in the Tileset Image. If not given it will default to the map.tileWidth value.
    * @param {number} [tileSpacing=0] - The height of the tiles in the Tileset Image. If not given it will default to the map.tileHeight value.
    * @param {number} [gid=0] - If adding multiple tilesets to a blank/dynamic map, specify the starting GID the set will use here.
    * @return {Phaser.Tileset} Returns the Tileset object that was created or updated, or null if it failed.
    */
    addTilesetImage: function (tileset, key, tileWidth, tileHeight, tileMargin, tileSpacing, gid) {

        if (typeof tileWidth === 'undefined') { tileWidth = this.tileWidth; }
        if (typeof tileHeight === 'undefined') { tileHeight = this.tileHeight; }
        if (typeof tileMargin === 'undefined') { tileMargin = 0; }
        if (typeof tileSpacing === 'undefined') { tileSpacing = 0; }
        if (typeof gid === 'undefined') { gid = 0; }

        //  In-case we're working from a blank map
        if (tileWidth === 0)
        {
            tileWidth = 32;
        }

        if (tileHeight === 0)
        {
            tileHeight = 32;
        }

        if (typeof key === 'undefined')
        {
            if (typeof tileset === 'string')
            {
                key = tileset;

                if (!this.game.cache.checkImageKey(key))
                {
                    console.warn('Phaser.Tilemap.addTilesetImage: Invalid image key given: "' + key + '"');
                    return null;
                }
            }
            else
            {
                return null;
            }
        }

        if (typeof tileset === 'string')
        {
            tileset = this.getTilesetIndex(tileset);

            if (tileset === null && this.format === Phaser.Tilemap.TILED_JSON)
            {
                console.warn('Phaser.Tilemap.addTilesetImage: No data found in the JSON matching the tileset name: "' + key + '"');
                return null;
            }
        }

        if (this.tilesets[tileset])
        {
            this.tilesets[tileset].setImage(this.game.cache.getImage(key));
            return this.tilesets[tileset];
        }
        else
        {
            var newSet = new Phaser.Tileset(key, gid, tileWidth, tileHeight, tileMargin, tileSpacing, {});

            newSet.setImage(this.game.cache.getImage(key));

            this.tilesets.push(newSet);

            var i = this.tilesets.length - 1;
            var x = tileMargin;
            var y = tileMargin;

            var count = 0;
            var countX = 0;
            var countY = 0;

            for (var t = gid; t < gid + newSet.total; t++)
            {
                this.tiles[t] = [x, y, i];

                x += tileWidth + tileSpacing;

                count++;

                if (count === newSet.total)
                {
                    break;
                }

                countX++;

                if (countX === newSet.columns)
                {
                    x = tileMargin;
                    y += tileHeight + tileSpacing;

                    countX = 0;
                    countY++;

                    if (countY === newSet.rows)
                    {
                        break;
                    }
                }
            }

            return newSet;

        }

        return null;

    },

    /**
    * Creates a Sprite for every object matching the given gid in the map data. You can optionally specify the group that the Sprite will be created in. If none is
    * given it will be created in the World. All properties from the map data objectgroup are copied across to the Sprite, so you can use this as an easy way to
    * configure Sprite properties from within the map editor. For example giving an object a property of alpha: 0.5 in the map editor will duplicate that when the
    * Sprite is created. You could also give it a value like: body.velocity.x: 100 to set it moving automatically.
    *
    * @method Phaser.Tilemap#createFromObjects
    * @param {string} name - The name of the Object Group to create Sprites from.
    * @param {number} gid - The layer array index value, or if a string is given the layer name within the map data.
    * @param {string} key - The Game.cache key of the image that this Sprite will use.
    * @param {number|string} [frame] - If the Sprite image contains multiple frames you can specify which one to use here.
    * @param {boolean} [exists=true] - The default exists state of the Sprite.
    * @param {boolean} [autoCull=false] - The default autoCull state of the Sprite. Sprites that are autoCulled are culled from the camera if out of its range.
    * @param {Phaser.Group} [group=world] - Group to add the Sprite to. If not specified it will be added to the World group.
    * @param {object} [CustomClass=Phaser.Sprite] - If you wish to create your own class, rather than Phaser.Sprite, pass the class here. Your class must extend Phaser.Sprite and have the same constructor parameters.
    * @param {boolean} [adjustY=true] - By default the Tiled map editor uses a bottom-left coordinate system. Phaser uses top-left. So most objects will appear too low down. This parameter moves them up by their height.
    */
    createFromObjects: function (name, gid, key, frame, exists, autoCull, group, CustomClass, adjustY) {

        if (typeof exists === 'undefined') { exists = true; }
        if (typeof autoCull === 'undefined') { autoCull = false; }
        if (typeof group === 'undefined') { group = this.game.world; }
        if (typeof CustomClass === 'undefined') { CustomClass = Phaser.Sprite; }
        if (typeof adjustY === 'undefined') { adjustY = true; }

        if (!this.objects[name])
        {
            console.warn('Tilemap.createFromObjects: Invalid objectgroup name given: ' + name);
            return;
        }

        var sprite;

        for (var i = 0, len = this.objects[name].length; i < len; i++)
        {
            if (this.objects[name][i].gid === gid)
            {
                sprite = new CustomClass(this.game, this.objects[name][i].x, this.objects[name][i].y, key, frame);

                sprite.name = this.objects[name][i].name;
                sprite.visible = this.objects[name][i].visible;
                sprite.autoCull = autoCull;
                sprite.exists = exists;

                if (adjustY)
                {
                    sprite.y -= sprite.height;
                }

                group.add(sprite);

                for (var property in this.objects[name][i].properties)
                {
                    group.set(sprite, property, this.objects[name][i].properties[property], false, false, 0, true);
                }
            }
        }

    },

    /**
    * Creates a new TilemapLayer object. By default TilemapLayers are fixed to the camera.
    * The `layer` parameter is important. If you've created your map in Tiled then you can get this by looking in Tiled and looking at the Layer name.
    * Or you can open the JSON file it exports and look at the layers[].name value. Either way it must match.
    * If you wish to create a blank layer to put your own tiles on then see Tilemap.createBlankLayer.
    *
    * @method Phaser.Tilemap#createLayer
    * @param {number|string} layer - The layer array index value, or if a string is given the layer name, within the map data that this TilemapLayer represents.
    * @param {number} [width] - The rendered width of the layer, should never be wider than Game.width. If not given it will be set to Game.width.
    * @param {number} [height] - The rendered height of the layer, should never be wider than Game.height. If not given it will be set to Game.height.
    * @param {(Phaser.Group|null)} [group=world] - Optional Group to add the object to. If not specified it will be added to the World group. If null, will not add to any group.
    * @return {Phaser.TilemapLayer} The TilemapLayer object, which extends Phaser.Sprite.
    */
    createLayer: function (layerKey, width, height, group) {

        if (typeof group === 'undefined') { group = this.game.world; }

        //  Add Buffer support for the left of the canvas

        if (typeof width === 'undefined') { width = this.game.width; }
        if (typeof height === 'undefined') { height = this.game.height; }
        if (typeof group === 'undefined') { group = this.game.world; }

        var layer = this.getTileLayer(layerKey);

        if (!layer)
        {
            console.warn('Tilemap.createLayer: Invalid layer ID given: ' + layerKey);
            return;
        }

        var tilemapLayer = this.createRenderer(layer, width, height);
        tilemapLayer.name = layerKey;  // As good as any..
        
        if (group)
        {
            group.add(tilemapLayer);
        }

        return tilemapLayer;

    },

    /**
    * Create the appropriate display object / renderer.
    * @method
    * @private
    */
    createRenderer: function (layer, width, height) {

        var res = window.prompt("Which renderer? (s = sprite, c/other = canvas");
        if (res.trim().toLowerCase() == "s") {
            return new Phaser.TilemapSpriteRenderer(this.game, this, layer.layerIndex, width, height);
        } else {
            return new Phaser.TilemapCanvasRenderer(this.game, this, layer.layerIndex, width, height);
        }

    },

    /**
    * Creates a new and empty layer on this Tilemap. By default TilemapLayers are fixed to the camera.
    *
    * @method Phaser.Tilemap#createBlankLayer
    * @param {string} name - The name of this layer. Must be unique within the map.
    * @param {number} width - The width of the layer in tiles.
    * @param {number} height - The height of the layer in tiles.
    * @param {number} tileWidth - The width of the tiles the layer uses for calculations.
    * @param {number} tileHeight - The height of the tiles the layer uses for calculations.
    * @param {(Phaser.Group|null)} [group=world] - Optional Group to add the layer to. If not specified it will be added to the World group; if null, will not add to any group.
    * @return {Phaser.TilemapLayer} The TilemapLayer object, which extends Phaser.Sprite.
    */
    createBlankLayer: function (name, width, height, tileWidth, tileHeight, group) {

        if (typeof group === 'undefined') { group = this.game.world; }

        if (this.getLayerIndex(name) !== null)
        {
            console.warn('Tilemap.createBlankLayer: Layer with matching name already exists');
            return;
        }

        //  Don't specify owner to constructor; else addTileLayer won't accept it
        var layer = new Phaser.TileLayer(null, width, height, tileWidth, tileHeight);
        this.addTileLayer(layer);

        this.currentLayer = this.layers.length - 1;

        //  Might be more appropriate to be  w * layer.tileWidth, etc.
        width = Phaser.Math.clamp(layer.widthInPixels, 0, this.game.width);
        height = Phaser.Math.clamp(layer.heightInPixels, 0, this.game.height);

        var tilemapLayer = this.createRenderer(layer, width, height);
        tilemapLayer.name = name;
        
        if (group)
        {
            group.add(tilemapLayer);
        }

        return tilemapLayer;

    },

    /**
    * Adds a TileLayer; this also performs additional cleanup/linking as required.
    *
    * @method Phaser.Tilemap#addTileLayer
    * @private
    * @param {Phaser.TileLayer} layer - The layer to add. The layer should not be added to this (or any other) Tilemap.
    */
    addTileLayer: function (layer) {

        if (this.layers.indexOf(layer) > -1 ||
            layer.tilemap !== null)
        {
            console.warn('Tilemap.addTileLayer: TileLayer is alread bound: ' + layer.name);
            return;
        }

        layer.tilemap = this;
        layer.layerIndex = this.layers.length;

        if (!this.layers.length)
        {
            //  Current layer only set when first layer added.
            this.currentLayer = 0;
        }

        this.layers.push(layer);

    },

    /**
    * Gets the layer index based on the layers name.
    *
    * @method Phaser.Tilemap#getIndex
    * @protected
    * @param {array} location - The local array to search.
    * @param {string} name - The name of the array element to get.
    * @return {(number|null)} The index of the element in the array, or null if not found.
    */
    getIndex: function (location, name) {

        for (var i = 0; i < location.length; i++)
        {
            if (location[i].name === name)
            {
                return i;
            }
        }

        return null;

    },

    /**
    * Gets the layer index based on its name.
    *
    * @method Phaser.Tilemap#getLayerIndex
    * @param {string} name - The name of the layer to get.
    * @return {(number|null)} The index of the layer in this tilemap, or null if not found.
    */
    getLayerIndex: function (name) {

        return this.getIndex(this.layers, name);

    },

    /**
    * Gets the tileset index based on its name.
    *
    * @method Phaser.Tilemap#getTilesetIndex
    * @param {string} name - The name of the tileset to get.
    * @return {(number|null)} The index of the tileset in this tilemap, or null if not found.
    */
    getTilesetIndex: function (name) {

        return this.getIndex(this.tilesets, name);

    },

    /**
    * Gets the image index based on its name.
    *
    * @method Phaser.Tilemap#getImageIndex
    * @param {string} name - The name of the image to get.
    * @return {(number|null)} The index of the image in this tilemap, or null if not found.
    */
    getImageIndex: function (name) {

        return this.getIndex(this.images, name);

    },

    /**
    * Gets the object index based on its name.
    *
    * @method Phaser.Tilemap#getObjectIndex
    * @param {string} name - The name of the object to get.
    * @return {number} The index of the object in this tilemap, or null if not found.
    */
    getObjectIndex: function (name) {

        return this.getIndex(this.objects, name);

    },

    /**
    * Sets a layer-wide collision callback for the given tile indexes/types within the layer. This will affect all tiles on this layer with the given index.
    *
    * If a callback is already set for the tile index it will be replaced. Set the callback to null to remove it.
    *
    * Use `setTileLocationCallback` to set a callback for tiles at a specific location.
    *
    * @method Phaser.Tilemap#setTileIndexCallback
    * @param {number|array} indexes - Either a single tile index, or an array of tile indexes to have a collision callback set for.
    * @param {function} callback - The callback that will be invoked when the tile is collided with.
    * @param {object} callbackContext - The context under which the callback is called.
    * @param {number|string|Phaser.TilemapLayer} [layer] - The layer to operate on. If not given will default to this.currentLayer.
    */
    setTileIndexCallback: function (indexes, callback, callbackContext, layerKey) {

        var layer = this.getTileLayer(layerKey);

        var setFor = indexes;
        if (typeof setFor === 'number')
        {
            //  Single index was supplied
            setFor = [indexes];
        }

        layer.setCollisionTestForTileIndexes(setFor, callback, callbackContext);

    },

    /**
    * Sets a common collision callback for existing tiles in the given map location within the layer. This will affect all tiles (including those with an index/type of 0) in the given area as long as they exist.
    *
    * If a callback is already set for the tile index it will be replaced. Set the callback to null to remove it.
    *
    * @method Phaser.Tilemap#setTileLocationCallback
    * @param {number} x - X position of the top left of the area to copy (given in tiles, not pixels)
    * @param {number} y - Y position of the top left of the area to copy (given in tiles, not pixels)
    * @param {number} width - The width of the area to copy (given in tiles, not pixels)
    * @param {number} height - The height of the area to copy (given in tiles, not pixels)
    * @param {function} callback - The callback that will be invoked when the tile is collided with.
    * @param {object} callbackContext - The context under which the callback is called.
    * @param {number|string|Phaser.TilemapLayer} [layer=(currentLayer)] - The layer to operate on.
    */
    setTileLocationCallback: function (x, y, width, height, callback, callbackContext, layerKey) {

        var layer = this.getTileLayer(layerKey);

        var collisionTest = [callback, callbackContext];

        layer.transformRegion(new Phaser.Rectangle(x, y, width, height),
            function (tiles) {
                for (var i = 0; i < tiles.length; i++) {
                    var tile = tiles[i];
                    tile.setSharedCollisionTest(collisionTest);
                }
            }, this, null, false);

    },

    /**
    * Enables collision the for the given tile indexes/types.
    *
    * @method Phaser.Tilemap#setCollision
    * @param {number|array} indexes - Either a single tile index, or an array of tile IDs to be checked for collision.
    * @param {boolean} [collides=true] - If true collisions will be enabled; otherwise collisions will be cleared.
    * @param {number|string|Phaser.TilemapLayer} [layer=(currentLayer)] - The layer to operate on.
    * @param {boolean} [recalculate=true] - Recalculates the tile faces after the update.
    */
    setCollision: function (indexes, collides, layerKey, recalculate) {

        if (typeof collides === 'undefined') { collides = true; }
        if (typeof recalculate === 'undefined') { recalculate = true; }

        var setFor = indexes;
        if (typeof indexes === 'number')
        {
            //  Single index was supplied
            setFor = [indexes];
        }
        
        var layer = this.getTileLayer(layer);

        var collideFlags = 0;
        if (collides)
        {
            collideFlags = Phaser.Tile.COLLIDE_ALL;
        }

        layer.setDefaultCollisionFlags(setFor, collideFlags, true);

        if (recalculate)
        {
            layer.refreshLayer(false);
        }

    },

    /**
    * Enables collision the for the given tile indexes/types within the sepcified inclusive range.
    *
    * Calling this with a start value of 10 and a stop value of 14 would set collision for tiles 10, 11, 12, 13 and 14.
    *
    * @method Phaser.Tilemap#setCollisionBetween
    * @param {number} start - The first index of the tile to be set for collision.
    * @param {number} stop - The last index of the tile to be set for collision, inclusive.
    * @param {boolean} [collides=true] - If true collisions will be enabled; otherwise collisions will be cleared.
    * @param {number|string|Phaser.TilemapLayer} [layer=(currentLayer)] - The layer to operate on.
    * @param {boolean} [recalculate=true] - Recalculates the tile faces after the update.
    */
    setCollisionBetween: function (start, stop, collides, layerKey, recalculate) {

        var setFor = [];
        for (var index = start; index <= stop; index++)
        {
            setFor.push(index);
        }

        this.setCollision(setFor, collides, layerKey, recalculate);

    },

    /**
    * Enables collision of the given tile indexes/types *except* for the indexes specified in the given array.
    *
    * This does not remove any previously enabled collisions even if they are not specified in the supplied indexes.
    *
    * @method Phaser.Tilemap#setCollisionByExclusion
    * @param {array} indexes - An array of the tile IDs to not be counted for collision.
    * @param {boolean} [collides=true] - If true collisions will be enabled; otherwise collisions will be cleared.
    * @param {number|string|Phaser.TilemapLayer} [layer=(currentLayer)] - The layer to operate on.
    * @param {boolean} [recalculate=true] - Recalculates the tile faces after the update.
    */
    setCollisionByExclusion: function (indexes, collides, layerKey, recalculate) {

        var setFor = [];

        var exclude = [];
        for (var i = 0; i < indexes.length; i++)
        {
            var index = indexes[i];
            exclude[index] = true;
        }

        //  Collide everything, except the IDs given in the indexes array
        for (var i = 0, len = this.tiles.length; i < len; i++)
        {
            if (!exclude[i])
            {
                setFor.push(i);
            }
        }

        this.setCollision(setFor, collides, layerKey, recalculate);

    },

    /**
    * Sets collision values on a tile in the set.
    * Use `setCollision`, `setCollisionBetween`, or `setCollisionByExclusion` instead of invoking this method directly.
    *
    * @method Phaser.Tilemap#setCollisionByIndex
    * @protected
    * @deprecated Do not use this directly.
    * @param {number} index - The index of the tile on the layer.
    * @param {boolean} [collides=true] - If true it will enable collision on the tile. If false it will clear collision values from the tile.
    * @param {number|string|Phaser.TilemapLayer} [layer=(currentLayer)] - The layer to operate on.
    * @param {boolean} [recalculate=true] - Recalculates the tile faces after the update.
    */
    setCollisionByIndex: function (index, collides, layerKey, recalculate) {

        this.setCollision([index], collides, layerKey, recalculate);

    },

    /**
    * Gets the actual TileLayer object.
    *
    * @protected
    * @param {number|string|Phaser.TilemapLayer} layer - The layer to resolve.
    * @return {(Phaser.TileLayer|null)} The corresponding TileLayer or null.
    */
    getTileLayer: function (layerKey) {

        var layerIndex = this.getLayer(layerKey);
        return this.layers[layerIndex] || null;

    },

    /**
    * Gets the *index* for the corresponding tile layer.
    *
    * @method Phaser.Tilemap#getLayer
    * @protected
    * @param {number|string|Phaser.TilemapLayer} [layer=(currentLayer)] - The layer to resolve to an index.
    * @return {number} The TilemapLayer index.
    */
    getLayer: function (layerKey) {

        var type = typeof layerKey;

        if (type === 'undefined')
        {
            return this.currentLayer;
        }
        else if (type === 'string')
        {
            return this.getLayerIndex(layerKey);
        }
        else if (type === 'object')
        {
            //   eg. TileLayer or TilemapLayer
            return layerKey.index;
        }

        return layerKey;

    },

    /**
    * Get the properties associated with the tile index/type. The properties are shared across the entire Tilemap.
    *
    * @protected
    * @param {integer} tileIndex - Tile index/type to find the properties for.
    * @param {boolean} ensureProperties - If true a tile-index properties object will be created (and saved) as appropriate; will not create properties for an out-of-range tile index.
    * @return {(object|null)} The properties associated with the index/type of a tile, or null.
    */
    getTileIndexProperties: function (tileIndex, ensureProperties) {

        var setid = this.tiles[tileIndex][2];
        var tileset = this.tilesets[setid];

        var setCorrectedIndex = tileIndex - tileset.firstgid;

        if (setCorrectedIndex < 0 || setCorrectedIndex >= tileset.tileProperties.length)
        {
            //  Can't make up a new tile index ..
            return null;
        }

        var prop = tileset.tileProperties[setCorrectedIndex];
        if (prop)
        {
            return prop;
        }
        else if (ensureProperties)
        {
            return (tileset.tileProperties[setCorrectedIndex] = {});
        }
        else
        {
            return null;
        }

    },

    /**
    * Turn off/on the recalculation of faces for tile or collission updates for all layers.
    *
    * @method Phaser.Tilemap#setPreventRecalculate
    * @deprecated Use `TileMap#suppressRefresh` for a specific layer instead.
    * @param {boolean} prevent - If true recalculations will be put hold; otherwise recalculations will be resumed.
    */
    setPreventRecalculate: function (prevent) {

        if (prevent && !this.preventingRecalculate)
        {
            //  Enable suppression for all layers
            this.preventingRecalculate = true;

            for (var i = 0; i < this.layers.length; i++)
            {
                var layer = this.layers[i];
                layer.suppressRefresh = true;
            }
        }
        else if (!prevent && this.preventingRecalculate)
        {
            //  Disable suppression for all layers
            this.preventingRecalculate = false;

            for (var i = 0; i < this.layers.length; i++)
            {
                var layer = this.layers[i];
                layer.suppressRefresh = false;
            }
        }
    },

    /**
    * Internal function.
    *
    * @method Phaser.Tilemap#calculateFaces
    * @deprecated Use {@link Phaser.TileMap#refreshLayer} instead.
    * @protected
    * @param {number|string|Phaser.TilemapLayer} [layer=(currentLayer)] - The layer to operate on.
    */
    calculateFaces: function (layerKey) {

        var layer = this.getTileLayer(layerKey);
        layer.refreshLayer();

    },

    /**
    * Gets the tile above the tile coordinates given.
    *
    * @method Phaser.Tilemap#getTileAbove
    * @param {number|string|Phaser.TilemapLayer} [layer=(currentLayer)] - The layer to operate on
    * @param {number} x - The x coordinate component of the cell (in tiles)
    * @param {number} x - The y coordinate component of the cell (in tiles)
    * @return {(Phaser.Tile|null)} - A copy of the Tile, or null.
    */
    getTileAbove: function (layerKey, x, y) {

        var layer = this.getTileLayer(layerKey);
        return layer.getTileCopy(x, y - 1, true);

    },

    /**
    * Gets the tile below the tile coordinates given.
    *
    * @method Phaser.Tilemap#getTileBelow
    * @param {number|string|Phaser.TilemapLayer} [layer=(currentLayer)] - The layer to operate on
    * @param {number} x - The x coordinate component of the cell (in tiles)
    * @param {number} x - The y coordinate component of the cell (in tiles)
    * @return {(Phaser.Tile|null)} - A copy of the Tile, or null.
    */
    getTileBelow: function (layerKey, x, y) {

        var layer = this.getTileLayer(layerKey);
        return layer.getTileCopy(x, y + 1, true);

    },

    /**
    * Gets the tile to the left of the tile coordinates given.
    *
    * @method Phaser.Tilemap#getTileLeft
    * @param {number|string|Phaser.TilemapLayer} [layer=(currentLayer)] - The layer to operate on
    * @param {number} x - The x coordinate component of the cell (in tiles)
    * @param {number} x - The y coordinate component of the cell (in tiles)
    * @return {(Phaser.Tile|null)} - A copy of the Tile, or null.
    */
    getTileLeft: function (layerKey, x, y) {

        var layer = this.getTileLayer(layerKey);
        return layer.getTileCopy(x - 1, y, true);

    },

    /**
    * Gets the tile to the right of the tile coordinates given.
    *
    * @method Phaser.Tilemap#getTileRight
    * @param {number|string|Phaser.TilemapLayer} [layer=(currentLayer)] - The layer to operate on
    * @param {number} x - The x coordinate component of the cell (in tiles)
    * @param {number} x - The y coordinate component of the cell (in tiles)
    * @return {(Phaser.Tile|null)} - A copy of the Tile, or null.
    */
    getTileRight: function (layerKey, x, y) {

        var layer = this.getTileLayer(layerKey);
        return layer.getTileCopy(x + 1, y, true);

    },

    /**
    * Sets the current layer to the given index.
    *
    * @method Phaser.Tilemap#setLayer
    * @param {number|string|Phaser.TilemapLayer} layer - The layer to set as current.
    */
    setLayer: function (layerKey) {

        var layerIndex = this.getLayer(layerKey);

        if (layerIndex !== null)
        {
            this.currentLayer = layerIndex;
        }

    },

    /**
    * Checks if there is a tile at the given location.
    *
    * @method Phaser.Tilemap#hasTile    
    * @param {number} x - X position to check if a tile exists at (given in tile units, not pixels)
    * @param {number} y - Y position to check if a tile exists at (given in tile units, not pixels)
    * @param {number|string|Phaser.TilemapLayer} layer - The layer to set as current.
    * @return {boolean} True if there is a tile at the given location, otherwise false.
    */
    hasTile: function (x, y, layerKey) {

        var layer = this.getTileLayer(layerKey);
        return layer.hasCell(x, y);

    },

    /**
    * Removes the tile located at the given coordinates and updates the collision data.
    *
    * @method Phaser.Tilemap#removeTile    
    * @param {number} x - X position to place the tile (given in tile units, not pixels)
    * @param {number} y - Y position to place the tile (given in tile units, not pixels)
    * @param {number|string|Phaser.TilemapLayer} [layer] - The layer to modify.
    * @return {Phaser.Tile|null} The Tile object that was removed from this map, if any.
    */
    removeTile: function (x, y, layerKey) {

        var layer = this.getTileLayer(layerKey);

        var tile = layer.getTileCopy(x, y);
        if (tile)
        {
            layer.clearCell(x, y);
            layer.refreshLayer(false);

            return tile;
        }
        else
        {
            return null;
        }

    },

    /**
    * Removes the tile located at the given coordinates and updates the collision data. The coordinates are given in pixel values.
    *
    * @method Phaser.Tilemap#removeTileWorldXY
    * @param {number} x - X position to insert the tile (given in pixels)
    * @param {number} y - Y position to insert the tile (given in pixels)
    * @param {number} tileWidth - The width of the tile in pixels.
    * @param {number} tileHeight - The height of the tile in pixels.
    * @param {number|string|Phaser.TilemapLayer} [layer] - The layer to modify.
    * @return {Phaser.Tile} The Tile object that was removed from this map.
    */
    removeTileWorldXY: function (x, y, tileWidth, tileHeight, layerKey) {

        x = this.game.math.snapToFloor(x, tileWidth) / tileWidth;
        y = this.game.math.snapToFloor(y, tileHeight) / tileHeight;

        return this.removeTile(x, y, layerKey);

    },

    /**
    * Puts a tile of the given index value at the coordinate specified.
    * If you pass `null` as the tile it will pass your call over to Tilemap.removeTile instead.
    *
    * @method Phaser.Tilemap#putTile
    * @param {Phaser.Tile|number|null} tile - The index of this tile to set or a Phaser.Tile object. If null the tile is removed from the map.
    * @param {number} x - X position to place the tile (given in tile units, not pixels)
    * @param {number} y - Y position to place the tile (given in tile units, not pixels)
    * @param {number|string|Phaser.TilemapLayer} [layer] - The layer to modify.
    * @return {Phaser.Tile} The Tile object that was created or added to this map.
    */
    putTile: function (tileOrIndex, x, y, layerKey) {

        var layer = this.getTileLayer(layerKey);

        if (tileOrIndex === null)
        {
            return layer.clearCell(x, y);
        }

        if (x >= 0 && x < layer.width && y >= 0 && y < layer.height)
        {
            if (typeof tileOrIndex !== "number")
            {
                layer.setCellFromTile(x, y, tileOrIndex);
            }
            else
            {
                layer.setCell(x, y, tileOrIndex);
            }

            layer.refreshLayer(false);

            return layer.getTileCopy(x, y);
        }

        return null;

    },

    /**
    * Puts a tile into the Tilemap layer. The coordinates are given in pixel values.
    *
    * @method Phaser.Tilemap#putTileWorldXY
    * @param {Phaser.Tile|number} tile - The index of this tile to set or a Phaser.Tile object.
    * @param {number} x - X position to insert the tile (given in pixels)
    * @param {number} y - Y position to insert the tile (given in pixels)
    * @param {number} tileWidth - The width of the tile in pixels.
    * @param {number} tileHeight - The height of the tile in pixels.
    * @param {number|string|Phaser.TilemapLayer} [layer] - The layer to modify.
    * @return {Phaser.Tile} The Tile object that was created or added to this map.
    */
    putTileWorldXY: function (tile, x, y, tileWidth, tileHeight, layerKey) {

        x = this.game.math.snapToFloor(x, tileWidth) / tileWidth;
        y = this.game.math.snapToFloor(y, tileHeight) / tileHeight;

        return this.putTile(tile, x, y, layerKey);

    },

    /**
    * Searches the entire map layer for the first tile matching the given index, then returns that Phaser.Tile object.
    * If no match is found it returns null.
    * The search starts from the top-left tile and continues horizontally until it hits the end of the row, then it drops down to the next column.
    * If the reverse boolean is true, it scans starting from the bottom-right corner travelling up to the top-left.
    *
    * @method
    * @deprecated Functionality is not used internally.
    * @param {number} index - The tile index value to search for.
    * @param {number} [skip=0] - The number of times to skip a matching tile before returning.
    * @param {number} [reverse=false] - If true it will scan the layer in reverse, starting at the bottom-right. Otherwise it scans from the top-left.
    * @param {number|string|Phaser.TilemapLayer} [layer] - The layer to get the tile from.
    * @return {Phaser.Tile} The first (or n skipped) tile with the matching index.
    */
    searchTileIndex: function (index, skip, reverse, layerKey) {

        if (typeof skip === 'undefined') { skip = 0; }
        if (typeof reverse === 'undefined') { reverse = false; }

        var layer = this.getLayer(layerKey);

        var c = 0;

        if (reverse)
        {
            for (var y = this.layers[layer].height - 1; y >= 0; y--)
            {
                for (var x = this.layers[layer].width - 1; x >= 0; x--)
                {
                    if (this.layers[layer].data[y][x].index === index)
                    {
                        if (c === skip)
                        {
                            return this.layers[layer].data[y][x];
                        }
                        else
                        {
                            c++;
                        }
                    }
                }
            }
        }
        else
        {
            for (var y = 0; y < this.layers[layer].height; y++)
            {
                for (var x = 0; x < this.layers[layer].width; x++)
                {
                    if (this.layers[layer].data[y][x].index === index)
                    {
                        if (c === skip)
                        {
                            return this.layers[layer].data[y][x];
                        }
                        else
                        {
                            c++;
                        }
                    }
                }
            }
        }

        return null;

    },

    /**
    * Gets a tile from the Tilemap Layer. The coordinates are given in tile values.
    *
    * @method Phaser.Tilemap#getTile
    * @param {number} x - X position to get the tile from (given in tile units, not pixels)
    * @param {number} y - Y position to get the tile from (given in tile units, not pixels)
    * @param {number|string|Phaser.TilemapLayer} [layer] - The layer to get the tile from.
    * @param {boolean} [nonNull=false] - If true getTile won't return null for empty tiles, but a Tile object with an index of -1.
    * @return {Phaser.Tile} The tile at the given coordinates or null if no tile was found or the coordinates were invalid.
    */
    getTile: function (x, y, layerKey, nonNull) {

        if (typeof nonNull === 'undefined') { nonNull = false; }

        var layer = this.getTileLayer(layerKey);
        return layer.getTileCopy(x, y, nonNull);

    },

    /**
    * Gets a tile from the Tilemap layer. The coordinates are given in pixel values.
    *
    * @method Phaser.Tilemap#getTileWorldXY
    * @param {number} x - X position to get the tile from (given in pixels)
    * @param {number} y - Y position to get the tile from (given in pixels)
    * @param {number} [tileWidth] - The width of the tiles. If not given the map default is used.
    * @param {number} [tileHeight] - The height of the tiles. If not given the map default is used.
    * @param {number|string|Phaser.TilemapLayer} [layer] - The layer to get the tile from.
    * @return {Phaser.Tile} The tile at the given coordinates.
    */
    getTileWorldXY: function (x, y, tileWidth, tileHeight, layerKey) {

        if (typeof tileWidth === 'undefined') { tileWidth = this.tileWidth; }
        if (typeof tileHeight === 'undefined') { tileHeight = this.tileHeight; }

        x = this.game.math.snapToFloor(x, tileWidth) / tileWidth;
        y = this.game.math.snapToFloor(y, tileHeight) / tileHeight;

        return this.getTile(x, y, layerKey);

    },

    /**
    * Creates a copy of the tiles in the given rectangular block which can be pasted. Non-existant tiles are materialized.
    *
    * @method Phaser.Tilemap#copy
    * @deprecated Use {@link Phaser.TileLayer#copyTiles} / {@link Phaser.TileLayer#pasteTiles}
    * @param {number} x - X position of the top left of the area to copy (given in tiles, not pixels)
    * @param {number} y - Y position of the top left of the area to copy (given in tiles, not pixels)
    * @param {number} width - The width of the area to copy (given in tiles, not pixels)
    * @param {number} height - The height of the area to copy (given in tiles, not pixels)
    * @param {number|string|Phaser.TilemapLayer} [layer] - The layer to copy the tiles from.
    * @return {array} An array of the tiles that were copied.
    */
    copy: function (x, y, width, height, layerKey) {

        var layer = this.getTileLayer(layerKey);

        if (typeof x === "undefined") { x = 0; }
        if (typeof y === "undefined") { y = 0; }
        if (typeof width === "undefined") { width = layer.width; }
        if (typeof height === "undefined") { height = layer.height; }

        var copyData = layer.copyTiles(new Phaser.Rectangle(x, y, width, height), this._results, true);

        //  `unshift` allows the the result to be used as it was before, with a biased offset.
        //  Switch to TileLayer#copyTiles to avoid it.
        var header = { x: x, y: y, width: width, height: height, layer: layer, copyData: copyData };
        var tileblock = copyData.tiles;
        tileblock.unshift(header);

        return tileblock;

    },

    /**
    * Pastes a previously copied block of tile data into the given x/y coordinates. Data should have been prepared with Tilemap.copy.
    *
    * @method Phaser.Tilemap#paste
    * @deprecated Use {@link Phaser.TileLayer#copyTiles} / {@link Phaser.TileLayer#pasteTiles}
    * @param {number} x - X position of the top left of the area to paste to (given in tiles, not pixels)
    * @param {number} y - Y position of the top left of the area to paste to (given in tiles, not pixels)
    * @param {array} tileblock - The block of tiles to paste.
    * @param {number|string|Phaser.TilemapLayer} [layer] - The layer to paste the tiles into.
    */
    paste: function (x, y, tileblock, layerKey) {

        var layer = this.getTileLayer(layerKey);

        if (typeof x === "undefined") { x = 0; }
        if (typeof y === "undefined") { y = 0; }

        if (!tileblock || tileblock.length < 2)
        {
            return;
        }

        var header = tileblock[0];
        layer.pasteTiles(header.copyData, x, y, 1);

    },

    /**
    * For each tile in the given area defined by x/y and width/height run the given callback.
    *
    * @method Phaser.Tilemap#forEach
    * @deprecated Use {@link Phaser.TileLayer#transformRegion}
    * @param {number} callback - The callback. Each tile in the given area will be passed to this callback as the first and only parameter.
    * @param {number} context - The context under which the callback should be run.
    * @param {number} x - X position of the top left of the area to operate one, given in tiles, not pixels.
    * @param {number} y - Y position of the top left of the area to operate one, given in tiles, not pixels.
    * @param {number} width - The width in tiles of the area to operate on.
    * @param {number} height - The height in tiles of the area to operate on.
    * @param {number|string|Phaser.TilemapLayer} [layer] - The layer to operate on.
    */
    forEach: function (callback, context, x, y, width, height, layerKey) {

        this.copy(x, y, width, height, layerKey);

        if (this._results.length < 2)
        {
            return;
        }

        this._results.forEach(callback, context);

        this.paste(x, y, this._results, layerKey);

    },

    /**
    * Scans the given area for tiles with an index matching tileA and swaps them with tileB.
    *
    * @method Phaser.Tilemap#swap
    * @param {number} tileA - First tile index.
    * @param {number} tileB - Second tile index.
    * @param {number} x - X position of the top left of the area to operate one, given in tiles, not pixels.
    * @param {number} y - Y position of the top left of the area to operate one, given in tiles, not pixels.
    * @param {number} width - The width in tiles of the area to operate on.
    * @param {number} height - The height in tiles of the area to operate on.
    * @param {number|string|Phaser.TilemapLayer} [layer] - The layer to operate on.
    */
    swap: function (tileA, tileB, x, y, width, height, layerKey) {

        var layer = this.getTileLayer(layerKey);

        layer.transformRegion(new Phaser.Rectangle(x, y, width, height),
            this._swapTransform, this, [tileA, tileB], true);

    },

    /*
    * @private
    */
    _swapTransform: function (tiles, context, indexA, indexB)
    {

        for (var i = 0; i < tiles.length; i++)
        {
            var tile = tiles[i];

            if (tile.index === indexA)
            {
                tile.index = indexB;
            }
            else if (tile.index === indexB)
            {
                tile.index = indexA;
            }
        }

    },

    /**
    * Scans the given area for tiles with an index matching `source` and updates their index to match `dest`.
    *
    * @method Phaser.Tilemap#replace
    * @param {number} source - The tile index value to scan for.
    * @param {number} dest - The tile index value to replace found tiles with.
    * @param {number} x - X position of the top left of the area to operate one, given in tiles, not pixels.
    * @param {number} y - Y position of the top left of the area to operate one, given in tiles, not pixels.
    * @param {number} width - The width in tiles of the area to operate on.
    * @param {number} height - The height in tiles of the area to operate on.
    * @param {number|string|Phaser.TilemapLayer} [layer] - The layer to operate on.
    */
    replace: function (source, dest, x, y, width, height, layerKey) {

        var layer = this.getTileLayer(layerKey);

        layer.transformRegion(new Phaser.Rectangle(x, y, width, height),
            this._replaceTransform, this, [source, dest], true);

    },

   /*
    * @private
    */
    _replaceTransform: function (tiles, context, sourceIndex, destIndex)
    {

        for (var i = 0; i < tiles.length; i++)
        {
            var tile = tiles[i];

            if (tile.index === sourceIndex)
            {
                tile.index = destIndex;
            }
        }

    },

    /**
    * Randomises a set of tiles in a given area.
    *
    * @method Phaser.Tilemap#random
    * @param {number} x - X position of the top left of the area to operate one, given in tiles, not pixels.
    * @param {number} y - Y position of the top left of the area to operate one, given in tiles, not pixels.
    * @param {number} width - The width in tiles of the area to operate on.
    * @param {number} height - The height in tiles of the area to operate on.
    * @param {number|string|Phaser.TilemapLayer} [layer] - The layer to operate on.
    */
    random: function (x, y, width, height, layerKey) {

        var layer = this.getTileLayer(layerKey);

        layer.transformRegion(new Phaser.Rectangle(x, y, width, height),
            this._randomTransform, this, null, true);

    },

   /*
    * @private
    */
    _randomTransform: function (tiles)
    {

        var indexes = [];

        for (var i = 0; i < tiles.length; i++)
        {
            var tile = tiles[i];

            if (tile.index > 0 &&
                indexes.indexOf(tile.index) === -1)
            {
                indexes.push(tile.index);
            }
        }

        for (var i = 0; i < tiles.length; i++)
        {
            var tile = tiles[i];

            tile.index = this.game.rnd.pick(indexes);
        }

    },

    /**
    * Shuffles a set of tiles in a given area. It will only randomise the tiles in that area, so if they're all the same nothing will appear to have changed!
    *
    * @method Phaser.Tilemap#shuffle
    * @param {number} x - X position of the top left of the area to operate one, given in tiles, not pixels.
    * @param {number} y - Y position of the top left of the area to operate one, given in tiles, not pixels.
    * @param {number} width - The width in tiles of the area to operate on.
    * @param {number} height - The height in tiles of the area to operate on.
    * @param {number|string|Phaser.TilemapLayer} [layer] - The layer to operate on.
    */
    shuffle: function (x, y, width, height, layerKey) {

        var layer = this.getTileLayer(layerKey);

        layer.transformRegion(new Phaser.Rectangle(x, y, width, height),
            this._shuffleTransform, this, null, true);

    },

   /*
    * @private
    */
    _shuffleTransform: function (tiles)
    {

        var indexes = [];

        for (var i = 0; i < tiles.length; i++)
        {
            var tile = tiles[i];
            indexes.push(tile.index);
        }

        Phaser.Utils.shuffle(indexes);
         
        for (var i = 0; i < tiles.length; i++)
        {
            var tile = tiles[i];
            tile.index = indexes[i];
        }

    },

    /**
    * Fills the given area with the specified tile.
    *
    * @method Phaser.Tilemap#fill
    * @param {number} index - The index of the tile that the area will be filled with.
    * @param {number} x - X position of the top left of the area to operate one, given in tiles, not pixels.
    * @param {number} y - Y position of the top left of the area to operate one, given in tiles, not pixels.
    * @param {number} width - The width in tiles of the area to operate on.
    * @param {number} height - The height in tiles of the area to operate on.
    * @param {number|string|Phaser.TilemapLayer} [layer] - The layer to operate on.
    */
    fill: function (index, x, y, width, height, layerKey) {

        var layer = this.getTileLayer(layerKey);

        layer.transformRegion(new Phaser.Rectangle(x, y, width, height),
            this._fillTransform, this, [index], true);

    },

    /**
    * @private
    */
    _fillTransform: function (tiles, transform, fillIndex)
    {

        for (var i = 0; i < tiles.length; i++)
        {
            var tile = tiles[i];

            tile.index = fillIndex;
        }

    },

    /**
    * Removes all layers from this tile map.
    *
    * @method Phaser.Tilemap#removeAllLayers
    */
    removeAllLayers: function () {

        this.layers.length = 0;
        this.currentLayer = 0;

    },

    /**
    * Dumps the tilemap data out to the console.
    *
    * @method Phaser.Tilemap#dump
    */
    dump: function (layerKey) {

        var layer = this.getTileLayer(layerKey);

        var txt = '';
        var args = [''];

        var tile = new Phaser.Tile(layer, -1, 0, 0);

        for (var y = 0; y < layer.height; y++)
        {
            for (var x = 0; x < layer.width; x++)
            {
                layer.copyToTile(x, y, tile);
                var index = tile.index;

                txt += "%c  ";

                if (index > 0)
                {
                    if (this.debugMap[index])
                    {
                        args.push("background: " + this.debugMap[index]);
                    }
                    else
                    {
                        args.push("background: #ffffff");
                    }
                }
                else
                {
                    args.push("background: rgb(0, 0, 0)");
                }
            }

            txt += "\n";
        }

        args[0] = txt;
        console.log.apply(console, args);

    },

    /**
    * Removes all layer data from this tile map and nulls the game reference.
    * Note: You are responsible for destroying any TilemapLayer objects you generated yourself, as Tilemap doesn't keep a reference to them.
    *
    * @method Phaser.Tilemap#destroy
    */
    destroy: function () {

        this.removeAllLayers();
        this.data = [];
        this.game = null;

    }

};

/**
 * Gets the tileset that is responsbile for the give tile ID.
 *
 * @method
 * @param tileId {Number} The id of the tile to find the tileset for
 * @return {TiledTileset} Returns the tileset if found, undefined if not
 */
Phaser.Tilemap.prototype.getTileset = function (tileId) {

    var setMap = this.tiles[tileId];
    if (setMap)
    {
        return this.tilesets[setMap[2]];
    }
    else
    {
        return null;
    }

};

Phaser.Tilemap.prototype.constructor = Phaser.Tilemap;

/**
* @name Phaser.Tilemap#layer
* @property {number|string|Phaser.TilemapLayer} layer - The current layer object.
*/
Object.defineProperty(Phaser.Tilemap.prototype, "layer", {

    get: function () {

        return this.layers[this.currentLayer];

    },

    set: function (value) {

        this.setLayer(value);

    }

});
