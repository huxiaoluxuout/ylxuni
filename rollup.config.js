import terser from '@rollup/plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
    input: 'index.js',
    output: {
        file: 'dist/ylxuni.esm.js',
        format: 'esm',
        inlineDynamicImports: true,
    },

    external: ['uni','wx','vue'],
    plugins: [
        resolve(),
        commonjs(),
        terser({
            compress: {
                dead_code: true,
                drop_debugger: true,
                conditionals: true,
                evaluate: true,
                booleans: true,
                loops: true,
                unused: true,
                hoist_funs: true,
                keep_fargs: false,
                hoist_vars: true,
                if_return: true,
                join_vars: true,
                side_effects: true,
                warnings: false
            },
            mangle: true,
        })
    ]
}
