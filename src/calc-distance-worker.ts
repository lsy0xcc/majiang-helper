import { parentPort, workerData } from "worker_threads";
import { calcDistance } from "./calc-distance";
import { base64PatternToSheet } from "./calc-distance-util";

const generateResultMap = (list: string[], workerNo: number) => {
  console.log(`${workerNo} start!`);
  let sum = 0;
  const startTime = new Date().getTime();
  // const total = list.length;
  const map: Map<string, number> = new Map();
  for (let i = 0; i < list.length; i++) {
    const pattern = list[i];
    const sheet: number[][] = base64PatternToSheet(pattern);
    if (!map.has(pattern)) {
      sum++;
      map.set(pattern, calcDistance(sheet));
    }
    if (sum % 1000 === 0) {
      const text = `worker#${workerNo}: ${sum}/${list.length} ${(
        (sum / list.length) *
        100
      ).toFixed(4)}% total:${(new Date().getTime() - startTime) / 1000}s`;
      parentPort?.postMessage({
        type: "process",
        data: text,
      });
    }
  }
  parentPort?.postMessage({
    type: "process",
    data: `\nworker#${workerNo}: ${sum} generated ${
      (new Date().getTime() - startTime) / 1000
    }s\n`,
  });
  return [...map].map((e) => `${e[0]}>${e[1]}`);
};
parentPort?.postMessage({
  type: "success",
  data: generateResultMap(workerData.data, workerData.workerNo),
});
