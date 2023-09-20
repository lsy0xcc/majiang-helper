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
    const resultSetList: Set<String>[] = [];
    let currentIndex = 0;
    for (let i = 0; i < countList.length; i++) {
      resultSetList.push(new Set<string>());
    }
    patternList.forEach((e) => {
      if (resultSetList[currentIndex].size >= countList[currentIndex]) {
        currentIndex++;
      }
      resultSetList[currentIndex].add(e);
    });

    return resultSetList;
  } catch (e) {
    console.error(e);
    return [];
  }
};
export const searchDistance = async (
  input: string,
  loadedData?: Set<String>[]
) => {
  const sheet = inputToSheet(input);
  if (!sheet?.length) {
    return -1;
  }
  const sum = (arr: number[]) => arr.reduce((prev, curr) => prev + curr);
  const total = sum(sheet.map(sum));
  if (total % 3 !== 2) {
    return -1;
  }
  const pattern = sheetToBase64Pattern(sheet);

  const mapData = loadedData ?? (await readFromFile());
  for (let i = 0; i < mapData.length; i++) {
    if (mapData[i].has(pattern)) {
      return i;
    }
  }
  return -1;
};
