import Benchmark from "benchmark";
import { format } from "../dist/std-format.esm.mjs";

const suite = new Benchmark.Suite();

const smallTemplate = "Hello, {name}!";
const smallData = { name: "World" };

const largeTemplate = "{greeting}, {name}! Today is {day}.".repeat(50);
const largeData = { greeting: "Hi", name: "Alice", day: "Monday" };

suite
    .add("Format small string", () => {
        format(smallTemplate, smallData);
    })
    .add("Format large string", () => {
        format(largeTemplate, largeData);
    })
    .on("cycle", (event) => {
        console.log(String(event.target));
    })
    .on("complete", function () {
        console.log("Fastest is " + this.filter("fastest").map("name"));
    })
    .run({ async: true });
