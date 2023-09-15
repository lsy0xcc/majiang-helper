import { readTempAndSet, writeSetToFile } from "./calc-distance-gen";

const run = async () => {
  await writeSetToFile();
  await readTempAndSet();
};

run();
