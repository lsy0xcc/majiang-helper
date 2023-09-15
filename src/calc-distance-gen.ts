import * as readline from "readline";
import * as fs from "node:fs/promises";
import {
  compareList,
  patternToSheet,
  sheetToPattern,
} from "./calc-distance-util";
import { calcDistance } from "./calc-distance";
import { readFile } from "fs";

// decompose the input to a sum af a list of number
const generateCount = (input: number, maxCount: number) => {
  const resultList: number[][][] = [[[0]]];
  for (let i = 1; i <= input; i++) {
    let newSolution: number[][] = [];
    for (let j = 1; j <= maxCount; j++) {
      newSolution = newSolution.concat(pushNewCount(j, i, resultList));
    }
    resultList.push(newSolution);
  }
  return resultList.map((e2) =>
    e2.map((e1) => {
      e1.shift();
      return e1;
    })
  );
};

const pushNewCount = (
  addNumber: number,
  currentNumber: number,
  resultList: number[][][]
) => {
  const baseNumber = currentNumber - addNumber;
  if (baseNumber < 0) {
    return [];
  } else {
    return resultList[baseNumber].map((e) => [...e, addNumber]);
  }
};

// generate the gap of each number
const generateGap = (input: number, type: number) => {
  const result = [[[0]]];
  for (let i = 1; i <= input; i++) {
    result[i] = pushNewGap(result[i - 1], type);
  }
  return result.map((e2) =>
    e2.map((e1) => {
      e1.shift();
      return e1;
    })
  );
};

const pushNewGap = (prevList: number[][], type: number) => {
  return prevList
    .map((list) => [...new Array(type).keys()].map((add) => [...list, add]))
    .flat();
};

// return the map of all result, key is pattern and value is distance

const generateResultMap = (
  list: string[],
  tempMap: Map<string, number>,
  calcNumber = 10000
) => {
  let sum = tempMap.size;
  const startTime = new Date().getTime();
  const total = list.length;
  const map: Map<string, number> = new Map(tempMap);
  const endIndex = Math.min(tempMap.size + calcNumber, list.length);
  for (let i = tempMap.size; i < endIndex; i++) {
    const pattern = list[i];
    const sheet: number[][] = patternToSheet(pattern);
    if (!map.has(pattern)) {
      sum++;
      map.set(pattern, calcDistance(sheet));
    }
    if (sum % 1000 === 0) {
      const text = `\r\x1b[K${sum}/${total} ${((sum / total) * 100).toFixed(
        4
      )}% total:${(new Date().getTime() - startTime) / 1000}s`;
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(text);
    }
  }
  console.log(
    `\n${sum - tempMap.size}generated ${
      (new Date().getTime() - startTime) / 1000
    }s`
  );
  return map;
};

const generateResultSet = (len: number) => {
  console.log("generating");
  // { patternSum: 1292059, calcSum: 1058213 }
  const allSmallerCount = [];
  let curr = 2;
  while (curr <= len) {
    allSmallerCount.push(curr);
    curr += 3;
  }
  const countSheet = generateCount(len, 4);
  const countLists = allSmallerCount.map((e) => countSheet[e]).flat();
  const gapSheet = generateGap(len - 1, 3);
  const set = new Set<string>();
  countLists.forEach((countList, _index) => {
    const gapLists = gapSheet[countList.length - 1];
    gapLists.forEach((gapList) => {
      // generate sheet from gap and count
      const result: number[][] = [];
      let temp: number[] = [];
      for (let i = 0; i < countList.length; i++) {
        temp.push(countList[i]);
        if (gapList[i]) {
          switch (gapList[i]) {
            case 1:
              temp.push(0);
              break;
            case 2:
              result.push(temp);
              temp = [];
              break;
          }
        }
      }
      result.push(temp);

      const isMoreThanMax = result.reduce(
        (prev, curr) => prev && curr.length <= 9,
        true
      ); // if the list longer than 9, not a correct list
      const pattern = sheetToPattern(result);
      if (isMoreThanMax && !set.has(pattern)) {
        set.add(pattern);
      }
    });
  });
  console.log(`generated total:${set.size}`);
  return set;
};

export const writeSetToFile = async () => {
  // 87864ms
  // 100176ms

  try {
    await fs.mkdir("./output");
  } catch {}
  try {
    await fs.access(`./output/${len}-list.txt`);
  } catch {
    const resultSet = generateResultSet(len);
    await fs.writeFile(`./output/${len}-list.txt`, [...resultSet].join("\n"));
  }
};

export const readTempAndSet = async () => {
  let list: string[] = [];
  const map: Map<string, number> = new Map();
  try {
    list = (await fs.readFile(`./output/${len}-list.txt`))
      .toString()
      .split("\n");
    const mapList = (await fs.readFile(`./output/${len}-temp.txt`))
      .toString()
      .split("\n");

    mapList.forEach((e) => {
      const [pattern, distance] = e.split(">");
      map.set(pattern, parseInt(distance));
    });
  } catch {}

  console.log(`total:${list.length} done:${map.size}`);
  const resultMap = generateResultMap(list, map, 1000000);
  if (resultMap.size) {
    await fs.writeFile(
      `./output/${len}-temp.txt`,
      [...resultMap.entries()].map((e) => `${e[0]}>${e[1]}`).join("\n")
    );
  }
};

const len = 11;
