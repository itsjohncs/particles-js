const Vector = require("./vector.js");
const {clamp, rand} = require("./util.js");
const {ParticleEngine, Particle} = require("./particleEngine.js");

// This is the canvas that's visible to our user
const canvas = document.getElementById("particleCanvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const context = canvas.getContext("2d");

// This is our hidden canvas we'll use as a buffer
const bufferCanvas = document.getElementById("particleCanvasBuffer");
bufferCanvas.width = canvas.width;
bufferCanvas.height = canvas.height;
const bufferContext = bufferCanvas.getContext("2d");

// Creates some number of random particles scatterred across the screen
const createRandomParticles = function(numParticles) {
    const particles = [];
    for (let i = 0; i < numParticles; ++i) {
        particles.push(new Particle({
            position: new Vector({
                x: rand(0, canvas.width),
                y: rand(0, canvas.height),
            }),
            velocity: new Vector({x: 0, y: 0}),
            fillStyle: "rgba(200, 0, 0, 0.4)",
        }));
    }

    return particles;
};

// This is our core and handles applying the various forces to our lovely
// little particles.
const engine = new ParticleEngine({
    canvasSize: {width: canvas.width, height: canvas.height},
    particles: createRandomParticles(500),
    metaforces: [
        // This'll give us some random motion in the beggining
        (particle) => {
            // TODO(johnsullivan): rand should be [a, b) and not [a, b] or
            //     whatever its purporting to be... It's actually [a, b + 1)
            //     right now...
            return new Vector({
                x: rand(-1, 0) * 0.2,
                y: rand(-1, 0) * 0.2,
            });
        },
    ]
});

// This is what actually schedules draws with the browser, as well as what
// determines and displays the FPS.
const drawController = new (function() {
    this.pendingFrame = null;

    this.fpsData = {
        rollingSum: 0,
        rollingSumNumSamples: 0,
        lastDrawnFrameTimestamp: null,
    };

    const doDraw = (now) => {
        engine.draw(bufferContext);
        context.drawImage(bufferCanvas, 0, 0);

        this.pendingFrame = null;
        this.recordFrameDrawnForFPS(now);
    };

    this.recordFrameDrawnForFPS = (now) => {
        if (this.fpsData.lastDrawnFrameTimestamp !== null) {
            const millisecondsSinceLastDraw = (
                now - this.fpsData.lastDrawnFrameTimestamp);
            const fps = 1000 / millisecondsSinceLastDraw;
            this.fpsData.rollingSum += fps;
            this.fpsData.rollingSumNumSamples += 1;
        }

        if (this.fpsData.rollingSumNumSamples > 50) {
            const averageFPS = (
                this.fpsData.rollingSum / this.fpsData.rollingSumNumSamples);
            document.getElementById("fps").innerHTML = (
                "" + Math.round(averageFPS));

            this.fpsData.rollingSum = 0;
            this.fpsData.rollingSumNumSamples = 0;
        }

        this.fpsData.lastDrawnFrameTimestamp = now;
    };

    this.requestDraw = () => {
        if (!this.pendingFrame) {
            this.pendingFrame = window.requestAnimationFrame(doDraw);
        }
    };
})();

// Have the engine step on an interval rather than pairing it with how quickly
// we can draw. This is a pretty cheapo/not-the-most-effective way to deal
// with different computer's processing speeds...
setInterval(() => {
    engine.step();
    drawController.requestDraw();
}, 20);

let clickHintVisible = false;
let clickHint = setTimeout(function() {
    document.getElementById("click-hint").style.opacity = 1;
    clickHintVisible = true;
}, 5000);
const hideClickHint = function() {
    if (clickHint) {
        clearTimeout(clickHint);
        clickHint = null;
    }

    if (clickHintVisible) {
        document.getElementById("click-hint").style.opacity = 0;
        clickHintVisible = false;
    }
};

canvas.addEventListener("mousemove", function(e) {
    if (engine.gravityWells.length === 0) {
        return;
    }

    engine.gravityWells[0].position = new Vector({
        x: e.clientX,
        y: e.clientY,
    });
});

canvas.addEventListener("mousedown", function(e) {
    engine.gravityWells = [{
        position: new Vector({
            x: e.clientX,
            y: e.clientY,
        }),
        mass: -1,
    }];

    // Clear out any metaforces (this is a heavy-handed way to stop the
    // brownian motion we have going at the beginning).
    engine.metaforces = [];

    hideClickHint();
});

canvas.addEventListener("mouseup", function(e) {
    engine.gravityWells = [{
        position: new Vector({
            x: e.clientX,
            y: e.clientY,
        }),
        mass: 1,
    }];
});

window.addEventListener("keyup", function(e) {
    if (e.keyCode === 32) {
        engine.particles = createRandomParticles(500);
    }
});


const moveGravityWellForTouch = function(touchEvent) {
    // We never wanna let the user scroll or create an implicit click event
    touchEvent.preventDefault();

    // If the user takes their fingers off the screen, we want to leave any
    // gravity wells that existed previously right where they are. This lets
    // people see the cool swirling more easily.
    if (touchEvent.touches.length === 0) {
        return;
    }

    // Createa gravity well at each touch point
    const gravityWells = [];
    for (let i = 0; i < touchEvent.touches.length; ++i) {
        const touch = touchEvent.touches[i];
        gravityWells.push({
            mass: 1,
            position: new Vector({
                x: touch.pageX,
                y: touch.pageY,
            }),
        });
    }
    engine.gravityWells = gravityWells;

    // Clear out any metaforces (this is a heavy-handed way to stop the
    // brownian motion we have going at the beginning).
    engine.metaforces = [];

    hideClickHint();
};

canvas.addEventListener("touchstart", moveGravityWellForTouch);
canvas.addEventListener("touchmove", moveGravityWellForTouch);

// Resize everything when the window resizes
let queuedResize = null;
window.addEventListener("resize", function(event) {
    if (queuedResize) {
        return;
    }

    queuedResize = window.requestAnimationFrame(function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        bufferCanvas.width = canvas.width;
        bufferCanvas.height = canvas.height;

        engine.canvasSize.width = canvas.width;
        engine.canvasSize.height = canvas.height;

        queuedResize = null;
    });
});
