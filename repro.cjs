const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const { transformSync } = require('@swc/core');
const { GenMapping, addSegment, setSourceContent, toEncodedMap } = require('@jridgewell/gen-mapping');
const { TraceMap, originalPositionFor } = require('@jridgewell/trace-mapping');

const filename = path.join(__dirname, 'component.jsx');
const source = 'export const element =\n  <div />;\nthrow new Error("marker");\n';
const original = '\n'.repeat(6) + source;
const upstream = new GenMapping();
setSourceContent(upstream, filename, original);
source.split('\n').forEach((text, line) => {
  for (let column = 0; column <= text.length; column++) {
    addSegment(upstream, line, column, filename, line + 6, column);
  }
});
const { code, map } = transformSync(source, {
  filename, configFile: false, swcrc: false, sourceMaps: true,
  inputSourceMap: JSON.stringify(toEncodedMap(upstream)),
  jsc: {
    parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022',
    transform: { react: { runtime: 'classic', development: true } },
  },
  module: { type: 'commonjs' },
});
const context = vm.createContext({ exports: {}, React: { createElement: (_type, props) => props } });
try { vm.runInContext(code, context); } catch (error) { assert.equal(error.message, 'marker'); }
const lines = code.split('\n');
const line = lines.findIndex(text => text.includes('new Error("marker")'));
assert.ok(line >= 0, 'Expected the retained error expression');
const runtime = originalPositionFor(new TraceMap(map), {
  line: line + 1, column: lines[line].indexOf('new Error('),
});
const jsxSource = context.exports.element.__source;
console.log(JSON.stringify({ runtime, jsxSource, expectedJsxLine: 8, expectedRuntimeLine: 9 }, null, 2));
assert.equal(runtime.line, 9, 'The emitted source map should follow the incoming map');
assert.equal(jsxSource.lineNumber, 8, 'JSX diagnostics should follow the same incoming map');
