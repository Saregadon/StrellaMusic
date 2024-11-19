//TOOD:
//1. Create playlist and pull from Spotify for Strella
//2. Implement database if need be for her
//3. If possible for home server, utilize this on website in docker
//4. Implement pictures that cycle through.
//5. Create new circle objects that go out.

var song;
var fft;
var particles = []

function preload(){
  //song = loadSound('songs/Shake the Frost (Live).mp3') //add songs from spotify 
  song = loadSound('songs/Stargazing.mp3') //add songs from spotify 
  //song = loadSound('songs/The Otter.mp3') //add songs from spotify 
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  fft = new p5.FFT();

  //noLoop();
}

function draw() {
  background(0);
  stroke(255);
  strokeWeight(3);
  noFill();

  translate(width / 2, height / 2);

  fft.analyze();
  amp = fft.getEnergy(20, 200);

  var wave = fft.waveform();

  //possibly look at getting shape for heart as opposed to circle
  for(var t = -1; t <= 1; t+= 2){
    beginShape();
    for(var i = 0; i <= 180; i += 0.25){
      var index = floor(map(i, 0, 180, 0, wave.length - 1));

      //map of the audio visualizer
      var r = map(wave[index],-1, 1, 150, 350);

      //set up as a circle for right now, most likely change to a heart
      var x = r * sin(i) * t;
      var y = r * cos(i);
      vertex(x, y);
    }
    endShape();
  }

  var p = new Particle();
  particles.push(p);

  for(var i = particles.length - 1; i >= 0; i--){
    if(!particles[i].edges()){
      //check amperage changes per song, possibly have dynamic typing
      particles[i].update(amp > 230);
      particles[i].show();
    }
    else {
      particles.splice(i, 1);
    }
  }
}

function mouseClicked() {
  if (song.isPlaying()) {
    song.pause();
  }else{
    song.play();
  }
}

class Particle{
  constructor() {
    this.pos = p5.Vector.random2D().mult(250);
    this.vel = createVector(0, 0);
    this.acc = this.pos.copy().mult(random(0.0001, 0.00001));
  
    this.w = random(3, 5)

    this.color = [random(0, 35), random(0, 255), 0]
  }

  update(cond){
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    if(cond) {
      this.pos.add(this.vel);
      this.pos.add(this.vel);
    }
  }

  edges() {
    if(this.pos.x < -width / 2 || this.pos.x > width / 2 ||
      this.pos.y < -height / 2 || this.pos.y > height / 2){
        return true;
    }
      else{
        return false;
      }
  }

  show() {
    //new values for gradients
    //var r = random(0, 30);
    //var g = random(0, 255);

    noStroke();
    fill(this.color);
    ellipse(this.pos.x, this.pos.y, this.w)
  }
}