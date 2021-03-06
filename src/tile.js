function tile(tileLayerData, x, y, map)
{
	this.layerData = tileLayerData;
	this.map = map;
	this.x = x;
	this.y = y;

	var tileData = this.indexToTypeDictionary[tileLayerData.index.toString()];


	if(tileData === undefined)
	{
		this.type = this.REGULAR;
		this.solid = true;
	}
	else
	{
		this.type = tileData[0];
		this.solid = tileData[1];
	}
}

tile.prototype.solid = true;
tile.prototype.type = 200;

//Tile type constants
tile.prototype.WINZONE = 2;
tile.prototype.AIR = 0;
tile.prototype.REGULAR = 1;
tile.prototype.BREAKABLE = 3;


tile.prototype.indexToTypeDictionary = {
	"-1": [tile.prototype.AIR, false], 
	"2": [tile.prototype.WINZONE, false], 
	"13": [tile.prototype.BREAKABLE, true]
};

tile.prototype.indexFromType = function(type)
{
	for(var key in this.indexToTypeDictionary)
	{
		var array = this.indexToTypeDictionary[key];
		if(array[0] == type)
		{
			return parseInt(key);
		}
	}

	return -1;
}

tile.prototype.onLanding = function(character, velocity)
{
};

tile.prototype.onLeave = function(character, velocity)
{
	switch(this.type)
	{
		case this.BREAKABLE:
		//Break tile
		this.changeType(this.AIR);
		break;
	}
};

tile.prototype.changeType = function(type)
{
	this.type = type;
	var newIndex = this.indexFromType(this.type)
	this.solid = this.indexToTypeDictionary[newIndex.toString()][1];
	this.map.replace(this.layerData.index, newIndex, this.x, this.y, 1, 1, "tilemap");
}
