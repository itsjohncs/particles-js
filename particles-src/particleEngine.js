const Vector = require("./vector.js");
const {clamp} = require("./util.js");

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
                 metaforces = [], big_g = 10}) {
        this.canvasSize = canvasSize;
        this.particles = particles;
        this.gravityWells = gravityWells;
        this.metaforces = metaforces;
        this.big_g = big_g;
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
                this.big_g * gravityWell.mass * Math.min(1, 1 / distance),
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

        if (particle.position.x > this.canvasSize.width) {
            velocity = velocity.getUpdated({
                x: -Math.abs(velocity.x),
            });
        } else if (particle.position.x < 0) {
            velocity = velocity.getUpdated({
                x: Math.abs(velocity.x),
            });
        }
        if (particle.position.y > this.canvasSize.height) {
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
        context.fillStyle = "rgba(255, 255, 255, 0.7)";
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

module.exports = {Particle, ParticleEngine};
