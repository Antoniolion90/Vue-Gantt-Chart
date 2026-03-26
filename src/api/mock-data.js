import dayjs from "dayjs";
import { faker } from "@faker-js/faker";

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


function generateRow() {
  let rowId = "JHR" +
    faker.number.int({ min: 100, max: 999 }) +
    faker.string.alpha({ length: 1, casing: 'upper' }) +
    faker.string.alpha({ length: 1, casing: 'upper' });
  let rowType = faker.helpers.arrayElement(typeList);
  let rowSpeed = faker.number.int({ min: 0, max: 200 });

  return {
    name: faker.helpers.arrayElement(nameList),
    id: rowId,
    type: rowType,
    speed: rowSpeed,
    colorPair: (() => {
      let a = "rgb" + faker.helpers.arrayElement(colorList);
      return {
        dark: a.replace(")", ",0.8)"),
        light: a.replace(")", ",0.1)")
      };
    })(),
    gtArray: (() => {
      let temp = [];
      let i = 0;
      let j = faker.number.int({ min: colNum - 1, max: colNum });
      let tempStart = dayjs(times[0]);
      let tempEnd = dayjs(times[0]);

      while (i < j) {
        tempStart = tempEnd.add(faker.number.int({ min: 1, max: 6 }), "hour");
        tempEnd = tempStart.add(faker.number.int({ min: 2, max: 6 }), "hour");
        temp.push({
          id:
            faker.string.alpha({ length: 2, casing: 'upper' }) +
            faker.number.int({ min: 1000, max: 9999 }),
          passenger: faker.number.int({ min: 10, max: 200 }),
          start: tempStart.toString(),
          end: tempEnd.toString(),
          type: rowType,
          parentId: rowId
        });

        i++;
      }
      return temp;
    })()
  };
}

export function mockDatas(nums, col, t) {
  colNum = col;
  times = t;
  let datas = [];
  let j = faker.number.int({ min: nums, max: nums });
  for (let i = 0; i < j; i++) {
    datas.push(Object.assign({rawIndex: i}, generateRow()));
  }
  return datas;
}

