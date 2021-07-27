$(function() {

  const overallStatus = $('#deployment_status'); // Initializing vs Live
  const studioStatus = $('#studio_status'); // Status indicator for studio setup
  const phoneNumberStatus = $('#phone_number_status'); // Status indicator for PN setup
  const syncStatus = $('#sync_status'); // Status indicator for Sync setup
  const launchButton = $('#launch'); // Button used to open photo frame
  const photoFrame = $('#frame'); // Photo frame container
  const innerFrame = $('#inner_frame'); // // Where the photos actually go
  const closeFrameButton = $('#close_frame'); // Button to close frame
  const caption = $('#caption'); // Caption div display container
  const number = $('#number'); // Twilio phone number display container
  const passcodeInput = $('#passcode'); // Text input
  const passcodeButton = $('#passcode_submit'); // Button

  let listName; // Returned in setup
  let syncList; // Returned in setup
  let currentIndex; // Returned in setup

  photoFrame.hide(); // On load, hide the frame

  function log(message) {
    // In the future, maybe display this too.
    console.log(message);
  }

  /**
   *
   * Calling a relative URL which is to a Twilio Function
   * that will create a Studio flow for this user.
   * The Function returns a SID and webhook URL.
   *
   */
  
  function touchStudioFlow(passcode) {
    return $.getJSON("./setup-studio", { passcode: passcode })
      .then(function (data) {
        log("Ran studio setup function...");
        const url = "https://www.twilio.com/console/studio/flows/" + data.flowSid;
        studioStatus.html('provisioned! <a href="' + url + '">[Edit Flow]</a>');
        studioStatus.addClass('provisioned');
        return data.webhookUrl;
      })
      .catch(function(err) {
        console.log(err);
        log("Studio setup failed!");
        throw new Error(err.details);
      });
  }

  /**
   *
   * Calling a relative URL which is to a Twilio Function
   * that will modify a number to point to the Studio flow.
   * The Function returns a phone number SID.
   *
   */

  function touchPhoneNumber(webhookUrl, passcode) {
    return $.getJSON("./setup-number", {
        webhookUrl: webhookUrl,
        passcode: passcode
      })
      .then(function (data) {
        log("Ran phone number setup function...");
        let url = "https://www.twilio.com/console/phone-numbers/" + data.phoneNumberSid;
        phoneNumberStatus.html('provisioned! <a href="' + url +'">[Number Configuration]</a>');
        phoneNumberStatus.addClass('provisioned');
        number.html(data.phoneNumber);
        return data.phoneNumberSid;
      })
      .catch(function(err) {
        console.log(err);
        log("Phone number config failed!");
        throw new Error(err.details);
      });
  }

  /**
   *
   * Calling a relative URL which is to a Twilio Function
   * that will create a Sync Service to be used in this app.
   * The Function returns a sync service SID.
   *
   */

  function touchSyncService(passcode) {
    return $.getJSON("./setup-sync", { passcode: passcode })
      .then(function (data) {
        log("Ran sync setup function...");
        let url = "https://www.twilio.com/console/sync/services/" + data.syncServiceSid;
        syncStatus.html('provisioned! <a href="' + url +'">[View Service]</a>');
        syncStatus.addClass('provisioned');
        return data.syncServiceSid;
      })
      .catch(function(err) {
        console.log(err);
        log("Phone number config failed!");
        throw new Error(err.details);
      });
  }

  /**
   *
   * Our Twilio Function has already created a Sync List that
   * will store incoming posts. This will connect our website
   * to that list via the Sync SDK to listen for udpates.
   *
   * getSyncCreds() calls a Twilio Function that will return
   * a Sync token for our local Sync SDK to use to connect.
   *
   */
  
  function getSyncCreds(passcode) {
    log("Requesting Access Token...");
    return $.getJSON("./sync-token", { passcode: passcode })
      .then(function (data) {
        log("Got a token.");
        listName = data.listName;
        return data.token;
      })
      .catch(function(err) {
        console.log(err);
        log("Could not get a token from server!");
        throw new Error(err.details);
      });
  }

  /**
   *
   * startSync is called in our setup function above
   * to actually begin the Sync SDK's listening.
   *
   */

  function startSync(token) {
    log("Starting sync...");
    let syncClient = new Twilio.Sync.Client(token);

    // It's important to regenerate the token so that 
    // the page can be open a long time.

    syncClient.on('tokenAboutToExpire', function() {
      log("Token about to expire...");
      getSyncCreds(function(token) {
        syncClient.updateToken(token);
      });
    }); 
    
    // Here is where we actually bind ourselves to the
    // Sync List that contains our new posts to show!

    syncClient.list(listName).then(function(list) {
      window.syncList = list;
      list.on('itemAdded', function(result) {
        currentIndex = result.item.index;
        insertItemToPage(result.item.data); // Show the new image & caption
      });
    });

    overallStatus.html('Live');
  }

  /**
   *
   * This function takes data from our Sync List
   * and adds it to the page as HTML objects. 
   *
   */
  
  function insertItemToPage(data) {

    let currentImage = $('.image'); // Grab a copy of the current image

    $('<img class="image" src="'+ data.imgPath +'">').on('load', function() {

      cleanUpArray(); // Clear any previous animation
      initParticles(config.particleNumber, config.x, config.y); // Show the animation

      currentImage.remove(); // Remove the current image
      caption.empty(); // Remove the current caption

      $(this).prependTo(innerFrame); // Add the newly loaded image

      if (data.caption != "") { // Update and show the caption if they specified one
        caption.html(data.caption);
        caption.show();
      }
      else { // Else, hide the caption object
        caption.hide();
      }
    });
  }

  /**
   *
   * addLaunchButton called above in runSetup() 
   * once all steps are complete
   *
   */

  function addLaunchButton() {
    launchButton.attr('disabled', false);
    launchButton.html('Launch Photo Frame!');
    launchButton.on('click', openPhotoFrame);
    closeFrameButton.on('click', function() {
      photoFrame.fadeOut('fast');
    });
  }


  function openPhotoFrame() { // Tied to the button to open the frame
    photoFrame.fadeIn('fast');
  }

  function displayInitError(error) {
    console.log(`Error: ${error}`);
    alert("We're sorry, there was an issue with the installation. Please file a github issue on https://github.com/twilio-labs/function-templates and mention mms-photo-frame. Thank you!");
  }

  function runSetup(passcode) {
    // Run all of our Twilio resource setup functions
    touchStudioFlow(passcode)
      .then((webhookUrl) => touchPhoneNumber(webhookUrl, passcode))
      .then(() => touchSyncService(passcode))
      .then(() => getSyncCreds(passcode))
      .then((token) => startSync(token))
      .then(() => addLaunchButton())
      .catch(error => displayInitError(error));
  }

  function enableAskPassword() {
    passcodeButton.on('click', function() {
      $('.locked').hide();
      $('.unlocked').show();
      runSetup(passcodeInput.val());
    })
  }

  // eslint-disable-next-line no-use-before-define
  frame(); // Begin the 2d context for animations later
  enableAskPassword(); // Make the password work

});

/**
 *
 * The below code is all used to display the confetti every time
 * a new message/photo is displayed. It is used above as initParticles();
 * 
 * You can effectively consider this to be a module and not read through this.
 * But... it's pretty cool. Check it out!
 *
 * Credit: Dean Wagman https://codepen.io/deanwagman/pen/EjLBdQ
 */

let canvas = document.querySelector("#canvas"),
  ctx = canvas.getContext('2d');

// Set Canvas to be window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Configuration, Play with these
let config = {
  particleNumber: 250,
  maxParticleSize: 8,
  maxSpeed: 25,
  colorVariation: 5,
  x: window.innerWidth / 2,
  y: window.innerHeight / 2
};

// Colors
let colorPalette = {
  bg: {
    r: 14,
    g: 18,
    b: 41
  },
  matter: [{
      r: 177,
      g: 177,
      b: 207
    },
    {
      r: 223,
      g: 68,
      b: 77
    },
    {
      r: 255,
      g: 147,
      b: 153
    },
    {
      r: 223,
      g: 225,
      b: 240
    }
  ]
};

// Some Variables hanging out
let particles = [],
  centerX = canvas.width / 2,
  centerY = canvas.height / 2;

// Draws the background for the canvas, because space
const drawBg = function(ctx, color) {
  ctx.fillStyle = 'rgba(225,225,225,0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

// Particle Constructor
const Particle = function(x, y) {
  // X Coordinate
  this.x = x || Math.round(Math.random() * canvas.width);
  // Y Coordinate
  this.y = y || Math.round(Math.random() * canvas.height);
  // Radius of the space dust
  this.r = Math.ceil(Math.random() * config.maxParticleSize);
  // Color of the rock, given some randomness
  this.c = colorVariation(colorPalette.matter[Math.floor(Math.random() * colorPalette.matter.length)], true);
  // Speed of which the rock travels
  this.s = Math.pow(Math.ceil(Math.random() * config.maxSpeed), .7);
  // Direction the Rock flies
  this.d = Math.round(Math.random() * 360);
};

// Provides some nice color variation
// Accepts an rgba object
// returns a modified rgba object or a rgba string if true is passed in for argument 2
const colorVariation = function(color, returnString) {
  var r, g, b, a, variation;
  r = Math.round(((Math.random() * config.colorVariation) - (config.colorVariation / 2)) + color.r);
  g = Math.round(((Math.random() * config.colorVariation) - (config.colorVariation / 2)) + color.g);
  b = Math.round(((Math.random() * config.colorVariation) - (config.colorVariation / 2)) + color.b);
  a = Math.random() + .5;
  if (returnString) {
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  } else {
    return {
      r,
      g,
      b,
      a
    };
  }
};

// Used to find the rocks next point in space, accounting for speed and direction
const updateParticleModel = function(p) {
  var a = 180 - (p.d + 90); // find the 3rd angle
  p.d > 0 && p.d < 180 ? p.x += p.s * Math.sin(p.d) / Math.sin(p.s) : p.x -= p.s * Math.sin(p.d) / Math.sin(p.s);
  p.d > 90 && p.d < 270 ? p.y += p.s * Math.sin(a) / Math.sin(p.s) : p.y -= p.s * Math.sin(a) / Math.sin(p.s);
  return p;
};

// Just the function that physically draws the particles
// Physically? sure why not, physically.
const drawParticle = function(x, y, r, c) {

  ctx.beginPath();
  ctx.fillStyle = c;
  ctx.arc(x, y, r, 0, 2 * Math.PI, false);
  ctx.fill();
  ctx.closePath();
};

// Remove particles that aren't on the canvas
const cleanUpArray = function() {
  particles = particles.filter((p) => {
    return (p.x > -100 && p.y > -100);
  });
};


const initParticles = function(numParticles, x, y) {
  for (let i = 0; i < numParticles; i++) {
    particles.push(new Particle(x, y));
  }
  particles.forEach((p) => {
    drawParticle(p.x, p.y, p.r, p.c);
  });
};

const frame = function() {
  // Draw background first
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBg(ctx, colorPalette.bg);
  // Update Particle models to new position
  particles.map((p) => {
    return updateParticleModel(p);
  });
  // Draw em'
  particles.forEach((p) => {
    drawParticle(p.x, p.y, p.r, p.c);
  });
  // Play the same song? Ok!
  window.requestAnimationFrame(frame);
};
