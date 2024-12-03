import { BigNumber } from "ethers";
const create5x5 = () => {
    let nums = new Array(5);
    for (let i = 0; i < nums.length; i++) {
      nums[i] = new Array(5);
    }
    for (let i = 0; i < 5; i++) {
      const max = (i + 1) * 15;
      const min = i * 15 + 1;
      let seenNums = [];
      for (let k = 0; k < 5; k++) {
        if (i == 2 && k == 2) {
          nums[k][i] = 0;
          continue;
        }
        let n = rndInRange(max, min);
        while (seenNums.includes(n)) {
          n = rndInRange(max, min);
        }
        seenNums.push(n);
        nums[k][i] = n;
      }
    }
    return nums;
  };
  
  const arrayToHex = (arr) => {
    let res = "";
    for (const row of arr) {
      res += row.reduce((a, b) => {
        const prefixed = b > 15 ? b.toString(16) : `0${b.toString(16)}`;
        return `${a}${prefixed}`;
      }, "");
    }
    return `0x${res}`;
  };

  const hexToArry = (hex) => {
    let hexPart = hex._hex.substring(2);
    let index = 0;
    let res = [];
    while(index < hexPart.length){
        res.push(parseInt(hexPart.slice(index, index + 2), 16));
        index = index + 2;
    }
    
    return res;
  };
  
  const rndInRange = (max, min) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  export { create5x5, arrayToHex, hexToArry };