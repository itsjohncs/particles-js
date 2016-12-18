const Vector = require("./vector.js");
const {clamp, rand} = require("./util.js");
const {ParticleEngine, Particle} = require("./particleEngine.js");


const canvas = document.getElementById("particleCanvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const context = canvas.getContext("2d");

const bufferCanvas = document.getElementById("particleCanvasBuffer");
bufferCanvas.width = window.innerWidth;
bufferCanvas.height = window.innerHeight;
const bufferContext = bufferCanvas.getContext("2d");

const engine = new ParticleEngine({
    canvasSize: {width: window.innerWidth, height: window.innerHeight},
});

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

engine.particles = createRandomParticles(500);

const BIG_G = 10;
engine.gravityWells.push({
    position: new Vector({
        x: canvas.width / 2,
        y: canvas.height / 2,
    }),
    mass: 0,
});

const draw = function() {
    engine.draw(bufferContext);

    context.drawImage(bufferCanvas, 0, 0);
};

const drawController = new (function() {
    this.pendingFrame = null;

    this.fpsData = {
        rollingSum: 0,
        rollingSumNumSamples: 0,
        lastDrawnFrameTimestamp: null,
    };

    const doDraw = (now) => {
        draw();
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

const brownianMotionForce = function(particle) {
    // TODO(johnsullivan): rand should be [a, b) and not [a, b] or whatever
    //     its purporting to be... It's actually [a, b + 1) right now...
    return new Vector({
        x: rand(-1, 0) * 0.2,
        y: rand(-1, 0) * 0.2,
    });
};

engine.metaforces.push(brownianMotionForce);

const step = function() {
    engine.step();
    drawController.requestDraw();
};

setInterval(() => {
    step();
}, 20);

window.requestAnimationFrame(draw);

canvas.addEventListener("mousemove", function(e) {
    engine.gravityWells[0].position = new Vector({
        x: e.clientX,
        y: e.clientY,
    });
});

canvas.addEventListener("mousedown", function(e) {
    engine.gravityWells[0].mass = -1;
    engine.metaforces = [];
});

canvas.addEventListener("mouseup", function(e) {
    engine.gravityWells[0].mass = 1;
});

window.addEventListener("keyup", function(e) {
    if (e.keyCode === 32) {
        engine.particles = createRandomParticles(500);
    }
});


const moveGravityWellForTouch = function(touchEvent) {
    if (touchEvent.touches.length === 0) {
        return;
    }

    const touch = touchEvent.touches[0];
    engine.gravityWells[0].mass = 1;
    engine.gravityWells[0].position = new Vector({
        x: touch.pageX,
        y: touch.pageY,
    });

    engine.metaforces = [];

    touchEvent.preventDefault();
};

canvas.addEventListener("touchstart", moveGravityWellForTouch);
canvas.addEventListener("touchmove", moveGravityWellForTouch);
