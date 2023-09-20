import { toByteArray } from "base64-js";
import * as fs from "node:fs/promises";
import pako from "pako";
import { Worker } from "worker_threads";
import {
  numberListToUInt8Array,
  sheetToBase64Pattern,
} from "./calc-distance-util";

const len = 14;

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
      const pattern = sheetToBase64Pattern(result);
      if (isMoreThanMax && !set.has(pattern)) {
        set.add(pattern);
      }
    });
  });
  console.log(`generated total:${set.size}\n`);
  return set;
};

const generateResultMap = async (list: string[], processNo = 8) => {
  const startTime = new Date().getTime();
  const separated: string[][] = [];
  for (let i = 0; i < processNo; i++) {
    separated[i] = [];
  }
  for (let i = 0; i < list.length; i++) {
    separated[i % processNo].push(list[i]);
  }
  const workerResult = await Promise.all(
    separated.map((e, i) => runWorker({ data: e, workerNo: i }))
  );
  const resultArray: string[] = [];
  let x = 0;
  let y = 0;
  while (workerResult[x][y]) {
    resultArray.push(workerResult[x][y]);
    x = (x + 1) % processNo;
    if (x === 0) {
      y = y + 1;
    }
  }
  console.log(
    `\n${resultArray.length} generated in ${
      (new Date().getTime() - startTime) / 1000
    }s`
  );
  return resultArray;
};

export const writeDataToFile = async () => {
  const start = new Date();
  const list: string[] = [...generateResultSet(len)];
  console.log(
    `total:${list.length} ${
      (new Date().getTime() - start.getTime()) / 1000
    }s used`
  );
  const result = await generateResultMap(list);
  generateBinFile(result);
};

export const generateBinFile = async (resultList: string[]) => {
  const resultMap: string[][] = [];
  // sort the list by distance
  resultList.forEach((record) => {
    const [pattern, distance] = record.split(">");
    const distanceIndex = parseInt(distance);
    if (resultMap[distanceIndex]) {
      resultMap[distanceIndex].push(pattern);
    } else {
      resultMap[distanceIndex] = [pattern];
    }
  });
  // convert the result
  const resultArray: number[] = [];
  resultMap.forEach((group) => {
    group.forEach((pattern) => {
      const patternArray = [...toByteArray(pattern)]
        .map((e) => [
          (e >> 6) & 0b11,
          (e >> 4) & 0b11,
          (e >> 2) & 0b11,
          e & 0b11,
        ])
        .flat();
      const lastIndex = patternArray.lastIndexOf(0b11);
      const result = patternArray.slice(0, lastIndex + 1);
      resultArray.push(...result);
    });
  });
  const compressed = pako.deflate(numberListToUInt8Array(resultArray));
  await fs.writeFile(`./bin/${len}-data.bin`, compressed);
  await fs.writeFile(
    `./bin/${len}-index.txt`,
    resultMap.map((e) => e.length).join("\n")
  );
};

const runWorker = async (workerData: { data: string[]; workerNo: number }) => {
  return new Promise<string[]>((resolve, reject) => {
    console.log(`worker#${workerData.workerNo} will start soon`);
    const worker = new Worker("./dist/calc-distance-worker.js", {
      workerData,
    });
    worker.on("message", (message) => {
      if (message.type === "success") {
        resolve(message.data);
      } else {
        console.log(message.data);
        // readline.clearLine(process.stdout, 0);
        // readline.cursorTo(process.stdout, 0);
        // process.stdout.write(message.data);
      }
    });
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0) reject(new Error(`stopped with  ${code} exit code`));
    });
  });
};
