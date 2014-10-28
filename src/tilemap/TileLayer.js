/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2014 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

/**
* TileLayer represents tile data for a single layer.
* Most notably this is used for {@link Phaser.Tilemap#layers} and by {@link Phaser.TilemapLayer}.
*
* A TileLayer is usually rendered by a {@link Phaser.TilemapLayer}.
*
* A cell is "data" at a particular location represented as a grid and a Tile is a copy/view of a cell.
* See {@link Phaser.TileLayer#getTileRef getTileRef} and {@link Phaser.Tile} documentation for Tile usage restrictions.
*
* A cell/tile with a negative index (ie. -1) is said to be *non-existant*. When updated any internal state associated with such a non-existant cell is cleared as if `removeCell` was called. A tile with an index of 0 exists and thus *can* participate in collision handling, etc.
*
* @class Phaser.TileLayer
* @constructor
* @param {Phaser.Tilemap} tilemap - Leave this null as it will be set when added to a Tilemap.
* @param {integer} width - Width in tiles.
* @param {integer} height - Height in tiles.
* @param {integer} tileWidth - Width of each tile (in pixels); should match Tilemap.
* @param {integer} tileHeight - Height of each tile (in pixels); should match Tilemap.
*/
Phaser.TileLayer = function (tilemap, width, height, tileWidth, tileHeight) {

    /**
    * The name of this layer, if any. The name of the layer should not be changed once added to a Tilemap.
    * @member {(string|null)}
    * @protected
    */
    this.name = null;

    /**
    * @todo Define usage/meaning or remove.
    * @private
    */
    this.x = 0;

    /**
    * @todo Define usage/meaning or remove.
    * @private
    */
    this.y = 0;

    /**
    * The associated tilemap. This should be set after the layer is added to a tilemap.
    * (This is becuase a TileLayer is first created by the parser, which has no knowledge of the final Tilemap.)
    * @member {Phaser.Tilemap}
    * @private
    */
    this.tilemap = tilemap;

    /**
    * The index of this layer in its parent container. The index of the layer should not be changed once added to a Tilemap.
    * @member {integer}
    * @private
    */
    this.layerIndex = -1;

    /**
    * Width of the layer in tiles.
    * @member {integer}
    * @public
    * @readonly
    */
    this.width = width | 0;

    /**
    * Height of the layer in tiles.
    * @member {integer}
    * @public
    * @readonly
    */
    this.height = height | 0;

    /**
    * Width of each tile (in pixels).
    * @member {integer}
    * @public
    * @readonly
    */
    this.tileWidth = tileWidth | 0;

    /**
    * Height of each tile (in pixels).
    * @member {integer}
    * @public
    * @readonly
    */
    this.tileHeight = tileHeight | 0;

    /**
    * Width of the layer (in pixels).
    * @member {integer}
    * @public
    * @readonly
    */
    this.widthInPixels = this.width * this.tileWidth;

    /**
    * Height of the layer (in pixels).
    * @member {integer}
    * @public
    * @readonly
    */
    this.heightInPixels = this.height * this.tileHeight;

    /**
    * Layer opacity - not currently used internally.
    * @member {number}
    * @private
    * @todo Currently unused?
    */
    this.alpha = 1;

    /**
    * Layer visibility - not currently used internally.
    * @member {boolean} 
    * @private
    * @todo Currently unused?
    */
    this.visible = true;

    /**
    * Other layer index properties.
    * @member {object} 
    * @private
    * @todo Needs usage formalization.
    */
    this.properties = {};

    /**
    * Other layer index properties.
    * @member {object[]}
    * @private
    * @todo Needs usage formalization.
    */
    this.indexes = [];

    /**
    * Other layer body properties.
    * This is used by physics engines but is otherwise not used by the layer.
    * @member {object[]}
    * @protected
    */
    this.bodies = [];

    /**
    * The Tiles for this layer. Non-existant tiles are represented by null values.
    *
    * This is *an implementation detail* and direct-usage of this field, except for implementation-specific usage, should be avoided.
    *
    * @member {array<Phaser.Tile[]>}
    * @protected
    */
    this.data = (function (width, height) {

        var row = [];
        var x = width;
        while (x--)
        {
            row.push(null);
        }

        var data = [];
        var y = height;
        while (y--)
        {
            data.push(row.slice(0));
        }

        return data;

    })(width, height);

    /**
    * @typedef Phaser.TileLayer~RoleData
    * @private
    * @type {object}
    * @property {integer} roleId - ID of the role, should be larger than 0 as roleId = 0 is "invalid".
    * @property {string} roleName - Name of the role, should be unique within the Layer.
    * @property {(object|null)} roleRroperties - Properties for this role, if any.
    */

    /**
    * Data relating to a specific role index/type. This includes callbacks, default settings, etc.
    * @member {Phaser.TileLayer~RoleData}
    * @private
    */
    this._roleData = [null];

    /**
    * @member {object} Object mapping names to Phaser.TileLayer~RoleData
    * @private
    */
    this._rolesByName = {};

    /**
    * @typedef Phaser.TileLayer~IndexData
    * @private
    * @type {object}
    * @property {(function|null)} collisionTest - The tile/index collision test, if any.
    * @property {(object|null)} collisionContext - The context of the collision test, if any.
    * @property {(integer|null)} defaultCollideMask - See {@link Phaser.Tile#tileFlags}. Only applied when non-null.
    * @property {(object|null)} indexProperties - Properties associated with this index.
    */

    /**
    * Data relating to a specific tile index/type. This includes collision callbacks, default settings, etc.
    * @member {Phaser.TileLayer~IndexData}
    * @private
    */
    this._indexData = [];

    /**
    * If true then all Tiles fetched from this layer will use Layer-local index/type properties (see {@link Phaser.Tile#indexProperties}). This should be set prior to using any index/type properties and not changed.
    * 
    * @public
    * @default
    */
    this.useLayerIndexProperties = true;

    /**
    * The current change count. This is incremented when a cell is suspected of having been modified. The need to handle changes (ie. redrawing) can be detected by comparing this value with a saved value.
    * @member {integer}
    * @public
    * @readonly
    */
    // readonly externally, but modified internally.
    this.changeCount = 0;

    /**
    * Additional internal change counts.
    * @member {object}
    * @private
    */
    this._changeCounts = {
        ruleChanges: 0
    };

    /**
    * Internal change clear tracking.
    * @member {object}
    * @private
    */
    this._changeClearedAt = {
        changeCount: 0,
        applyRules: 0,
        calculateFaces: 0
    };

    /**
    * Internal flag; see `suppressRefresh`.
    * @member {boolean}
    * @private
    */
    this._suppressRefresh = false;

};

Phaser.TileLayer.prototype = {

    /**
    * Creates a role with the given name.
    *
    * The name can be subsequently used to assign a role to a Tile with `Tile.roleName` or with `setCell`.
    *
    * @method Phaser.TileLayer#createTileRole
    * @public
    * @param {string} roleName - The name of the role to create.
    * @return {object} The tile role object (Internal).
    */
    createTileRole: function (roleName) {

        var role = this._rolesByName[roleName];

        if (!role)
        {
            role = {
                roleId: this._roleData.length,
                roleName: roleName,
                properties: {}
            };

            this._roleData.push(role);
            this._rolesByName[roleName] = null;
        }

        return role;

    },

    /**
    * Get a tile role with the given name.
    *
    * @method Phaser.TileLayer#getTileRole
    * @protected
    * @param {string} roleName - The name of the role to create.
    * @return {(object|null)} The tile role object (internal) or null.
    */
    getTileRole: function (roleName) {

        return this._rolesByName[roleName] || null;

    },

    /**
    * Get the properties associated with the tile index/type.
    *
    * The properties may be shared across the entire Tilemap or limited to the current Layer depending on `useLayerIndexProperties`. If layer-specific properties are enabled the use the Tilemap properties as a [prototype].
    *
    * @protected
    * @param {integer} tileIndex - Tile index/type to find the properties for.
    * @param {boolean} ensureProperties - If true a tile-index properties object will be created (and saved) as appropriate.
    * @return {(object|null)} The properties associated with the index/type of a tile, or null.
    */
    getTileIndexProperties: function (tileIndex, ensureProperties) {

        if (this.useLayerIndexProperties) {

            var data = this.getTileIndexData(tileIndex, ensureProperties);

            if (data.indexProperties)
            {
                return data.indexProperties;
            }
            else if (ensureProperties)
            {
                var baseProps = this.tilemap.getTileIndexProperties(tileIndex, true);
                return (data.indexProperties = Object.create(baseProps));
            }
            else
            {
                return null;
            }

        }
        else
        {
            return this.tilemap.getTileIndexProperties(tileIndex, ensureProperties);
        }

    },

    /**
    * Get the properties associated with the tile role. The properties are shared within the layer.
    *
    * @protected
    * @param {integer} roleId - Tile index/type to find the properties for.
    * @param {boolean} ensureProperties - If true a properties object will be created (and saved) as appropriate.
    * @return {(object|null)} The properties associated with the index/type of a tile, or null.
    */
    getRoleProperties: function (roleId, ensureProperties) {

        var role = this._roleData[roleId];
        if (!role)
        {
            //  No role, no properties
            return null;
        }

        if (role.roleProperties)
        {
            return role.roleProperties;
        }
        else if (ensureProperties)
        {
            return (role.roleProperties = {});
        }
        else
        {
            return null;
        }

    },


    /**
    * Set a cell. Only the current cell's index (or role/alpha) is changed.
    *
    * This does *not* automatically update the layer collision/metadata. The `refreshLayer` method should be manually called after updating all relevant cells.
    *
    * This does not affect any per-location callbacks or properties associated with the cell.
    * Default rules, including collide falgs, are applied if the tileIndex value of the cell changes.
    *
    * A negative/non-existant index value (ie. -1) will clear the cell.
    *
    * @public
    * @param {integer} x - The cell's x coordinate-component.
    * @param {integer} y - The cell's y coordinate-component.
    * @param {integer} tileIndex - The index/type of the tile/cell.
    * @param {integer} [roledId=don't change] - The role id of the tile/cell.
    * @param {number} [alpha=don't change] - The per-cell alpha value, from [0, 1].
    */
    setCell: function (x, y, tileIndex, roleId, alpha) {

        if (tileIndex > -1)
        {
            var tile = this._ensureTile(x, y);
         
            if (tile.tileIndex !== tileIndex)
            {
                this.applyDefaultTileRules(tile);
            }

            tile.tileIndex = tileIndex;

            if (roleId !== undefined)
            {
                tile.roleId = roleId;
            }
            if (alpha !== undefined)
            {
                tile.alpha = alpha;
            }

            this.changeCount++;
        }
        else
        {
            this.clearCell(x, y);
        }

    },

    /**
    * Set a cell from a tile; the tile should be associated with this layer. Existing cell information is overwritten. Ad-hoc properties on the tile are *not* saved.
    *
    * This does *not* automatically update the layer collision/metadata. The `refreshLayer` function should be manually called after updating all relevant cells.
    *
    * Not supplying a tile or supplying a tile with a negative index value (ie. -1) will clear the cell.
    *
    * @public
    * @param {integer} x - The cell's x coordinate-component
    * @param {integer} y - The cell's y coordinate-component
    * @param {(Phaser.Tile|null)} tile - The Tile data.
    */
    setCellFromTile: function (x, y, sourceTile) {

        if (sourceTile && sourceTile.tileIndex > -1)
        {
            // if (sourceTile.layer !== this) -> bad!

            var tile = this._ensureTile(x, y);
            
            tile.copyFrom(sourceTile);

            this.changeCount++;
        }
        else
        {
            this.clearCell(x, y);
        }

    },

    /**
    * Used to "ensure" a Tile for a cell. Returns null for cells out of range.
    * @private
    */
    _ensureTile: function (x, y)
    {

        if (y < 0 || y >= this.data.length) { return null; }
        var row = this.data[y];
        if (x < 0 || x >= row.length) { return null; }

        if (row[x])
        {
            return row[x];
        }
        else
        {
            return (row[x] = new Phaser.Tile(this, -1, x, y));
        }

    },

    /**
    * Remove/clear a cell.
    *
    * This does *not* automatically update the layer collision/metadata. The `refreshLayer` function should be manually called after updating all relevant cells.
    *
    * @param {integer} x - The tile's x coordinate-component
    * @param {integer} y - The tile's y coordinate-component
    */
    clearCell: function (x, y) {

        if (y < 0 || y >= this.data.length) { return; }
        var row = this.data[y];
        if (x < 0 || x >= row.length) { return; }

        row[x] = null;

        this.changeCount++;

    },

    /**
    * Returns true if the cell exists, false otherwise.
    *
    * @public
    * @param {integer} x - The cell's x coordinate-component.
    * @param {integer} y - The cell's y coordinate-component.
    * @return {boolean} True if the cell at the specified location exists.
    */
    hasCell: function (x, y) {

        if (y < 0 || y >= this.data.length) { return false; }
        var row = this.data[y];
        if (x < 0 || x >= row.length) { return false; }

        var tile = row[x];
        
        return tile && tile.tileIndex > -1;

    },

    /**
    * Returns a Tile representing the specified cell location.
    *
    * This method should only be used for a quick read/inspection of a cell - the Tile object returned *may* be recycled/reused by different implementations. The same Tile object is *not* guaranteed to be returned on subsequent invocations.
    *
    * It is *not* safe for public code to modify the returned Tile or to store it for later use. See `getTileCopy` or `copyToTile` for functions that return a copied Tile.
    *
    * @protected
    * @param {integer} x - The cell's x coordinate-component.
    * @param {integer} y - The cell's y coordinate-component.
    * @returns {(Phaser.Tile|null)} A Tile representing a cell, or null if the cell is non-existant or the location is invalid.
    */
    getTileRef: function (x, y) {

        if (y < 0 || y >= this.data.length) { return null; }
        var row = this.data[y];
        if (x < 0 || x >= row.length) { return null; }

        return row[x] || null;

    },

    /**
    * Extracts the cell information into a Tile.
    *
    * The Tile copy can be modified; but `setCellFromTile` is required to update the layer data. If the cell is updated elsewhere, and then from a copied tile, the intermediate changes may be lost.
    *
    * @public
    * @param {integer} x - The cell's x coordinate-component.
    * @param {integer} y - The cell's y coordinate-component.
    * @param {boolean} [forceMaterialize=false] - If true a non-existant tile will be materialzed and returned.
    * @returns {(Phaser.Tile|null)} The new Tile copy. Null is returned if the tile is non-existant (and `forceMaterialize` is not true) or the location is invalid.
    */
    getTileCopy: function (x, y, forceMaterialize) {

        if (y < 0 || y >= this.data.length) { return null; }
        var row = this.data[y];
        if (x < 0 || x >= row.length) { return null; }

        var tile = row[x];

        if (tile)
        {
            var targetTile = new Phaser.Tile(this, -1, x, y);
            targetTile.copyFrom(tile);

            return targetTile;
        }
        else if (forceMaterialize)
        {
            return new Phaser.Tile(this, -1, x, y);
        }
        else
        {
            return null;
        }

    },

    /**
    * Extracts the cell information into a Tile object.
    *
    * The Tile copy can be modified; but `setCellFromTile` is required to update the layer data. If the cell is updated elsewhere, and then from a copied tile, the intermediate changes may be lost.
    *
    * @public
    * @param {integer} x - The cell's x coordinate-component.
    * @param {integer} y - The cell's y coordinate-component.
    * @param {Phaser.Tile} targetTile - The Tile object to modify. This should itself by a new Tile object or a Tile copy; copying to a Tile obtain from `getTileRef` is ill-defined.
    * @returns {(Phaser.Tile|null)} The `targetTile` (even when the tile is non-existant), or null if the location was invalid.
    */
    copyToTile: function (x, y, targetTile) {

        targetTile.x = x;
        targetTile.y = y;

        if (y < 0 || y >= this.data.length)
        {
            targetTile.resetToNonExistant();
            return null;
        }

        var row = this.data[y];
        
        if (x < 0 || x >= row.length) {
            targetTile.resetToNonExistant();
            return null;
        }

        var tile = row[x];
        if (tile)
        {
            targetTile.copyFrom(tile);
            return targetTile;
        }
        else
        {
            targetTile.resetToNonExistant();
            return targetTile;
        }

    },

    /**
    * Calls the shared-index collision handler for a tile index/type, should it exist.
    *
    * If there is no collision handler then "pass" (a true value) is returned; otherwise returns the value of the callback (which may be null).
    *
    * @public
    * @param {Phaser.Tile} tile - The tile participating in this test.
    * @param {object} collider - The object being tested for collision against the tile, usually a physics body.
    * @return {object} The result of invoking the callback should it exist, else "pass".
    */
    doTileIndexCollisionTest: function (tile, collider) {

        //  These are in {callback:, callbackContext:} form
        var data = this._indexData[tile.tileIndex];
        
        if (!data || !data.collisionTest)
        {
            return "pass";
        }

        return data.collisionTest.call(data.collisionContext, collider, tile);

    },

    /**
    * Gets the index-specific data for the given tile index, creating it if requested.
    *
    * @private
    * @param {integer} tileIndex - The tile index of the data to fetch.
    * @param {boolean} autoCreate - If true data will be created as required.
    * @return {Phaser.TileLayer~IndexData} The data object.
    */
    getTileIndexData: function (tileIndex, autoCreate) {

        var data = this._indexData[tileIndex];
        if (data)
        {
            return data;
        }
        else if (autoCreate)
        {
            return (this._indexData[tileIndex] = {
                defaultCollideMask: null,
                collisionTest: null,
                collisionContext: null,
                indexProperties: null
            });
        }
        else
        {
            return null;
        }

    },

    /**
    * Assigns the *per-Layer* collision test/callback for the given indexes. This affects all tiles, present and future, which have the index when performing collision checks.
    *
    * @public
    * @param {integer[]} tileIndexes - An array of affected tile indexes.
    * @param {(function|null)} [callback=none] - The callback/test. If null or omitted the existing callbacks are removed.
    * @param {object} [callbackContext=none] - The context of the callback, if any.
    */
    setCollisionTestForTileIndexes: function (tileIndexes, callback, callbackContext) {

        var needsCreate = !!callback;

        for (var i = 0; i < tileIndexes.length; i++) {
            var index = tileIndexes[i];

            var data = this.getTileIndexData(index, needsCreate);
            if (!data)
            {
                continue;
            }

            if (callback)
            {
                data.collisionTest = callback;
                data.collisionContext = callbackContext || null;
            }
            else
            {
                data.collisionTest = null;
                data.collisionContext = null;
            }
        }

    },

    /**
    * Set the default `Tile.collide*` behavior for the given tile indexes/types.
    *
    * This will *not* update existing tile copies, except if they have their index reassigned.
    *
    * @public
    * @param {integer[]} tileIndexes - Array of tile indexes to affect.
    * @param {integer} collideFlags - See Phaser.Tile#tileFlags. Only the collision flag information be changed.
    * @param {boolean} [applyImmediate=true] - If true then `refreshLayer(false)` will be applied immediately.
    */
    setDefaultCollisionFlags: function (tileIndexes, collideFlags, applyImmediately) {

        if (applyImmediately === undefined) { applyImmediately = true; }

        //  Don't allow values outside collide mask range and also update flags
        //  so that the `faces*` are also set when applied.
        collideFlags &= Phaser.Tile.COLLIDE_ALL;
        collideFlags |= (collideFlags << 4);

        var needsCreate = collideFlags !== 0;

        for (var i = 0; i < tileIndexes.length; i++) {
            var index = tileIndexes[i];

            var data = this.getTileIndexData(index, needsCreate);
            data.defaultCollideMask = collideFlags;

            this._changeCounts.ruleChanges++;
        }

        if (applyImmediately)
        {
            this.refreshLayer(false);
        }

    },

    /**
    * Refresh the layer updating tile rules and/or collision metadata.
    *
    * This is a relatively "expensive" operation and should only be called after a batch of related tile or rule modifications.
    *
    * This function *must* be called to update internal metadata information including collision detection flags; otherwise the layer may be filled with stale information.
    *
    * @public
    * @param {boolean} [force=false] - If true a refresh will be performed even if `suppressRefresh` is enabled; it will also force a refresh even when the layer is not known to require an update.
    */
    refreshLayer: function (force) {

        this.applyRules(force);
        this.calculateFaces(force);

    },

    /**
    * Apply all applicable index/role rules to the layer.
    *
    * External code should use `refreshLayer`.
    *
    * @protected
    * @param {boolean} force - If true this will ignore `suppressRefresh` and optimistic checks.
    */
    applyRules: function (force) {

        if (!force && this._suppressRefresh)
        {
            return;
        }
        if (!force && this._changeClearedAt.applyRules >= this._changeCounts.ruleChanges)
        {
            return; //  Optimistic check says no need
        }

        for (var y = 0; y < this.height; y++)
        {
            var row = this.data[y];

            for (var x = 0; x < row.length; x++)
            {
                var tile = row[x];
                if (!tile)
                {
                    continue;
                }

                this.applyDefaultTileRules(tile);
            }
        }

        this._changeClearedAt.applyRules = this._changeCounts.ruleChanges;
        this.changeCount++;

    },

    /**
    * Applies any default tile-index/type rules to the given tile.
    *
    * @private
    * @param {Phaser.Tile} tile - The tile to apply the rules to.
    */
    applyDefaultTileRules: function (tile) {

        var data = this._indexData[tile.tileIndex];
        if (data)
        {
            if (data.defaultCollideMask !== null)
            {
                tile.tileFlags &= ~Phaser.Tile.COLLIDE_ALL;
                tile.tileFlags &= ~Phaser.Tile.FACE_ALL;
                tile.tileFlags |= data.defaultCollideMask;
            }
        }

    },

    /**
    * Update the touching face / collision data.
    *
    * External code should use `refreshLayer`.
    *
    * @protected
    * @param {boolean} force - If true this will ignore `suppressRefresh` and optimistic checks.
    */
    calculateFaces: function (force) {

        if (!force && this._suppressRefresh)
        {
            return;
        }
        if (!force && this._changeClearedAt.calculateFaces >= this.changeCount)
        {
            return; //  Optimistic check says no need
        }

        var n;

        var row;
        var rowAbove;
        var rowBelow = this.data[0];

        for (var y = 0, h = this.height; y < h; y++)
        {
            rowAbove = row;
            row = rowBelow;
            rowBelow = this.data[y + 1];

            for (var x = 0; x < row.length; x++)
            {
                var tile = row[x];
                if (!tile || tile.tileIndex < 0) {
                    //  Skip non-existant cells
                    continue;
                }

                //  Enable a facing flag for every corresponding colliding flag
                tile.tileFlags &= ~Phaser.Tile.FACE_ALL;
                tile.tileFlags |= (tile.tileFlags & Phaser.Tile.COLLIDE_ALL) << 4;

                //  Remove faces that are against a tile that has a collision set
                //  in the same direction. This ensures that only "outside" faces
                //  are marked after the algorithm completes.
                
                n = rowAbove && rowAbove[x];
                if (n && n.collideUp) {
                    tile.faceTop = false;
                }

                n = rowBelow && rowBelow[x];
                if (n && n.collideDown) {
                    tile.faceBottom = false;
                }

                n = row[x - 1];
                if (n && n.collideLeft) {
                    tile.faceLeft = false;
                }

                n = row[x + 1];
                if (n && n.collideRight) {
                    tile.faceRight = false;
                }
            }
        }

        this._changeClearedAt.calculateFaces = this.changeCount;

    },

    /**
    * Given a rectangle, with dimensions in tiles, create a new trimmed rectangle such that every point is a valid tile location in this layer.
    *
    * @private
    * @param {Phaser.Rectangle} rect - The rectangle to fit.
    * @return {Phaser.Rectangle} A new fitted rectangle.
    */
    fitRectInLayer: function (rect) {

        rect = new Phaser.Rectangle(rect.x, rect.y, rect.width, rect.height);

        rect.x |= 0;
        rect.y |= 0;

        if (rect.x < 0)
        {
            rect.width -= rect.x;
            rect.x = 0;
        }

        if (rect.y < 0)
        {
            rect.height -= rect.y;
            rect.y = 0;
        }

        rect.width = Phaser.Math.clamp(rect.width, 0, this.width - rect.x) | 0;
        rect.height = Phaser.Math.clamp(rect.height, 0, this.height - rect.y) | 0;

        return rect;

    },

    /**
    * Return a flattend array of tiles from the given region.
    *
    * The tile objects returned should *not* be modified and should *not* have their lifetime extended. The contract for returned Tiles is the same as that for `getTileRef`.
    *
    * Only Tiles for existing cells are included in the buffer - this includes cells with an index of 0, should such be present.
    *
    * @protected
    * @param {integer} x - The x component of the region's top-left corner (in tiles).
    * @param {integer} y - The y component of the region's top-left corner (in tiles).
    * @param {integer} width - The width of the region (in tiles).    
    * @param {integer} height - The height of region (in tiles).
    * @param {Phaser.Tile[]} buffer - The array to use, otherwise a new array is created. The size of the array is adjusted as appropriate.
    * @param {integer} anyMask - Any tiles/cells with tileFlags matching this mask at all be selected.
    */
    getExistingTiles: function (x, y, width, height, buffer, anyMask) {

        if (!buffer)
        {
            buffer = [];
        }

        x = Math.max(x, 0) | 0;
        y = Math.max(y, 0) | 0;
        var endx = Math.min(x + width, this.width);
        var endy = Math.min(y + height, this.height);

        var count = 0;

        for (var ty = y; ty < endy; ty++)
        {
            var row = this.data[ty];

            for (var tx = x; tx < endx && tx < row.length; tx++)
            {
                var tile = row[tx];

                if (tile && (tile.tileFlags & anyMask) !== 0)
                {
                    if (count < buffer.length)
                    {
                        buffer[count] = tile;
                    }
                    else
                    {
                        buffer.push(tile);
                    }
                    count++;
                }
            }
        }

        //  Remove excess
        while (buffer.length > count)
        {
            buffer.pop();
        }

        return buffer;

    },

    /**
    * Return a flattend array of tiles from the given region.
    *
    * The tile objects returned should *not* be modified (unless forceCopy is specified); this restriction can be lifted by the calling environment as documented.
    *
    * @protected
    * @param {integer} x - The x component of the region's top-left corner (in tiles).
    * @param {integer} y - The y component of the region's top-left corner (in tiles).
    * @param {integer} width - The width of the region (in tiles).
    * @param {integer} height - The height of region (in tiles).
    * @param {(Phaser.Tile[]|null)} buffer - The array to use, otherwise a new array is created. The size of the array is trimmed if it was previously too large.
    * @param {boolean} forceMaterialize - If true non-existant cells will be materialzed.
    * @param {boolean} forceCopy - If true all Tile's are copies (not "references"). A copy may be made even if false and Tiles obtained via this method must always be explicitly updated. This also ensures the copies are disconnected (see {@link Phaser.Tile#copyFrom}).
    * @return {Phaser.Tile[]} An array of Phaser.Tiles.
    */
    getTilesEx: function (x, y, width, height, buffer, forceMaterialize, forceCopy) {

        if (!buffer)
        {
            buffer = [];
        }

        x = Math.max(x, 0) | 0;
        y = Math.max(y, 0) | 0;
        var ex = Math.min(x + width, this.width);
        var ey = Math.min(y + height, this.height);

        var count = 0;

        for (var ty = y; ty < ey; ty++)
        {
            var row = this.data[ty];

            for (var tx = x; tx < ex && tx < row.length; tx++)
            {
                var tile = row[tx];

                if (!tile && forceMaterialize)
                {
                    tile = new Phaser.Tile(this, -1, tx, ty);
                }
                else if (tile && forceCopy)
                {
                    tile = tile.clone(true);
                }

                if (count < buffer.length)
                {
                    buffer[count] = tile;
                }
                else
                {
                    buffer.push(tile);
                }
                count++;
            }
        }

        //  Remove excess
        while (buffer.length > count)
        {
            buffer.pop();
        }

        return buffer;

    },

    /**
    * Transforms cells in a region; allows for un-assigned/non-existant cells to be assigned.
    *
    * The callback is supplied with the with the arguments (tiles, context, ...args).
    *
    * In the callback, `tiles` is an array of Tiles representing the cells. Non-existant cells will be materialized as Tiles with an index of -1 if `forceMaterialize` is true. `context` is reserved for future use.
    *
    * To remove or clear a Tile/cell, set the index to -1. Setting the index to 0 will prevent rendering but will not clear the cell data as it "still exists".
    *
    * Tiles should not be leaked from the callback; any changes/usage of such should be done immediatly. If the callback terminates abnormally (ie. an exception is thrown) the state of the cells is ill-defined.
    *
    * This method automatically invokes `refreshLayer(false)` after the transformation is applied.
    *
    * @public
    * @param {Phaser.Rectangle} rect - Rectangle defining the region to transform (in tiles).
    * @param {function} callback - The transformation function.
    * @param {object} [context=null] - The transformation function context.
    * @param {object[]} [args=[]] - Additional arguments to supply to the transformation function, if any.
    * @param {boolean} [forceMaterialize=false] - If true non-existant cells will be have tile objects created. This adds overhead but allows non-existant cells to be inspected and updated.
    */
    transformRegion: function (rect, callback, context, args, forceMaterialize) {

        if (forceMaterialize === undefined) { forceMaterialize = false; }

        var rect = this.fitRectInLayer(rect);

        var tiles = this.getTilesEx(
            rect.x, rect.y, rect.width, rect.height,
            [], forceMaterialize, false);

        var callbackArgs = [tiles, null];
        if (args)
        {
            callbackArgs.push.apply(callbackArgs, args);
        }

        callback.apply(context, callbackArgs);

        for (var i = 0; i < tiles.length; i++)
        {
            var tile = tiles[i];
            this.setCellFromTile(tile.x, tile.y, tile);
        }

        this.refreshLayer(false);

    },

    /**
    * Create a copy of the cells/tiles within a region. To transform a region use {@link Phaser.TileLayer#transformRegion transformRegion} instead of a copy-transform-paste operation. To iterate a region without making any changes use {@link Phaser.TileLayer#getTilesEx}.
    *
    * The resulting copied tiles/information has a `tiles` property which is an array of the tiles.
    *
    * @public
    * @param {Phaser.Rectangle} rect - The area to copy (in tiles), constrained to the layer.
    * @param {array} [buffer=new array] - The array to copy the tiles into. Any existing items in the array are removed. If not specified a new array is used.
    * @param {boolean} [forceMaterialize=true] - If true then even non-existant cells will have tile objects created; otherwise `tiles` may contain null elements.
    * @return {object} The copy data / information.
    */
    copyTiles: function (rect, buffer, forceMaterialize) {

        if (buffer === undefined) { buffer = []; }
        if (forceMaterialize === undefined) { forceMaterialize = true; }

        rect = this.fitRectInLayer(rect);

        buffer = this.getTilesEx(
            rect.x, rect.y, rect.width, rect.height,
            buffer, forceMaterialize, true);

        return {
            layer: this,
            rect: rect,
            tiles: buffer
        };

    },

    /**
    * Pastes previously copied tiles at the given coordinates. Data should have been prepared with {@link copyTiles}.
    *
    * Tiles should only be pasted into the same layer from which they were copied. Attempts to copy from a different layer is not well defined.
    *
    * This method automatically calls {@linkcode Phaser.TileMap#refreshLayer refreshLayer(false)}.
    *
    * @public
    * @param {object} copyData - The previously copied tile data.
    * @param {integer} [x=copy_src_x] - The x component of the top-left coordinate (in tiles).
    * @param {integer} [y=copy_src_y] - The y component of the top-left coordinate (in tiles).
    */
    // param {integer} [offset=0] - Internal / for compatibility with Tilemap#paste.
    pasteTiles: function (copyData, x, y, offset) {

        if (!copyData || !copyData.buffer.length)
        {
            return 0;
        }

        if (x === undefined) { x = copyData.rect.x; }
        if (y === undefined) { y = copyData.rect.x; }

        var tileblocks = copyData.tiles;
        var ty = y;
        var i = offset || 0;
        var pasteCount = 0;

        while (i < tileblocks.length)
        {
            if (ty >= 0 && ty < this.height) {
                //  Row exists in layer

                for (var tx = x, endx = x + copyData.rect.width; tx < endx; tx++) {

                    if (tx >= 0 && tx < this.width) {
                        //  Colum exists in layer
                        var tile = tileblocks[i];

                        this.setCellFromTile(tx, ty, tile);

                        pasteCount++;
                    }

                }
            }

            i += copyData.rect.width;
            ty++;
        }

        this.refreshLayer(false);

        return (copyData.width * copyData.height) === pasteCount;

    },

    /**
    * Remove all physic bodies from `bodies`, invoking destroy upon them if specified.
    *
    * @public
    * @param {boolean} [destroy=true] - If true then `destroy` is invoked upon each removed body.
    */
    removeBodies: function (destroy) {

        if (destroy === undefined) { destroy = true; }

        while (this.bodies.length)
        {
            var body = this.bodies.pop();
            if (destroy) {
                body.destroy();
            }
        }

    },

    /**
    * Returns true if the cell/tile at given coordinate contains the render-relative point.
    *
    * @public
    * @param {integer} x - The cell's x coordinate component.
    * @param {integer} y - The cells's y coordinate component.
    * @param {number} rx - The render-relative x coordinate component (in pixels).
    * @param {number} ry - The render-relative y coordinate component (in pixels).
    * @return {boolean} True if the coordinates are within the specified cell/tile location, otherwise false.
    */
    cellContainsCoordinate: function (x, y, rx, ry) {

        var wx = x * this.tileWidth;
        var wy = y * this.tileHeight;

        return (
            rx >= wx &&
            ry >= wy &&
            rx <= (wx + this.tileWidth) &&
            ry <= (wy + this.tileHeight)
        );

    },

    /**
    * Returns true if the cell/tile at the given coordinate intersects the render-relative bounds.
    *
    * @public
    * @param {integer} x - The cells's x coordinate component.
    * @param {integer} y - The cells's y coordinate component.
    * @param {number} left - The render-relative x/left edge (in pixels).
    * @param {number} top - The render-relative y/top edge (in pixels).
    * @param {number} right - The render-relative right edge (in pixels).
    * @param {number} bottom - The render-relative bottom edge (in pixels).
    * @return {boolean} True if any point of the cell/tile is within the region.
    */
    cellIntersectsBounds: function (x, y, left, top, right, bottom) {

        var wx = x * this.tileWidth;
        var wy = y * this.tileHeight;

        return (
            right > wx &&
            bottom > wy &&
            left < (wx + this.tileWidth) &&
            top < (wy + this.tileHeight)
        );

    },

    /*
    * Perhaps clean up any resources/state, if such applies.
    *
    * @protected
    */
    destroy: function () {

        this.removeBodies(true);

        this.data = null;
        this.index = -1;

    }

};

/**
* True if this layer needs to be redrawn; this is set when cells have been suspected of being modified.
*
* @member #dirty
* @memberof Phaser.TileLayer
* @protected
* @deprecated Newer code should use {@link Phaser.TileLayer#changeCount}.
*/
Object.defineProperty(Phaser.TileLayer.prototype, "dirty", {

    get: function () {
        return this._changeClearedAt.changeCount !== this.changeCount;
    },

    set: function (value) {
        if (value)
        {
            //  Set
            this._changeClearedAt.changeCount = this.changeCount - 1;
        }
        else
        {
            //  Cleared
            this._changeClearedAt.changeCount = this.changeCount;
        }
    }

});

/**
* True if layer refreshing is being suppressed.
*
* When the layer is suppressed calling `refreshLayer(false)` will be ignored. When suppression is disabled (ie. normal refresh is re-enabled) this will automatically call `refreshLayer(false)`. Suppression never affects `refreshLayer(true)`.
*
* @member #suppressRefresh
* @memberof Phaser.TileLayer
* @public
* @default false
* @see #refreshLayer
*/
Object.defineProperty(Phaser.TileLayer.prototype, "suppressRefresh", {

    get: function () {
        return this._suppressRefresh;
    },

    set: function (suppress) {
        if (suppress && !this._suppressRefresh)
        {
            //  Enable suppression
            this._suppressRefresh = true;
        }
        else if (!suppress && this._suppressRefresh)
        {
            //  Disable suppression
            this._suppressRefresh = false;
            this.refreshLayer(false);
        }
    }

});
