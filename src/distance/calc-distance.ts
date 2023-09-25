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
    const uint8Array = pako.inflate(await fs.readFile(`./bin/${len}-data.bin`));
    const countList = (await fs.readFile(`./bin/${len}-index.txt`))
      .toString()
      .split("\n")
      .map((e) => parseInt(e));
    const resultMap: Map<String, number> = new Map();
    let currentIndex = 0;
    let indexCount = 0;
    let temp: number[] = [];
    for (let i = 0; i < uint8Array.length; i++) {
      const byte = uint8Array[i];
      for (let j = 0; j < 2; j++) {
        const count = j ? (byte >> 2) & 0b11 : (byte >> 6) & 0b11;
        const gap = j ? byte & 0b11 : (byte >> 4) & 0b11;
        temp.push(count);
        temp.push(gap);
        if (gap === 0b11 && temp.length !== 0) {
          if (indexCount >= countList[currentIndex]) {
            currentIndex++;
            indexCount = 0;
          }
          indexCount++;
          resultMap.set(
            fromByteArray(numberListToUInt8Array(temp)),
            currentIndex
          );
          temp = [];
        }
      }
    }
    return resultMap;
  } catch (e) {
    console.error(e);
    return new Map();
  }
};

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

  let total = 0;
  for (let i = 0; i < sheet.length; i++) {
    for (let j = 0; j < sheet[i].length; j++) {
      total += sheet[i][j];
    }
  }
  if (total % 3 !== 2) {
    return -1;
  }
  const pattern = sheetToBase64Pattern(sheet);
  return loadedData.get(pattern) ?? -1;
};
