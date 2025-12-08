
document.getElementById("closeOverlay").onclick = () => {
    document.getElementById("overlayBackground").style.display = "none";
};

/* ---------- YOUR P5.JS CODE ---------- */
let _text;

function setup() {
	createCanvas(700, 700, WEBGL).parent("p5container");
	background(142,22,6);
	_text = createGraphics(700, 700);
	_text.textFont('Helvetica');
	_text.textAlign(LEFT);
	_text.textSize(150);
	_text.fill(142,22,6);
	_text.noStroke();
	_text.textLeading(130);
	_text.text('J*YEUX\nNÖEL***\n*B*NNES\nFÊTES**\n***2026* ',50,140);
}

function draw() {
	background(230);

	stroke(255,255,119);
	strokeWeight(7);

	push();
	noStroke();
	texture(_text);
	plane(700,700);
	pop();

	push();
	translate(0,-200);
	fill('rgba(0,255,0,0.5)');
	rotateZ(PI);
	rotateY(frameCount *0.02);
	cone(160, 150);
	pop();

	push();
	translate(0,-50);
	fill('rgba(0,255,0,0.5)');
	rotateZ(PI);
	rotateY(frameCount * 0.02);
	cone(180, 150);
	pop();

	push();
	translate(0,100);
	fill('rgba(0,255,0,0.5)');
	rotateZ(PI);
	rotateY(frameCount * 0.02);
	cone(200, 150);
	pop();

	push();
	fill('rgba(255,102,102,0.8)');
	translate(-30,0);
	ellipse(30,30,400,400,30);
	pop();
}