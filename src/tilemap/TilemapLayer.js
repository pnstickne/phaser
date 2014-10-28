/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2014 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

/**
* TilemapLayer is an obsolete alias to TilemapCanvasRenderer.
*
* @class Phaser.TilemapCanvasRenderer
* @extends {Phaser.Image}
* @constructor
* @param {Phaser.Game} game - Game reference to the currently running game.
* @param {Phaser.Tilemap} tilemap - The tilemap to which this layer belongs.
* @param {number} index - The layer index within the map that this TilemapLayer represents.
* @param {number} width - Width of the renderable area of the layer.
* @param {number} height - Height of the renderable area of the layer.
* @obsolete See {@link Phaser.TilemapCanvasRenderer}
*/
Phaser.TilemapLayer = Phaser.TilemapCanvasRenderer;
