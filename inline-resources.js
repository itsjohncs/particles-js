const inliner = require("inline-resource");
const result = inliner.inline({
    inlineAll: true,
    files: ["build/compressed/index.htm"],
    css: true,
    js: true,
});
console.log(result[0].data);
