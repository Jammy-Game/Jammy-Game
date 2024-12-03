import React, { useEffect, useState } from "react";
import { getCard, redrawCard, closeNumber } from "../../../pages/Game/store";
import { getStorage } from "../../../pages/store";
import { useDispatch, useSelector } from "react-redux";
import { useMetaMask } from "../../../utility/hooks/useMetaMask";
import Loading from "../../../components/Loading/Loading";
//images
import logo from "../../../assets/img/logo.svg";

const Card0 = ({
  game,
  gameStatus,
  inComponent,
  hash,
  drawnNumbers,
  card0DrawnNumbers,
  setCard0DrawnNumbers,
  manuelCloseToggle,
  redrawPCI,
  setRedrawPCI,
  cardChangePopup,
}) => {
  const dispatch = useDispatch();
  const gameId = useSelector((state) => state.gameStore.gameId);
  const cardCount = useSelector((state) => state.gameStore.cardCount);

  const { wallet, signer, unSigner } = useMetaMask();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingText, setIsLoadingText] = useState(null);
  const [cardIndex, setCardIndex] = useState(null);
  const [cardNumbers, setCardNumbers] = useState(null);
  const [reRander, setReRander] = useState(false);
  const playerCardIndex = 0;

  useEffect(() => {
    if (redrawPCI > -1) {
      if (redrawPCI !== playerCardIndex) {
        setIsLoading(true);
        setIsLoadingText("unavailable now!");
      }
    } else if (wallet.accounts.length > 0 && gameId) {
      dispatch(
        getStorage({
          key: `redraw-${gameId}-${wallet.accounts[0].toLowerCase()}-${playerCardIndex}`,
          type: "local",
        })
      )
        .then((result) => {
          if (result.payload) {
            setIsLoading(true);
            setIsLoadingText("Waiting transaction...");
          } else {
            setIsLoading(false);
            setIsLoadingText(null);
          }
        })
        .catch((error) => console.log(error));
    }
  }, [wallet.accounts, gameId, redrawPCI]);

  useEffect(() => {
    if (!unSigner.contract) return;
    if (wallet.accounts.length < 1) return;
    if (!gameId) return;

    if (gameStatus === 3) {
      dispatch(
        getStorage({
          key: `closeNumber-${gameId}-${playerCardIndex}`,
          type: "local",
        })
      )
        .then((result) => {
          if (result.payload && !card0DrawnNumbers.length > 0) {
            console.log(
              `closeNumber-${gameId}-${playerCardIndex}`,
              result.payload
            );
            setCard0DrawnNumbers(result.payload);
          }
        })
        .catch((error) => console.log(error));
    }

    if (unSigner.contract && cardCount >= 1) {
      gameStatus !== 3 && setIsLoading(true);
      dispatch(
        getCard({
          dispatch,
          gameId,
          unSigner,
          user: wallet.accounts[0].toLowerCase(),
          playerCardIndex,
        })
      )
        .then((result) => {
          setIsLoading(true);
          // console.log("getCard(0):", result.payload);
          if (result.payload) {
            if (!result.payload.errors) {
              setCardIndex(result.payload.cardIndex);
              setCardNumbers(result.payload.cardNumbers);
              setIsLoading(false);
            } else if (result.payload.errors.includes("card not ready")) {
              setCardIndex(null);
              setCardNumbers([]);
              dispatch(
                getStorage({
                  key: `redraw-${gameId}-${wallet.accounts[0].toLowerCase()}-${playerCardIndex}`,
                  type: "local",
                })
              )
                .then((result) => {
                  if (result.payload) {
                    setIsLoadingText("Waiting transaction...");
                  }
                })
                .catch((error) => console.log(error));
            } else {
              setIsLoadingText("Card not found!");
            }
          }
        })
        .catch((error) => console.log(error));
    } else {
      setIsLoading(false);
    }
  }, [unSigner, wallet.accounts, gameId, cardCount, cardChangePopup, reRander]);

  useEffect(() => {
    if (!unSigner.contract) return;
    if (wallet.accounts.length < 1) return;
    if (!gameId) return;

    const listenerRequestFulfilled = async (
      requestId,
      reqType,
      player,
      numberOfWords
    ) => {
      const reqResult = await unSigner.contract.randomRequests(requestId);
      if (Number(reqResult.gameId) === gameId) {
        dispatch(
          getStorage({
            key: `redraw-${gameId}-${wallet.accounts[0].toLowerCase()}-${playerCardIndex}`,
            type: "local",
          })
        )
          .then((result) => {
            if (
              result.payload &&
              result.payload.split("-")[1] === requestId.toString() &&
              Number(reqType) === 2 &&
              player.toLowerCase() === wallet.accounts[0].toLowerCase()
            ) {
              localStorage.removeItem(
                `redraw-${gameId}-${wallet.accounts[0].toLowerCase()}-${playerCardIndex}`
              );
              setIsLoadingText(null);
            }
            setReRander(!reRander);
          })
          .catch((error) => console.log(error));
      }
    };

    unSigner.contract?.on("RequestFulfilled", listenerRequestFulfilled);
    return () => {
      unSigner.contract?.off("RequestFulfilled", listenerRequestFulfilled);
    };
  }, [unSigner.contract, wallet.accounts, gameId]);

  return (
    <>
      {isLoading ? (
        <div className="item-card">
          <div className="d-flex w-100 h-100 justify-content-center align-items-center">
            <img className="w-100" src={logo} alt="" />
            <Loading text={isLoadingText ? isLoadingText : "Loading card..."} />
          </div>
        </div>
      ) : cardNumbers !== null ? (
        <div
          className="item-card"
          style={
            inComponent === "CardTx" || inComponent === "CardChange"
              ? { cursor: "pointer" }
              : { cursor: "auto" }
          }
          onClick={
            inComponent === "CardChange"
              ? () => {
                  setIsLoading(true);
                  setIsLoadingText("Waiting metamask...");
                  setRedrawPCI(playerCardIndex);
                  dispatch(
                    redrawCard({
                      dispatch,
                      gameId,
                      signer,
                      user: wallet.accounts[0].toLowerCase(),
                      playerCardIndex,
                      gameStatus,
                      game,
                    })
                  )
                    .then((result) => {
                      if (result.payload) {
                        if (!result.payload.errors) {
                          setCardIndex(null);
                          setCardNumbers([]);
                        } else {
                          setIsLoading(false);
                          setIsLoadingText(null);
                        }
                        setRedrawPCI(-1);
                      }
                    })
                    .catch((error) => console.log(error));
                }
              : inComponent === "CardTx"
              ? () =>
                  window.open(
                    `${process.env.REACT_APP_NETWORKURL}tx/${hash}`,
                    "_blank"
                  )
              : null
          }
        >
          <span>{cardIndex}</span>
          <div className="in">
            {cardNumbers.length > 0
              ? cardNumbers.map((number, numberindex) =>
                  manuelCloseToggle ? (
                    // manuel sayı kapatma
                    <div
                      key={numberindex}
                      className={
                        card0DrawnNumbers
                          ? card0DrawnNumbers.includes(number) || number === 0
                            ? "item revealed"
                            : "item"
                          : "item"
                      }
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        number !== 0 &&
                        inComponent !== "CardTx" &&
                        inComponent !== "CardChange"
                          ? dispatch(
                              closeNumber({
                                dispatch,
                                gameId,
                                unSigner,
                                gameStatus,
                                playerCardIndex,
                                number,
                                card0DrawnNumbers,
                              })
                            )
                              .then((result) => {
                                if (result.payload) {
                                  console.log(result.payload);
                                  if (!result.payload.errors) {
                                    setCard0DrawnNumbers(
                                      result.payload.closedNumbers
                                    );
                                  }
                                }
                              })
                              .catch((error) => console.log(error))
                          : null
                      }
                    >
                      {number !== 0 ? number : null}
                    </div>
                  ) : (
                    // Otomatik sayı kapatma
                    <div
                      key={numberindex}
                      className={
                        drawnNumbers
                          ? drawnNumbers.find(
                              (drawn) => drawn.number === number
                            ) || number === 0
                            ? "item revealed"
                            : "item"
                          : "item"
                      }
                    >
                      {number !== 0 ? number : null}
                    </div>
                  )
                )
              : null}
          </div>
        </div>
      ) : (
        <div className="item-card" style={{ cursor: "auto" }}>
          <div className="d-flex w-100 h-100 justify-content-center align-items-center">
            <img className="w-100" src={logo} alt="" />
          </div>
        </div>
      )}
    </>
  );
};

export default React.memo(Card0);
