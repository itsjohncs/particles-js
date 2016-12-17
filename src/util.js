module.exports = {
	rand: (min, max) => Math.random() * (max - min + 1) + min,
	clamp: (value, min, max) => Math.min(max, Math.max(value, min)),
};
