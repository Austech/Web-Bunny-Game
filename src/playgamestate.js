function playGameState(game, level)
{
	gameState.call(this, game);
	this.level = level;
}

playGameState.prototype = Object.create(gameState.prototype);

playGameState.prototype.ST_PLAY = 0;
playGameState.prototype.ST_PAUSE = 1;
playGameState.prototype.ST_WON = 2;
playGameState.prototype.ST_LOSS = 3;
playGameState.prototype.ST_CHANGINGSTATE = 4;

//UI Renderables
playGameState.prototype.stageClearFade = null;
playGameState.prototype.stageClearText = null;
playGameState.prototype.stageClearPressEnterText = null;
playGameState.prototype.stageEnterNameText = null;
playGameState.prototype.stageEnterLevelText = null;
playGameState.prototype.stageUIOffset = {x: 0, y: 0, alpha: 1};
playGameState.prototype.stageUITween = null;

playGameState.prototype.moves = 0;

playGameState.prototype.levelId = 0;
playGameState.prototype.worldId = 0;
playGameState.prototype.levelName = "N/A";
playGameState.prototype.levelType = "normal";
playGameState.prototype.maxMoves = -1;
playGameState.prototype.silverStandard = -1;
playGameState.prototype.goldStandard = -1;

playGameState.prototype.init = function()
{
  //setup game
	this.stageUIOffset = {x: 0, y: 0, alpha: 1};
  this.cursors = game.input.keyboard.createCursorKeys();

	this.doubleJumpKey = game.input.keyboard.addKey(Phaser.Keyboard.SHIFT);
	this.enterKey = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
	this.pauseKey = game.input.keyboard.addKey(Phaser.Keyboard.ESC);

  this.game.world.setBounds(0,0,800,800);
  this.game.stage.backgroundColor = "#000000";

	this.state = this.ST_PLAY;
	this.moves = 0;

  this.setMap(this.level.mapKey)
	this.player = this.addEntity(new character(this.tilemap));
	this.game.camera.follow(this.player.gameObject);

	this.deathEmitter = this.game.add.emitter(0,0, 100);
	this.deathEmitter.makeParticles("lockedlevel");
	this.deathEmitter.setAlpha(1, 0, 5000);
	this.deathEmitter.setScale(.3, 0, .3, 0, 5000);

	this.showLevelEnterUI();
}

playGameState.prototype.update = function()
{
	gameState.prototype.update.call(this);
	//Check if player is in winzone and won

	var currentTile = this.tilemap.getTile(this.player.tilePos.x, this.player.tilePos.y);
	if(currentTile)
	{
		if(currentTile.tile.type == 2) //is this a winzone tile
		{
			this.winGame();
		}
	}

	//Input for player
	if(this.state == this.ST_PLAY)
	{
		if(this.cursors.left.isDown)
		{
			if(this.doubleJumpKey.isDown)
			{
				if(this.player.move(new point(-2, 0))) this.moves++;
			}
			else
			{
				if(this.player.move(new point(-1, 0))) this.moves++;
			}
		}
		else if(this.cursors.right.isDown)
		{
			if(this.doubleJumpKey.isDown)
			{
				if(this.player.move(new point(2, 0))) this.moves++;
			}
			else
			{
				if(this.player.move(new point(1, 0))) this.moves++;
			}
		}

		if(this.pauseKey.isDown)
		{
			addGameState(new pauseState(this.game, "Paused", this.level, false));
		}

		if(this.player.dead)
		{
			addGameState(new pauseState(this.game, "Aw too bad!", this.level, true));
			if(this.player.gameObject.alive)
			{
				this.deathEmitter.x = this.player.gameObject.x + this.player.gameObject.width / 2;
				this.deathEmitter.y = this.player.gameObject.y + this.player.gameObject.height / 2;;
				this.deathEmitter.start(true, 5000, null, 10);
				this.player.gameObject.kill();
			}
		}
	}
	else if(this.state == this.ST_WON)
	{
		if(this.enterKey.isDown)
		{
			this.state = this.ST_CHANGINGSTATE;
			//Change to level select state
			clearGameStates();
			addGameState(new levelSelectState(this.game));
			//Unlock levels
			unlockedLevels.push.apply(unlockedLevels, this.level.unlocks);
			saveGame();
		}
	}
}

playGameState.prototype.winGame = function()
{
	if(this.state == this.ST_WON || this.state == this.ST_CHANGINGSTATE)
		return false;	//Game has already been won

	this.state = this.ST_WON;

	if(this.stageClearFade == null)
	{
		this.stageClearFade = game.add.graphics(0,0);
		this.stageClearFade.beginFill(0x000000);
		this.stageClearFade.lineStyle(10, 0x000000, 1);
		this.stageClearFade.drawRect(this.game.camera.x, this.game.camera.y, this.game.width, this.game.height);
		this.stageClearFade.alpha = 0;
	}

	if(this.stageClearText == null)
	{
		this.stageClearText = this.game.add.text(this.game.camera.x + this.game.width / 2, this.game.camera.y + 10, "STAGE CLEAR", {align: "center", fill:"#FFFFFF" } );
		this.stageClearText.anchor.setTo(.5, 0);
		this.stageClearText.alpha = 0;
	}

	if(this.stageUITween != null)
		this.stageUITween._lastChild.stop();	//On the offchance the beginning "Show level" tween is running, stop it

	this.stageUIOffset.alpha = 0;
	this.stageUIOffset.x = 0;
	this.stageUIOffset.y = 100;

	this.game.world.bringToTop(this.stageEnterNameText);
	this.game.world.bringToTop(this.stageEnterLevelText);


	this.game.add.tween(this.stageClearFade).to( {alpha: 1}, 1000).start();
	this.game.add.tween(this.stageClearText).to( {alpha: 1}, 1000).to({alpha: 1}, 1000).start();
	var tween = this.game.add.tween(this.stageUIOffset).to( {alpha: 1}, 1000).to({alpha: 1}, 1000);
	tween._lastChild.onComplete.add(function()
	{
		if(this.stageClearPressEnterText == null)
		{
			this.stageClearPressEnterText = this.game.add.text(this.game.camera.x + this.game.width / 2, this.game.camera.y + 500, "PRESS ENTER TO CONTINUE", {align: "center", fill:"#FFFFFF" } );
			this.stageClearPressEnterText.anchor.setTo(.5, 0);
		}
	}, this);
	tween.start();

	this.startRewardTimer = this.game.time.events.add(Phaser.Timer.SECOND * 1, function()
	{
		this.moveCounterTitle = this.game.add.text(this.game.width / 2, 220, "Moves", {fill: "#FFFFFF" } );
		this.moveCounterTitle.fixedToCamera = true;
		this.moveCounterTitle.anchor.set(.5,.5);

		this.moveCounterText = this.game.add.text(this.game.width / 2, 250, "0", {fill: "#FFFFFF" } );
		this.moveCounterText.fixedToCamera = true;
		this.moveCounterText.anchor.set(.5,.5);
		this.rewardTimer = this.game.time.events.repeat(150 / (this.moves/10), this.moves, function()
		{
			this.moveCounterText.text = parseInt(this.moveCounterText.text) + 1;
			if(parseInt(this.moveCounterText.text) >= this.moves)
			{
				console.log(this.level);
				if(this.moves <= this.level.gold)
				{
					this.rewardSprite = this.game.add.sprite(this.game.width / 2, 300, "gold");
				}
				else if(this.moves <= this.level.silver)
				{
					this.rewardSprite = this.game.add.sprite(this.game.width / 2, 300, "silver");
				}
				else
				{
					this.rewardSprite = this.game.add.sprite(this.game.width / 2, 300, "bronze");
				}

				this.rewardSprite.fixedToCamera = true;
				this.rewardSprite.anchor.set(.5, 0);
				this.rewardSprite.scale.set(.5,.5);
			}
		}, this);
	}, this);
}

playGameState.prototype.render = function()
{
	if(this.stageClearText)
	{
		this.stageClearText.x = this.game.camera.x + 400;
		this.stageClearText.y = this.game.camera.y + 10;
	}
	if(this.stageEnterNameText)
	{
		this.stageEnterNameText.x = (this.game.camera.x + this.game.width / 2) + this.stageUIOffset.x;
		this.stageEnterNameText.y = this.game.camera.y + this.stageUIOffset.y;
		this.stageEnterNameText.alpha = this.stageUIOffset.alpha;
		
		if(this.stageEnterLevelText)
		{
			this.stageEnterLevelText.x = this.stageEnterNameText.x;
			this.stageEnterLevelText.y = this.stageEnterNameText.y + 30;
			this.stageEnterLevelText.alpha = this.stageUIOffset.alpha;
		}
	}
}

playGameState.prototype.setMap = function(name)
{
  this.map = this.game.add.tilemap(name);
  this.map.addTilesetImage("tiles_spritesheet", "tiles");

	for(var i = 0; i < this.map.layers.length; i++)
	{
		this.map.createLayer(this.map.layers[i].name);
	}

	this.tilemap = new tilemap(this.map);

  this.game.stage.backgroundColor = this.map.properties.backgroundColor;
	this.maxMoves = parseInt(this.map.properties.maxMoves);
	this.silverStandard = parseInt(this.map.properties.silver);
	this.goldStandard = parseInt(this.map.properties.gold);
}

//Call this to display level enter text
playGameState.prototype.showLevelEnterUI = function()
{
	this.stageUIOffset.y = -100;
	this.stageUIOffset.alpha = 0;

	this.stageEnterNameText = this.game.add.text(this.game.camera.x + this.game.width / 2, this.game.camera.y - 100, this.level.name, {align: "center", fill:"#FFFFFF" } );
	this.stageEnterNameText.anchor.setTo(0.5, 0);

	this.stageEnterLevelText = this.game.add.text(this.game.camera.x + this.game.width / 2, this.game.camera.y - 100, this.level.mapKey, {align: "center", fill:"#FFFFFF" } );
	this.stageEnterLevelText.anchor.setTo(0.5, 0);

	this.stageUITween = this.game.add.tween(this.stageUIOffset).to( {y: 10, alpha: 1}, 1000, Phaser.Easing.Circular.InOut, true)
	.to( {y: 10}, 1000, Phaser.Easing.Circular.InOut, true)
	.to( {x: -1000, alpha: 0}, 1000, Phaser.Easing.Circular.InOut, true); 
}

playGameState.prototype.close = function()
{
	gameState.prototype.close.call(this);

	this.game.world.removeAll();
	this.game.tweens.removeAll();

	if(this.startRewardTimer)
		this.game.time.events.remove(this.startRewardTimer);

	if(this.rewardTimer)
		this.game.time.events.remove(this.rewardTimer);
}
