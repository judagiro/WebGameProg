import {Images} from '../../assets'
import Player from '../../components/Player/Player'
import GameAdapter from '../../globals/GameAdapter'
import GameManager from '../../globals/GameManager'
import getLevelOneEnemyWave from '../enemyWaves/levelOneWaves'
import EnemyFactory from '../../components/Enemy/EnemyFactory'
import PowerUpFactory from '../../components/PowerUp/PowerUpFactory'
import { triggerId } from 'async_hooks';

import {randomYPos, randomXPos} from '../../utils/gamehelpers'
import { Sprite } from 'phaser-ce';

export default class LevelTwo extends Phaser.State {
  readonly BROKEN_CNT = 60
  readonly FEEDS_CNT = 75
  readonly TIME_LMT = 90
  private intervalFunc = null
  private gameResult = 'ready'//'success', 'failed'
  
  readonly WAVE_DELAY: number = 750
  private player: Player
  private enemiesGroup: Phaser.Group
  private gameAdapter: GameAdapter
  private timer: Phaser.Timer
  private bgBack: any
  private bgMid: any
  private bgFront: Phaser.TileSprite =  null
  private farTilesSpeed: number = 0.1
  private midTilesSpeed: number = 1
  private frontTilesSpeed: number = 3
  private enemyFactory: EnemyFactory
  private powerUpFactory: PowerUpFactory
  private willUpdateWave: boolean
  private restartKey: Phaser.Key
  private currentWaveNumber: number

  private tileBoards: Phaser.Sprite[] = []
  private imgTile: any =[ Images.ImageIsland1, Images.ImageIsland2, Images.ImageIsland3 ]
  private countTick: number = 0

  private feeds: Phaser.Sprite[] = []
  private feed: Phaser.Sprite

  private brokens: Phaser.Sprite[] = []
  private broken: Phaser.Sprite
  private countBroken: number = 0

  private eatFeed: number = 0
  public counterTime: Phaser.Text
 
  constructor() {
    super()
    this.gameAdapter = new GameAdapter()
    GameManager.Instance.currentLevelNum = 2
  }
  /////////////////Put broken feed//////
  private checkPossiblePos(){
    for(var i =0; i<3; i++){ 
      this.game.physics.arcade.overlap(this.broken, this.tileBoards[i],() =>{

        this.broken.position.y = this.game.height/7 
        this.broken.scale.x = -1       
      })
    }
    this.game.physics.arcade.overlap(this.broken, this.bgFront,() =>{
       this.broken.position.y = this.game.height/6  
      //this.feed.scale.y = -1      
    })
    for(var i =0; i < this.FEEDS_CNT ; i++){ 
      this.game.physics.arcade.overlap(this.broken, this.feeds[i],() =>{        
        this.broken.position.x = this.game.width/3 
        this.broken.scale.x = -1       
      })
    }

  }
  private createBroken(){
    for(var i =0; i<this.BROKEN_CNT; i++){   
      this.broken =  this.game.add.sprite(randomXPos(this.game.width), 80, Images.ImageBroken.getName())
      
      this.game.physics.arcade.enable(this.broken)
      this.broken.body.collideWorldBounds = true      

      this.broken.body.allowGravity = false
      this.broken.body.gravity.y = 50
      if(i % 2){
        this.broken.scale.y = -1
      }
      this.brokens[i] = this.broken      
    }
  }
  ///////////////////////////// Putting Feed ////////////////// 
  private checkHardPosition(){
    for(var i =0; i<3; i++){ 
      this.game.physics.arcade.overlap(this.feed, this.tileBoards[i],() =>{
        
        this.feed.position.y = this.game.height/7 
        this.feed.scale.x = -1       
      })
    }
    this.game.physics.arcade.overlap(this.feed, this.bgFront,() =>{
      //console.log('Floor--2')      
      this.feed.position.y = this.game.height/6  
      //this.feed.scale.y = -1      
    })   
  }
  private createFeeds(): void {
    for(var i =0; i<this.FEEDS_CNT; i++){   
      this.feed =  this.game.add.sprite(randomXPos(this.game.width), randomYPos(this.game.height), Images.ImageBanana.getName())
      this.game.physics.arcade.enable(this.feed)
      this.feed.body.collideWorldBounds = true      
      this.feed.body.immovable = true      
      this.checkHardPosition()
      this.feed.body.allowGravity = false
      if(i % 3){
        this.feed.scale.y = -1
      }
      this.feeds[i] = this.feed      
    }
  }
  public resetScore(): void {
    this.eatFeed = 0
    this.countBroken = 0
    this.countTick = 0
  }
  public create(): void {
    this.resetScore()
    GameManager.Instance.levelStartLogic(this.game)
    this.game.physics.enable(this, Phaser.Physics.ARCADE)
   
    this.restartKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR)
    this.willUpdateWave = false
    this.game.stage.backgroundColor = '#071924'
    this.timer = this.game.time.create(false)
    this.timer.start()

    const backImg = Images.ImageSky.getName()
    const midImg = Images.ImageClouds1.getName()
    const frontImg = Images.ImageIsland1.getName()

    this.bgBack = this.game.add.tileSprite(0,
      this.game.height - this.game.cache.getImage(backImg).height,
      this.game.width,
      this.game.cache.getImage(backImg).height,
      backImg
    )

    this.bgMid = this.game.add.tileSprite(0,
      this.game.height - this.game.cache.getImage(midImg).height,
      this.game.width,
      this.game.cache.getImage(midImg).height,
      midImg
    )

    // Spawn player
    this.player = new Player(this.game)
    GameManager.Instance.setPlayerInstance(this.player)
    this.powerUpFactory = new PowerUpFactory(this.game, this.player)
    
    this.game.camera.follow(this.player);
    this.player.initAnimations()

    this.bgFront = this.game.add.tileSprite(0,
      this.game.height - this.game.cache.getImage(frontImg).height,
      this.game.width,
      this.game.cache.getImage(frontImg).height,
      frontImg
    )
    this.game.physics.arcade.enable(this.bgFront)   
    this.bgFront.body.collideWorldBounds = true
    this.bgFront.body.immovable = true
    this.bgFront.body.allowGravity = false
    
    const pos = [{x:16,y:330}, {x:254,y:220}, {x:487,y:150}]
    for(var i =0; i<3; i++){   
      this.tileBoards[i] = this.game.add.sprite(pos[i].x, pos[i].y, this.imgTile[0].getName())
      this.game.physics.arcade.enable(this.tileBoards[i])
      this.tileBoards[i].body.collideWorldBounds = true
      this.tileBoards[i].body.allowGravity = false
      this.tileBoards[i].body.immovable = true
     
    }    

    this.createFeeds()
    this.createBroken()
  
    this.intervalFunc = setInterval(() => {
      if(this.countBroken < this.BROKEN_CNT){
        if(this.brokens[this.countBroken]){
          this.brokens[this.countBroken].body.allowGravity = true
          this.countBroken++ 
          console.log(`Broken:${this.countBroken}`)
        }
      } 
      GameManager.Instance.scoreValue = 500 + this.eatFeed * 10    
      this.initTimer(this.game, this.countTick, this.TIME_LMT)
      this.countTick ++
      if(this.countTick == this.TIME_LMT){
        this.goNext()
        this.countTick = 0
        clearInterval(this.intervalFunc)
      }
    },1000)
    this.enemiesGroup = this.game.add.group()
    this.currentWaveNumber = 1
    console.log(`Wave ${this.currentWaveNumber}`)
  }
  public goNext(): void {
    GameManager.Instance.scoreValue = 500 + this.eatFeed * 10
    this.initTimer(this.game, this.countTick, this.TIME_LMT)
    
    if(this.intervalFunc){
      this.countTick = 0
      clearInterval(this.intervalFunc)
    }

    if(this.gameResult == 'success'){
      this.game.state.start('win')
    }
    else{
      this.game.state.start('Gameover')
    }    
  }

  public update(): void {
    this.bgMid.tilePosition.x -= this.midTilesSpeed
    this.bgBack.tilePosition.x -= this.farTilesSpeed
    for(var i = 0; i<3;i++){
      this.game.physics.arcade.collide(this.tileBoards[i], this.player, () => {
        this.player.setIsGround(true)
      });
    }
    for( var i = 0; i < this.BROKEN_CNT; i++){
      if(this.brokens[i]){
        this.game.physics.arcade.collide(this.brokens[i], this.player, () => {
          if(this.intervalFunc){
            this.countTick = 0
            clearInterval(this.intervalFunc)
          }
          this.brokens[i].destroy()
          this.gameResult = 'failed'
          this.game.state.start('Gameover')
        });
      }
    }
    for(var i = 0; i < this.FEEDS_CNT;i++){
      if(this.feeds[i]){
        this.game.physics.arcade.collide(this.feeds[i], this.player, () => {
          this.feeds[i].destroy()
          this.feeds[i] = null          
          this.eatFeed ++          
          if(this.eatFeed == this.FEEDS_CNT){
            this.gameResult = 'success'
            this.goNext()
          }
          else {
            this.gameResult = 'failed'
          }
        });
      }
    }
   
    this.game.physics.arcade.collide(this.bgFront, this.player, () => {  
      this.player.setIsGround(true)
    });

    GameManager.Instance.clearGraveyard()
    this.checkWavePassed()
    this.gameAdapter.checkCollisions(this.game, this.player, this.enemiesGroup)

    GameManager.Instance.updateFiltersTime(this.game.time.totalElapsedSeconds() * 1000)
    if (!this.player.alive) {
      if (GameManager.Instance.getRestartKeyReady() && this.restartKey.isDown) {
        this.game.state.start('leveltwo')
      }
    }
  }
  public initTimer(game: Phaser.Game, v: number, limit_v: number): void {
    
    if(this.counterTime && this.counterTime.alive){
      this.counterTime.destroy() 
    }
    const text: string = `Time Left: ${(limit_v-v)} S  Score: ${GameManager.Instance.scoreValue}`
   this.counterTime = new Phaser.Text(game, 20, 20, text, { font: '18px Anonymous Pro', fontStyle: 'bold', fill: '#fff', align: 'left' })
    game.add.existing(this.counterTime)
  }

  private checkWavePassed(): void {
    if (!this.willUpdateWave && this.gameAdapter.enemyGroupDead(this.enemiesGroup)) {
      this.willUpdateWave = true

      this.timer.add(this.WAVE_DELAY, () => {
        //this.updateWave()
      })
    }
  }

  /**
   * Check if current enemies wave is all dead
   * and if so, add the next until none are left
   */
  private updateWave(): void {
    this.willUpdateWave = false // reset state for coming loops
    this.currentWaveNumber = this.currentWaveNumber + 1

    // Make parallax bg move slightly faster for each wave
    this.farTilesSpeed += 0.03
    this.midTilesSpeed += 0.1
    this.frontTilesSpeed += 0.3


  }

}
