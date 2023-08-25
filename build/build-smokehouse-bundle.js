/**
 * @license Copyright 2020 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import esbuild from 'esbuild';
import {nodeModulesPolyfillPlugin} from 'esbuild-plugins-node-modules-polyfill';

import * as plugins from './esbuild-plugins.js';
import {LH_ROOT} from '../root.js';
import { builtinModules } from 'module';

const distDir = `${LH_ROOT}/dist`;
const bundleOutFile = `${distDir}/smokehouse-bundle.js`;
const smokehouseLibFilename = './cli/test/smokehouse/frontends/lib.js';
const smokehouseCliFilename = `${LH_ROOT}/cli/test/smokehouse/lighthouse-runners/cli.js`;

async function main() {
  await esbuild.build({
    entryPoints: [smokehouseLibFilename],
    outfile: bundleOutFile,
    format: 'cjs',
    bundle: true,
    plugins: [
      plugins.replaceModules({
        [smokehouseCliFilename]:
          'export function runLighthouse() { throw new Error("not supported"); }',
        'module': `
          export const createRequire = () => {
            return {
              resolve() {
                throw new Error('createRequire.resolve is not supported in bundled Lighthouse');
              },
            };
          };
        `,
        // Our node modules polyfill plugin does not support assert/strict.
        'assert/strict': `
          import assert from 'assert';
          export default assert;
        `,
      }),
      plugins.bulkLoader([
        plugins.partialLoaders.inlineFs({verbose: Boolean(process.env.DEBUG)}),
        plugins.partialLoaders.rmGetModuleDirectory,
      ]),
      nodeModulesPolyfillPlugin({
        modules: builtinModules.filter(mod => mod !== 'process'),
      }),
      plugins.ignoreBuiltins(),
    ],
  });
}

await main();
