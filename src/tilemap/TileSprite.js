/**
 * Tile Sprite designed to be used with TilemapSpriteRenderer.
 *
 * @class Tile
 * @extends Phaser.Sprite
 * @constructor
 */
Phaser.TileSprite = function (game) {
    Phaser.Sprite.call(this, game, 0, 0, null);

    this.type = Phaser.TILESPRITE;
};

Phaser.TileSprite.prototype = Object.create(Phaser.Sprite.prototype);
Phaser.TileSprite.prototype.constructor = Phaser.TileSprite;

/**
* Update the sprite from tile data.
* @param {?Phaser.Tile} tile - The tile to update from; can be null.
*/
Phaser.TileSprite.prototype.updateFromTile = function (tile) {

    if (!tile)
    {
        this.visible = false;
        return;
    }

    //  Ideally these would be moved out to caller, or at least the texture fetch.
    var layer = tile.layer;
    var tilemap = layer.tilemap;

    var tileId = tile.index;
    var tileset = tilemap.getTileset(tileId);
    var texture = tileset.getTileTexture(tileId);

    this.visible = true;
    this.position.x = tile.x * layer.tileWidth;
    this.position.y = tile.y * layer.tileHeight;
    // Width/Height should come from frame .. in theory.
    this.setTexture(texture);

};
