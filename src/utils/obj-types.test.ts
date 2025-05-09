import { getArrayDepth, isArray, isMap, isRecord } from "./obj-types";

describe("Testing util obj-types functions", () => {

    it("isArray", () => {
        expect(isArray(undefined)).toEqual(false);
        expect(isArray(null)).toEqual(false);
        expect(isArray(0)).toEqual(false);
        expect(isArray("0")).toEqual(false);
        expect(isArray({})).toEqual(false);
        expect(isArray(() => { })).toEqual(false);
        expect(isArray([])).toEqual(true);
        expect(isArray([0])).toEqual(true);
        expect(isArray(["0"])).toEqual(true);
    });

    it("isRecord", () => {
        expect(isRecord(undefined)).toEqual(false);
        expect(isRecord(null)).toEqual(false);
        expect(isRecord(0)).toEqual(false);
        expect(isRecord("0")).toEqual(false);
        expect(isRecord({})).toEqual(true);
        expect(isRecord(() => { })).toEqual(false);
        expect(isRecord([])).toEqual(false);
        expect(isRecord(new Map())).toEqual(false);
        expect(isRecord(new Set())).toEqual(false);
        expect(isRecord(new Date())).toEqual(false);
        expect(isRecord(new Error("Oops!"))).toEqual(false);
    });

    it("isMap", () => {
        expect(isMap(undefined)).toEqual(false);
        expect(isMap(null)).toEqual(false);
        expect(isMap(0)).toEqual(false);
        expect(isMap("0")).toEqual(false);
        expect(isMap({})).toEqual(false);
        expect(isMap(() => { })).toEqual(false);
        expect(isMap([])).toEqual(false);
        expect(isMap(new Map([]))).toEqual(true);
    });

    it("getArrayDepth", () => {
        expect(getArrayDepth(undefined)).toEqual(0);
        expect(getArrayDepth(null)).toEqual(0);
        expect(getArrayDepth(0)).toEqual(0);
        expect(getArrayDepth("0")).toEqual(0);
        expect(getArrayDepth(() => { })).toEqual(0);
        expect(getArrayDepth([])).toEqual(1);
        expect(getArrayDepth([0, 1, 2])).toEqual(1);
        expect(getArrayDepth([[0], [1], [2]])).toEqual(2);
        expect(getArrayDepth([[[0], [1]], [2]])).toEqual(3);
        expect(getArrayDepth([0, [1, 2]])).toEqual(2);
        expect(getArrayDepth([[], "0"])).toEqual(2);
        expect(getArrayDepth({})).toEqual(1);
        expect(getArrayDepth([{}])).toEqual(2);
        expect(getArrayDepth({ A: [] })).toEqual(2);
    });
});
