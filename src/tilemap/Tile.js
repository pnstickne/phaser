/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2014 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

/**
* A Tile is a representation of a single cell/location within a Layer of a Tilemap.
*
* Changes made to a specific Tile do *not* automatically update the corresponding cell. The reliable manipulation/update of cells on a Layer can only be done through the cell/location manipulation functions (eg. {@link Phaser.TileLayer#setCellFromTile}, {@link Phaser.TileLayer#transformRegion}) exposed by a Tilemap or TilemapLayer.
*
* Ad-hoc properties added to Tile objects are *not* garuanteed to persit across future tile access. Use `properties`, `indexProperties` and `roleProperties` to add the appropriate per-classification information.
*
* *Tile objects should not be referenced/kept for extended periods of time:* a Tile should be considered only valid for the function in which it was obtained and when used with functions/code within that scope. Tile objects obtained *without* an explicit copy guarantee may be cached and reused.
*
* Previous Tile functionality has been deprecated in favor of more direct interactions with the appropriate Tilemap/TileLayer.
*
* @class Phaser.Tile
* @constructor
* @param {Phaser.TileLayer} layer - The layer this tile is associated with.
* @param {integer} tileIndex - The index/type of this tile in the core map data.
* @param {integer} x - The x map coordinate component.
* @param {integer} y - The y map coordinate component.
*/
Phaser.Tile = function (layer, tileIndex, x, y) {

    /**
    * The layer in the Tilemap data that this tile belongs to. This should only be used internally as a tile should only be used within a specific layer context already.
    *
    * @member {object} layer 
    * @protected
    * @readonly
    */
    this.layer = layer;

    /**
    * The tile index/type; -1 indicates the tile is "non-existant".
    *
    * @property {integer}
    * @protected
    * @readonly
    * @see #index
    */
    //  Modified internally
    this.tileIndex = tileIndex;

    /**
    * The role ID; 0 indicates there is no role assigned.
    *
    * @member {integer}
    * @protected
    * @readonly
    * @see #roleName
    */
    //  Modified internally
    this.roleId = 0;

    /**
    * The x map coordinate component of the Tile.
    *
    * @member {integer}
    * @readonly
    */
    this.x = x | 0;

    /**
    * The y map coordinate component of the Tile,
    *
    * @member {integer}
    * @readonly
    */
    this.y = y | 0;

    /**
    * Alpha value, in [0, 1], at which this tile is drawn. The alpha is only guaranteed to have a precision of 1/64.
    *
    * The TileLayer cell information is not guaranteed to be updated until the tile is set/updated.
    *
    * @member {number}
    */
    this.alpha = 1;

    /**
    * Bitmask indicating tile information. For internal and implementation use only.
    *
    * @member {integer}
    * @protected
    */
    // "Well Known"
    //   0x08 - collide up
    //   0x04 - collide down
    //   0x02 - collide left
    //   0x01 - collide right
    //   0x80 - face up           ~ collide up << 4
    //   0x40 - face down         ~ collide down << 4
    //   0x20 - face left         ~ collide left << 4
    //   0x10 - face right        ~ collide right << 4
    // See constants for others
    this.tileFlags = 0;

};

/*
* tileFlag Mask for colliding on all faces.
*
* @memberof Phaser.Tile
* @constant {integer} COLLIDE_ALL
* @protected
*/
Phaser.Tile.COLLIDE_ALL = 0x0f;

/*
* Mask for tileFlags facing top or bottom
* @constant
* @protected
*/
Phaser.Tile.FACE_TOP_BOTTOM = 0x80 | 0x40;

/*
* Mask for tileFlags facing left or right
* @constant
* @protected
*/
Phaser.Tile.FACE_LEFT_RIGHT = 0x20 | 0x10;

/*
* Mask for tileFlags facing any direction (top, bottom, left, right)
* @constant
* @protected
*/
Phaser.Tile.FACE_ALL = 0xf0;

/*
* Mask for tileFlags that has a tile/location-specific collision test.
* This does not consider tile-index collisions.
* @constant
* @protected
*/
Phaser.Tile.HAS_COLLISION_TEST = 0x1 << 8;

/*
* Mask for tileFlags that has a tile/location-specific collision test.
* This does not consider tile-index collisions.
* @constant
* @protected
*/
Phaser.Tile.DEBUG = 0x1 << 12;


Phaser.Tile.prototype = {

    /**
    * Check if the given render-relative coordinates fall within this tile.
    *
    * @method
    * @param {number} rx - The render-relative x coordinate component (in pixels).
    * @param {number} ry - The render-relative y coordinate component (in pixels).
    * @return {boolean} True if the coordinates are within this Tile, otherwise false.
    * @deprecated Use {@link Phaser.TileLayer#cellContainsCoordinate} directly.
    */
    containsPoint: function (rx, ry) {

        return this.layer.cellContainsCoordinate(this.x, this.y, rx, ry);

    },

    /**
    * Check for intersection with this tile.
    *
    * @method
    * @param {number} left - The render-relative x/left edge (in pixels).
    * @param {number} top - The render-relative y/top edge (in pixels).
    * @param {number} right - The render-relative right edge (in pixels).
    * @param {number} bottom - The render-relative bottom edge (in pixels).
    * @return {boolean} True if any point of the tile is within the region.
    * @deprecated Use {@link Phaser.TileLayer#cellIntersectsBounds} directly.
    */
    intersects: function (left, top, right, bottom) {

        return this.layer.cellIntersectsBounds(this.x, this.y, left, top, right, bottom);

    },

    /**
    * Will "expand" this object.
    * This is used to materialize additional members
    * @method
    * @private
    */
    _expand: function () {
        if (this._expanded)
        {
            return;
        }

        this._expanded = true;
        this._properties = undefined;
        this._indexProperties = undefined;
        this._roleProperties = undefined;
        this._collisionTest = undefined;
    },

    /**
    * Set a collision callback/test to be called when this tile is hit by an object.
    * The callback must return true for collision processing to take place.
    *
    * The cell information will not be updated until the tile is set/updated.
    *
    * @method
    * @param {function} callback - Callback function. If null the callback is removed.
    * @param {object} [context=null] - Callback will be called within this context.
    * @param {...object} [args=(none)] - Additional arguments to supply to the callback when it is invoked.
    */
    setCollisionTest: function (callback, context) {
        
        if (callback)
        {
            var collisionTest = [callback, context || null];
            for (var i = 2, len = arguments.length; i < len; i++) {
                collisionTest.push(arguments[i]);
            }

            this.setSharedCollisionTest(collisionTest);
        }
        else
        {
            this.setSharedCollisionTest(null);
        }

    },

    /**
    * This internal method allows a callback to be shared between many tiles - see {@link Phaser.Tile#setCollisionTest}.
    *
    * @method
    * @protected
    * @param {object[]} sharedCallback - The shared callback data; null if the callback is to be removed. This object must not be mutated after it is assigned and must be in the same format as generated within `setCollisionCallback`.
    */
    setSharedCollisionTest: function (collisionTest) {
        
        if (collisionTest)
        {
            this._expand();
            this.hasCollisionTest = true;
            this._collisionTest = collisionTest;
        }
        else
        {
            this.hasCollisionTest = false;
            if (this._expanded)
            {
                this._collisionTest = undefined;
            }
        }

    },

    /**
    * Reset internal state to that suitable of a non-existant cell.
    *
    * @method
    * @protected
    */
    resetToNonExistant: function () {

        this.tileIndex = -1;
        this.roleId = 0;
        this.tileFlags = 0;
        this.alpha = 1;

        if (this._expanded)
        {
            this._properties = undefined;
            this._indexProperties = undefined;
            this._roleProperties = undefined;
            this._collisionTest = undefined;
        }

    },

    /**
    * Clean up internal resources.
    *
    * @method
    */
    destroy: function () {

        this.layer = null;

    },

    /**
    * Sets the collision flags for each side of this tile. A tile will only collide with an object moving from the side the collision is specified from.
    *
    * The cell information will not be updated until the tile is set/updated.
    *
    * @method
    * @param {boolean} left - Indicating a collision with an object on the left.
    * @param {boolean} right - Indicating a collision with an object on the right.
    * @param {boolean} up - Indicating a collision with an object on the top.
    * @param {boolean} down - Indicating a collision with an object on the bottom.
    */
    setCollision: function (left, right, up, down) {

        var collisionFlags = 0;
        if (up) { collisionFlags |= (0x08 | 0x80); }
        if (down) { collisionFlags |= (0x04 | 0x40); }
        if (left) { collisionFlags |= (0x02 | 0x20); }
        if (right) { collisionFlags |= (0x01 | 0x10); }

        this.tileFlags &= ~(Phaser.Tile.COLLIDE_ALL | Phaser.Tile.FACE_ALL);
        this.tileFlags |= collisionFlags;

    },

    /**
    * Reset collision status flags.
    *
    * The cell information will not be updated until the tile is set/updated.
    *
    * @method
    */
    resetCollision: function () {

        this.tileFlags &= ~(Phaser.Tile.COLLIDE_ALL | Phaser.Tile.FACE_ALL);

    },

    /**
    * Is this tile interesting?
    *
    * @method
    * @param {boolean} collides - If true will check for collisions / collide values.
    * @param {boolean} faces - If true will check for interesting faces.
    * @return {boolean} True if the Tile is interesting, otherwise false.
    */
    isInteresting: function (collides, faces) {

        return (
            (collides && (this.tileFlags & Phaser.Tile.COLLIDE_ALL) !== 0) ||
            (faces && (this.tileFlags & Phaser.Tile.FACE_ALL) !== 0)
        );

    },

    /**
    * Calls the tile-specific collision handler, if any, for this cell.
    *
    * If there is no collision handler then "pass" is returned; otherwise returns the value of invoking the callback (which may be null).
    *
    * @method
    * @param {integer} x - The tile's x coordinate component.
    * @param {integer} y - The tile's y coordinate component.
    * @return The result of invoking the callback should it exist, else "pass".
    */
    doTileCollisionTest: function (collider) {

        var handler = this._collisionTest;

        if (!handler || this.tileIndex < 0)
        {
            return "pass";
        }

        if (handler.length <= 2)
        {
            //  Faster-path
            return handler[0].call(handler[1], collider, this);
        }
        else
        {
            var args = [collider, this];
            args.concat(handler.slice(2));

            return handler[0].apply(handler[1], args);
        }

    },

    /**
    * Perform a shallow-copy/clone.
    *
    * @method
    * @protected
    * @param {boolean} [disconnect=false] - If true then `properties` will be deep-copied.
    * @return {Phaser.Tile} The new/cloned tile.
    */
    clone: function (disconnect) {

        var tile = new Phaser.Tile(this.layer, -1, this.x, this.y);
        tile.copyFrom(this, disconnect);
        
        return tile;

    },

    /**
    * Perform a copy from the source tile data and properties to this tile.
    * This does *not* the target tiles `x` or `y` location.
    *
    * Peforms a deep copy of the Tile `properties` if such is set and the location of the source tile and destination tile differ or if `disconnect` is specified. This is designed primarily to work with potential location-moving actions such as "copy & paste".
    *
    * The cell information will not be updated until the tile is set/updated.
    *
    * @method
    * @param {Phaser.Tile} tile - The tile to copy from.
    * @param {boolean} [disconnect=false] - If true then `properties` will be deep-copied.
    */
    copyFrom: function (srcTile, disconnect) {

        this.tileIndex = srcTile.tileIndex;
        this.roleId = srcTile.roleId;

        this.alpha = srcTile.alpha;
        this.tileFlags = srcTile.tileFlags;

        if (srcTile._expanded)
        {
            this._expand();

            if (srcTile._properties &&
                (disconnect || this.x !== srcTile.x || this.y !== srcTile.y))
            {
                //  Deep-copy per-location propertiess if for a different location
                this._properties = Phaser.Utils.extend(true, {}, srcTile._properties);
            }
            else
            {
                this._properties = srcTile._properties;
            }

            //  Carry cached values
            this._indexProperties = srcTile._indexProperties;
            this._roleProperties = srcTile._roleProperties;

            this._collisionTest = srcTile._collisionTest;
        }

    }

};

//  These following properties are, when set, added as a group to the actual tile.
//  This reduces the object memory cost of these should-be-less-frequently
//  use properties. See `_expand`. (In V8 this saves ~40 bytes/object.)

/**
* Track expanded state
* @member {boolean}
* @private
*/
Phaser.Tile.prototype._expanded = false;

/**
* Cell/location properties
* @member {(object|undefined)}
* @private
*/
Phaser.Tile.prototype._properties = undefined;

/**
* Cached index properties
* @member {(object|null|undefined)}
* @private
*/
Phaser.Tile.prototype._indexProperties = undefined;

/**
* Cached role properties
* @member {(object|null|undefined)}
* @private
*/
Phaser.Tile.prototype._roleProperties = undefined;

/**
* Cached collision callback
* @member {(object|undefined)} - In the form of [callback, context, ...args]
* @private
*/
Phaser.Tile.prototype._collisionTest = undefined;

/**
* Alias for `copyFrom`.
*
* @method
* @deprecated Use `copyFrom`.
*/
Phaser.Tile.prototype.copy  = Phaser.Tile.prototype.copyFrom;

/**
* Alias for `setCollisionTest`.
*
* @method
* @deprecated Use `setCollisionTest`.
*/
Phaser.Tile.prototype.setCollisionCallback  = Phaser.Tile.prototype.setCollisionTest;

Phaser.Tile.prototype.constructor = Phaser.Tile;

/**
* The global index represeting a particular type of tile within the tilemap.
*
* If this property is assigned a different value then default rules for the tile index/type will be applied.
*
* A tile a negative index (ie. -1) "does not exist" and will not participate in collisions, cannot have a role, and will not be rendered. A tile with an index of 0 will not be displayed but can still participate in collisions.
*
* The TileLayer cell information is not guaranteed to be updated until the tile is set/updated.
*
* @member {integer} #index
* @memberof Phaser.Tile
*/
Object.defineProperty(Phaser.Tile.prototype, "index", {

    get: function () {
        return this.tileIndex;
    },

    set: function (index) {
        if (index < 0)
        {
            this.resetToNonExistant();
        }
        else if (index !== this.tileIndex)
        {
            this.tileIndex = index;
            if (this._expanded)
            {
                this._indexProperties = undefined;
            }
            this.layer.applyDefaultTileRules(this);
        }
    }

});

/**
* A role name can be given to one or more tiles. All cells/tiles with the same roleName share the same role properties. The primary purpose is to allow customization/disambiguation of particular cells within a layer or between layers.
*
* The TileLayer cell information is not guaranteed to be updated until the tile is set/updated.
*
* @member {(string|null)} #roleName
* @memberof Phaser.Tile
*/
Object.defineProperty(Phaser.Tile.prototype, "roleName", {

    get: function () {
        if (this.roleId > 0)
        {
            var role = this.layer._roles[this.roleId];
            return (role && role.roleName) || null;
        }
    },

    set: function (name) {

        var role = this.layer._rolesByName[name];
        
        if (role)
        {
            this.roleId = role.roleId;
        }
        else
        {
            this.roleId = 0;
            if (this._expanded)
            {
                this._roleProperties = undefined;
            }
        }
    }

});

/**
* Returns true if there is a tile-specific collision associated with this tile.
*
* @member {boolean} #hasCollisionTest
* @memberof Phaser.Tile
* @readonly
*/
Object.defineProperty(Phaser.Tile.prototype, "hasCollisionTest", {

    get: function () {
        return (this.tileFlags & Phaser.Tile.HAS_COLLISION_TEST) !== 0;
    },

    //  "private"
    set: function (value) {
        if (value) { this.tileFlags |= Phaser.Tile.HAS_COLLISION_TEST; }
        else { this.tileFlags &= ~Phaser.Tile.HAS_COLLISION_TEST; }
    }

});

/**
* True if this Tile has a role.
*
* @member {boolean} #hasRole
* @memberof Phaser.Tile
* @protected
* @readonly
*/
Object.defineProperty(Phaser.Tile.prototype, "hasRole", {

    get: function () {
        return this.roleId > 0;
    }

});

/**
* Tile-specific collision callback. Use setCollisionCallback to change. May be null.
*
* @member {(function|null)} #collisionCallback
* @memberof Phaser.Tile
* @protected
* @readonly
* @deprecated Use {@link Phaser.Tile#doTileCollisionTest} instead.
*/
Object.defineProperty(Phaser.Tile.prototype, "collisionCallback", {

    get: function () {
        if (!this._collisionTest)
        {
            return null;
        }

        return this._collisionTest[0] || null;
    }

});

/**
* The context in which the collision callback will be called. Use setCollisionCallback to change. May be null.
*
* @member {(object|null)} #collisionCallbackContext
* @memberof Phaser.Tile
* @protected
* @readonly
* @deprecated Use {@link Phaser.Tile#doTileCollisionTest} instead.
*/
Object.defineProperty(Phaser.Tile.prototype, "collisionCallbackContext", {

    get: function () {
        if (!this._collisionTest)
        {
            return null;
        }

        return this._collisionTest[1] || null;
    }

});

/**
* True if this tile has any "collide" flags set.
*
* @member {boolean} #collides
* @memberof Phaser.Tile
* @readonly
*/
Object.defineProperty(Phaser.Tile.prototype, "collides", {

    get: function () {
        return (this.tileFlags & 0x0f) !== 0;
    }

});

/**
* True if this tile can collide on any of its faces or has a collision test callback set.
*
* @member {boolean} #canCollide
* @memberof Phaser.Tile
* @readonly
*/
Object.defineProperty(Phaser.Tile.prototype, "canCollide", {

    get: function () {
        return (this.tileFlags & (0x0f | Phaser.Tile.HAS_COLLISION_TEST)) !== 0;
    }

});

/**
* Returns true if this Tile has cell/location properties.
*
* @member {boolean} #hasProperties
* @memberof Phaser.Tile
* @readonly
*/
Object.defineProperty(Phaser.Tile.prototype, "hasProperties", {

    get: function () {
        return !!this._properties;
    }

});

/**
* Custom properties for a *specific cell/location* within the Layer. This does *not* include per-index/type properties from Tiled data - see {@link Phaser.Tile#indexProperties}.
*
* Changing the returned object immediately affects the cell data - unless the `properties` have been explicltly disconnected by `copyFrom` or `clone`.
*
* Accessing this field creates new a properties object as required. Use `hasProperties` to check for existence of cell/location properties to avoid accidently creating new properties if not required.
*
* Custom types should *not* be added either directly or indirectly as some Tile operations may create a deep-clone of the `properties` object and custom types are not guaranteed to be correctly restored.
*
* @member {object} #properties
* @memberof Phaser.Tile
* @readonly
*/
Object.defineProperty(Phaser.Tile.prototype, "properties", {

    get: function () {
        if (this._properties === undefined)
        {
            this._expand();
            this._properties = {};
        }
        return this._properties;
    }

});

/**
* Additional properties for a *tile index/type*. Tile index/type properties are shared across the Layer or Tilemap depending on {@link Phaser.TileLayer#useLayerIndexProperties}.
*
* Changing the returned object immediately affects the shared tile index/type properties.
*
* Returns null if the index is invalid or refers to a non-existant tile.
*
* @member {(object|null)} #indexProperties
* @memberof Phaser.Tile
* @readonly
*/
Object.defineProperty(Phaser.Tile.prototype, "indexProperties", {

    get: function () {
        if (this._indexProperties === undefined)
        {
            this._expand();
            this._indexProperties = this.layer.getTileIndexProperties(this.tileIndex, true);
        }
        return this._indexProperties;
    }

});

/**
* Additional properties for a *tile role*. Role properties are shared for all tiles with a particular role within the given Layer. See @{link Phaser.TileLayer#createTileRole} and @{link Phaser.Tile#roleName}.
*
* Changing the returned object immediately affects the shared tile index/type properties.
*
* Returns null if the tile does not have an assigned role.
*
* @member {(object|null)} #roleProperties
* @memberof Phaser.Tile
* @readonly
*/
Object.defineProperty(Phaser.Tile.prototype, "roleProperties", {

    get: function () {
        if (this._roleProperties === undefined)
        {
            this._expand();
            this._roleProperties = this.layer.getRoleProperties(this.roleName, true);
        }
        return this._roleProperties;
    }

});

/**
* True if debugging is enabled for the tile; this normally means rendering is effected.
*
* @member {boolean} #debug
* @memberof Phaser.Tile
*/
Object.defineProperty(Phaser.Tile.prototype, "debug", {

    get: function () {
        return (this.tileFlags & Phaser.Tile.DEBUG) !== 0;
    },

    set: function (value) {
        if (value) { this.tileFlags |= Phaser.Tile.DEBUG; }
        else { this.tileFlags &= ~Phaser.Tile.DEBUG; }
    }

});

/**
* Render-relative left edge (in pixels).
*
* @member {integer} #left
* @memberof Phaser.Tile
* @readonly
*/
Object.defineProperty(Phaser.Tile.prototype, "left", {

    get: function () {
        return this.x * this.layer.tileWidth;
    }

});

/**
* Render-relative right edge (in pixels).
*
* @member {integer} #right
* @memberof Phaser.Tile
* @readonly
*/
Object.defineProperty(Phaser.Tile.prototype, "right", {

    get: function () {
        return (this.x + 1) * this.layer.tileWidth;
    }

});

/**
* Render-relative top edge (in pixels).
*
* @member {integer} #top
* @memberof Phaser.Tile
* @readonly
*/
Object.defineProperty(Phaser.Tile.prototype, "top", {

    get: function () {
        return this.y * this.layer.tileHeight;
    }

});

/**
* Render-relative bottom edge (in pixels).
*
* @member {integer} #bottom
* @memberof Phaser.Tile
* @readonly
*/
Object.defineProperty(Phaser.Tile.prototype, "bottom", {

    get: function () {
        return (this.y + 1) * this.layer.tileHeight;
    }

});

/**
* Width of the tile (in pixels).
*
* @member {integer} #width
* @memberof Phaser.Tile
* @readonly
*/
Object.defineProperty(Phaser.Tile.prototype, "width", {

    get: function () {
        return this.layer.tileWidth;
    }

});

/**
* Height of the tile (in pixels).
*
* @member {integer} #height
* @memberof Phaser.Tile
* @readonly
*/
Object.defineProperty(Phaser.Tile.prototype, "height", {

    get: function () {
        return this.layer.tileHeight;
    }

});

/**
* Render-relative x coordinate component (in pixels).
*
* @member {integer} #worldX
* @memberof Phaser.Tile
* @readonly
*/
Object.defineProperty(Phaser.Tile.prototype, "worldX", {

    get: function () {
        return this.x * this.layer.tileWidth;
    }

});

/**
* Render-relative y coordinate component (in pixels).
*
* @member {integer} #worldY
* @memberof Phaser.Tile
* @readonly
*/
Object.defineProperty(Phaser.Tile.prototype, "worldY", {

    get: function () {
        return this.y * this.layer.tileHeight;
    }

});

/**
* Half-width of the tile (in pixels).
*
* @member {integer} #centerX
* @memberof Phaser.Tile
* @protected
* @readonly
* @deprecated Only used by Ninja physics; should be local math.
*/
Object.defineProperty(Phaser.Tile.prototype, "centerX", {

    get: function () {
        return this.layer.tileWidth >>> 1;
    }

});

/**
* Half-height of the tile (in pixels).
*
* @member {integer} #centerY
* @memberof Phaser.Tile
* @protected
* @readonly
* @deprecated Only used by Ninja physics; should be local math.
*/
Object.defineProperty(Phaser.Tile.prototype, "centerY", {

    get: function () {
        return this.layer.tileHeight >>> 1;
    }

});

/**
* True if interesting for collisions.
*
* @member {boolean} #faceTop
* @memberof Phaser.Tile
*/
Object.defineProperty(Phaser.Tile.prototype, "faceTop", {

    get: function () {
        return (this.tileFlags & 0x80) !== 0;
    },

    set: function (value) {
        if (value) { this.tileFlags |= 0x80; } else { this.tileFlags &= ~0x80; }
    }

});

/**
* True if interesting for collisions.
*
* @member {boolean} #faceBottom
* @memberof Phaser.Tile
*/
Object.defineProperty(Phaser.Tile.prototype, "faceBottom", {

    get: function () {
        return (this.tileFlags & 0x40) !== 0;
    },

    set: function (value) {
        if (value) { this.tileFlags |= 0x40; } else { this.tileFlags &= ~0x40; }
    }

});

/**
* True if interesting for collisions.
*
* @member {boolean} #faceLeft
* @memberof Phaser.Tile
*/
Object.defineProperty(Phaser.Tile.prototype, "faceLeft", {

    get: function () {
        return (this.tileFlags & 0x20) !== 0;
    },

    set: function (value) {
        if (value) { this.tileFlags |= 0x20; } else { this.tileFlags &= ~0x20; }
    }

});

/**
* True if interesting for collisions.
*
* @member {boolean} #faceRight
* @memberof Phaser.Tile
*/
Object.defineProperty(Phaser.Tile.prototype, "faceRight", {

    get: function () {
        return (this.tileFlags & 0x10) !== 0;
    },

    set: function (value) {
        if (value) { this.tileFlags |= 0x10; } else { this.tileFlags &= ~0x10; }
    }

});

/**
* Indicating collide with any object on the top.
*
* @member {boolean} #collideUp
* @memberof Phaser.Tile
*/
Object.defineProperty(Phaser.Tile.prototype, "collideUp", {

    get: function () {
        return (this.tileFlags & 0x08) !== 0;
    },

    set: function (value) {
        if (value) { this.tileFlags |= 0x08; } else { this.tileFlags &= ~0x08; }
    }

});

/**
* Indicating collide with any object on the bottom.
*
* @member {boolean} #collideDown
* @memberof Phaser.Tile
*/
Object.defineProperty(Phaser.Tile.prototype, "collideDown", {

    get: function () {
        return (this.tileFlags & 0x04) !== 0;
    },

    set: function (value) {
        if (value) { this.tileFlags |= 0x04; } else { this.tileFlags &= ~0x04; }
    }

});

/**
* Indicating collide with any object on the left.
*
* @member {boolean} #collideLeft
* @memberof Phaser.Tile
*/
Object.defineProperty(Phaser.Tile.prototype, "collideLeft", {

    get: function () {
        return (this.tileFlags & 0x02) !== 0;
    },

    set: function (value) {
        if (value) { this.tileFlags |= 0x02; } else { this.tileFlags &= ~0x02; }
    }

});

/**
* Indicating collide with any object on the right.
*
* @member {boolean} #collideRight
* @memberof Phaser.Tile
*/
Object.defineProperty(Phaser.Tile.prototype, "collideRight", {

    get: function () {
        return (this.tileFlags & 0x01) !== 0;
    },

    set: function (value) {
        if (value) { this.tileFlags |= 0x01; } else { this.tileFlags &= ~0x01; }
    }

});
