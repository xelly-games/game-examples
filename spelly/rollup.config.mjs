import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import url from '@rollup/plugin-url';

export default {
    input: 'src/main.ts',
    external: ['excalibur', '@xelly/xelly.js'],
    plugins: [url({
        include: ['**/*.woff'],
        limit: Infinity, // always inline
        emitFiles: false, // always inline
    }), typescript(), resolve()],
    output: {
        file: 'dist/bundle.js',
        format: 'iife',
        name: 'Game',
        globals: {
            'excalibur': 'Excal',
            '@xelly/xelly.js': 'Xelly'
        },
        plugins: [terser()]
    }
};
