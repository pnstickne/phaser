/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2014 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

/**
* A Tile is a representation of a single tile within the Tilemap.
*
* Tile objects represent a cell data (a single location) in a tile layer - BUT changes made to a specific Tile do NOT guaranteed automatically update the corresponding cell. The reliable manipulation/update of a Tile object can only be done through the cell/tile manipulation functions exposed by a Tilemap or TilemapLayer.
*
* Do not add permantent ad-hoc properties. If any properties are added to a Tile object they may not be associated with future tile access. Use the `indexProperties` and `roleProperties` collection to add per-classification information.
*
* Tile objects should not be referenced for extended periods of time: a Tile should be considered only valid for the function in which it was obtained and when used with functions/code within that scope. In some cases Tile objects may be cached/reused; these should be appropriate documented.
*
* Various functionality has been deprecated in favor of more direct interactions with the appropriate Tilemap/TileLayer.
*
* @class Phaser.Tile
* @constructor
* @param {Phaser.TileLayer} layer - The layer this tile is associated with. Deprecated.
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
    * The tile index/type.
    *
    * @property {integer}
    * @protected
    * @readonly
    * @see #index
    */
    //  Modified internally
    this.tileIndex = tileIndex;

    /**
    * The role ID; -1 indicates there is no role.
    *
    * @member {integer}
    * @protected
    * @readonly
    * @see #roleName
    */
    //  Modified internally
    this.roleId = -1;

    /**
    * The x map coordinate component of the Tile.
    *
    * @member {integer}
    * @readonly
    */
    this.x = x;

    /**
    * The y map coordinate component of the Tile,
    *
    * @member {integer}
    * @readonly
    */
    this.y = y;

    /**
    * Alpha value (in [0, 1]) at which this tile is drawn.
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
    // 0x08 - collide up
    // 0x04 - collide down
    // 0x02 - collide left
    // 0x01 - collide right
    // 0x80 - face up
    // 0x40 - face down
    // 0x20 - face left
    // 0x10 - face right
    // 0x100 - has location-specific callback
    this.tileFlags = 0;

    /**
    * Cached index properties
    * @member {(object|null|undefined)}
    * @private
    */
    this._indexProperties = undefined;

    /**
    * Cached role properties
    * @member {(object|null|undefined)} 
    * @private
    */
    this._roleProperties = undefined;

    /**
    * Cached collision callback
    * @member {(object|null)}
    * @private
    */
    // In the form [callback, context, ...args]
    this._collisionTest = null;

};

/*
* tileFlag Mask for colliding on all faces.
*
* @memberof Phaser.Tile
* @constant {integer} COLLIDES_ALL
* @protected
*/
Phaser.Tile.COLLIDES_ALL = 0x0f;

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
Phaser.Tile.FACE_ANY = Phaser.Tile.FACE_TOP_BOTTOM | Phaser.Tile.FACE_LEFT_RIGHT;

/*
* Mask for tileFlags that has a tile-sppcific collision test.
* @constant
* @protected
*/
Phaser.Tile.HAS_COLLISION_TEST = 0x100;

/*
* Mask for tileFlags - if the tile has a roleName assigned
* @constant
* @protected
*/
Phaser.Tile.HAS_ROLE = 0x200;


Phaser.Tile.prototype = {

    /**
    * Check if the given render-relative coordinates fall within this tile.
    *
    * @param {number} rx - The render-relative x coordinate component (in pixels).
    * @param {number} ry - The render-relative y coordinate component (in pixels).
    * @return {boolean} True if the coordinates are within this Tile, otherwise false.
    * @deprecated Use Phaser.TileLayer support directly.
    */
    containsPoint: function (rx, ry) {

        return this.layer.cellContainsPoint(this.x, this.y, rx, ry);

    },

    /**
    * Check for intersection with this tile.
    *
    * @param {number} left - The render-relative x/left edge (in pixels).
    * @param {number} top - The render-relative y/top edge (in pixels).
    * @param {number} right - The render-relative right edge (in pixels).
    * @param {number} bottom - The render-relative bottom edge (in pixels).
    * @return {boolean} True if any point of the tile is within the region.
    * @deprecated Use Phaser.TileLayer support directly.
    */
    intersects: function (left, top, right, bottom) {

        return this.layer.cellIntersectsBounds(this.x, this.y, left, top, right, bottom);

    },

    /**
    * Set a callback to be called when this tile is hit by an object.
    * The callback must return true for collision processing to take place.
    *
    * The cell information will not be updated until the tile is set/updated.
    *
    * @param {function} callback - Callback function. If null the callback is removed.
    * @param {object} context - Callback will be called within this context.
    * @param {...object} args - Additional arguments to pass.
    */
    setCollisionCallback: function (callback, context) {
        
        if (callback)
        {
            var args = [callback, context];
            for (var i = 0, len = arguments.length; i < len; i++) {
                args.push(arguments[i]);
            }

            this.hasCollisionTest = true;
            this._collisionTest = args;
        }
        else
        {
            this.hasCollisionTest = false;
            this._collisionTest = null;
        }

    },

    /**
    * Reset internal state to that suitable of a non-existant cell.
    *
    * @protected
    */
    resetToNonExistant: function () {

        this.tileIndex = -1;
        this.roleId = -1;
        this.tileFlags = 0;
        this.alpha = 1;
        this._indexProperties = undefined;
        this._roleProperties = undefined;
        this._collisionTest = undefined;

    },

    /**
    * Clean up memory.
    *
    * @deprecated This serves no useful role in context.
    */
    destroy: function () {

        this.layer = null;

    },

    /**
    * Sets the collision flags for each side of this tile and updates the interesting faces list.
    *
    * The cell information will not be updated until the tile is set/updated.
    *
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

        this.tileFlags &= ~0xFF;
        this.tileFlags |= collisionFlags;

    },

    /**
    * Reset collision status flags.
    *
    * The cell information will not be updated until the tile is set/updated.
    */
    resetCollision: function () {

        this.tileFlags &= ~0xFF;

    },

    /**
    * Is this tile interesting?
    *
    * @param {boolean} collides - If true will check for collisions / collide values.
    * @param {boolean} faces - If true will check for interesting faces.
    * @return {boolean} True if the Tile is interesting, otherwise false.
    */
    isInteresting: function (collides, faces) {

        return (
            (collides && (this.tileFlags & 0x0F) !== 0) ||
            (faces && (this.tileFlags & 0xF0) !== 0)
        );

    },

    /**
    * Calls the tile-specific collision handler, if any, for this cell.
    *
    * If there is no collision handler then "pass" is returned; otherwise returns the value of invoking the callback (which may be null).
    *
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
    * Perform a shallow-copy from the source tile data and properties to this tile.
    *
    * The cell information will not be updated until the tile is set/updated.
    *
    * @param {Phaser.Tile} tile - The tile to copy from.
    */
    copyFrom: function (srcTile) {

        this.tileIndex = srcTile.tileIndex;
        this.roleId = srcTile.roleId;

        this.alpha = srcTile.alpha;
        this.tileFlags = srcTile.tileFlags;

        this._collisionTest = srcTile._collisionTest;

        //  Carry cached values
        this._indexProperties = srcTile._indexProperties;
        this._roleProperties = srcTile._roleProperties;

    }

};

/**
* Alias for `copyFrom`.
*
* @method Phaser.Tile#copy
* @deprecated Use `copyFrom`.
*/
Phaser.Tile.prototype.copy  = Phaser.Tile.prototype.copyFrom;

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
* @memberof Phaser.Tile
* @member {integer} #index
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
            this._indexProperties = undefined;
            this.tileIndex = index;
            this.layer.applyDefaultTileRules(this);
        }
    }

});

/**
* A role name can be given to one or more tiles. All cells/tiles with the same roleName share the same role properties. The primary purpose is to allow customization/disambiguation of particular cells within a layer or between layers.
*
* The TileLayer cell information is not guaranteed to be updated until the tile is set/updated.
*
* @memberof Phaser.Tile
* @member {(string|null)} #roleName
*/
Object.defineProperty(Phaser.Tile.prototype, "roleName", {

    get: function () {
        if (this.roleId >= 0)
        {
            var role = this.layer._roles[this.roleId];
            return (role && role.roleName) || null;
        }
    },

    set: function (name) {

        var role = this.layer._rolesByName[name];
        
        if (role)
        {
            this.hasRole = true;
            this.roleId = role.roleId;
            this._roleProperties = role.properties;
        }
        else
        {
            this.hasRole = false;
            this.roleId = -1;
            this._roleProperties = undefined;
        }
    }

});

/**
* Returns true if there is a tile-specific collision associated with this tile.
*
* @memberof Phaser.Tile
* @member {boolean} #hasCollisionTest
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
* @memberof Phaser.Tile
* @member {boolean} #hasRole
* @protected
* @readonly
*/
Object.defineProperty(Phaser.Tile.prototype, "hasRole", {

    get: function () {
        return (this.tileFlags & Phaser.Tile.HAS_ROLE) !== 0;
    },

    //  "private"
    set: function (value) {
        if (value) { this.tileFlags |= Phaser.Tile.HAS_ROLE; }
        else { this.tileFlags &= ~Phaser.Tile.HAS_ROLE; }
    }

});

this.tileFlags |= Phaser.Tile.HAS_ROLE;

/**
* Tile-specific collision callback. Use setCollisionCallback to change. May be null.
#
* @memberof Phaser.Tile
* @member {(function|null)} #collisionCallback
* @protected
* @readonly
* @deprecated See Phaser.Tile#doTileCollisionTest
*/
Object.defineProperty(Phaser.Tile.prototype, "collisionCallback", {

    get: function () {
        if ((this.tileFlags & Phaser.Tile.HAS_COLLISION_TEST) === 0)
        {
            return null;
        }

        var handler = this._collisionTest;
        return handler[0] || null;
    }

});

/**
* The context in which the collision callback will be called. Use setCollisionCallback to change. May be null.
*
* @memberof Phaser.Tile
* @member {(object|null)} #collisionCallbackContext
* @protected
* @readonly
* @deprecated See Phaser.Tile.doTileCollisionTest
*/
Object.defineProperty(Phaser.Tile.prototype, "collisionCallbackContext", {

    get: function () {
        if ((this.tileFlags & Phaser.Tile.HAS_COLLISION_TEST) === 0)
        {
            return null;
        }

        var handler = this._collisionTest;
        return handler[1] || null;
    }

});

/**
* True if this tile can collide on any of its faces.
*
* @memberof Phaser.Tile
* @member {boolean} #collides
* @readonly
*/
Object.defineProperty(Phaser.Tile.prototype, "collides", {

    get: function () {
        return (this.tileFlags & 0x0F) !== 0;
    }

});

/**
* True if this tile can collide on any of its faces or has a collision test callback set.
*
* @memberof Phaser.Tile
* @member {boolean} #canCollide
* @readonly
*/
Object.defineProperty(Phaser.Tile.prototype, "canCollide", {

    get: function () {
        return (this.tileFlags & (0x0F | Phaser.Tile.HAS_COLLISION_TEST)) !== 0;
    }

});

/**
* Like indexProperties; but creates new properties as required instead of returning null.
*
* @memberof Phaser.Tile
* @member {object} #properties
* @protected
* @readonly
* @deprecated Care should be used when accessing this property as it may accidently create new objects. See {@link Phaser.Tile#indexProperties indexProperties} as an alternative.
*/
Object.defineProperty(Phaser.Tile.prototype, "properties", {

    get: function () {
        if (this._indexProperties === undefined)
        {
            this._indexProperties = this.layer.tilemap.gettileIndexProperties(this.tileIndex, true);
        }
        return this._indexProperties;
    }

});

/**
* Additional properties for a tile index/type; returns null if there are no properties associated with the given index. Tile index/type properties are shared across the entire tilemap.
*
* Modifying the returned object (if not null) modifies all shared index properties.
*
* @memberof Phaser.Tile
* @member {(object|null)} #indexProperties
* @public
* @readonly
*/
Object.defineProperty(Phaser.Tile.prototype, "indexProperties", {

    get: function () {
        if (this._indexProperties === undefined)
        {
            this._indexProperties = this.layer.tilemap.gettileIndexProperties(this.tileIndex, false);
        }
        return this._indexProperties;
    }

});

/**
* Additional properties for a named role; returns null if there are no properties associated with the given role name for this layer. See @{Link TileLayer.addRole}.
*
* Modifying the returned object (if not null) modifies all shared role properties.
*
* @memberof Phaser.Tile
* @member {(object|null)} #roleProperties
* @readonly
*/
Object.defineProperty(Phaser.Tile.prototype, "roleProperties", {

    get: function () {
        if (this._roleProperties === undefined)
        {
            this._roleProperties = this.layer.getRoleProperties(this.roleName);
        }
        return this._roleProperties;
    }

});

/**
* The world x value of the left (in pixels).
*
* @memberof Phaser.Tile
* @member {integer} #left
* @readonly
* @deprecated Should use Tilemap/layer information when doing calculation. Also, just use `worldX` if required.
*/
Object.defineProperty(Phaser.Tile.prototype, "left", {

    get: function () {
        return this.worldX;
    }

});

/**
* The world x value of the right (in pixels).
*
* @memberof Phaser.Tile
* @member {integer} #right
* @readonly
* @deprecated Should use Tilemap/layer information when doing calculation.
*/
Object.defineProperty(Phaser.Tile.prototype, "right", {

    get: function () {
        return this.worldX + this.width;
    }

});

/**
* The world y value of the top (in pixels).
*
* @memberof Phaser.Tile
* @member {integer} #top
* @readonly
* @deprecated Should use Tilemap/layer information when doing calculation. Also, just use `worldY` if required.
*/
Object.defineProperty(Phaser.Tile.prototype, "top", {

    get: function () {
        return this.worldY;
    }

});

/**
* The world y value of the bottom (in pixels).
*
* @memberof Phaser.Tile
* @member {integer} #bottom
* @readonly
* @deprecated Should use Tilemap/layer information when doing calculation.
*/
Object.defineProperty(Phaser.Tile.prototype, "bottom", {

    get: function () {
        return this.worldY + this.height;
    }

});

/**
* Width of the tile (in pixels).
*
* @memberof Phaser.Tile
* @member {integer} #width
* @readonly
* @deprecated Should use Tilemap/layer information when doing calculation.
*/
Object.defineProperty(Phaser.Tile.prototype, "width", {

    get: function () {
        return this.layer.tileWidth;
    }

});

/**
* Height of the tile (in pixels).
*
* @memberof Phaser.Tile
* @member {integer} #height
* @readonly
* @deprecated Should use Tilemap/layer information when doing calculation.
*/
Object.defineProperty(Phaser.Tile.prototype, "heigth", {

    get: function () {
        return this.layer.tileHeight;
    }

});

/**
* Render-relative x coordinate component (in pixels).
*
* @memberof Phaser.Tile
* @member {integer} #worldX
* @readonly
* @deprecated Should use Tilemap/layer information when doing calculation.
*/
Object.defineProperty(Phaser.Tile.prototype, "worldX", {

    get: function () {
        return (this.x * this.layer.tileWidth) | 0;
    }

});

/**
* Render-relative y coordinate component (in pixels).
*
* @memberof Phaser.Tile
* @member {integer} #worldY
* @readonly
* @deprecated Should use Tilemap/layer information when doing calculation.
*/
Object.defineProperty(Phaser.Tile.prototype, "worldY", {

    get: function () {
        return (this.y * this.layer.tileHeight) | 0;
    }

});

/**
* Half-width of the tile (in pixels).
*
* @memberof Phaser.Tile
* @member {integer} #centerX
* @protected
* @readonly
* @deprecated Should use Tilemap/layer information when doing calculation.
*/
Object.defineProperty(Phaser.Tile.prototype, "centerX", {

    get: function () {
        return this.layer.tileWidth >>> 1;
    }

});

/**
* Half-height of the tile (in pixels).
*
* @memberof Phaser.Tile
* @member {integer} #centerY
* @protected
* @readonly
* @deprecated Should use Tilemap/layer information when doing calculation.
*/
Object.defineProperty(Phaser.Tile.prototype, "centerY", {

    get: function () {
        return this.layer.tileHeight >>> 1;
    }

});

/**
* True if interesting for collisions.
*
* @memberof Phaser.Tile
* @member {boolean} #faceTop
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
* @memberof Phaser.Tile
* @member {boolean} #faceBottom
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
* @memberof Phaser.Tile
* @member {boolean} #faceLeft
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
* @memberof Phaser.Tile
* @member {boolean} #faceRight
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
* @memberof Phaser.Tile
* @member {boolean} #collideUp
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
* @memberof Phaser.Tile
* @member {boolean} #collideDown
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
* @memberof Phaser.Tile
* @member {boolean} #collideLeft
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
* @memberof Phaser.Tile
* @member {boolean} #collideRight
*/
Object.defineProperty(Phaser.Tile.prototype, "collideRight", {

    get: function () {
        return (this.tileFlags & 0x01) !== 0;
    },

    set: function (value) {
        if (value) { this.tileFlags |= 0x01; } else { this.tileFlags &= ~0x01; }
    }

});
