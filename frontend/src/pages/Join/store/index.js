// ** Redux Imports
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { BigNumber, utils } from "ethers";

const dateTime = (date) => {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let ap = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12;
  // if (hours === 12) {
  //   hours = 0;
  // }
  let mergeTime =
    hours.toString().padStart(2, "0") +
    ":" +
    minutes.toString().padStart(2, "0") +
    " " +
    ap;
  return mergeTime;
};

export const getFilterTimes = createAsyncThunk(
  "getFilterTimes",
  async ({ endHour, timeZone }) => {
    const nowtimestamp = Date.parse(Date()) / 1000;
    let filterNowHour =
      dateTime(new Date((nowtimestamp + 60) * 1000))
        .split(" ")[0]
        .split(":")[0] % 12;
    let filterNowMin = dateTime(new Date((nowtimestamp + 60) * 1000))
      .split(" ")[0]
      .split(":")[1];
    console.log(filterNowHour, filterNowMin);
    let filtertimes = ["ALL TIMES"];
    while (true) {
      if (filterNowMin <= 59) {
        if (filterNowHour === 0) {
          filtertimes.push(
            `12:${filterNowMin
              .toString()
              .padStart(2, "0")} ${timeZone.toUpperCase()}`
          );
        } else {
          filtertimes.push(
            `${filterNowHour.toString().padStart(1, "0")}:${filterNowMin
              .toString()
              .padStart(2, "0")} ${timeZone.toUpperCase()}`
          );
        }
        filterNowMin++;
      } else {
        filterNowMin = 0;
        if (filterNowHour < endHour) {
          filterNowHour++;
        } else {
          break;
        }
      }
    }
    return filtertimes;
  }
);

export const gameFiltering = createAsyncThunk(
  "gameFiltering",
  async ({ unSigner, gameList, pot, cardprice, time }) => {
    const formatTime = time.replace(":", "-").replace(" ", "-");
    let filterArry = [];
    let gamePot = null;
    const potmin = Number(pot.split("-")[0]);
    const potmax = Number(pot.split("-")[1]);

    const getGamePot = async (gameId) => {
      const game = await unSigner.contract.games(gameId);
      const gamecardprice = Number(
        utils.formatEther(BigNumber.from(game.cardPrice))
      );
      const totalCardsSold = Number(game.totalCardsSold);
      gamePot = totalCardsSold * gamecardprice;
    };

    gameList.forEach(async (gameItems) => {
      if (pot !== "0") {
        getGamePot(gameItems.gameId);
      }

      if (
        gameItems.startedPrice === cardprice &&
        formatTime === "0" &&
        pot === "0"
      ) {
        filterArry.push(gameItems);
      } else if (
        gameItems.startDateAMPM === formatTime &&
        cardprice === "0" &&
        pot === "0"
      ) {
        filterArry.push(gameItems);
      } else if (
        gamePot >= potmin &&
        gamePot <= potmax &&
        cardprice === "0" &&
        formatTime === "0"
      ) {
        filterArry.push(gameItems);
      } else if (
        gameItems.startedPrice === cardprice &&
        gameItems.startDateAMPM === formatTime &&
        pot === "0"
      ) {
        filterArry.push(gameItems);
      } else if (
        gameItems.startedPrice === cardprice &&
        gamePot >= potmin &&
        gamePot <= potmax &&
        formatTime === "0"
      ) {
        filterArry.push(gameItems);
      } else if (
        gameItems.startDateAMPM === formatTime &&
        gamePot >= potmin &&
        gamePot <= potmax &&
        cardprice === "0"
      ) {
        filterArry.push(gameItems);
      } else if (
        gameItems.startedPrice === cardprice &&
        gameItems.startDateAMPM === formatTime &&
        gamePot >= potmin &&
        gamePot <= potmax
      ) {
        filterArry.push(gameItems);
      }
    });
    return filterArry;
  }
);

export const joinStore = createSlice({
  name: "joinStore",
  initialState: {},
  reducers: {},
});

export default joinStore.reducer;
