/* global hexo */
"use strict"

const vm = require("vm");
const { dirname } = require("path");
const assert = require("assert");

const { createElement } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { renderStylesToString } = require("emotion-server");

assert(typeof hexo === "object",
  "Hexo is required to use `hexo-renderer-react-emotion`.");

const babelOptions = {
  presets: [
    require.resolve("@babel/preset-env"),
    require.resolve("@babel/preset-react"),
  ],
  extensions: [".jsx", ".js"],
};

function renderer (data, options) {
  if (!data.text) {
    console.error("Not enough stuff to render", data.path);
  }

  const sandbox = {
    require,
    ____babelOptions: {
      ...babelOptions,
      cwd: dirname(data.path),
    },
    console: {
      log(...args) { console.log(...args) },
      error(...args) { console.error(...args) },
    },
    exports: Object.create(null),
  };

  const code = `
    require("@babel/register")(____babelOptions);
    exports = require(${JSON.stringify(data.path)});
  `;

  try {
    vm.runInNewContext(code, sandbox, {
      displayErrors: true,
    });
  } catch (err) {
    console.error("ERROR", err);
  }

  assert(sandbox.exports && typeof sandbox.exports.default === "function",
    `Must export a 'default' export from ${data.path}`);

  return renderStylesToString(
            renderToStaticMarkup(
              createElement(sandbox.exports.default)));
}

hexo.extend.renderer.register("jsx", "html", renderer, true)
