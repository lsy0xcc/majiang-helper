import { readFromFile, searchDistance } from "./calc-distance";

const run = async () => {
  console.time("load data");
  const loadedData = await readFromFile();
  console.timeEnd("load data");
  console.time("search");
  const query = [
    "12345z",
    "12345670z",
    "11123456789990p",
    "22333445556667p",
    "33334445555p",
    "19m19s19p1234567z5p",
    "19m19s19p12345677z",
  ];
  query.forEach((e, i) => {
    console.log(`#${i}\t${searchDistance(e, loadedData)}\t${e}`);
  });
  console.timeEnd("search");
};

run();
