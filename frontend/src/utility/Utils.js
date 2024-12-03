export const formatBalance = (rawBalance) => {
  const balance = (parseInt(rawBalance) / 1000000000000000000).toFixed(process.env.REACT_APP_TOFIXED);
  return balance;
};

export const formatChainAsNum = (chainIdHex) => {
  const chainIdNum = parseInt(chainIdHex);
  return chainIdNum;
};

export const formatAddress = (addr) => {
  return `${addr.substring(0, 8)} . . . ${addr.substring(
    addr.length - 6,
    addr.length
  )}`;
};

export const formatTimestampToAMPM = (gametimestamp) => {
  const dateTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ap = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours.toString().padStart(1, "0")}-${minutes.toString().padStart(2, "0")}-${ap}`;
  };

  const dateFormatGame = new Date(gametimestamp * 1000);
  const hours = dateTime(dateFormatGame).split("-")[0];
  const ap = dateTime(dateFormatGame).split("-")[2];
  let initialSlideIndex = 0;
  switch (Number(hours)) {
    case 12:
      if (ap === "am") return { "time": dateTime(dateFormatGame), "room": "12-2-am", "initialSlideIndex" : 0 };
      if (ap === "pm") return { "time": dateTime(dateFormatGame), "room": "12-2-pm", "initialSlideIndex" : 4 };
      break;
    case 1:
      if (ap === "am") return { "time": dateTime(dateFormatGame), "room": "12-2-am", "initialSlideIndex" : 0 };
      if (ap === "pm") return { "time": dateTime(dateFormatGame), "room": "12-2-pm", "initialSlideIndex" : 4 };
      break;
    case 2:
      if (ap === "am") return { "time": dateTime(dateFormatGame), "room": "12-2-am", "initialSlideIndex" : 0 };
      if (ap === "pm") return { "time": dateTime(dateFormatGame), "room": "12-2-pm", "initialSlideIndex" : 4 };
      break;
    case 3:
      if (ap === "am") return { "time": dateTime(dateFormatGame), "room": "3-5-am", "initialSlideIndex" : 1 };
      if (ap === "pm") return { "time": dateTime(dateFormatGame), "room": "3-5-pm", "initialSlideIndex" : 5 };
      break;
    case 4:
      if (ap === "am") return { "time": dateTime(dateFormatGame), "room": "3-5-am", "initialSlideIndex" : 1 };
      if (ap === "pm") return { "time": dateTime(dateFormatGame), "room": "3-5-pm", "initialSlideIndex" : 5 };
      break;
    case 5:
      if (ap === "am") return { "time": dateTime(dateFormatGame), "room": "3-5-am", "initialSlideIndex" : 1 };
      if (ap === "pm") return { "time": dateTime(dateFormatGame), "room": "3-5-pm", "initialSlideIndex" : 5 };
      break;
    case 6:
      if (ap === "am") return { "time": dateTime(dateFormatGame), "room": "6-8-am", "initialSlideIndex" : 2 };
      if (ap === "pm") return { "time": dateTime(dateFormatGame), "room": "6-8-pm", "initialSlideIndex" : 6 };
      break;
    case 7:
      if (ap === "am") return { "time": dateTime(dateFormatGame), "room": "6-8-am", "initialSlideIndex" : 2 };
      if (ap === "pm") return { "time": dateTime(dateFormatGame), "room": "6-8-pm", "initialSlideIndex" : 6 };
      break;
    case 8:
      if (ap === "am") return { "time": dateTime(dateFormatGame), "room": "6-8-am", "initialSlideIndex" : 2 };
      if (ap === "pm") return { "time": dateTime(dateFormatGame), "room": "6-8-pm", "initialSlideIndex" : 6 };
      break;
    case 9:
      if (ap === "am") return { "time": dateTime(dateFormatGame), "room": "9-11-am", "initialSlideIndex" : 3 };
      if (ap === "pm") return { "time": dateTime(dateFormatGame), "room": "9-11-pm", "initialSlideIndex" : 7 };
      break;
    case 10:
      if (ap === "am") return { "time": dateTime(dateFormatGame), "room": "9-11-am", "initialSlideIndex" : 3 };
      if (ap === "pm") return { "time": dateTime(dateFormatGame), "room": "9-11-pm", "initialSlideIndex" : 7 };
      break;
    case 11:
      if (ap === "am") return { "time": dateTime(dateFormatGame), "room": "9-11-am", "initialSlideIndex" : 3 };
      if (ap === "pm") return { "time": dateTime(dateFormatGame), "room": "9-11-pm", "initialSlideIndex" : 7 };
      break;
    default:
      return "null";
  }
};
