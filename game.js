var tile_width=40,
	num_cols=20,
	num_rows=10,
	width=tile_width*num_cols,
	height=tile_width*num_rows,
	game = new Phaser.Game(width, height, Phaser.AUTO, '', { preload: preload, create: create, update: update }),
	tile_map,
	clicked=false,
	animating=false,
	atoms=[],
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
			if(i==0 && j==0)
				data={color:null,balls:[]};
			else if(i==0 && j==num_cols-1)
				data={color:null,balls:[]};
			else if(i==num_rows-1 && j==0)
				data={color:null,balls:[]};
			else if(i==num_rows-1 && j==num_cols-1)
				data={color:null,balls:[]};
			else if(i==0)
				data={color:null,balls:[]}
			else if(i==num_rows-1)
				data={color:null,balls:[]};
			else if(j==0)
				data={color:null,balls:[]};
			else if(j==num_cols-1)
				data={color:null,balls:[]};
			else
				data={color:null,balls:[]};
			// atoms[i][j]=data;
			row.push(data);
		}
		atoms.push(row);
	}
}

function update() {
	if(game.input.mousePointer.isDown){
		onClick();
	}
	else if(game.input.mousePointer.isUp){
		clicked=false;
	}
}

function onClick(){
	if(clicked || animating){
		// console.log("returning click",clicked,animating);
		return;
	}
	clicked=true;
	animating=true;

	var col=Math.floor(game.input.activePointer.worldX/tile_width),
		row=Math.floor(game.input.activePointer.worldY/tile_width),
		atom=atoms[row][col];

	// console.log(row,col);

	//firstly don't let the player do anything if this atom has another color
	if(atom.color!=null && atom.color!=turn){
		animating=false;
		return false;
	}

	addAtom(row,col,function(){
		next_turn();
		animating=false;
	});
}

function addAtom(row,col,onComplete){
	var atom=atoms[row][col];

	atom.color=turn;
	atom.balls.push(draw_atom(row,col));

	//split the atom if number of balls has become equal to the number of neighbours
	if(atom_needs_split(row,col)){
		split_atoms(row,col,function(){
			console.log("addAtom oncomplete being called");
			onComplete();
		});
		// console.log(atom.balls.length,neighbours);
	}
	else{
		align_balls(atom);
		onComplete();
	}
}

function draw_atom(row,col,color){
	var atom=atoms[row][col],
		x=col*tile_width + tile_width/2,
		y=row*tile_width + tile_width/2,
		ball_str,
		ball;

	if(color===undefined){
		ball_str=turn=="red"?'ball_red':'ball_green';
	}
	else
		ball_str=color=="red"?"ball_red":"ball_green";

	ball=game.add.sprite(x,y,ball_str);
	ball.anchor.set(0.5);
	return ball;
}

function split_atoms(row,col,onComplete){
	console.log("split_atoms called for,",row,col);
	var atom=atoms[row][col],
		balls=atom.balls,
		color=atom.color,
		neighbours=get_neighbours(row,col);
	
	atom.balls=[];
	atom.color=null;
	for(var k=0;k<balls.length;k++){
		var ball=balls[k],
			neighbour=neighbours[k];

		move_ball_to_neighbour(balls,color,neighbour,ball,k,function(index){
			//this will run only after all balls have been moved to the neighbours
			if(index==balls.length-1){
				console.log("inner callback");
				// console.log("split_atoms() running for",row,col);
				onComplete();
			}
		});
	}
}

function get_neighbours(x,y){
	var neighbours=[];
	if(x-1>=0)
		neighbours.push([x-1,y]);
	if(x+1<num_cols)
		neighbours.push([x+1,y]);
	if(y-1>=0)
		neighbours.push([x,y-1]);
	if(y+1<num_rows)
		neighbours.push([x,y+1]);
	
	return neighbours;
}

function move_ball_to_neighbour(balls,color,neighbour,ball,ball_index,callback){
	var row=neighbour[0],
		col=neighbour[1],
		x=col*tile_width+tile_width/2,
		y=row*tile_width+tile_width/2,
		neighbour_atom=atoms[row][col],
		tween=game.add.tween(ball);

	// console.log(neighbour_atom);

	tween.to({x:x,y:y},600,'Linear',true,0);
	tween.onComplete.add(function(){
		neighbour_atom.balls.push(ball);
		// console.log(neighbour_atom.color,turn);
		if(neighbour_atom.color!=null && neighbour_atom.color!=color){
			console.log("changing color",row,col,color,neighbour_atom.color);
			change_atom_color(row,col,color);
		}
		if(atom_needs_split(row,col)){
			console.log("atom needs a split");
			split_atoms(row,col,function(){
				console.log("split complete");
				callback(ball_index);
			});
		}
		else{
			align_balls(neighbour_atom);
			callback(ball_index);
		}
		// else
		// 	addAtom(i,j,ball);
		// atom.balls.splice(ball_index,1);
	},this);
}

function change_atom_color(row,col,color){
	var atom=atoms[row][col],
		num_atoms=atom.balls.length;

	atom.color=color;
	atom.balls.forEach(function(ball){
		ball.destroy();
	});
	atom.balls=[];

	for(var k=0;k<num_atoms;k++){
		atom.balls.push(draw_atom(row,col,color))
	}
}

//since all balls shouldn't be superimposed
//this function moves the balls so that all are visible
function align_balls(atom){
	if(atom.balls.length==2){
		atom.balls[0].x-=2;
		atom.balls[0].y-=2;
		
		atom.balls[1].x+=2;
		atom.balls[1].y+=2;
	}
	else if(atom.balls.length==3){
		atom.balls[0].y-=4;
		
		atom.balls[1].x-=4;
		atom.balls[1].y+=4;
		
		atom.balls[2].x+=4;
		atom.balls[2].y+=4;	
	}
}

function atom_needs_split(row,col){
	var atom=atoms[row][col],
		neighbours=get_neighbours(row,col);

	if(atom.balls.length == neighbours.length)
		return true;

	return false;
}

function next_turn(){
	turn=turn=="red"?"green":"red";
}