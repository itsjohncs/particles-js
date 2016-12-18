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
        return clamp(speed, 2, 10);
    }
}

class ParticleEngine {
    constructor({canvasSize, particles = [], gravityWells = [],
                 metaforces = []}) {
        this.canvasSize = canvasSize;
        this.particles = particles;
        this.gravityWells = gravityWells;
        this.metaforces = metaforces;
    }

    getForceOnParticle(particle) {
        // We're going to collect all the forces. We could just store the sum,
        // but keeping them all around for a sec isn't particularly slower and
        // makes debugging easier (just log the forces array if anything's
        // acting weird).
        const forces = [];

        // Get the forces from the gravity wells
        for (const gravityWell of this.gravityWells) {
            // Figure out the distance between the particle and the gravity
            // well, in addition to a normalized vector pointing from the
            // particle to the gravity well.
            const {magnitude: distance, normalizedVector: direction} = (
                gravityWell.position
                        .getDifference(particle.position)
                        .getNormalizedVectorAndMagnitude());

            // Determine the magnitude of the force this gravity well is
            // exerting on the particle. This isn't based on any real-world
            // force, and was found by playing around and seeing what looks
            // good.
            const forceMagnitude = clamp(
                BIG_G * gravityWell.mass * Math.min(1, 1 / distance),
                -0.1,
                0.1);

            forces.push(direction.getScaled(forceMagnitude));
        }

        // Now from the metaforces
        for (const metaforceFunc of this.metaforces) {
            forces.push(metaforceFunc(particle));
        }

        // Sum all the forces together
        return forces.reduce((a, b) => a.getSum(b), new Vector({x: 0, y: 0}));
    }

    getAdjustedVelocityWithWallBounce(particle) {
        let velocity = particle.velocity;

        if (particle.position.x > canvas.width) {
            velocity = velocity.getUpdated({
                x: -Math.abs(velocity.x),
            });
        } else if (particle.position.x < 0) {
            velocity = velocity.getUpdated({
                x: Math.abs(velocity.x),
            });
        }
        if (particle.position.y > canvas.height) {
            velocity = velocity.getUpdated({
                y: -Math.abs(velocity.y),
            });
        } else if (particle.position.y < 0) {
            velocity = velocity.getUpdated({
                y: Math.abs(velocity.y),
            });
        }

        return velocity;
    }

    step() {
        for (const particle of this.particles) {
            const force = this.getForceOnParticle(particle);
            particle.velocity = particle.velocity.getSum(force);

            // And add some friction (this is very important for
            // keeping the amount of "chaos" in the simulation down).
            particle.velocity = particle.velocity.getScaled(0.99);

            particle.velocity = (
                this.getAdjustedVelocityWithWallBounce(particle));

            // We have our final velocity! Now actually take a step in time
            // and apply that velocity to the particle's position.
            particle.position = particle.position.getSum(particle.velocity);
        }
    }

    draw(context) {
        context.fillStyle = "rgb(255, 255, 255)";
        context.fillRect(
            0,
            0,
            this.canvasSize.width,
            this.canvasSize.height);
        
        for (const particle of this.particles) {
            context.fillStyle = particle.fillStyle;

            const width = particle.getWidth();
            context.fillRect(
                particle.position.x - width / 2,
                particle.position.y - width / 2,
                width,
                width);
        }
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
