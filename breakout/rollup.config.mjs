import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default {
    input: 'src/main.ts',
    external: ['excalibur', '@xelly/xelly.js'],
    plugins: [typescript()],
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
