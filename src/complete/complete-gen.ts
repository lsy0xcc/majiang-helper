interface Position {
  x: number;
  y: number;
}
interface CompleteRecord {
  sheet: number[][];
  d?: Position;
  k: Position[];
  s: Position[];
}

const comparePosition = (a: Position, b: Position) => {
  return a.x === b.x ? a.y - b.y : a.x - b.x;
};

const copySheet = (sheet: number[][]) => {
  const result: number[][] = [];
  sheet.forEach((e) => {
    result.push([...e]);
  });
  return result;
};

const copyPosition: (position: Position) => Position = (position: Position) => {
  return { x: position.x, y: position.y };
};

const copyRecord: (record: CompleteRecord) => CompleteRecord = (
  record: CompleteRecord
) => {
  return {
    sheet: copySheet(record.sheet),
    d: record.d ? copyPosition(record.d) : undefined,
    k: record.k.map((e) => copyPosition(e)),
    s: record.s.map((e) => copyPosition(e)),
  };
};

const isCorrectSheet = (sheet: number[][]) => {
  for (let i = 0; i < sheet.length; i++) {
    if (sheet[i].length > 9) {
      return false;
    }
    for (let j = 0; j < sheet[i].length; j++) {
      if (sheet[i][j] > 4) {
        return false;
      }
    }
  }
  return true;
};

const addXIndex = (record: CompleteRecord, minIndex: number) => {
  for (let i = 0; i < record.k.length; i++) {
    if (record.k[i].x >= minIndex) {
      record.k[i].x++;
    }
  }
  for (let i = 0; i < record.s.length; i++) {
    if (record.s[i].x >= minIndex) {
      record.s[i].x++;
    }
  }
  if (record.d && record.d.x > -minIndex) {
    record.d.x++;
  }
};

// step1 add S first
const addS = (record: CompleteRecord) => {
  const { sheet, d, k, s } = record;
  const sheetList: number[][][] = [];
  const sList: Position[] = [];
  for (let i = 0; i < sheet.length; i++) {
    for (let j = 0; j < sheet[i].length; j++) {
      const newSheet = copySheet(sheet);
      for (let k = 0; k < 3; k++) {
        if (newSheet[i][j + k]) {
          newSheet[i][j + k]++;
        } else {
          newSheet[i].push(1);
        }
      }
      if (isCorrectSheet(newSheet)) {
        sheetList.push(newSheet);
        sList.push({ x: i, y: j });
      }
    }
  }

  // add the last record
  sheetList.push([...sheet, [1, 1, 1]]);
  sList.push({ x: sheet.length, y: 0 });

  const result: CompleteRecord[] = [];
  sheetList.forEach((newSheet, i) => {
    const newSList = [...s, sList[i]];
    newSList.sort(comparePosition);
    result.push({
      sheet: newSheet,
      d,
      k,
      s: newSList,
    });
  });
  return result;
};

// step2 add K
// step3 add D
const addKOrD = (record: CompleteRecord, isD?: boolean) => {
  const count = isD ? 2 : 3;
  const resultList: CompleteRecord[] = [];
  const { sheet } = record;
  // between two lists
  for (let i = 0; i <= sheet.length; i++) {
    const newRecord = copyRecord(record);
    newRecord.sheet.splice(i, 0, [count]);
    // add the x index
    addXIndex(newRecord, i);
    if (isCorrectSheet(newRecord.sheet)) {
      if (isD) {
        newRecord.d = { x: i, y: 0 };
      } else {
        newRecord.k.push({ x: i, y: 0 });
        newRecord.k.sort(comparePosition);
      }
      resultList.push(newRecord);
    }
  }
  // in the list
  for (let i = 0; i < sheet.length; i++) {
    for (let j = 0; j < sheet[i].length; j++) {
      const newRecord = copyRecord(record);
      if (newRecord.sheet[i][j]) {
        newRecord.sheet[i][j] += count;
      } else {
        newRecord.sheet[i].push(count);
      }
      if (isCorrectSheet(newRecord.sheet)) {
        if (isD) {
          newRecord.d = { x: i, y: j };
        } else {
          newRecord.k.push({ x: i, y: j });
          newRecord.k.sort(comparePosition);
        }
        resultList.push(newRecord);
      }
    }
  }
  return resultList;
};

const sheetToPattern = (sheet: number[][], mCount: number) => {
  const resultList: number[] = [];
  for (let i = 0; i < 1 << (sheet.length - 1); i++) {
    let temp = [sheet[0]];
    for (let j = 0; j < sheet.length - 1; j++) {
      if (i & (1 << j)) {
        temp[temp.length - 1] = temp[temp.length - 1].concat(sheet[j + 1]);
      } else {
        temp.push(sheet[j + 1]);
      }
    }
    if (temp.reduce((prev, curr) => prev && curr.length <= 9, true)) {
      let result = 0;
      for (let j = 0; j < temp.length; j++) {
        for (let k = 0; k < temp[j].length; k++) {
          const shiftLen = 2 * temp[j][k] - 1;
          result = (result << shiftLen) | ((1 << shiftLen) - 2);
        }
        result = (result << 1) + 2;
      }
      result = (result << 3) | mCount;
      resultList.push(result);
    }
  }
  return resultList;
};

const recordToResultPattern = (record: CompleteRecord) => {
  const { sheet, d, k, s } = record;
  if (!d) {
    return 0;
  }
  const sum = [[0]];
  for (let i = 0; i < sheet.length; i++) {
    const list = [sum[i][sum[i].length - 1]];
    for (let j = 0; j < sheet[i].length; j++) {
      list.push(list[list.length - 1] + sheet[i][j]);
    }
    sum.push(list);
  }
  sum.shift();
  let result = ((s.length << 7) | (k.length << 4) | sum[d.x][d.y]) << 16;
  s.concat(k).forEach((e, i) => {
    result = result | (sum[e.x][e.y] << (12 - 4 * i));
  });

  return result;
};

export const generateCompleteMap = async () => {
  let resultList: CompleteRecord[] = [];
  const sResults: CompleteRecord[][] = [[{ sheet: [], s: [], k: [] }]];
  for (let i = 0; i < 4; i++) {
    sResults[i + 1] = sResults[i].map((e) => addS(e)).flat();
  }
  for (let i = 0; i <= 4; i++) {
    let tempResults = sResults[i];
    resultList = resultList.concat(tempResults);
    for (let j = 1; j <= 4 - i; j++) {
      tempResults = tempResults.map((e) => addKOrD(e)).flat();
      resultList = resultList.concat(tempResults);
    }
  }
  resultList = resultList.map((e) => addKOrD(e, true)).flat();
  const resultMap: Map<number, Set<number>> = new Map();
  resultList.forEach((resultRecord) => {
    const keys = sheetToPattern(
      resultRecord.sheet,
      resultRecord.s.length + resultRecord.k.length
    );
    const value = recordToResultPattern(resultRecord);
    keys.forEach((key) => {
      if (resultMap.has(key)) {
        resultMap.get(key)?.add(value);
      } else {
        resultMap.set(key, new Set([value]));
      }
    });
  });
  return resultMap;
};
