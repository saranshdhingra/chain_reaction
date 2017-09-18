var tile_width=40,
	num_cols=20,
	num_rows=10,
	width=tile_width*num_cols,
	height=tile_width*num_rows,
	game = new Phaser.Game(width, height, Phaser.AUTO, '', { preload: preload, create: create, update: update }),
	tile_map,
	clicked=false,
	animating=false,
	cells=[],
	running_tweens=0,
	turn="red";

function preload() {
	// console.log("preload ran");
	game.load.image('tile','images/tile.jpg');
	game.load.image('ball_red', 'images/ball_1.png');
	game.load.image('ball_green', 'images/ball_2.png');
}

function create() {
	tile_map = this.game.add.tileSprite(0,0,game.width,game.height,'tile');
	for(var i=0;i<num_rows;i++){
		var row=[]
		for(var j=0;j<num_cols;j++){
			var data;
			data=new Cell(i,j,null);
			// atoms[i][j]=data;
			row.push(data);
		}
		cells.push(row);
	}
}

function update() {
	if(game.input.mousePointer.isDown){
		onClick();
	}
	else if(game.input.mousePointer.isUp){
		clicked=false;
	}
	if(running_tweens>0){
		animating=true;
	}
	else
		animating=false;
}

function onClick(){
	if(clicked || animating){
		// console.log("returning click",clicked,animating);
		return;
	}
	clicked=true;

	var col=Math.floor(game.input.activePointer.worldX/tile_width),
		row=Math.floor(game.input.activePointer.worldY/tile_width),
		cell=cells[row][col];

	//firstly don't let the player do anything if this atom has another color
	if(cell.color!=null && cell.color!=turn){
		return false;
	}

	cell.draw_atom(turn);
	cell.split_if_needed();
	next_turn();
}

function next_turn(){
	turn=turn=="red"?"green":"red";
}

function Cell(row,col,color){
	this.row=row;
	this.col=col;
	this.color=color;
	this.atoms=[];
	this.draw_atom=function(color){
		var x=this.col*tile_width + tile_width/2,
			y=this.row*tile_width + tile_width/2,
			atom;

		this.color=color;

		atom=game.add.sprite(x,y,"ball_"+color);
		atom.anchor.set(0.5);
		this.atoms.push(atom);
	}
	this.split_if_needed=function(){
		if(this.atoms.length==this.neighbours().length){
			// console.log("needs split",this.row,this.col,this.atoms.length,this.neighbours());
			// console.log()
			this.split_atoms();
		}
		else{
			this.align_atoms();
		}
	}
	this.split_atoms=function(){
		var promises=[],
			cell=this;
		// console.log("splitting for cells:",this.row,this.col);
		running_tweens+=this.atoms.length;
		for(var k=0;k<this.atoms.length;k++){
			(function(){
				var index=k,
					atom=this.atoms[k],
					neighbour=this.neighbours()[k];

				promises[k]=new Promise((resolve,reject)=>{
					var tween=game.add.tween(atom),
						x=neighbour.col*tile_width+tile_width/2,
						y=neighbour.row*tile_width+tile_width/2;

					tween.to({x:x,y:y},600,'Linear',true,0).start();
					// console.log(index,tween);
					tween.onComplete.add(function(){
						// console.log("tween completed",index);
						neighbour.atoms.push(atom);
						neighbour.change_color(cell.color);
						neighbour.split_if_needed();
						// console.log("test");
						resolve();
					});
				});
			}.bind(this))();
		}
		Promise.all(promises).then(function(){
			running_tweens-=cell.atoms.length;
			cell.atoms=[];
			cell.color=null;
		});
	}
	this.neighbours=function(){
		var neighbours=[];
		if(this.row-1>=0)
			neighbours.push(cells[this.row-1][this.col]);
		if(this.row+1<num_cols)
			neighbours.push(cells[this.row+1][this.col]);
		if(this.col-1>=0)
			neighbours.push(cells[this.row][this.col-1]);
		if(this.col+1<num_rows)
			neighbours.push(cells[this.row][this.col+1]);
		
		return neighbours;
	}
	this.change_color=function(color){
		// console.log("running change_color on ",this.row,this.col);
		if(this.color!=color){
			var num_atoms=this.atoms.length;
			this.atoms.forEach(function(atom){
				atom.destroy();
			});
			this.atoms=[];

			for(var k=0;k<num_atoms;k++){
				// this.atoms.push(this.draw_atom(row,col,color))
				this.draw_atom(color);
			}
		}
		this.color=color;
		// console.log("ended change_color");
	}
	this.align_atoms=function(){
		if(this.atoms.length==2){
			this.atoms[0].x-=2;
			this.atoms[0].y-=2;
			
			this.atoms[1].x+=2;
			this.atoms[1].y+=2;
		}
		else if(this.atoms.length==3){
			this.atoms[0].y-=4;
			
			this.atoms[1].x-=4;
			this.atoms[1].y+=4;
			
			this.atoms[2].x+=4;
			this.atoms[2].y+=4;	
		}
	}
}