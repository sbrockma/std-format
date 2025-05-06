import Benchmark from "benchmark";
import { format } from "../dist/index.esm.mjs";

const tasks = [
    {
        name: "Format small string",
        template: "Hello, {name}!",
        data: { name: "World" }
    },
    {
        name: "Format large string",
        template: "{greeting}, {name}! Today is {day}.".repeat(50),
        data: { greeting: "Hi", name: "Alice", day: "Monday" }
    },
    {
        name: "Format fraction with fill and align",
        template: "{num:*^20.5f}",
        data: { num: Math.PI }
    },
];

const suite = new Benchmark.Suite();

tasks.forEach(d => {
    suite.add(d.name, () => format(d.template, d.data));
});

suite
    .on("cycle", (event) => {
        console.log(String(event.target));
    })
    .on("complete", function () {
        console.log("Fastest is " + this.filter("fastest").map("name"));
    })
    .run({ async: true });
