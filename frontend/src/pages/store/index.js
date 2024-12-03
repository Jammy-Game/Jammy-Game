// ** Redux Imports
import axios from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { hexToArry } from "../../components/CreateCards";
import { formatTimestampToAMPM } from "../../utility/Utils";
import { AES, enc } from "crypto-js";
import { utils } from "ethers";

export const register = createAsyncThunk(
  "register",
  async ({ data }, { dispatch, getState }) => {
    return axios.post(`${process.env.REACT_APP_API}auth/register`, data);
  }
);

export const getAvatars = createAsyncThunk("getAvatars", async () => {
  // return axios.get(`${process.env.REACT_APP_API}users/avatars`);
});

const formatingGame = (
  gameId,
  game,
  timestampStartDate,
  gameTypeName,
  cardsLength,
  playerCardsLength,
  isPrizesClaimed
) => {
  return {
    gameId,
    host: game.host,
    startDate: Number(game.startDate),
    startDateAMPM: formatTimestampToAMPM(timestampStartDate).time,
    maxCardsPerPlayer: Number(game.maxCardsPerPlayer),
    startedPrice: Number(game.cardPrice),
    gameTypeName,
    totalCardsSold: Number(game.totalCardsSold),
    houseShare: Number(game.houseShare),
    seed: Number(game.seed),
    cancelled: game.cancelled,
    gameTransaction: game.txHash || null,
    totalPlayerCount: Number(game.totalPlayerCount), //TODO: contratta verilmeli
    playerCardsLength,
    pot: Number(game.totalCardsSold) * Number(game.cardPrice),
    isSoldOut:
      cardsLength &&
      Number(game.totalCardsSold) + 1 > Math.floor(Number(cardsLength) / 2)
        ? true
        : false,
    maxBuyCardCount: cardsLength
      ? Math.floor(Number(cardsLength) / 2) - Number(game.totalCardsSold)
      : 0,
    isJoined: playerCardsLength && playerCardsLength > 0 ? true : false, //true or false
    isRefunds: true,
    gameStatus: null,
    isPrizesClaimed
  };
};

export const getCreatedGames = createAsyncThunk(
  "getCreatedGames",
  async ({ dispatch, unSigner, host, user }) => {
    let createdGames = [];

    const gameTypes = await dispatch(getGameTypes({ dispatch }))
      .then((result) => {
        if (!result.payload.error) {
          return result.payload.gameTypes;
        }
      })
      .catch((error) => {
        console.log(error);
      });

    let gameCounter = Number(await unSigner.contract.gameCounter());

    for (gameCounter; gameCounter >= 1; gameCounter--) {
      const dateTimeNow = Date.parse(Date()) / 1000;
      const game = await unSigner.contract.games(gameCounter);
      const timestampStartDate = Number(game.startDate);

      if (
        new Date(timestampStartDate * 1000).getDate() <=
        new Date(dateTimeNow * 1000).getDate()
      ) {
        let gameTypeName = null;
        gameTypes.forEach((type) => {
          if (type.price === utils.formatEther(game.cardPrice)) {
            gameTypeName = type.name;
          }
        });

        const info = await dispatch(
          getInfo({ unSigner, gameId: gameCounter, user })
        )
          .then((result) => {
            if (result.payload) {
              return result.payload;
            }
          })
          .catch((error) => {
            console.log(error);
          });

        const cancelled = Number(game.cancelled);
        if (!host || (host && host.toLowerCase() === game.host.toLowerCase())) {
          if (!cancelled && dateTimeNow < timestampStartDate) {
            createdGames.push(
              formatingGame(
                gameCounter,
                game,
                timestampStartDate,
                gameTypeName,
                info.cardsLength,
                info.playerCardsLength
              )
            );
          }
        }
      } else {
        break;
      }
    }
    return { createdGames, error: null };
  }
);

export const getReadyGames = createAsyncThunk(
  "getReadyGames",
  async ({ dispatch, unSigner, host, user }) => {
    let readyGames = [];

    const gameTypes = await dispatch(getGameTypes({ dispatch }))
      .then((result) => {
        if (!result.payload.error) {
          return result.payload.gameTypes;
        }
      })
      .catch((error) => {
        console.log(error);
      });

    let gameCounter = Number(await unSigner.contract.gameCounter());

    for (gameCounter; gameCounter >= 1; gameCounter--) {
      const dateTimeNow = Date.parse(Date()) / 1000;
      const game = await unSigner.contract.games(gameCounter);
      const timestampStartDate = Number(game.startDate);

      const gameStatus = await dispatch(
        checkGameStatus({ unSigner, gameId: gameCounter })
      )
        .then((result) => {
          return result.payload;
        })
        .catch((error) => {
          console.log(error);
        });

      const expirationDuration = Number(
        await unSigner.contract.EXPIRATION_DURATION()
      );
      if (
        new Date(timestampStartDate * 1000).getDate() <=
          new Date(dateTimeNow * 1000).getDate() ||
        (new Date(timestampStartDate * 1000).getDate() >
          new Date(dateTimeNow * 1000).getDate() &&
          dateTimeNow < timestampStartDate + expirationDuration)
      ) {
        let gameTypeName = null;
        gameTypes.forEach((type) => {
          if (type.price === utils.formatEther(game.cardPrice)) {
            gameTypeName = type.name;
          }
        });

        const info = await dispatch(
          getInfo({ unSigner, gameId: gameCounter, user })
        )
          .then((result) => {
            if (result.payload) {
              return result.payload;
            }
          })
          .catch((error) => {
            console.log(error);
          });

        const cancelled = Number(game.cancelled);
        if (!host || (host && host.toLowerCase() === game.host.toLowerCase())) {
          if (!cancelled && gameStatus === 2) {
            readyGames.push(
              formatingGame(
                gameCounter,
                game,
                timestampStartDate,
                gameTypeName,
                info.cardsLength,
                info.playerCardsLength
              )
            );
          }
        }
      } else {
        break;
      }
    }
    return { readyGames, error: null };
  }
);

export const getStartedGames = createAsyncThunk(
  "getStartedGames",
  async ({ dispatch, unSigner, host, user }) => {
    let startedGames = [];

    const gameTypes = await dispatch(getGameTypes({ dispatch }))
      .then((result) => {
        if (!result.payload.error) {
          return result.payload.gameTypes;
        }
      })
      .catch((error) => {
        console.log(error);
      });

    let gameCounter = Number(await unSigner.contract.gameCounter());

    for (gameCounter; gameCounter >= 1; gameCounter--) {
      const dateTimeNow = Date.parse(Date()) / 1000;
      const game = await unSigner.contract.games(gameCounter);
      const gameSeed = game[6];
      const timestampStartDate = Number(game.startDate);

      const gameStatus = await dispatch(
        checkGameStatus({ unSigner, gameId: gameCounter })
      )
        .then((result) => {
          return result.payload;
        })
        .catch((error) => {
          console.log(error);
        });

      const expirationDuration = Number(
        await unSigner.contract.EXPIRATION_DURATION()
      );
      if (
        new Date(timestampStartDate * 1000).getDate() <=
          new Date(dateTimeNow * 1000).getDate() ||
        (new Date(timestampStartDate * 1000).getDate() >
          new Date(dateTimeNow * 1000).getDate() &&
          dateTimeNow < timestampStartDate + expirationDuration &&
          gameSeed > 0)
      ) {
        let gameTypeName = null;
        gameTypes.forEach((type) => {
          if (type.price === utils.formatEther(game.cardPrice)) {
            gameTypeName = type.name;
          }
        });

        const info = await dispatch(
          getInfo({ unSigner, gameId: gameCounter, user })
        )
          .then((result) => {
            if (result.payload) {
              return result.payload;
            }
          })
          .catch((error) => {
            console.log(error);
          });

        const cancelled = Number(game.cancelled);
        if (!host || (host && host.toLowerCase() === game.host.toLowerCase())) {
          if (!cancelled && gameStatus === 3) {
            startedGames.push(
              formatingGame(
                gameCounter,
                game,
                timestampStartDate,
                gameTypeName,
                info.cardsLength,
                info.playerCardsLength
              )
            );
          }
        }
      } else {
        break;
      }
    }
    return { startedGames, error: null };
  }
);

export const getEndedGames = createAsyncThunk(
  "getEndedGames",
  async ({ dispatch, unSigner, host, user }) => {
    let endedGames = [];

    const gameTypes = await dispatch(getGameTypes({ dispatch }))
      .then((result) => {
        if (!result.payload.error) {
          return result.payload.gameTypes;
        }
      })
      .catch((error) => {
        console.log(error);
      });

    let gameCounter = Number(await unSigner.contract.gameCounter());

    for (gameCounter; gameCounter >= 1; gameCounter--) {
      const game = await unSigner.contract.games(gameCounter);
      const timestampStartDate = Number(game.startDate);

      const gameStatus = await dispatch(
        checkGameStatus({ unSigner, gameId: gameCounter })
      )
        .then((result) => {
          return result.payload;
        })
        .catch((error) => {
          console.log(error);
        });

      let gameTypeName = null;
      gameTypes.forEach((type) => {
        if (type.price === utils.formatEther(game.cardPrice)) {
          gameTypeName = type.name;
        }
      });

      const info = await dispatch(
        getInfo({ unSigner, gameId: gameCounter, user })
      )
        .then((result) => {
          if (result.payload) {
            return result.payload;
          }
        })
        .catch((error) => {
          console.log(error);
        });

      const cancelled = Number(game.cancelled);
      const isPrizesClaimed = await unSigner.contract.prizesClaimed(gameCounter);
      if (!host || (host && host.toLowerCase() === game.host.toLowerCase())) {
        if (!cancelled && gameStatus === 4) {
          endedGames.push(
            formatingGame(
              gameCounter,
              game,
              timestampStartDate,
              gameTypeName,
              info.cardsLength,
              info.playerCardsLength,
              isPrizesClaimed
            )
          );
        }
      }
    }
    return { endedGames, error: null };
  }
);

export const getExpiredGames = createAsyncThunk(
  "getExpiredGames",
  async ({ dispatch, unSigner, host, user }) => {
    let expiredGames = [];

    const gameTypes = await dispatch(getGameTypes({ dispatch }))
      .then((result) => {
        if (!result.payload.error) {
          return result.payload.gameTypes;
        }
      })
      .catch((error) => {
        console.log(error);
      });

    let gameCounter = Number(await unSigner.contract.gameCounter());

    for (gameCounter; gameCounter >= 1; gameCounter--) {
      const dateTimeNow = Date.parse(Date()) / 1000;
      const game = await unSigner.contract.games(gameCounter);
      const timestampStartDate = Number(game.startDate);

      const gameStatus = await dispatch(
        checkGameStatus({ unSigner, gameId: gameCounter })
      )
        .then((result) => {
          return result.payload;
        })
        .catch((error) => {
          console.log(error);
        });

      let gameTypeName = null;
      gameTypes.forEach((type) => {
        if (type.price === utils.formatEther(game.cardPrice)) {
          gameTypeName = type.name;
        }
      });

      const info = await dispatch(
        getInfo({ unSigner, gameId: gameCounter, user })
      )
        .then((result) => {
          if (result.payload) {
            return result.payload;
          }
        })
        .catch((error) => {
          console.log(error);
        });

      const cancelled = Number(game.cancelled);
      if (!host || (host && host.toLowerCase() === game.host.toLowerCase())) {
        if (!cancelled && gameStatus === 5) {
          expiredGames.push(
            formatingGame(
              gameCounter,
              game,
              timestampStartDate,
              gameTypeName,
              info.cardsLength,
              info.playerCardsLength
            )
          );
        }
      }
    }
    return { expiredGames, error: null };
  }
);

export const getCancelledGames = createAsyncThunk(
  "getCancelledGames",
  async ({ dispatch, unSigner, host, user }) => {
    let cancelledGames = [];

    const gameTypes = await dispatch(getGameTypes({ dispatch }))
      .then((result) => {
        if (!result.payload.error) {
          return result.payload.gameTypes;
        }
      })
      .catch((error) => {
        console.log(error);
      });

    let gameCounter = Number(await unSigner.contract.gameCounter());

    for (gameCounter; gameCounter >= 1; gameCounter--) {
      const dateTimeNow = Date.parse(Date()) / 1000;
      const game = await unSigner.contract.games(gameCounter);
      const timestampStartDate = Number(game.startDate);

      const gameStatus = await dispatch(
        checkGameStatus({ unSigner, gameId: gameCounter })
      )
        .then((result) => {
          return result.payload;
        })
        .catch((error) => {
          console.log(error);
        });

      let gameTypeName = null;
      gameTypes.forEach((type) => {
        if (type.price === utils.formatEther(game.cardPrice)) {
          gameTypeName = type.name;
        }
      });

      const info = await dispatch(
        getInfo({ unSigner, gameId: gameCounter, user })
      )
        .then((result) => {
          if (result.payload) {
            return result.payload;
          }
        })
        .catch((error) => {
          console.log(error);
        });

      if (!host || (host && host.toLowerCase() === game.host.toLowerCase())) {
        if (gameStatus === 6) {
          cancelledGames.push(
            formatingGame(
              gameCounter,
              game,
              timestampStartDate,
              gameTypeName,
              info.cardsLength,
              info.playerCardsLength
            )
          );
        }
      }
    }
    return { cancelledGames, error: null };
  }
);

export const userGameDetails = createAsyncThunk(
  "userGameDetails",
  async ({ unSigner, gameId, user }) => {
    const isRefunds = await unSigner.contract.refunds(gameId, user);
    return { isRefunds };
  }
);

// Host Panel
export const createGameTimes = createAsyncThunk("createGameTimes", async () => {
  const nowtimestamp = Date.parse(Date()) / 1000;
  let selectOptions = [];
  for (let i = 5; ; i++) {
    if (
      new Date((nowtimestamp + 60 * i) * 1000).getDate() ===
      new Date(nowtimestamp * 1000).getDate()
    ) {
      //gün değişmedikçe döner
      const parseTime = formatTimestampToAMPM(nowtimestamp + 60 * i).time.split(
        "-"
      );
      selectOptions.push(`${parseTime[0]}:${parseTime[1]} ${parseTime[2]}`);
    } else {
      break;
    }
  }
  return selectOptions;
});

export const checkGameStatus = createAsyncThunk(
  "checkGameStatus",
  async ({ unSigner, gameId }) => {
    const jammyWon = (await unSigner.contract.gamePrizes(gameId, 0))[1];
    const game = await unSigner.contract.games(gameId);
    const nowTimestamp = Math.floor(Date.now() / 1000);
    const gameTimestamp = Number(game.startDate);
    const gameCancelled = game.cancelled;
    const gameSeed = game.seed;

    if (gameTimestamp === 0) {
      //GameStatus.INVALID
      return 0;
    }
    if (jammyWon) {
      //GameStatus.ENDED
      return 4;
    }
    if (gameCancelled) {
      //GameStatus.CANCELLED
      return 6;
    }
    if (nowTimestamp < gameTimestamp) {
      //GameStatus.CREATED
      return 1;
    }
    const expirationDuration = Number(
      await unSigner.contract.EXPIRATION_DURATION()
    );
    if (
      nowTimestamp > gameTimestamp &&
      nowTimestamp < gameTimestamp + expirationDuration
    ) {
      if (gameSeed > 0) {
        //GameStatus.STARTED
        return 3;
      }
      return 2; //GameStatus.READY
    }
    return 5; //GameStatus.EXPIRED
  }
);

export const getInfo = createAsyncThunk(
  "getInfo",
  async ({ unSigner, gameId, user, prizeIndex }) => {
    let info = null;
    let maxNumber = 0;
    if (unSigner) {
      maxNumber = Number(await unSigner.contract.MAX_NUMBER());
      info = await unSigner.contract.getGameInfo(
        gameId || 0,
        user ? user : "0x000000000000000000000000000000000000dEaD",
        prizeIndex || 0
      );
    }

    return {
      availableNumbersLength: Number(info.availableNumbersLength),
      gamePrizesLength: Number(info.gamePrizesLength),
      prizeWinnersLength: Number(info.prizeWinnersLength),
      numbersLength: Number(info.numbersLength),
      revealedNumberLength: maxNumber - Number(info.numbersLength),
      cardsLength: Number(info.cardsLength),
      playerCardsLength: Number(info.playerCardsLength), //isJoined
    };
  }
);

export const setAllCards = createAsyncThunk(
  "setAllCards",
  async ({ dispatch, unSigner }) => {
    const info = await dispatch(getInfo({ unSigner }))
      .then((result) => {
        if (result.payload) {
          return result.payload;
        }
      })
      .catch((error) => {
        console.log(error);
      });
    const cardCount = Number(info.cardsLength);

    sessionStorage.removeItem("allCards");
    sessionStorage.setItem("syncAllCards", false);
    let allCards = [];
    try {
      for (let cardIndex = 0; cardIndex < cardCount; cardIndex++) {
        const card = await unSigner.contract.cards(cardIndex);
        allCards.push({ cardIndex, hexCard: card, arrayCard: hexToArry(card) });
      }
      sessionStorage.setItem("allCards", JSON.stringify(allCards));
      sessionStorage.setItem("syncAllCards", true);
    } catch (err) {
      console.error("setAllCards:", err);
    }
    return allCards;
  }
);

export const getGameTypes = createAsyncThunk(
  "getGameTypes",
  async ({ dispatch }) => {
    const testGameTypes = [
      { id: 1, name: "BRONZE", price: "0.0002" },
      { id: 2, name: "GOLD", price: "0.0004" },
      { id: 3, name: "SILVER", price: "0.0006" },
      { id: 4, name: "DIAMOND", price: "0.0008" },
    ];
    if (!sessionStorage.getItem("gameTypes")) {
      dispatch(
        setStorage({
          key: "gameTypes",
          value: testGameTypes,
          type: "session",
        })
      );
    }
    return { gameTypes: testGameTypes, error: null };
  }
);

export const setStorage = createAsyncThunk(
  "setStorage",
  async ({ key, value, type }) => {
    // Encrypt
    const encryptedValue = AES.encrypt(
      JSON.stringify(value),
      process.env.REACT_APP_CRYPTOKEY
    );

    if (type === "local") {
      localStorage.setItem(key, encryptedValue.toString());
    } else if (type === "session") {
      sessionStorage.setItem(key, encryptedValue.toString());
    }

    return [{ result: true, encryptedValue }];
  }
);

export const getStorage = createAsyncThunk(
  "getStorage",
  async ({ key, type }) => {
    let getValue = null;
    if (type === "local") {
      getValue = localStorage.getItem(key);
    } else if (type === "session") {
      getValue = sessionStorage.getItem(key);
    }

    if (getValue) {
      // Decrypt
      const decryptedValue = AES.decrypt(
        getValue,
        process.env.REACT_APP_CRYPTOKEY
      ).toString(enc.Utf8);
      return JSON.parse(decryptedValue);
    } else {
      return null;
    }
  }
);

export const rootStore = createSlice({
  name: "rootStore",
  initialState: {},
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(checkGameStatus.fulfilled, (state, action) => {
      state.gameStatus = action.payload;
    });
    builder.addCase(getInfo.fulfilled, (state, action) => {
      state.contractInfo = action.payload;
    });
  },
});

export default rootStore.reducer;
