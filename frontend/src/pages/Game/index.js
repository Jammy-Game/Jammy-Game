import React, { useState, useEffect, useRef } from "react";
import "./index.css";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useMetaMask } from "../../utility/hooks/useMetaMask";
import {
  urlParams,
  fetchGame,
  checkGamePrizes,
  checkNumbers,
  allStorageClear,
} from "./store";
import {
  checkGameStatus,
  setStorage,
  getStorage,
  getInfo,
  setAllCards,
} from "../store";
import BottomButtons from "../../components/Game/BottomButtons/BottomButtons";
import Cards from "../../components/Game/Cards/Cards";
import TopInfo from "../../components/Game/TopInfo/TopInfo";
import RightLine from "../../components/Game/RightLine/RightLine";
import LeftLine from "../../components/Game/LeftLine/LeftLine";
import HeadLine from "../../components/HeadLine/HeadLine";
import MockGetRandom from "../../components/MockGetRandom/MockGetRandom";
// Popups
import CardsTxPopup from "../../components/Game/Popups/CardsTxPopup";
import PrizesPopup from "../../components/Game/Popups/PrizesPopup";
import WinnerLoserPopup from "../../components/Game/Popups/WinnerLoserPopup";
import CancelledExpiredPopup from "../../components/Game/Popups/CancelledExpiredPopup";

function Game() {
  const { search } = useLocation();
  const [searchParams] = useState(new URLSearchParams(search));
  const dispatch = useDispatch();
  const gameId = useSelector((state) => state.gameStore.gameId);
  const cardCount = useSelector((state) => state.gameStore.cardCount);

  const { wallet, signer, unSigner } = useMetaMask();
  const [game, setGame] = useState([]);
  const [gameStatus, setGameStatus] = useState(0);
  const [joinTx, setJoinTx] = useState(null);

  const [drawnNumbers, setDrawnNumbers] = useState([]);
  const passiveNumbers = Array.from(Array(76).keys()).slice(1);
  const [manuelCloseToggle, setManuelCloseToggle] = useState(false); //default > false: auto | true: manuel
  const [gamePrizes, setGamePrizes] = useState([]);

  const [cardChangePopup, setCardChangePopup] = useState(false);
  const initialPrizesPopupParams = { prizeIndex: -1, winners: [] };
  const [prizesPopupParams, setPrizesPopupParams] = useState(
    initialPrizesPopupParams
  );
  const [showWinnerLoserPopup, setShowWinnerLoserPopup] = useState(false);
  const [showCancelledExpired, setShowCancelledExpired] = useState(false);
  const [isCancelExpired, setIsCancelExpired] = useState(null);
  const [newNumber, setNewNumber] = useState(null);

  const newRevealNum = useRef();

  const refundStatus = async (gameId, user) => {
    try {
      const refunds = await unSigner.contract.refunds(gameId, user);
      console.log("refunds:", refunds);
      return refunds;
    } catch (error) {
      console.log(error);
    }
  };

  const checkLocalContractWinners = (contractPrizes) => {
    if (contractPrizes.length > 0) {
      contractPrizes.forEach(async (prize, prizeIndex) => {
        const localWinners = await dispatch(
          getStorage({
            key: `prizes-${gameId}-${Number(prizeIndex)}`,
            type: "local",
          })
        )
          .then((result) => {
            if (result.payload) {
              return result.payload;
            }
          })
          .catch((error) => console.log(error));

        let prizeStatus = false;

        switch (prizeIndex) {
          case 4:
            prizeStatus = prize.isWon;
            break;

          case 3:
            prizeStatus = prize.isWon;
            break;

          case 2:
            prizeStatus = prize.isWon;
            break;

          case 1:
            prizeStatus = prize.isWon;
            break;
        }

        if (prizeStatus) {
          prize.winners.forEach((contractWinner, index) => {
            setTimeout(function () {
              if (!localWinners) {
                console.log("show-popup", index * 6000, contractWinner);
                console.log("1", {
                  prizeIndex,
                  winners: [contractWinner],
                });
                setPrizesPopupParams({
                  prizeIndex,
                  winners: [contractWinner],
                });
              } else {
                //TODO: Hata var düzeltilecek
                // if (
                //   localWinners.length < prize.winners.length &&
                //   !localWinners.find(
                //     ({ addr }) =>
                //       addr.toLowerCase() === contractWinner.addr.toLowerCase()
                //   )
                // ) {
                //   console.log("show-popup", index * 6000, contractWinner);
                //   console.log("2", {
                //     prizeIndex,
                //     winners: [contractWinner],
                //   });
                //   setPrizesPopupParams({
                //     prizeIndex,
                //     winners: [contractWinner],
                //   });
                // }
              }
            }, index * 6000);

            setTimeout(function () {
              if (!localWinners) {
                console.log("close-popup", (index + 1) * 5000, contractWinner);
                setPrizesPopupParams(initialPrizesPopupParams);
              } else {
                //TODO: yukardaki hata düzelince açılacak
                // if (localWinners.length !== prize.winners.length) {
                //   console.log(
                //     "close-popup",
                //     (index + 1) * 5000,
                //     contractWinner
                //   );
                //   setPrizesPopupParams(initialPrizesPopupParams);
                // }
              }
            }, (index + 1) * 5000);
          });
        }
      });
    }
  };

  useEffect(() => {
    if (typeof window.ethereum === "undefined") return;

    if (!gameId && unSigner.contract && wallet.accounts.length > 0) {
      dispatch(
        urlParams({
          dispatch,
          unSigner,
          user: wallet.accounts[0].toLowerCase(),
          searchParams,
        })
      );
    }

    console.log("gameId:", gameId, "cardCount:", cardCount);

    try {
      if (unSigner.contract && wallet.accounts.length > 0 && gameId > 0) {
        //cardTx popup açılışı
        dispatch(
          getStorage({
            key: `join-${gameId}-${wallet.accounts[0].toLowerCase()}`,
            type: "local",
          })
        )
          .then((result) => {
            if (result.payload) {
              setJoinTx(result.payload.split("-")[1]);
            }
          })
          .catch((error) => console.log(error));

        dispatch(fetchGame({ dispatch, unSigner, gameId }))
          .then((result) => {
            if (result.payload) {
              console.log("game:", result.payload);
              setGame(result.payload);
            }
          })
          .catch((error) => console.log(error));

        dispatch(checkGameStatus({ gameId, unSigner }))
          .then((result) => {
            if (result.payload) {
              console.log("gameStatus:", result.payload);
              setGameStatus(result.payload);
            }
          })
          .catch((error) => console.log(error));

        if (gameStatus === 1) {
          console.log(">>> GAME CREATED");
        } else if (gameStatus === 2) {
          console.log(">>> GAME HAS NOT STARTED YET");
        } else if (gameStatus === 3 && game[5] > 1) {
          console.log(">>> GAME STARTED");
          dispatch(checkNumbers({ dispatch, gameId, unSigner, gameStatus }))
            .then((result) => {
              if (result.payload) {
                setDrawnNumbers(result.payload.drawnNumbers);
              }
            })
            .catch((error) => console.log(error));
          if (!signer.isHost) {
            dispatch(
              checkGamePrizes({
                dispatch,
                unSigner,
                gameId,
                user: wallet.accounts[0].toLowerCase(),
              })
            )
              .then((result) => {
                if (result.payload) {
                  setGamePrizes(result.payload);
                  checkLocalContractWinners(result.payload); // açılmayan popuplar için kontrol edilir.
                }
              })
              .catch((error) => console.log(error));
          }
        } else if (gameStatus === 4) {
          console.log(">>> GAME ENDED");
        } else if (gameStatus === 5) {
          console.log(">>> GAME EXPIRED");
          refundStatus(gameId, wallet.accounts[0].toLowerCase())
            .then((result) => {
              if (!result) {
                setIsCancelExpired("expired");
                setShowCancelledExpired(true);
              }
            })
            .catch((error) => console.log(error));
        } else if (gameStatus === 6) {
          console.log(">>> GAME CANCELED");
          refundStatus(gameId, wallet.accounts[0].toLowerCase())
            .then((result) => {
              if (!result) {
                setIsCancelExpired("cancelled");
                setShowCancelledExpired(true);
              }
            })
            .catch((error) => console.log(error));
        }

        // contractEvents();
      }
    } catch (error) {
      console.error(error);
    }
  }, [
    wallet.accounts,
    signer,
    unSigner.contract,
    gameId,
    cardCount,
    gameStatus,
  ]);

  //Event listeners
  useEffect(() => {
    if (!unSigner.contract) return;
    if (wallet.accounts.length < 1) return;
    if (gameStatus < 1) return;

    // if (!sessionStorage.getItem("syncAllCards")) {
    //   dispatch(setAllCards({ dispatch, unSigner }));
    // }

    const listenerCardsAdded = () => {
      console.log("#CardsAdded (game) event was emmited");
      // dispatch(setAllCards({ dispatch, unSigner }));
      dispatch(getInfo({ unSigner }));
    };
    const listenerCardsUpdated = () => {
      console.log("#CardsUpdated (game) event was emmited");
      // dispatch(setAllCards({ dispatch, unSigner }));
      dispatch(getInfo({ unSigner }));
    };
    const listenerPlayerJoined = (joinGameId, player, cardsCount) => {
      if (Number(joinGameId) !== gameId) return;
      console.log("#PlayerJoined (game) event was emmited");

      dispatch(checkGameStatus({ unSigner, gameId }))
        .then((result) => {
          if (result.payload) {
            console.log(">>gameStatus:", result.payload);
            setGameStatus(result.payload);
          }
        })
        .catch((error) => console.log(error));

      dispatch(fetchGame({ dispatch, unSigner, gameId }))
        .then((result) => {
          if (result.payload) {
            setGame(result.payload);
          }
        })
        .catch((error) => console.log(error));
    };
    const listenerRequestFulfilled = async (
      requestId,
      reqType,
      player,
      numberOfWords
    ) => {
      const reqResult = await unSigner.contract.randomRequests(requestId);
      if (Number(reqResult.gameId) !== gameId) return;
      if (Number(reqType) !== 3) return;
      console.log("#RequestFulfilled (game) event was emmited");

      dispatch(fetchGame({ dispatch, unSigner, gameId }))
        .then((result) => {
          if (result.payload) {
            setGame(result.payload);
          }
        })
        .catch((error) => console.log(error));

      dispatch(checkGameStatus({ unSigner, gameId }))
        .then((result) => {
          if (result.payload) {
            console.log(">>gameStatus:", result.payload);
            setGameStatus(result.payload);
          }
        })
        .catch((error) => console.log(error));
    };
    const listenerGameStarted = (startedGameId) => {
      if (Number(startedGameId) !== gameId) return;
      console.log("#GameStarted (game) event was emmited");

      dispatch(checkGameStatus({ gameId, unSigner }))
        .then((result) => {
          if (result.payload) {
            console.log(">>gameStatus:", result.payload);
            setGameStatus(result.payload);
            localStorage.removeItem(
              `join-${gameId}-${wallet.accounts[0].toLowerCase()}`
            );
          }
        })
        .catch((error) => console.log(error));
    };
    const listenerNumberRevealed = async (nrGameId, revealedNum) => {
      if (Number(nrGameId) !== gameId) return;
      console.log("#NumberRevealed (game) event was emmited");

      await unSigner.contract
        ?.queryFilter("NumberRevealed") // TODO: block aralığı sınırlandırılacak (toBlock)
        .then(async (result) => {
          result.forEach(async (event) => {
            if (
              Number(event.args.gameId) === gameId &&
              Number(event.args.revealedNum) === revealedNum
            ) {
              const blockTimestamp = (await event.getBlock()).timestamp;
              const tx = event.transactionHash;

              setDrawnNumbers((oldDrawnNumbers) => [
                ...oldDrawnNumbers,
                !oldDrawnNumbers.find(
                  ({ number }) => number === Number(revealedNum)
                ) && {
                  datetime: blockTimestamp,
                  number: Number(revealedNum),
                  transaction: tx,
                },
              ]);

              const localRN = await dispatch(
                getStorage({
                  key: `revealNumbers-${gameId}`,
                  type: "local",
                })
              )
                .then((result) => {
                  return result.payload || [];
                })
                .catch((error) => console.log(error));

              if (!localRN.find(({ num }) => num === Number(revealedNum))) {
                if (!signer.isHost) {
                  setNewNumber(Number(revealedNum));
                  newRevealNum.current.style.display = "block";
                  setTimeout(() => {
                    // setNewNumber(null);
                    newRevealNum.current.style.display = "none";
                  }, 3500);
                }
                localRN.push({
                  datetime: blockTimestamp,
                  number: Number(revealedNum),
                  transaction: tx,
                });
                dispatch(
                  setStorage({
                    key: `revealNumbers-${gameId}`,
                    value: localRN,
                    type: "local",
                  })
                );
                console.log("localRN event:", localRN);
              }

              const info = await dispatch(
                getInfo({
                  unSigner,
                  gameId,
                  user: wallet.accounts[0].toLowerCase(),
                })
              )
                .then((result) => {
                  if (result.payload) {
                    return result.payload;
                  }
                })
                .catch((error) => console.log(error));

              const localNumbers = await dispatch(
                getStorage({
                  key: `revealNumbers-${gameId}`,
                  type: "local",
                })
              )
                .then((result) => {
                  return result.payload || [];
                })
                .catch((error) => console.log(error));

              // console.log(
              //   "localRN:",
              //   localNumbers.length,
              //   "contractRN:",
              //   Number(info.revealedNumberLength)
              // );
              if (info && localNumbers.length !== Number(info.revealedNumberLength)) {
                console.log(">>> FE and Contract out of sync");
                dispatch(
                  checkNumbers({ dispatch, gameId, unSigner, gameStatus })
                )
                  .then((result) => {
                    if (result.payload) {
                      setDrawnNumbers(result.payload.drawnNumbers);
                    }
                  })
                  .catch((error) => console.log(error));
              } else {
                console.log(">>> FE and Contract synchronized");
              }
            }
          });
        });

      if (!signer.isHost) {
        dispatch(
          checkGamePrizes({
            dispatch,
            unSigner,
            gameId,
            user: wallet.accounts[0].toLowerCase(),
          })
        )
          .then((result) => {
            if (result.payload) {
              setGamePrizes(result.payload);
              checkLocalContractWinners(result.payload); // açılmayan popuplar için kontrol edilir.
            }
          })
          .catch((error) => console.log(error));
      }
    };
    const listenerPrizeWon = (prizeWonGameId, prizeIndex, winner) => {
      if (Number(prizeWonGameId) !== gameId) return;
      console.log("#PrizeWon (game) event was emmited");

      dispatch(checkGameStatus({ gameId, unSigner }))
        .then((result) => {
          if (result.payload) {
            console.log(">>gameStatus:", result.payload);
            setGameStatus(result.payload);
          }
        })
        .catch((error) => console.log(error));

      if (!signer.isHost) {
        Number(prizeIndex) !== 0 &&
          setPrizesPopupParams({
            prizeIndex: Number(prizeIndex),
            winners: [winner],
          });
      } else {
        if (
          Number(prizeIndex) === 0 &&
          !localStorage.getItem(`jammy-${game[0]}`)
        ) {
          dispatch(
            setStorage({
              key: `jammy-${game[0]}`,
              value: true,
              type: "local",
            })
          );
        }
      }
    };
    const listenerGameEnds = async (endsGameId) => {
      if (Number(endsGameId) !== gameId) return;
      console.log("#GameEnds (game) event was emmited");

      dispatch(
        checkGamePrizes({
          dispatch,
          unSigner,
          gameId,
          user: wallet.accounts[0].toLowerCase(),
        })
      )
        .then((result) => {
          if (result.payload) {
            setGamePrizes(result.payload);
          }
        })
        .catch((error) => console.log(error));

      dispatch(checkGameStatus({ gameId, unSigner }))
        .then((result) => {
          if (result.payload) {
            console.log(">>gameStatus:", result.payload);
            setGameStatus(result.payload);
          }
        })
        .catch((error) => console.log(error));

      let winners = [];
      try {
        for (let i = 0; ; i++) {
          winners.push(await unSigner.contract.prizeWinners(gameId, 0, i));
        }
      } catch (error) {
        setPrizesPopupParams({ prizeIndex: 0, winners: winners });
      }
    };
    const listenerPrizeCollected = (prizeCollectedGameId, totalAmount) => {
      if (Number(prizeCollectedGameId) !== gameId) return;
      console.log("#PrizeCollected (game) event was emmited");

      if (!signer.isHost) {
        dispatch(
          allStorageClear({ gameId, user: wallet.accounts[0].toLowerCase() })
        )
          .then((result) => {
            if (result.payload) {
              console.log("all storage clear");
            }
          })
          .catch((error) => console.log(error));
      }

      if (!showWinnerLoserPopup) {
        setPrizesPopupParams(initialPrizesPopupParams);
        setShowWinnerLoserPopup(true);
      }
    };
    const listenerGameCancelled = (cancelledGameId) => {
      if (Number(cancelledGameId) !== gameId) return;
      console.log("#GameCancelled (game) event was emmited");

      dispatch(checkGameStatus({ gameId, unSigner }))
        .then((result) => {
          if (result.payload) {
            console.log(">>gameStatus:", result.payload);
            setGameStatus(result.payload);
          }
        })
        .catch((error) => console.log(error));

      refundStatus(gameId, wallet.accounts[0].toLowerCase())
        .then((result) => {
          if (!result) {
            setIsCancelExpired("cancelled");
            setShowCancelledExpired(true);
          }
        })
        .catch((error) => console.log(error));
    };

    unSigner.contract?.on("CardsAdded", listenerCardsAdded);
    unSigner.contract?.on("CardsUpdated", listenerCardsUpdated);
    gameStatus === 1 &&
      unSigner.contract?.on("PlayerJoined", listenerPlayerJoined);
    (gameStatus === 1 || gameStatus === 3) &&
      unSigner.contract?.on("RequestFulfilled", listenerRequestFulfilled);
    (gameStatus === 2 || gameStatus === 3) &&
      unSigner.contract?.on("GameStarted", listenerGameStarted);
    gameStatus === 3 &&
      unSigner.contract?.on("NumberRevealed", listenerNumberRevealed);
    gameStatus === 3 && unSigner.contract?.on("PrizeWon", listenerPrizeWon);
    (gameStatus === 3 || gameStatus === 4) &&
      unSigner.contract?.on("GameEnds", listenerGameEnds);
    gameStatus === 4 &&
      unSigner.contract?.on("PrizeCollected", listenerPrizeCollected);
    gameStatus === 1 &&
      unSigner.contract?.on("GameCancelled", listenerGameCancelled);
    return () => {
      unSigner.contract?.off("CardsAdded", listenerCardsAdded);
      unSigner.contract?.off("CardsUpdated", listenerCardsUpdated);
      gameStatus === 1 &&
        unSigner.contract?.off("PlayerJoined", listenerPlayerJoined);
      (gameStatus === 1 || gameStatus === 3) &&
        unSigner.contract?.off("RequestFulfilled", listenerRequestFulfilled);
      (gameStatus === 2 || gameStatus === 3) &&
        unSigner.contract?.off("GameStarted", listenerGameStarted);
      gameStatus === 3 &&
        unSigner.contract?.off("NumberRevealed", listenerNumberRevealed);
      gameStatus === 3 && unSigner.contract?.off("PrizeWon", listenerPrizeWon);
      (gameStatus === 3 || gameStatus === 4) &&
        unSigner.contract?.off("GameEnds", listenerGameEnds);
      gameStatus === 4 &&
        unSigner.contract?.off("PrizeCollected", listenerPrizeCollected);
      gameStatus === 1 &&
        unSigner.contract?.off("GameCancelled", listenerGameCancelled);
    };
  }, [signer, unSigner.contract, wallet.accounts, gameId, gameStatus]);

  return (
    <>
      <div
        className="new-reveal-number"
        ref={newRevealNum}
        // style={newNumber !== null ? { display: "block" } : { display: "none" }}
      >
        <h1>{newNumber}</h1>
      </div>
      {Number(process.env.REACT_APP_NETWORKVERSION) === 31337 && (
        <MockGetRandom />
      )}
      <HeadLine />
      <div className="wrapper">
        <LeftLine
          drawnNumbers={drawnNumbers}
          passiveNumbers={passiveNumbers.sort(function (a, b) {
            return a - b;
          })}
          gameStatus={gameStatus}
        />
        <div className="item-center col-7 col-xl-6">
          <TopInfo game={game} />
          <Cards
            game={game}
            gameStatus={gameStatus}
            drawnNumbers={drawnNumbers}
            manuelCloseToggle={manuelCloseToggle}
            cardChangePopup={cardChangePopup}
            setCardChangePopup={setCardChangePopup}
          />
          <BottomButtons
            gameStatus={gameStatus}
            drawnNumbers={drawnNumbers}
            gamePrizes={gamePrizes}
            setCardChangePopup={setCardChangePopup}
            manuelCloseToggle={manuelCloseToggle}
            setManuelCloseToggle={setManuelCloseToggle}
          />
        </div>
        <RightLine
          game={game}
          gameStatus={gameStatus}
          drawnNumbers={drawnNumbers}
        />
      </div>

      {joinTx && (
        <CardsTxPopup
          hash={joinTx}
          onClose={() => {
            localStorage.removeItem(
              `join-${gameId}-${wallet.accounts[0].toLowerCase()}`
            );
            setJoinTx(null);
          }}
        />
      )}
      {prizesPopupParams.prizeIndex !== -1 && !signer.isHost && (
        <PrizesPopup
          drawnNumbers={drawnNumbers}
          prizesPopupParams={prizesPopupParams}
          setShowWinnerLoserPopup={setShowWinnerLoserPopup}
          onClose={() => setPrizesPopupParams(initialPrizesPopupParams)}
        />
      )}
      {showWinnerLoserPopup && !signer.isHost && (
        <WinnerLoserPopup
          game={game}
          drawnNumbers={drawnNumbers}
          onClose={() => setShowWinnerLoserPopup(false)}
        />
      )}
      {showCancelledExpired && !signer.isHost && (
        <CancelledExpiredPopup
          isCancelExpired={isCancelExpired}
          onClose={() => setShowCancelledExpired(false)}
        />
      )}
    </>
  );
}
export default Game;
