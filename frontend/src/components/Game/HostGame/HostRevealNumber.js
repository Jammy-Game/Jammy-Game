import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useMetaMask } from "../../../utility/hooks/useMetaMask";
import { allStorageClear } from "../../../pages/Game/store";
import { getStorage } from "../../../pages/store";
import "./HostGame.css";
//images
import singleCardImg from "../../../assets/img/single-card.png";

const HostRevealNumber = ({ gameStatus, drawnNumbers }) => {
  const { search } = useLocation();
  const dispatch = useDispatch();
  const gameId = useSelector((state) => state.gameStore.gameId);

  const { wallet, signer, unSigner } = useMetaMask();
  const [seconds, setSeconds] = useState(0);
  const [lastRevealedNumber, setLastRevealedNumber] = useState(0);
  const hostDelay = 30; // saniye bekleme
  const [btnLoading, setBtnLoading] = useState(false);
  const [isEndGame, setIsEndGame] = useState(
    localStorage.getItem(`jammy-${gameId}`) ? true : false
  );

  const revealNumber = async () => {
    // setBtnLoading(true);
    if (typeof window.ethereum !== "undefined" && gameStatus === 3) {
      try {
        setBtnLoading(false);
        setSeconds(hostDelay);
        const tx = await signer.contract.revealNumber(gameId);
        const receipt = await tx.wait();
        console.log("rn-receipt:", receipt);
        setLastRevealedNumber(receipt.events[0].args.revealedNum);
        setBtnLoading(false);
        setSeconds(0);
      } catch (error) {
        setBtnLoading(false);
        setSeconds(0);
        console.log(error);
      }
    } else {
      console.log(`revealNumber: wrongGameStatus (${gameStatus})`);
    }
  };

  const backToLobby = async () => {
    await dispatch(
      allStorageClear({ gameId, user: wallet.accounts[0].toLowerCase() })
    )
      .then((result) => {
        if (result.payload) {
          console.log("all storage clear");
          window.location.href = "/";
        }
      })
      .catch((error) => console.log(error));
  };

  useEffect(() => {
    const countdown = setInterval(() => {
      if (seconds === 0) {
        clearInterval(countdown);
        return;
      }
      setSeconds(seconds - 1);
    }, 1000);
    return () => {
      clearInterval(countdown);
    };
  }, [seconds]);

  useEffect(() => {
    if (gameStatus === 3 && drawnNumbers.length > 0) {
      if (lastRevealedNumber === 0) {
        setLastRevealedNumber(drawnNumbers[0].number);
      }
    }
  }, [gameStatus, drawnNumbers]);

  return (
    <div className="single-card-item number-card-item">
      <div className="in-box">
        {gameStatus === 6 && (
          <h3 style={{ margin: "20px 0" }}>Canceled game!</h3>
        )}
        {gameStatus === 5 && (
          <h3 style={{ margin: "20px 0" }}>Expired game!</h3>
        )}
        {gameStatus === 4 && <h3 style={{ margin: "20px 0" }}>Game Over</h3>}
        {gameStatus === 3 && (
          <span
            className={
              lastRevealedNumber > 0 && lastRevealedNumber <= 15
                ? "yellow"
                : lastRevealedNumber > 15 && lastRevealedNumber <= 30
                ? "red"
                : lastRevealedNumber > 30 && lastRevealedNumber <= 45
                ? "purple"
                : lastRevealedNumber > 45 && lastRevealedNumber <= 60
                ? "green"
                : "blue"
            }
            style={
              lastRevealedNumber !== 0
                ? { display: "flex" }
                : { display: "none" }
            }
          >
            <small>
              {lastRevealedNumber !== 0 ? lastRevealedNumber : null}
            </small>
          </span>
        )}
        {gameStatus === 3 ? (
          <>
            <div className="btns-bottom" style={{ marginBottom: "8px" }}>
              <Link
                to={search}
                onMouseOver={() => {
                  if (!isEndGame && localStorage.getItem(`jammy-${gameId}`)) {
                    setIsEndGame(true);
                  }
                }}
                className={
                  btnLoading === false && seconds <= 0
                    ? "btn-sub"
                    : "btn-sub done"
                }
                onClick={() => revealNumber()}
              >
                {btnLoading === false && seconds <= 0
                  ? !isEndGame
                    ? "Draw a number"
                    : "End Game"
                  : btnLoading === true && seconds <= 0
                  ? `wait (Metamask)`
                  : `wait (${seconds} sec)`}
              </Link>
            </div>
            <p style={{ padding: 0, margin: 0 }}>75 of {drawnNumbers.length}</p>
          </>
        ) : (
          // TODO: bu button status 4 te cıkmıyor bakılacak
          <div className="btns-bottom">
            <Link
              to={search}
              className={"btn-sub"}
              onClick={() => backToLobby()}
            >
              Back to Lobby
            </Link>
          </div>
        )}
      </div>
      <img src={singleCardImg} className="w-100" alt="" />
    </div>
  );
};

export default HostRevealNumber;
