import typescript from "@rollup/plugin-typescript";
import babel from "rollup-plugin-babel";
import sourceMaps from "rollup-plugin-sourcemaps";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from '@rollup/plugin-commonjs';
import json from 'rollup-plugin-json';

export default {
  input: "./src/index.ts",
  external:["tslib","@antv/g6"],
  plugins: [
    typescript(),
    resolve(),
    commonjs(),
    json(),
    sourceMaps(),
    babel({
      exclude:'node_modules/**'
    })
  ],

  output: [
    {
      format: "es",
      file: "lib/bundle.esm.js",
      sourcemap: true
    }
  ]
};
