module.exports = {
	// This is kinda weird, range is [min, max + 1)... Don't judge me.
	rand: (min, max) => Math.random() * (max - min + 1) + min,
	clamp: (value, min, max) => Math.min(max, Math.max(value, min)),
};
