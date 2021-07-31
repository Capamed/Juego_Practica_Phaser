var AMOUNT_CRYSTALS = 15;
var AMOUNT_METEORS = 30;
var COUNT = 0;
GamePlayManager ={
    init: function(){
        //Propiedad para que se haga responsive
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        //Alinear nuestro juego de forma horizontal como vertical
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;
        //Para que no se mueva
        this.flagFirstMouseDown = false;
        this.amountCrystalsCaught = 0; //Variable que regsitra todos los crystales que vamos tomando
        this.changeAction = false;
        this.endGame = false;
    },
    preload: function(){
        //El background es el identificador de ese objeto
        game.load.image('background','assets/images/background/space.jpg');
        //Cargar el sprite
        game.load.spritesheet('robotParado','assets/images/robot/Idle (10).png');
        game.load.spritesheet('robotVolando','assets/images/robot/Jump (2).png');
        game.load.spritesheet('robotGanar','assets/images/robot/Jump (7).png');
        game.load.spritesheet('crystalSingle','assets/images/items/Crystal_02.png');
        game.load.spritesheet('crystalHuge','assets/images/items/Crystal_03.png');
        game.load.spritesheet('skrull','assets/images/items/Enemy_Destroy_Bonus.png');
        game.load.spritesheet('heart','assets/images/items/Hp_Bonus.png');
        game.load.spritesheet('explosion1','assets/images/items/Bomb_1_Explosion_003.png');
        game.load.spritesheet('meteoro1','assets/images/items/Meteor_02.png');
        game.load.spritesheet('meteoro2','assets/images/items/Meteor_07.png');
        game.load.spritesheet('misile','assets/images/items/Missile_2_Flying_000.png');
    },
    create: function(){
        //Para ponerlo en pantalla
        game.add.sprite(0,0,'background');
        this.meteors = [];
        for (let index = 0; index < AMOUNT_METEORS; index++) {
            var xMeteors = game.rnd.integerInRange(1,1140);
            var yMeteors = game.rnd.integerInRange(600,950);
            var meteor = game.add.sprite(xMeteors,yMeteors,'meteoro'+ game.rnd.integerInRange(1,2));
            meteor.vel = 0.2 + game.rnd.frac()*2;
            meteor.alpha = 0.9;
            meteor.scale.setTo((Math.random()).toFixed(1));
            this.meteors[index] = meteor;
        }
        this.misile = game.add.sprite(500,700,'misile');
        this.misile.scale.setTo(0.5);
        //Para guardar la instancia en un variable se usa el this.
        this.robot = game.add.sprite(0,0,'robotParado');
        this.robot.scale.setTo(0.3);
        this.robot.x = game.width/2;
        this.robot.y = game.height/2;
        this.robot.anchor.setTo(0.5);
        game.input.onDown.add(this.onTap,this);

        this.crystals = [];
        this.nameCrystals = ['crystalSingle','crystalHuge','skrull','heart'];
        for (let index = 0; index < AMOUNT_CRYSTALS; index++) {
            var crystal = game.add.sprite(100,100,this.nameCrystals[Math.floor(Math.random() * 4)]);
            crystal.scale.setTo(game.rnd.realInRange(0.1, 0.4));
            crystal.anchor.setTo(0.5);
            crystal.x = game.rnd.integerInRange(50,1050);
            crystal.y = game.rnd.integerInRange(50,600);
            this.crystals[index] = crystal;
            var rectCurrentCrystal = this.getBoundsCrystal(crystal);
            var rectRobot = this.getBoundsCrystal(this.robot);
            while (this.isOverlappingOtherCrystal(index,rectCurrentCrystal) || this.isRectangleOverlapping(rectRobot,rectCurrentCrystal)) {
                crystal.x = game.rnd.integerInRange(50,1050);
                crystal.y = game.rnd.integerInRange(50,600);
                rectCurrentCrystal = this.getBoundsCrystal(crystal);
            }
        }

        this.explosionGroup = game.add.group();
        
        for (let index = 0; index < 5; index++) {
            this.explosion = this.explosionGroup.create(100,100,'explosion1');
            //BOMBAZO
            this.explosion.tweenScale = game.add.tween(this.explosion.scale).to({
                x:[0.4,0.8,0.4],
                y:[0.4,0.8,0.4]
            },600, Phaser.Easing.Exponential.Out,false,0,0,false);
            //BOMBITA
            // this.explosion.tweenScale = game.add.tween(this.explosion.scale.setTo(0.2),600, Phaser.Easing.Exponential.Out,false,0,0,false);
    
            this.explosion.tweenAlpha = game.add.tween(this.explosion).to({
                alpha:[1,0.6,0]
            },600, Phaser.Easing.Exponential.Out,false,0,0,false);
            this.explosion.anchor.setTo(0.5);
            this.explosion.kill(); //lo hace invisible y disponible para hacer uso
        }

        //TEXT SCORE
        this.currentScore = 0;
        var style = {
            font:'bold 30pt Arial',
            fill: '#FFFFFF',
            align: 'center'
        }
        this.scoreText = game.add.text(game.width/2,40,'0',style);
        this.scoreText.anchor.setTo(0.5);

        //TEXT COUNTDOWN
        this.totalTime = 10;
        this.timerText = game.add.text(1000,40,this.totalTime,style);
        this.scoreText.anchor.setTo(0.5);

        this.timerGameOver = game.time.events.loop(Phaser.Timer.SECOND,()=>{
            if(this.flagFirstMouseDown){
                this.totalTime--;
                this.timerText.text = this.totalTime+'';//Para convertir e lINTEGER EN STRING
                if(this.totalTime<=0){
                    game.time.events.remove(this.timerGameOver);
                    this.endGame = true;
                    this.showFinalMessage('SE ACABÓ EL JUEGO');
                }
            }
        },this);
    },
    increaseScore:function(){
        this.currentScore+= 100;
        this.scoreText.text = this.currentScore;
        this.changeAction = true;
        this.robot.loadTexture('robotGanar');
        this.amountCrystalsCaught += 1;
        if(this.amountCrystalsCaught >= AMOUNT_CRYSTALS){
            game.time.events.remove(this.timerGameOver);
            this.showFinalMessage('FELICITACIONES');
            this.endGame = true;
        }
    },
    showFinalMessage:function (message) {
        //this.tweenMisile.stop();
        var bgAlpha = game.add.bitmapData(game.width,game.height);
        bgAlpha.ctx.fillStyle = '#000000';
        bgAlpha.ctx.fillRect(0,0,game.width,game.height);
        var bg = game.add.sprite(0,0,bgAlpha);
        bg.alpha = 0.5;

        var styleBg = {
            font:'bold 60pt Arial',
            fill: '#FFFFFF',
            align: 'center'
        }

        this.textFieldFinalMsg = game.add.text(game.width/2,game.height/2,message,styleBg);
        this.textFieldFinalMsg.anchor.setTo(0.5);
    },
    onTap: function () {
        if(!this.flagFirstMouseDown){
            // this.tweenMisile = game.add.tween(this.misile.position).to({y:-100},5800,Phaser.Easing.Cubic.Input,true,0,1000,true).loop(true);
        }
        this.flagFirstMouseDown = true;
        //En phaser 2 se usa load Texture en phaser 3 setTexture
        this.robot.loadTexture('robotVolando');
    },
    //Pasamos como parametro el sprite actual u objeto.
    //Vamos a devolver un rectangulo con las coordenas que ocupa nuestro cristal.
    getBoundsCrystal:function(currentCrystal){
        return new Phaser.Rectangle(currentCrystal.left,currentCrystal.top,currentCrystal.width,currentCrystal.height);
    },
    //Esta funcion permite verificar si dos objetos estan colisionando, recibe dos rectangulos como parametros 
    isRectangleOverlapping: function(rect1,rect2){
        //devuelve true, si los dos rectangulos estan sobre puesto y false si no lo estan
        if (rect1.x> rect2.x+rect2.width || rect2.x> rect1.x+rect1.width) {
            return false;
        }
        if (rect1.y> rect2.y+rect2.height || rect2.y> rect1.y+rect1.height) {
            return false;
        }
        return true;
    },
    isOverlappingOtherCrystal:function(arraylength,rect2){
        for (let index = 0; index < arraylength; index++) {
            var rect1 = this.getBoundsCrystal(this.crystals[index]);
            if (this.isRectangleOverlapping(rect1,rect2)) {
                return true;
            }
        }
        return false;
    },
    getBoundRobot:function(){
        //En vez de tomar la colision desde una punta la vamos a tomar desde la mitad del robot
        var x0= this.robot.x - Math.abs(this.robot.width)/4;
        var width = Math.abs(this.robot.width)/2;
        var y0 = this.robot.y - this.robot.height/2;
        var height = this.robot.height;
        return new Phaser.Rectangle(x0,y0,width,height);
    },
    // render:function(){
    //     game.debug.spriteBounds(this.robot);
    //     for (let index = 0; index < AMOUNT_CRYSTALS; index++) {
    //         game.debug.spriteBounds(this.crystals[index]);
    //     }
    // },
    update: function(){
        if (this.flagFirstMouseDown && !this.endGame) {
            if(this.changeAction){
                game.time.events.add(Phaser.Timer.SECOND * 1, ()=>{
                    this.changeAction = false;
                    this.robot.loadTexture('robotVolando');
                }, this); 
            }
            for (let index = 0; index < AMOUNT_METEORS; index++) {
                var meteor = this.meteors[index];
                meteor.y -= meteor.vel;
                if(meteor.y < -50){
                    meteor.y = 700;
                    meteor.x = game.rnd.integerInRange(1,11);
                }
                
            }
            var pointerX = game.input.x;
            var pointerY = game.input.y;
            //Calcular la distancia entre el robot y el cursor.
            var distX = pointerX - this.robot.x;
            var distY = pointerY - this.robot.y;
            //Orientar al robot a la IZQ o DER
            if(distX > 0){
                this.robot.scale.setTo(0.3,0.3);
            }else{
                this.robot.scale.setTo(-0.3,0.3);
            }
            //Mover al robot hacia la posicion del cursor
            this.robot.x += distX * 0.02;
            this.robot.y += distY * 0.02; 
            
            //Vamos a iterar sobre todos los items para ver si esta colisinando con nuestro robot
            for (let index = 0; index < AMOUNT_CRYSTALS; index++) {
                var rectRobot = this.getBoundRobot();
                var rectCrystal = this.getBoundsCrystal(this.crystals[index]);

                if (this.crystals[index].visible && this.isRectangleOverlapping(rectRobot,rectCrystal)) {
                    this.increaseScore();
                    this.crystals[index].visible = false;
                    var explosion = this.explosionGroup.getFirstDead();
                    if (explosion!=null) {     
                        explosion.reset(this.crystals[index].x,this.crystals[index].y);
                        explosion.tweenScale.start();
                        explosion.tweenAlpha.start();
                        explosion.tweenAlpha.onComplete.add((currentTarget,currentTween)=>currentTarget.kill(),this);
                    }
                }
                
            }
        } 
    }
}
// El primero son las dimensiones del juego: el width y el otro es el height 
// El otro parametro es la Renderizacion:
// WEBGL-->Implementacion para hacer uso de la tarjeta grafica, para hacer la renderizacion mucho mas rapida.
// CANVAS--> Se usa cuando sepamos que no podemos usar una tarjeta grafica y el render seria mas lento.
// AUTO--> Donde se indica que el dispositivo use WEBGL o CANVAS, depende de que el dispositivo soporte.
var game = new Phaser.Game(1136,640,Phaser.CANVAS);

//A la instancia de game, se le añade un estado gameplay se le añade un objeto GamePlayManager
game.state.add('gameplay',GamePlayManager);
game.state.start('gameplay');