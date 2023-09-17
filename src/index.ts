import { writeDataToFile, writeSetToFile } from "./calc-distance-gen";

const run = async () => {
  await writeSetToFile();
  await writeDataToFile();
};

run();
