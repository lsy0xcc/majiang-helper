import { memoryUsage } from "node:process";
import { readFromFile, searchDistance } from "./distance/calc-distance";
import { generateCompleteMap } from "./complete/complete-gen";
import { searchCompleteResult } from "./complete/complete";
const run = async () => {
  console.time("load data");
  const loadedData = await readFromFile();
  console.timeEnd("load data");
  console.log(memoryUsage());
  const query = [
    "1234567z1p",
    "12345567z",
    "123467z12p",
    "124578p12s",
    "124578p11s",
    "124578p12z",
    "124577p12z",
    "11123456789990p",
    "22333445556667p",
    "33334445555p",
    "19m19s19p1234567z5p",
    "129m19s19p1234567z",
  ];
  console.log(memoryUsage());
  console.time("search");
  query.forEach((e, i) => {
    console.log(`#${i}\t${searchDistance(e, loadedData)}\t${e}`);
  });
  console.timeEnd("search");
  // console.log("\n");
  // console.time("calc");
  // query.forEach((e, i) => {
  //   console.log(`#${i}\t${calcDistanceSimple(inputToSheet(e))}\t${e}`);
  // });
  // console.timeEnd("calc");
  // console.log(memoryUsage());
};
// run();
const run2 = async () => {
  const map = await generateCompleteMap();
  const result = searchCompleteResult("22333444555666p", map);
  console.log(JSON.stringify(result));
};
run2();
