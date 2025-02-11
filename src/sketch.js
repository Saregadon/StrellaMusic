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
let song;
let fft;
let particles = [];

// Fetch access token from URL
// Fetch access token from URL or localStorage
let accessToken = "";

// Ensure code only runs in the browser
if (typeof window !== "undefined") {
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get("access_token");

  if (urlToken) {
    // Store the new access token in localStorage
    localStorage.setItem("spotify_access_token", urlToken);
    accessToken = urlToken;

    // Remove access token from the URL to clean it up
    const newUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
  } else {
    // Retrieve token from localStorage if available
    accessToken = localStorage.getItem("spotify_access_token") || "";
  }
}


function preload() {
  if (accessToken) {
    fetchTrackData(accessToken).then((previewUrl) => {
      if (previewUrl) {
        song = loadSound(previewUrl);
      } else {
        console.error('No preview URL available.');
      }
    });
  } else {
    console.log('No access token found. Please log in.');
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  fft = new p5.FFT();
  if (song) {
    song.setVolume(0.05);
  }
}

function draw() {
  background(0);
  stroke(255);
  strokeWeight(3);
  noFill();

  translate(width / 2, height / 2);

  if (!fft || !song || !song.isPlaying()) {
    return;
  }

  fft.analyze();
  const amp = fft.getEnergy(20, 200);
  const wave = fft.waveform();

  for (let t = -1; t <= 1; t += 2) {
    beginShape();
    for (let i = 0; i <= 180; i += 0.25) {
      const index = floor(map(i, 0, 180, 0, wave.length - 1));
      const r = map(wave[index], -1, 1, 150, 350);
      const x = r * sin(i) * t;
      const y = r * cos(i);
      vertex(x, y);
    }
    endShape();
  }

  const p = new Particle();
  particles.push(p);

  for (let i = particles.length - 1; i >= 0; i--) {
    if (!particles[i].edges()) {
      particles[i].update(amp > 230);
      particles[i].show();
    } else {
      particles.splice(i, 1);
    }
  }
}

async function fetchTrackData(token) {
  try {
    const response = await fetch(`https://strellamusic.onrender.com/api/top-tracks`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    return data.items[0]?.preview_url || null;
  } catch (error) {
    console.error('Error fetching track data:', error);
    return null;
  }
}


class Particle {
  constructor() {
    this.pos = p5.Vector.random2D().mult(250);
    this.vel = createVector(0, 0);
    this.acc = this.pos.copy().mult(random(0.0001, 0.00001));
    this.w = random(3, 5);
    this.color = [random(0, 35), random(0, 255), 0];
  }

  update(cond) {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    if (cond) {
      this.pos.add(this.vel);
    }
  }

  edges() {
    return (
      this.pos.x < -width / 2 ||
      this.pos.x > width / 2 ||
      this.pos.y < -height / 2 ||
      this.pos.y > height / 2
    );
  }

  show() {
    noStroke();
    fill(this.color);
    ellipse(this.pos.x, this.pos.y, this.w);
  }
}
