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

export const patternToSheet = (pattern: string) => {
  return pattern.split(" ").map((e) =>
    e
      .replaceAll(";", ",0,")
      .split(",")
      .map((char) => parseInt(char))
  );
};
