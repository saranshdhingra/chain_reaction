var tile_width=40,
	num_cols=20,
	num_rows=10,
	width=tile_width*num_cols,
	height=tile_width*num_rows,
	game = new Phaser.Game(width, height, Phaser.AUTO, '', { preload: preload, create: create, update: update }),
	tile_map,
	clicked=false,
	atoms=[];

function preload() {
	// console.log("preload ran");
	game.load.image('tile','images/tile.jpg');
	game.load.image('ball', 'images/ball.png');
}

function create() {
	tile_map = this.game.add.tileSprite(0,0,game.width,game.height,'tile');
	for(var i=0;i<num_rows;i++){
		var row=[]
		for(var j=0;j<num_cols;j++){
			var data;
			if(i==0 && j==0)
				data={type:'corner',position:'left_top',balls:[]};
			else if(i==0 && j==num_cols-1)
				data={type:'corner',position:'right_top',balls:[]};
			else if(i==num_rows-1 && j==0)
				data={type:'corner',position:'left_bottom',balls:[]};
			else if(i==num_rows-1 && j==num_cols-1)
				data={type:'corner',position:'right_bottom',balls:[]};
			else if(i==0)
				data={type:'edge',position:'top',balls:[]}
			else if(i==num_rows-1)
				data={type:'edge',position:'bottom',balls:[]};
			else if(j==0)
				data={type:'edge',position:'left',balls:[]};
			else if(j==num_cols-1)
				data={type:'edge',position:'right',balls:[]};
			else
				data={type:'center',balls:[]};
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
	if(clicked)
		return;
	clicked=true;

	var x=Math.floor(game.input.activePointer.worldX/tile_width),
		y=Math.floor(game.input.activePointer.worldY/tile_width);
	
	addAtom(x,y);
}

function addAtom(x,y,ball){
	var atom=atoms[x][y],
		neighbours=get_neighbours(x,y);

	if(typeof ball=="undefined")
		addBall(atom.balls,x,y);
	else
		atom.balls.push(ball);
	//split the atom if number of balls has become equal to the number of neighbours
	if(atom.balls.length == neighbours.length){
		split_atoms(x,y,neighbours);
		// console.log(atom.balls.length,neighbours);
	}
}

function split_atoms(x,y,neighbours){
	var atom=atoms[x][y];
	
	for(var i=0;i<atom.balls.length;i++){
		var ball=atom.balls[i],
			neighbour=neighbours[i];
		move_ball_to_neighbour(atom,neighbour,ball,i);
	}
	atom.balls=[];
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

function addBall(balls,i,j){
	var atom=atoms[i][j],
		x=i*tile_width + tile_width/2,
		y=j*tile_width + tile_width/2,
		ball;

	ball=game.add.sprite(x,y,'ball');
	ball.anchor.set(0.5);
	atom.balls.push(ball);
}

function move_ball_to_neighbour(atom,neighbour,ball,ball_index){
	var i=neighbour[0],
		j=neighbour[1],
		x=i*tile_width+tile_width/2,
		y=j*tile_width+tile_width/2,
		neighbour_atom=atoms[i][j],
		tween=game.add.tween(ball);

	// console.log(neighbour_atom);

	tween.to({x:x,y:y},1000,'Linear',true,0);
	tween.onComplete.add(function(){
		// neighbour_atom.balls.push(ball);
		addAtom(i,j,ball);
		// atom.balls.splice(ball_index,1);
	},this);
}