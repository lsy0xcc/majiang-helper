import * as fs from "node:fs/promises";
import { Worker } from "worker_threads";
import { sheetToPattern } from "./calc-distance-util";

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

const generateResultMap = async (list: string[], processNo = 8) => {
  const startTime = new Date().getTime();
  // const total = list.length;
  const oneWorkerLen = Math.ceil(list.length / processNo);
  const workerResult = await Promise.all(
    [...new Array(processNo).keys()].map((e) =>
      runWorker({
        data: list.slice(e * oneWorkerLen, (e + 1) * oneWorkerLen),
        workerNo: e,
      })
    )
  );
  const resultArray = workerResult.flat();
  console.log(
    `\n${resultArray.length}generated in ${
      (new Date().getTime() - startTime) / 1000
    }s`
  );
  return resultArray.join("\n");
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
  console.log(`generated total:${set.size}\n`);
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

export const writeDataToFile = async () => {
  const start = new Date();
  let list: string[] = [];
  try {
    list = (await fs.readFile(`./output/${len}-list.txt`))
      .toString()
      .split("\n");
  } catch {}

  process.stdout.write(
    `total:${list.length} ${
      (new Date().getTime() - start.getTime()) / 1000
    }s used`
  );
  const result = await generateResultMap(list);

  await fs.writeFile(`./output/${len}-data.txt`, result);
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

const len = 14;
