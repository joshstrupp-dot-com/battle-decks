let shared;
let capture;
let isHost = false;
let spotlightOn = false;
let presentationStarted = false;
let currentSlide = 0;
const slides = [
  {
    text: "Take your seat.\nThe presentation will begin shortly.",
    image: null, // No image for intro slide
  },
  {
    text: "Q. Pompeius Rufus\n54 BC",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/b/bf/Q._Pompeius_Rufus%2C_denarius%2C_54_BC%2C_RRC_434-1_%28Sulla_only%29.jpg",
  },
  {
    text: "Not a drag queen,\nbut the queen of drag.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/b/b1/RuPaul_Trending_Report_2015.jpg",
  },
  {
    text: "Fly close to the sun.\nTake risks.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/4/4e/Ilovechicago.jpg",
  },
];

// Add preloaded images array
let slideImages = [];

function preload() {
  // Connect to p5.party server
  partyConnect("wss://demoserver.p5party.org", "blind_presenter");

  // Create/join shared data space
  shared = partyLoadShared("shared", {
    audienceCount: 0,
    isHostJoined: false,
    currentSlide: 0,
    comments: [],
  });

  // Preload images
  for (let slide of slides) {
    if (slide.image) {
      slideImages.push(loadImage(slide.image));
    } else {
      slideImages.push(null);
    }
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Hide both buttons by default
  const spotlightBtn = select("#spotlightBtn");
  const startBtn = select("#startBtn");
  spotlightBtn.style("display", "none");
  startBtn.style("display", "none");

  // First person to join becomes host
  if (!shared.isHostJoined) {
    isHost = true;
    shared.isHostJoined = true;
    // Show spotlight button only for host
    spotlightBtn.style("display", "block");
  } else {
    shared.audienceCount++;
    setupAudienceControls();
  }

  // Setup host controls
  if (isHost) {
    spotlightBtn.mousePressed(() => {
      capture = createCapture(VIDEO);
      capture.hide();
      spotlightOn = true;

      // Show start button if audience exists
      if (shared.audienceCount > 0) {
        startBtn.style("display", "block");
      }
    });

    startBtn.mousePressed(() => {
      shared.presentationStarted = true;
      shared.currentSlide = 1; // Automatically advance to slide 2
    });
  }
}

function draw() {
  background(0);

  // Draw current slide
  drawSlide();

  // Draw video if spotlight is on
  if (isHost && spotlightOn) {
    drawHostVideo();
  }

  if (!isHost && shared.presentationStarted) {
    // Draw host video for audience
    // Note: In a real implementation, you'd need to handle video streaming
    // between clients, which requires additional infrastructure
  }

  // Draw audience count
  fill(255);
  textSize(16);
  textAlign(LEFT, TOP);
  text(`Audience Members: ${shared.audienceCount}`, 10, 10);

  // Draw comments
  drawComments();
}

function drawSlide() {
  background(0);

  const currentSlideData = slides[shared.currentSlide];
  const currentImage = slideImages[shared.currentSlide];

  // Draw text on the left side
  fill(255);
  textSize(32);
  textAlign(LEFT, CENTER);
  text(currentSlideData.text, 50, height / 2);

  // Draw image on the right side if it exists
  if (currentImage) {
    const maxWidth = width / 2 - 100;
    const maxHeight = height - 100;

    // Calculate scaling to fit image while maintaining aspect ratio
    const scale = Math.min(
      maxWidth / currentImage.width,
      maxHeight / currentImage.height
    );

    const scaledWidth = currentImage.width * scale;
    const scaledHeight = currentImage.height * scale;

    // Center the image both horizontally in right half and vertically
    const imgX = width / 2 + (width / 2 - scaledWidth) / 2;
    const imgY = height / 2 - scaledHeight / 2;

    imageMode(CORNER);
    image(currentImage, imgX, imgY, scaledWidth, scaledHeight);
  }
}

function drawHostVideo() {
  if (capture) {
    const size = 150;
    const x = width - size - 20;
    const y = height - size - 20;

    // Draw circular video
    push();
    imageMode(CENTER);
    translate(x + size / 2, y + size / 2);
    image(capture, 0, 0, size, size);
    pop();
  }
}

function setupAudienceControls() {
  const commentInput = select("#commentInput");
  commentInput.style("display", "block");

  commentInput.input(() => {
    if (keyCode === ENTER && commentInput.value().trim() !== "") {
      shared.comments.push({
        text: commentInput.value(),
        timestamp: Date.now(),
      });
      commentInput.value("");
    }
  });
}

function drawComments() {
  // Draw floating comments
  shared.comments.forEach((comment, i) => {
    const age = (Date.now() - comment.timestamp) / 1000;
    if (age < 5) {
      // Show comments for 5 seconds
      fill(255, 255, 255, 255 * (1 - age / 5));
      text(comment.text, random(width), random(height));
    } else {
      shared.comments.splice(i, 1);
    }
  });
}

function keyPressed() {
  if (isHost && shared.presentationStarted) {
    if (keyCode === RIGHT_ARROW) {
      shared.currentSlide = min(shared.currentSlide + 1, slides.length - 1);
    } else if (keyCode === LEFT_ARROW) {
      shared.currentSlide = max(shared.currentSlide - 1, 0);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
