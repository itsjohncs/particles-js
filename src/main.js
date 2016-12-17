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

const particles = [];
for (let i = 0; i < 500; ++i) {
    particles.push(new Particle({
        position: new Vector({
            x: rand(0, canvas.width),
            y: rand(0, canvas.height),
        }),
        velocity: new Vector({x: 0, y: 0}),
        fillStyle: "rgb(200, 0, 0)",
    }));
}

const BIG_G = 50;
const gravityWell = {
    position: new Vector({
        x: canvas.width / 2,
        y: canvas.height / 2,
    }),
    mass: 1,
};

const draw = function() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    for (const particle of particles) {
        context.fillStyle = particle.fillStyle;
        const width = particle.getWidth();
        context.fillRect(
            particle.position.x - width / 2,
            particle.position.y - width / 2,
            width,
            width);
    }

    window.requestAnimationFrame(draw);
};

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
        // particles bouncde).
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
};

setInterval(() => {
    step();
}, 20);

window.requestAnimationFrame(draw);

canvas.addEventListener("mousemove", function(e) {
    gravityWell.position.x = e.clientX;
    gravityWell.position.y = e.clientY;
});

canvas.addEventListener("click", function(e) {});

canvas.addEventListener("mouseout", function(e) {
    gravityWell.position.x = e.clientX;
    gravityWell.position.y = e.clientY;
});
