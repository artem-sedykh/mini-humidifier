import resolve from 'rollup-plugin-node-resolve';

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/mini-humidifier-bundle.js',
    format: 'umd',
    name: 'MiniHumidifier',
  },
  plugins: [
    resolve(),
  ],
};
