class Vector {
    constructor({x, y}) {
        this.x = x;
        this.y = y;
    }
    
    getDistance(other) {
        return Math.sqrt(
            Math.pow(other.x - this.x, 2) +
            Math.pow(other.y - this.y, 2));
    }
    
    getDifference(other) {
        return new Vector({
            x: this.x - other.x,
            y: this.y - other.y,
        });
    }
    
    getNormalizedVectorAndMagnitude() {
        const magnitude = Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
        return {
            magnitude,
            normalizedVector: new Vector({
                x: this.x / magnitude,
                y: this.y / magnitude,
            }),
        };
    }
    
    getScaled(scalar) {
        return new Vector({
            x: this.x * scalar,
            y: this.y * scalar,
        });
    }
    
    getSum(other) {
        return new Vector({
            x: this.x + other.x,
            y: this.y + other.y,
        });
    }

    getUpdated({x, y}) {
        return new Vector({
            x: x === undefined ? this.x : x,
            y: y === undefined ? this.y : y,
        });
    }
}

module.exports = Vector;
