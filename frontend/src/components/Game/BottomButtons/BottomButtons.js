import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useMetaMask } from "../../../utility/hooks/useMetaMask";
import { checkWinCard } from "../../../pages/Game/store";
import { checkGameStatus, getStorage, setStorage } from "../../../pages/store";
//images
import RefreshImg from "../../../assets/img/refresh.png";
import RefreshRotateImg from "../../../assets/img/refresh-rotate.png";
import ReplaceImg from "../../../assets/img/replace.svg";
import winnerIcon from "../../../assets/img/others/winner-icon.png";
import soundOff from "../../../assets/img/sound-off.png";
import soundOn from "../../../assets/img/sound-on.png";
// Popups
import WinningHistoryPopup from "../Popups/WinningHistoryPopup";
// Sounds
import notificationSound from "../../../assets/sound/notification-sound.mp3";

const BottomButtons = ({
  gameStatus,
  drawnNumbers,
  gamePrizes,
  setCardChangePopup,
  manuelCloseToggle,
  setManuelCloseToggle,
}) => {
  const { search } = useLocation();
  const dispatch = useDispatch();
  const gameId = useSelector((state) => state.gameStore.gameId);
  const cardCount = useSelector((state) => state.gameStore.cardCount);

  const { wallet, signer, unSigner } = useMetaMask();
  const [winners, setWinners] = useState([]);
  const [buttons, setButtons] = useState([]);
  const [btnLoading, setBtnLoading] = useState(false);
  const [winningHistoryPopupParams, setWinningHistoryPopupParams] =
    useState(-1);
  const soundPlayer = useRef(null);
  const [soundStatus, setSoundStatus] = useState(false);

  //TODO: manuel sayı kapatmada game store (checkWinCard) bağlı olarak karşılıklı iyileştirilecek.
  //fe ye yeni sayı gelmeden sayıyı kapatması ve winprize yapabilmesi engellenecek.
  const winPrize = async (prizeIndex) => {
    setBtnLoading(true);
    if (gameStatus === 3) {
      const gamePrize = await unSigner.contract.gamePrizes(gameId, prizeIndex);

      if (gamePrize[1] === false) {
        if (manuelCloseToggle) {
          await dispatch(
            checkWinCard({
              dispatch,
              gameId,
              cardCount,
              unSigner,
              user: wallet.accounts[0].toLowerCase(),
              prizeIndex,
              drawnNumbers,
              isManuelCloseCard: true,
            })
          )
            .then(async (result) => {
              console.log(result.payload);
              if (result.payload.isFound) {
                const tx = await signer.contract.winPrize(
                  gameId,
                  prizeIndex,
                  result.payload.playerCardIndex
                );
                const receipt = await tx.wait();
                console.log("manuel-receipt-winPrize:", receipt);
                console.log("CardWin", result.payload.playerCardIndex);
              } else {
                console.log(`kazanan kart yok`);
              }
            })
            .catch((err) => console.log(err));
        } else {
          for (let pci = 0; pci < cardCount; pci++) {
            try {
              const tx = await signer.contract.winPrize(
                gameId,
                prizeIndex,
                pci
              );
              const receipt = await tx.wait();
              console.log("receipt-winPrize:", receipt);
            } catch (error) {
              console.log(`(playerCardIndex: ${pci}) CardDoesNotWin!`);
              continue;
            }
          }
        }

        setBtnLoading(false);
      }
    } else {
      console.log(`wrongGameStatus (current: ${gameStatus})`);
      setBtnLoading(false);
    }
  };

  useEffect(() => {
    if (gamePrizes && gamePrizes.length > 0) {
      console.log("gamePrizes:", gamePrizes);
      // result.payload = testPrizesStatus; //TODO: (akkoc): manipüle etmek için aç (104. satırı da aç)
      setButtons({
        jammy: gamePrizes[0].isWon,
        jam4: gamePrizes[1].isWon,
        jam3: gamePrizes[2].isWon,
        jam2: gamePrizes[3].isWon,
        jam1: gamePrizes[4].isWon,
      });

      setWinners({
        jammy:
          gamePrizes[0].winners &&
          gamePrizes[0].winners.find(
            (addr) => addr.toLowerCase() === wallet.accounts[0].toLowerCase()
          )
            ? true
            : false,
        jam4:
          gamePrizes[1].winners &&
          gamePrizes[1].winners.find(
            (addr) => addr.toLowerCase() === wallet.accounts[0].toLowerCase()
          )
            ? true
            : false,
        jam3:
          gamePrizes[2].winners &&
          gamePrizes[2].winners.find(
            (addr) => addr.toLowerCase() === wallet.accounts[0].toLowerCase()
          )
            ? true
            : false,
        jam2:
          gamePrizes[3].winners &&
          gamePrizes[3].winners.find(
            (addr) => addr.toLowerCase() === wallet.accounts[0].toLowerCase()
          )
            ? true
            : false,
        jam1:
          gamePrizes[4].winners &&
          gamePrizes[4].winners.find(
            (addr) => addr.toLowerCase() === wallet.accounts[0].toLowerCase()
          )
            ? true
            : false,
      });
    }
  }, [gamePrizes, drawnNumbers]);

  //Event Listeners
  useEffect(() => {
    if (!unSigner.contract) return;
    if (!gameId) return;
    if (signer.isHost) return;

    setSoundStatus(false);
    dispatch(
      setStorage({
        key: "sound",
        value: false,
        type: "session",
      })
    );

    const listenerNumberRevealed = (nrGameId, revealedNum) => {
      dispatch(
        getStorage({
          key: "sound",
          type: "session",
        })
      )
        .then((result) => {
          if (result.payload && Number(nrGameId) === gameId) {
            soundPlayer.current.play();
          }
        })
        .catch((error) => console.log(error));
    };

    unSigner.contract?.on("NumberRevealed", listenerNumberRevealed);
    return () => {
      unSigner.contract?.off("NumberRevealed", listenerNumberRevealed);
    };
  }, [signer, unSigner.contract, gameId]);

  return (
    <>
      <div className="btns-bottom">
        <audio ref={soundPlayer} src={notificationSound} />
        <Link
          to={search}
          className={
            gameStatus === 1 || gameStatus === 2 || btnLoading
              ? "btn-sub done"
              : "btn-sub"
          }
          style={
            !buttons.jam1 && !signer.isHost ? null : { background: "#d52e2e" }
          }
          onClick={
            !buttons.jam1 && !signer.isHost
              ? () => winPrize(4)
              : () => setWinningHistoryPopupParams(4)
          }
          title={
            !buttons.jam1 && !signer.isHost
              ? "Check 1st Jam prize"
              : "Show 1st Jam winners"
          }
        >
          1st Jam
          {winners.jam1 && (
            <img className="winner-icon" src={winnerIcon} alt="winner" />
          )}
        </Link>
        <Link
          to={search}
          className={
            gameStatus === 1 || gameStatus === 2 || !buttons.jam1 || btnLoading
              ? "btn-sub done"
              : "btn-sub"
          }
          style={
            buttons.jam1 && !buttons.jam2 && !signer.isHost
              ? null
              : { background: "#d52e2e" }
          }
          onClick={
            buttons.jam1 && !buttons.jam2 && !signer.isHost
              ? () => winPrize(3)
              : () => setWinningHistoryPopupParams(3)
          }
          title={
            buttons.jam1 && !buttons.jam2 && !signer.isHost
              ? "Check 2nd Jam prize"
              : "Show 2nd Jam winners"
          }
        >
          2nd Jam
          {winners.jam2 && (
            <img className="winner-icon" src={winnerIcon} alt="winner" />
          )}
        </Link>
        <Link
          to={search}
          className={
            gameStatus === 1 || gameStatus === 2 || !buttons.jam2 || btnLoading
              ? "btn-sub done"
              : "btn-sub"
          }
          style={
            buttons.jam2 && !buttons.jam3 && !signer.isHost
              ? null
              : { background: "#d52e2e" }
          }
          onClick={
            buttons.jam2 && !buttons.jam3 && !signer.isHost
              ? () => winPrize(2)
              : () => setWinningHistoryPopupParams(2)
          }
          title={
            buttons.jam2 && !buttons.jam3 && !signer.isHost
              ? "Check 3rd Jam prize"
              : "Show 3rd Jam winners"
          }
        >
          3rd Jam
          {winners.jam3 && (
            <img className="winner-icon" src={winnerIcon} alt="winner" />
          )}
        </Link>
        <Link
          to={search}
          className={
            gameStatus === 1 || gameStatus === 2 || !buttons.jam3 || btnLoading
              ? "btn-sub done"
              : "btn-sub"
          }
          style={
            buttons.jam3 && !buttons.jam4 && !signer.isHost
              ? null
              : { background: "#d52e2e" }
          }
          onClick={
            buttons.jam3 && !buttons.jam4 && !signer.isHost
              ? () => winPrize(1)
              : () => setWinningHistoryPopupParams(1)
          }
          title={
            buttons.jam3 && !buttons.jam4 && !signer.isHost
              ? "Check 4th Jam prize"
              : "Show 4th Jam winners"
          }
        >
          4th Jam
          {winners.jam4 && (
            <img className="winner-icon" src={winnerIcon} alt="winner" />
          )}
        </Link>
        <Link
          to={search}
          className={
            gameStatus === 1 || gameStatus === 2 || !buttons.jam4 || btnLoading
              ? "btn-sub done"
              : "btn-sub"
          }
          style={
            buttons.jam4 && !buttons.jammy && !signer.isHost
              ? null
              : { background: "#d52e2e" }
          }
          onClick={
            buttons.jam4 && !buttons.jammy && !signer.isHost
              ? () => winPrize(0)
              : () => setWinningHistoryPopupParams(0)
          }
          title={
            buttons.jam4 && !buttons.jammy && !signer.isHost
              ? "Check JAMMY prize"
              : "Show JAMMY winners"
          }
        >
          JAMMY
          {winners.jammy && (
            <img className="winner-icon" src={winnerIcon} alt="winner" />
          )}
        </Link>
        {!signer.isHost && (
          <>
            <Link
              to={search}
              title={
                manuelCloseToggle ? "Turn Auto Closing" : "Turn Manuel Closing"
              }
              onClick={() => {
                setManuelCloseToggle(!manuelCloseToggle);
                dispatch(checkGameStatus({ gameId, unSigner }))
                  .then((result) => {
                    if (result.payload) {
                      console.log("gameStatus:", result.payload);
                    }
                  })
                  .catch((error) => console.log(error));
              }}
            >
              <div className="position-relative">
                <img src={RefreshImg} alt="" />
                <img
                  className={
                    manuelCloseToggle
                      ? "refresh-rotate"
                      : "refresh-rotate refresh-toggle"
                  }
                  src={RefreshRotateImg}
                  alt=""
                />
              </div>
            </Link>
            {gameStatus === 1 ? (
              <Link
                to={search}
                onClick={() => {
                  dispatch(checkGameStatus({ gameId, unSigner }))
                    .then((result) => {
                      if (result.payload === 1) {
                        setCardChangePopup(true);
                      } else {
                        console.log(`wrongGameStatus (current: ${gameStatus})`);
                      }
                    })
                    .catch((error) => console.log(error));
                }}
              >
                <img src={ReplaceImg} alt="" />
              </Link>
            ) : (
              gameStatus === 3 && (
                <Link
                  to={search}
                  title={soundStatus ? "Turn Off" : "Turn On"}
                  onClick={() => {
                    dispatch(checkGameStatus({ gameId, unSigner }))
                      .then((result) => {
                        if (result.payload === 3) {
                          if (!soundStatus) {
                            soundPlayer.current.play();
                          }
                          setSoundStatus((status) => !status);
                          dispatch(
                            setStorage({
                              key: "sound",
                              value: !soundStatus,
                              type: "session",
                            })
                          );
                        }
                      })
                      .catch((error) => console.log(error));
                  }}
                >
                  {soundStatus ? (
                    <img
                      src={soundOff}
                      alt="sound off"
                      style={{ width: "46px", marginTop: "-2px" }}
                    />
                  ) : (
                    <img
                      src={soundOn}
                      alt="sound on"
                      style={{ width: "46px", marginTop: "-2px" }}
                    />
                  )}
                </Link>
              )
            )}
          </>
        )}
      </div>
      {winningHistoryPopupParams !== -1 && (
        <WinningHistoryPopup
          gameId={gameId}
          prizeIndex={winningHistoryPopupParams}
          onClose={() => setWinningHistoryPopupParams(-1)}
        />
      )}
    </>
  );
};

export default React.memo(BottomButtons);
