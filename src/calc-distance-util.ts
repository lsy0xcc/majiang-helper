export const compareList = (a: number[], b: number[]) => {
  if (a.length !== b.length) {
    return b.length - a.length;
  } else {
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return b[i] - a[i];
      }
    }
    return 0;
  }
};

export const sheetToPattern = (input: number[][]) => {
  for (let i = 0; i < input.length; i++) {
    const reversed = [...input[i]].reverse();
    if (compareList(reversed, input[i]) < 0) {
      input[i] = reversed;
    }
  }
  const sorted = input.sort(compareList);
  // return sorted.map((list) => list.join(",")).join(" ");
  return sorted
    .map((list) => list.join(","))
    .join(" ")
    .replaceAll(",0,", ";");
};

export const patternToSheet = (pattern: string) => {
  return pattern.split(" ").map((e) =>
    e
      .replaceAll(";", ",0,")
      .split(",")
      .map((char) => parseInt(char))
  );
};

export const inputToSheet = (input: string) =>
  listToSheet(inputToList(input) ?? []);

export const inputToList = (input: string) => {
  // [1m, ..., 9m, 0, 0, 1s, ..., 9s, 0, 0, 1p, ..., 9p, 0, 0, 1z, 0, 0, 2z, ...]
  const result = new Array(52).fill(0);
  if (input.match(/(\d+[mpsz])+/)) {
    [...input.matchAll(/\d+[mpsz]/g)]
      .map((e) => e[0]) // split mpsz type
      .forEach((e) => {
        const list = e.split("");
        const type = list.pop(); // get type
        list
          .map((e) => parseInt(e === "0" ? "5" : e)) // convert red 5
          .forEach((e) => {
            switch (type) {
              case "m":
                result[e - 1]++;
                break;
              case "s":
                result[e + 10]++;
                break;
              case "p":
                result[e + 21]++;
                break;
              case "z":
                result[3 * (e + 10)]++;
            }
          });
      });
    if (
      result.length <= 52 && // prevent 8z 9z
      result.reduce((prev, curr) => prev && curr <= 4, true) // prevent more than 4 tiles
    ) {
      return result;
    }
  }
};

export const listToSheet = (input: number[]) => {
  const result = [];
  let tempArray = [];
  for (let i = 0; i < input.length; i++) {
    if (input[i]) {
      tempArray.push(input[i]);
    } else {
      if (input[i + 1] && tempArray.length) {
        tempArray.push(input[i]);
      } else {
        if (tempArray.length) {
          result.push(tempArray);
          tempArray = [];
        }
      }
    }
  }
  if (tempArray.length) {
    result.push(tempArray);
  }
  return result;
};
