import { writeDataToFile } from "./calc-distance-gen";
import {
  readFromFile as readDataFromFile,
  searchDistance,
} from "./calc-distance";

const run = async () => {
  await writeDataToFile();
  console.time("load data");
  const loadedData = await readDataFromFile();
  console.timeEnd("load data");
  console.time("search");
  console.log(await searchDistance("12345z", loadedData));
  console.timeEnd("search");
};

run();
