import dayjs from "dayjs";

const colorList = [
  "(252, 105, 100)",
  "(247, 167, 71)",
  "(116, 202, 90)",
  "(83, 186, 241)",
  "(208, 142, 2231)"
];
const nameList = "Hope,SwiftWing,Lightbringer,Scout,PowerGod,Officer,LightningMeteor,Doctor,ThunderFireGod,Sniper,LightOfHope,SouthSeaNinja,RapidE3,MountainGod,SafetyGuard,Hammer,Longevity,Star,Romanska,Desire,ThunderLightning,FireRescue,EuroStar".split(
  ","
);

const typeList = "🚅,🚈,🚄".split(",");

let colNum = 10;
let times = [new Date(2000, 10, 10, 10, 10), new Date(2000, 10, 11, 10, 10)];


function generateRow(index, colNum, times) {
  const rowId = `JHR${100 + (index % 900)}${String.fromCharCode(65 + (index % 26))}${String.fromCharCode(65 + ((index + 1) % 26))}`;
  const rowType = typeList[index % typeList.length];
  const rowSpeed = (index * 7) % 201;
  const name = nameList[index % nameList.length];
  const color = colorList[index % colorList.length];
  const rgb = "rgb" + color;

  const gtArray = [];
  let tempStart = dayjs(times[0]);
  let tempEnd = dayjs(times[0]);

  for (let i = 0; i < colNum; i++) {
    tempStart = tempEnd.add((index + i) % 6 + 1, "hour");
    tempEnd = tempStart.add((index + i) % 5 + 2, "hour");
    gtArray.push({
      id: `${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(66 + (i % 26))}${1000 + i + index}`,
      passenger: 10 + ((index + i) % 191),
      start: tempStart.toString(),
      end: tempEnd.toString(),
      type: rowType,
      parentId: rowId
    });
  }

  return {
    name,
    id: rowId,
    type: rowType,
    speed: rowSpeed,
    colorPair: {
      dark: rgb.replace(")", ",0.8)"),
      light: rgb.replace(")", ",0.1)")
    },
    gtArray
  };
}

export function mockDatas(nums, col, t, seed = 0) {
  const datas = [];
  for (let i = 0; i < nums; i++) {
    datas.push(Object.assign({ rawIndex: i }, generateRow(i + seed, col, t)));
  }
  return datas;
}

