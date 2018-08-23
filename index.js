/* global hexo */
"use strict"

const vm = require("vm");
const babel = require("@babel/core");
const assert = require("assert");

const { createElement } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { renderStylesToString } = require("emotion-server");

assert(typeof hexo === "object",
  "Hexo is required to use `hexo-renderer-react-emotion`.");

function renderer (data, options) {
  if (!data.text) {
    console.error("Not enough stuff to render", data.path);
  }

  const sandbox = {
    require,
    exports: Object.create(null),
  };

  const babeled = babel.transform(data.text, {
    presets: [
      require.resolve("@babel/preset-env"),
      require.resolve("@babel/preset-react"),
    ],
  });

  vm.runInNewContext(babeled.code, sandbox, {
    displayErrors: true,
    filename: data.path,
  });

  return renderStylesToString(
            renderToStaticMarkup(
              createElement(sandbox.exports.default)));
}

hexo.extend.renderer.register("jsx", "html", renderer, true)
