//TOOD:
//WARNING: REMEMBER TO DELETE env. FOR API KEY. DO NOT ADD TO GITHUB
//1. Create playlist and pull from Spotify for Strella
//2a. Implement database (MongoDB) also use Axois, in Gitignore, implement env ->
//2.b Use spotify API to organize into database, connect to database
//2.c Use database for music selection
//2.d Use Apache built in VM for linux for web output
//3. If possible for home server, utilize this on website in docker -> do this for sure
//4. Implement pictures that cycle through.
//5. Create new circle objects that go out. DONE
//6. POSSIBLE IDEA -> PARAMETRIC HEART
//7. When running on machine -> HOST ON VM so THAT IP address is only pinned to the VM

//run using node
//node --env-file=.env src/sketch.js

//console.log(process.env);
//process for loading API modules and keeping safe in github -> ignoring .env API_KEYS

//BEGIN CODE
//making sure it is installed. -> using via WSL 22.04 LTS
//begin requireing environment for .env and SpotifyWebAPI
require('dotenv').config();

const axios = require('axios');
const SpotifyWebApi = require('spotify-web-api-node');

const CLIENT_ID = process.env.client_id;
const CLIENT_SECRET = process.env.client_secret;

const SpotifyApi = new SpotifyWebApi({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  redirectUri: 'http://localhost:3000/callback'
});

async function getAccessToken(){
  const clientId = CLIENT_ID;
  const clientSecret = CLIENT_SECRET;
  const tokenUrl = 'https://accounts.spotify.com/api/token'

const credentials = new URLSearchParams({
  grant_type: 'client_credentials',
  client_id: clientId,
  client_secret: clientSecret
})

  const response = await axios.post(tokenUrl, credentials.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  });
  //console.log('Access Token:', response.data.access_token);
  console.log(response.data.expires_in);

  return response.data.access_token;
};

SpotifyApi.setAccessToken();

async function getProfile() {
  const access_token = await getAccessToken();
  if (!access_token) {
    console.error("Error: Access token is missing!");
    return;
}
try{
  //need user authentication
  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: {
      Authorization: 'Bearer ' + access_token
      //Authorization: 'Basic' + CLIENT_ID + ":" + CLIENT_SECRET
    }
  });
  
  const data = await response.json();
  console.log(data);

  }catch (error){
    console.error('Fetch Error: ', error);
  }
};

getProfile();

//console.log(SpotifyApi);
//console.log(SpotifyWebApi);

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
  //arbitrary setup
  song.setVolume(0.05);
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