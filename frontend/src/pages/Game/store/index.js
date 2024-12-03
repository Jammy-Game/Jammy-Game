// ** Redux Imports
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { utils } from "ethers";
import { hexToArry } from "../../../components/CreateCards";
import { setStorage, getStorage, getInfo } from "../../store";

export const allStorageClear = createAsyncThunk(
  "allStorageClear",
  async ({ gameId, user }) => {
    localStorage.removeItem(`redraw-${gameId}-${user}-0`);
    localStorage.removeItem(`redraw-${gameId}-${user}-1`);
    localStorage.removeItem(`redraw-${gameId}-${user}-2`);
    localStorage.removeItem(`redraw-${gameId}-${user}-3`);
    localStorage.removeItem(`closeNumber-${gameId}-0`);
    localStorage.removeItem(`closeNumber-${gameId}-1`);
    localStorage.removeItem(`closeNumber-${gameId}-2`);
    localStorage.removeItem(`closeNumber-${gameId}-3`);
    localStorage.removeItem(`prizes-${gameId}-4`);
    localStorage.removeItem(`prizes-${gameId}-3`);
    localStorage.removeItem(`prizes-${gameId}-2`);
    localStorage.removeItem(`prizes-${gameId}-1`);
    localStorage.removeItem(`prizes-${gameId}-0`);
    localStorage.removeItem(`startgame-${gameId}`);
    localStorage.removeItem(`revealNumbers-${gameId}`);
    localStorage.removeItem(`jammy-${gameId}`);

    return true;
  }
);

export const urlParams = createAsyncThunk(
  "urlParams",
  async ({ dispatch, unSigner, user, searchParams }) => {
    const gameId = Number(searchParams.get("gameId"));

    const info = await dispatch(
      getInfo({ unSigner, user, gameId: Number(gameId) })
    )
      .then((result) => {
        if (result.payload) {
          return result.payload;
        }
      })
      .catch((error) => {
        console.log(error);
      });

    const cardCount = Number(info.playerCardsLength);
    return { gameId, cardCount };
  }
);

export const fetchGame = createAsyncThunk(
  "fetchGame",
  async ({ dispatch, unSigner, gameId }) => {
    const games = await unSigner.contract.games(gameId);
    const gameHost = games.host.toLowerCase();
    const gametimestamp = Number(games.startDate);
    const gamecardprice = Number(games.cardPrice); //TODO: Number dönüşümü olmayabilir bakılacak
    const maxCardsPerPlayer = Number(games.maxCardsPerPlayer);
    const totalCardsSold = Number(games.totalCardsSold);
    const houseShare = Number(games.houseShare);
    const gameSeed = Number(games.seed);
    const cancelled = games.cancelled;
    const totalPlayerCount = Number(games.totalPlayerCount); //TODO: contratta verilmeli

    const game = [
      gameId, //index 0
      gametimestamp, //index 1
      gamecardprice, //index 2
      maxCardsPerPlayer, //index 3
      totalCardsSold, //index 4
      gameSeed, //index 5
      houseShare, //index 6
      gameHost, //index 7
      cancelled, //index 8
      totalPlayerCount,
    ];
    return game;
  }
);

export const getCard = createAsyncThunk(
  "getCard",
  async ({ dispatch, gameId, unSigner, user, playerCardIndex }) => {
    let cardIndex = null;
    let hexCard = null;
    let errors = [];

    try {
      hexCard = await unSigner.contract.playerCards(
        gameId,
        user,
        playerCardIndex
      );

      if (Number(hexCard) !== 1) {
        // const allCards = JSON.parse(sessionStorage.getItem("allCards"));
        // cardIndex = allCards.find(
        //   (card) => card.hexCard.hex === hexCard._hex
        // ).cardIndex;
        // localStorage.removeItem(`redraw-${gameId}-${user}-${playerCardIndex}`);

        return {
          cardIndex,
          cardNumbers: hexToArry(hexCard),
          errors: null,
        };
      } else {
        errors.push("card not ready");
        return { cardIndex: null, cardNumbers: null, errors: errors };
      }
    } catch (error) {
      errors.push("card not found");
      return { cardIndex, cardNumbers: null, errors: errors };
    }
  }
);

export const redrawCard = createAsyncThunk(
  "redrawCard",
  async ({
    dispatch,
    gameId,
    signer,
    user,
    playerCardIndex,
    gameStatus,
    game,
  }) => {
    let errors = [];
    let hash = null;

    if (gameStatus === 1) {
      try {
        const redrawValue = utils.formatEther((game[2] / 2).toString());
        console.log(redrawValue);
        const tx = await signer.contract.redrawCard(gameId, playerCardIndex, {
          value: utils.parseEther(redrawValue),
        });
        dispatch(
          setStorage({
            key: `redraw-${gameId}-${user}-${playerCardIndex}`,
            value: "start-",
            type: "local",
          })
        );
        const receipt = await tx.wait();
        console.log("receipt-redrawCard:", receipt);

        if (receipt.events.length > 0) {
          receipt.events.forEach((element) => {
            if (element.event && element.event === "RequestSent") {
              hash = receipt.transactionHash;
              dispatch(
                setStorage({
                  key: `redraw-${gameId}-${user}-${playerCardIndex}`,
                  value: `wait-${element.args.requestId}`,
                  type: "local",
                })
              );
              localStorage.removeItem(
                `card-${gameId}-${user}-${playerCardIndex}`
              );
            }
          });
        }
      } catch (err) {
        errors.push(err.reason);
        localStorage.removeItem(`redraw-${gameId}-${user}-${playerCardIndex}`);
      }
    } else {
      errors.push("redrawCards: wrongGameStatus");
    }
    return { hash, errors };
  }
);

export const checkGamePrizes = createAsyncThunk(
  "checkGamePrizes",
  async ({ dispatch, unSigner, gameId, user }) => {
    let prizeObj = [];

    const info = await dispatch(getInfo({ unSigner, gameId, user }))
      .then((result) => {
        if (result.payload) {
          return result.payload;
        }
      })
      .catch((error) => {
        console.log(error);
      });
    const gamePrizesLength = Number(info.gamePrizesLength);

    for (let prizeIndex = 0; prizeIndex < gamePrizesLength; prizeIndex++) {
      //prizeIndex: 0 > jammy, 1 > jam4, 2 > jam3, 3 > jam2, 4 > jam1
      const info = await dispatch(
        getInfo({ unSigner, gameId, user, prizeIndex })
      )
        .then((result) => {
          if (result.payload) {
            return result.payload;
          }
        })
        .catch((error) => {
          console.log(error);
        });
      const prizeWinnersLength = Number(info.prizeWinnersLength);

      let winners = [];
      const isWon = (await unSigner.contract.gamePrizes(gameId, prizeIndex))
        .won;

      for (
        let winnerIndex = 0;
        winnerIndex < prizeWinnersLength;
        winnerIndex++
      ) {
        const winner = await unSigner.contract.prizeWinners(
          gameId,
          prizeIndex,
          winnerIndex
        );
        winners.push(winner);
      }

      prizeObj.push({ prizeIndex, isWon, winners });
    }

    return prizeObj;
  }
);

export const closeNumber = createAsyncThunk(
  "closeNumber",
  async ({
    dispatch,
    gameId,
    unSigner,
    gameStatus,
    playerCardIndex,
    number,
    card0DrawnNumbers,
    card1DrawnNumbers,
    card2DrawnNumbers,
    card3DrawnNumbers,
  }) => {
    let errors = [];
    if (gameStatus === 3) {
      let closedNumbers =
        (await dispatch(
          getStorage({
            key: `closeNumber-${gameId}-${playerCardIndex}`,
            type: "local",
          })
        )
          .then((result) => {
            if (result.payload) {
              return result.payload;
            }
          })
          .catch((error) => console.log(error))) || [];

      const tx = await unSigner.contract.drawnNumbers(gameId, number); //kontrat tarafında sayının cekilip cekilmedigi kontrol ediliyor.
      if (tx) {
        if (
          (card0DrawnNumbers && !card0DrawnNumbers.includes(number)) ||
          (card1DrawnNumbers && !card1DrawnNumbers.includes(number)) ||
          (card2DrawnNumbers && !card2DrawnNumbers.includes(number)) ||
          (card3DrawnNumbers && !card3DrawnNumbers.includes(number))
        ) {
          closedNumbers.push(number);
          await dispatch(
            setStorage({
              key: `closeNumber-${gameId}-${playerCardIndex}`,
              value: closedNumbers,
              type: "local",
            })
          );
          return { closedNumbers, errors: null };
        } else {
          errors.push(`'${number}' is closed!`);
          return { closedNumbers: null, errors: errors };
        }
      } else {
        errors.push(`'${number}' is not drawn!`);
        return { closedNumbers: null, errors: errors };
      }
    } else {
      errors.push(`closeNumber: wrongGameStatus (${gameStatus})`);
      return { closedNumbers: null, errors: errors };
    }
  }
);

export const checkNumbers = createAsyncThunk(
  "checkNumbers",
  async ({ dispatch, unSigner, gameId, gameStatus }) => {
    let drawnNumbers = [];

    if (gameStatus === 3) {
      localStorage.removeItem(`revealNumbers-${gameId}`);

      // for (let i = 1; i <= 75; i++) {
      //   const resultDrawnState = await unSigner.contract.drawnNumbers(
      //     gameId,
      //     i
      //   );
      //   // const resultDrawnHash = (
      //   //   await unSigner.contract.drawnNumbers(gameId, i)
      //   // ).txHash;
      //   // const datetime = Number(
      //   //   (await unSigner.contract.drawnNumbers(gameId, i)).datetime
      //   // );
      //   if (resultDrawnState === true) {
      //     drawnNumbers.push({
      //       datetime: null,
      //       number: i,
      //       transaction: null, //resultDrawnHash,
      //     });
      //   }
      // }

      const allDrawnNumbers = await unSigner.contract
        ?.queryFilter("NumberRevealed")
        .then(async (result) => {
          return result;
        });

      for (let i = 0; i < allDrawnNumbers.length; i++) {
        // console.log("blockTimestamp:", (await unSigner.provider.getBlock(event.blockNumber)).timestamp);
        if (Number(allDrawnNumbers[i].args.gameId) === gameId) {
          const blockTimestamp = (await allDrawnNumbers[i].getBlock())
            .timestamp;
          const tx = allDrawnNumbers[i].transactionHash;
          const revealedNum = Number(allDrawnNumbers[i].args.revealedNum);
          drawnNumbers.push({
            datetime: blockTimestamp,
            number: revealedNum,
            transaction: tx,
          });
        }
      }

      dispatch(
        setStorage({
          key: `revealNumbers-${gameId}`,
          value: drawnNumbers,
          type: "local",
        })
      );
    } else {
      console.log(`checkNumbers: wrongGameStatus (${gameStatus})`);
    }

    return { drawnNumbers };
  }
);

//TODO: manuel sayı kapatmada bottombuttons (winPrize) bağlı olarak karşılıklı iyileştirilecek.
//TODO: fe ye yeni sayı gelmeden sayıyı kapatması ve winprize yapabilmesi engellenecek.
export const checkWinCard = createAsyncThunk(
  "checkWinCard",
  async ({
    dispatch,
    unSigner,
    gameId,
    cardCount,
    user,
    prizeIndex,
    drawnNumbers,
    isManuelCloseCard,
  }) => {
    console.log("isManuelCloseCard:", isManuelCloseCard, cardCount);
    let isFound = false;
    let pci = 0;
    let hexCard = null;
    let cardIndex = null;
    let arrayCard = null;
    let localDrawnNumbers = null;

    for (pci; pci < cardCount; pci++) {
      if (isManuelCloseCard) {
        localDrawnNumbers = await dispatch(
          getStorage({
            key: `closeNumber-${gameId}-${pci}`,
            type: "local",
          })
        )
          .then((result) => {
            if (result.payload) {
              console.log("localDrawnNumbers:", pci, result.payload);
              return result.payload;
            }
          })
          .catch((error) => console.log(error));
      }

      try {
        hexCard = await unSigner.contract.playerCards(gameId, user, pci);

        arrayCard = hexToArry(hexCard);

        const rowsToMatch = 5 - prizeIndex;
        let matchedRows = 0;
        let seenNum = 0;
        let rowIndex = 0;
        let winRowIndex = 0;

        arrayCard.forEach((cardNum, cardNumIndex) => {
          if (cardNum === 0) seenNum++;
          if (isManuelCloseCard) {
            if (localDrawnNumbers) {
              localDrawnNumbers.forEach((drawnNum) => {
                if (Number(cardNum) === Number(drawnNum)) {
                  seenNum++;
                }
              });
            }
          } else {
            drawnNumbers.forEach((drawnNum) => {
              if (Number(cardNum) === Number(drawnNum.number)) {
                seenNum++;
              }
            });
          }

          if (cardNumIndex % 5 === 4) {
            if (seenNum === 5) {
              matchedRows++;
              winRowIndex = rowIndex;
            }
            seenNum = 0;
            rowIndex++;
          }
        });
        console.log(pci, hexCard, matchedRows, rowsToMatch);

        if (matchedRows >= rowsToMatch) {
          isFound = true;
          // const allCards = JSON.parse(sessionStorage.getItem("allCards"));
          // cardIndex = allCards.find(
          //   (card) => card.hexCard.hex === hexCard._hex
          // ).cardIndex;
          break;
        }
      } catch (error) {
        console.log(error.reason);
        break;
      }
    }

    return {
      isFound,
      user,
      avatar: "avatar6.png",
      username: "username",
      playerCardIndex: pci,
      cardIndex,
      arrayCard,
      hexCard,
      drawnNumbers: isManuelCloseCard ? localDrawnNumbers : drawnNumbers,
    };
  }
);

export const gameStore = createSlice({
  name: "gameStore",
  initialState: {},
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(urlParams.fulfilled, (state, action) => {
      state.gameId = action.payload.gameId;
      state.cardCount = action.payload.cardCount;
    });

    builder.addCase(fetchGame.fulfilled, (state, action) => {
      state.game = action.payload;
    });
  },
});

export default gameStore.reducer;
