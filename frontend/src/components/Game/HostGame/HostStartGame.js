import React, { useState, useEffect } from "react";
import { setStorage, getStorage } from "../../../pages/store";
import { allStorageClear } from "../../../pages/Game/store";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useMetaMask } from "../../../utility/hooks/useMetaMask";
import "./HostGame.css";
//images
import singleCardImg from "../../../assets/img/single-card.png";

const HostStartGame = ({ game, gameStatus }) => {
  const { search } = useLocation();
  const dispatch = useDispatch();
  const gameId = useSelector((state) => state.gameStore.gameId);

  const { wallet, signer, unSigner } = useMetaMask();
  const nowtimestamp = Math.floor(Date.now() / 1000);
  const gametimestamp = Number(game[1]);
  let { initialSeconds = Number(gametimestamp - nowtimestamp) } = "props";
  const [seconds, setSeconds] = useState(
    initialSeconds <= 0 ? 0 : initialSeconds
  );

  const initialButtons = {
    cancel: false,
    start: false,
    cancelText: "Cancel Game",
    startText: "Start Game",
  };
  const [buttonsControl, setButtonsControl] = useState(initialButtons);

  const startGame = async (startgameId) => {
    setButtonsControl({
      start: true,
      startText: "wait (Metamask)",
      cancel: false,
      cancelText: "Cancel Game",
    });
    try {
      const tx = await signer.contract.startGame(startgameId);
      dispatch(
        setStorage({
          key: `startgame-${startgameId}`,
          value: "start-",
          type: "local",
        })
      );
      const receipt = await tx.wait();
      console.log("receipt-startgame:", receipt);
      if (receipt.events.length > 0) {
        receipt.events.forEach(async (element) => {
          if (element.event && element.event === "RequestSent") {
            dispatch(
              setStorage({
                key: `startgame-${startgameId}`,
                value: `wait-${element.args.requestId}`,
                type: "local",
              })
            );
          }
        });
      }
    } catch (error) {
      console.error(error);
      setButtonsControl(initialButtons);
    }
  };

  const cancelGame = async (cancelledgameId) => {
    setButtonsControl({
      cancel: true,
      cancelText: "wait (Metamask)",
      start: false,
      startText: "Start Game",
    });
    try {
      const tx = await signer.contract.cancelGame(cancelledgameId);
      const receipt = await tx.wait();
      console.log("receipt-cancelGame:", receipt);
      const canceledGameId = Number(receipt.events[0].args.gameId);
      if (canceledGameId) {
        await dispatch(
          allStorageClear({
            gameId: cancelledgameId,
            user: wallet.accounts[0].toLowerCase(),
          })
        )
          .then((result) => {
            if (result.payload) {
              console.log("all storage clear");
              window.location.href = "/";
            }
          })
          .catch((error) => console.log(error));
      }
    } catch (error) {
      console.error(error);
      setButtonsControl(initialButtons);
    }
  };

  useEffect(() => {
    if (localStorage.getItem(`startgame-${gameId}`)) {
      setButtonsControl({
        start: true,
        startText: "wait (Metamask)",
        cancel: false,
        cancelText: "Cancel Game",
      });
    }

    if (!game && gameStatus === 1) {
      setSeconds(initialSeconds <= 0 ? 0 : initialSeconds);
    }

    if (gameStatus === 1) {
      const countdown = setInterval(() => {
        if (seconds <= 0) {
          clearInterval(countdown);
          return;
        }
        setSeconds(seconds - 1);
      }, 1000);
      return () => {
        clearInterval(countdown);
      };
    }
  }, [seconds, gameId, game, gameStatus]);

  //Event Listeners
  useEffect(() => {
    if (!unSigner.contract) return;
    if (!gameId) return;

    const listenerRequestFulfilled = async (
      requestId,
      reqType,
      user,
      numberOfWords
    ) => {
      const reqResult = await unSigner.contract.randomRequests(requestId);
      if (Number(reqResult.gameId) === gameId) {
        dispatch(
          getStorage({
            key: `startgame-${gameId}`,
            type: "local",
          })
        )
          .then((result) => {
            if (
              result.payload &&
              result.payload.split("-")[1] === requestId.toString() &&
              Number(reqType) === 3
            ) {
              localStorage.removeItem(`startgame-${gameId}`);
              setButtonsControl(initialButtons);
            }
          })
          .catch((error) => console.log(error));
      }
    };

    unSigner.contract?.on("RequestFulfilled", listenerRequestFulfilled);
    return () => {
      unSigner.contract?.off("RequestFulfilled", listenerRequestFulfilled);
    };
  }, [signer, unSigner.contract, gameId]);

  return (
    <div className="single-card-item number-card-item">
      <div className="in-box">
        <div className="time-area">
          {gameStatus === 6 && <p>Canceled game!</p>}
          {gameStatus === 5 && <p>Expired game!</p>}
          {gameStatus === 2 && <p>Ready game</p>}
          {gameStatus === 3 && (
            <p>
              Ready game <br /> (confirm vrf)
            </p>
          )}
          {gameStatus === 1 && (
            <>
              <small>Game starts in</small>
              <p>
                {seconds / 3600 >= 1
                  ? `more than 1 hour`
                  : seconds < 60
                  ? `00 : ${seconds < 10 ? `0${seconds}` : seconds}`
                  : `${
                      Math.floor(seconds / 60) < 10
                        ? `0${Math.floor(seconds / 60)}`
                        : Math.floor(seconds / 60)
                    } : ${
                      seconds % 60 < 10 ? `0${seconds % 60}` : seconds % 60
                    }`}
              </p>
            </>
          )}
        </div>
        {gameStatus === 1 || gameStatus === 2 || gameStatus === 3 ? (
          <>
            <div className="btns-bottom mb-0">
              <Link
                to={search}
                className={
                  seconds <= 0 && !buttonsControl.start
                    ? "btn-sub"
                    : "btn-sub done"
                }
                onClick={seconds <= 0 ? () => startGame(gameId) : null}
              >
                {" "}
                {buttonsControl.startText}
              </Link>
            </div>
            <div className="btns-bottom mb-0" style={{ marginTop: "10px" }}>
              <Link
                to={search}
                className={
                  seconds > 0 && !buttonsControl.cancel
                    ? "btn-sub"
                    : "btn-sub done"
                }
                onClick={seconds > 0 ? () => cancelGame(gameId) : null}
              >
                {" "}
                {buttonsControl.cancelText}
              </Link>
            </div>
          </>
        ) : (
          <div className="btns-bottom mb-0" style={{ marginTop: "10px" }}>
            <Link to={"/"} className={"btn-sub"}>
              Go to Lobby
            </Link>
          </div>
        )}
      </div>
      <img src={singleCardImg} className="w-100" alt="" />
    </div>
  );
};

export default HostStartGame;
