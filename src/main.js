const Vector = require("./vector.js");
const {clamp, rand} = require("./util.js");

class Particle {
    constructor({position, velocity, fillStyle}) {
        this.position = position;
        this.velocity = velocity;
        this.fillStyle = fillStyle;
    }
    
    getWidth() {
        const {magnitude: speed} = this.velocity.getNormalizedVectorAndMagnitude();
        return clamp(speed, 1, 10);
    }
}

const canvas = document.getElementById("particleCanvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const context = canvas.getContext("2d");

const bufferCanvas = document.getElementById("particleCanvasBuffer");
bufferCanvas.width = window.innerWidth;
bufferCanvas.height = window.innerHeight;
const bufferContext = bufferCanvas.getContext("2d");


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
}

let particles = createRandomParticles(500);

const BIG_G = 10;
const gravityWell = {
    position: new Vector({
        x: canvas.width / 2,
        y: canvas.height / 2,
    }),
    mass: 1,
};

const draw = function() {
    bufferContext.fillStyle = "rgb(255, 255, 255)";
    bufferContext.fillRect(0, 0, canvas.width, canvas.height);
    
    for (const particle of particles) {
        bufferContext.fillStyle = particle.fillStyle;
        const width = particle.getWidth();
        bufferContext.fillRect(
            particle.position.x - width / 2,
            particle.position.y - width / 2,
            width,
            width);
    }

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

const step = function() {
    for (const particle of particles) {
        // Figure out the amount of "force" being exerted on the particle (this
        // force will be added to its velocity).
        const {magnitude: distance, normalizedVector: direction} = (
            gravityWell.position
                    .getDifference(particle.position)
                    .getNormalizedVectorAndMagnitude());
        const force = clamp(
            BIG_G * gravityWell.mass * Math.min(1, 1 / distance),
            -0.1,
            0.1);

        // Determine the particle's new velocity we'd like
        particle.velocity = (
            particle.velocity
                    // Add the force
                    .getSum(direction.getScaled(force))
                    // And add some friction (this is very important for
                    // keeping the amount of "chaos" in the simulation down).
                    .getScaled(0.99));

        // Adjust that velocity if we're out of bounds (this makes the
        // particles bounce).
        if (particle.position.x > canvas.width) {
            particle.velocity = particle.velocity.getUpdated({
                x: -Math.abs(particle.velocity.x),
            });
        } else if (particle.position.x < 0) {
            particle.velocity = particle.velocity.getUpdated({
                x: Math.abs(particle.velocity.x),
            });
        }
        if (particle.position.y > canvas.height) {
            particle.velocity = particle.velocity.getUpdated({
                y: -Math.abs(particle.velocity.y),
            });
        } else if (particle.position.y < 0) {
            particle.velocity = particle.velocity.getUpdated({
                y: Math.abs(particle.velocity.y),
            });
        }

        // Finally, apply the velocity to get the new position!
        particle.position = particle.position.getSum(particle.velocity);
    }

    drawController.requestDraw();
};

setInterval(() => {
    step();
}, 20);

window.requestAnimationFrame(draw);

canvas.addEventListener("mousemove", function(e) {
    gravityWell.position = new Vector({
        x: e.clientX,
        y: e.clientY,
    });
});

canvas.addEventListener("mousedown", function(e) {
    gravityWell.mass = -Math.abs(gravityWell.mass);
});

canvas.addEventListener("mouseup", function(e) {
    gravityWell.mass = Math.abs(gravityWell.mass);
});

window.addEventListener("keyup", function(e) {
    if (e.keyCode === 32) {
        particles = createRandomParticles(500);
    }
});


const moveGravityWellForTouch = function(touchEvent) {
    if (touchEvent.touches.length === 0) {
        return;
    }

    const touch = touchEvent.touches[0];
    gravityWell.position = new Vector({
        x: touch.pageX,
        y: touch.pageY,
    });

    touchEvent.preventDefault();
};

canvas.addEventListener("touchstart", moveGravityWellForTouch);
canvas.addEventListener("touchmove", moveGravityWellForTouch);
