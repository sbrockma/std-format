import Benchmark from 'benchmark';
import Fmt from '../dist/std-format.esm.mjs';

// If you set "type": "module" in package.json then:
// const Benchmark = require('benchmark');
// const Fmt = require('../dist/std-format.cjs.js');

const suite = new Benchmark.Suite();

const smallTemplate = 'Hello, {name}!';
const smallData = { name: 'World' };

const largeTemplate = `
  {greeting}, {name}! Today is {day}.
  {greeting}, {name}! Today is {day}.
  {greeting}, {name}! Today is {day}.
  (repeat like 50-100 times for large strings)
`;

const largeData = { greeting: 'Hi', name: 'Alice', day: 'Monday' };

suite
    .add('Format small string', () => {
        Fmt.format(smallTemplate, smallData);
    })
    .add('Format large string', () => {
        Fmt.format(largeTemplate, largeData);
    })
    .on('cycle', (event) => {
        console.log(String(event.target));
    })
    .on('complete', function () {
        console.log('Fastest is ' + this.filter('fastest').map('name'));
    })
    .run({ async: true });
