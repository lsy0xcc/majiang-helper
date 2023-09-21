import * as fs from "node:fs/promises";
import pako from "pako";
import {
  inputToSheet,
  numberListToUInt8Array,
  sheetToBase64Pattern,
} from "./calc-distance-util";
import { fromByteArray } from "base64-js";
const len = 14;

export const readFromFile = async () => {
  try {
    const resultList: number[][] = [];
    let tempList: number[] = [];
    [...pako.inflate(await fs.readFile(`./bin/${len}-data.bin`))]
      .map((e) => [
        [(e >> 6) & 0b11, (e >> 4) & 0b11],
        [(e >> 2) & 0b11, e & 0b11],
      ])
      .flat()
      .forEach((e) => {
        tempList.push(e[0], e[1]);
        if (e[1] == 0b11) {
          resultList.push(tempList);
          tempList = [];
        }
      });
    const patternList = resultList.map((e) =>
      fromByteArray(numberListToUInt8Array(e))
    );
    const countList = (await fs.readFile(`./bin/${len}-index.txt`))
      .toString()
      .split("\n")
      .map((e) => parseInt(e));
    const resultMapList: Map<String, number> = new Map();
    let currentIndex = 0;
    let count = 0;
    patternList.forEach((e) => {
      if (count >= countList[currentIndex]) {
        currentIndex++;
        count = 0;
      }
      count++;
      resultMapList.set(e, currentIndex);
    });

    return resultMapList;
  } catch (e) {
    console.error(e);
    return new Map();
  }
};
const sum = (arr: number[]) => arr.reduce((prev, curr) => prev + curr);
export const searchDistance = (
  input: string,
  loadedData: Map<string, number>
) => {
  if (!loadedData) {
    return -1;
  }
  const sheet = inputToSheet(input);
  if (!sheet?.length) {
    return -1;
  }

  const total = sum(sheet.map(sum));
  if (total % 3 !== 2) {
    return -1;
  }
  const pattern = sheetToBase64Pattern(sheet);
  return loadedData.get(pattern) ?? -1;
};
