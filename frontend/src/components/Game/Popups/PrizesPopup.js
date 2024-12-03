import React, { useState, useEffect, Fragment } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useMetaMask } from "../../../utility/hooks/useMetaMask";
import { setStorage, getStorage, getInfo } from "../../../pages/store";
import { checkWinCard } from "../../../pages/Game/store";
import CloseButton from "../../CloseButton/CloseButton";
import Loading from "../../Loading/Loading";
import { formatAddress } from "../../../utility/Utils";
//images
import continuesBgImg from "../../../assets/img/continues-bg.png";
import logo from "../../../assets/img/logo.svg";
import avatar from "../../../assets/img/avatars/avatar6.png";

const PrizesPopup = ({
  drawnNumbers,
  prizesPopupParams,
  setShowWinnerLoserPopup,
  onClose,
}) => {
  const { search } = useLocation();
  const dispatch = useDispatch();
  const gameId = useSelector((state) => state.gameStore.gameId);

  const { wallet, signer, unSigner } = useMetaMask();
  const [seconds, setSeconds] = useState(5);
  const [players, setPlayers] = useState([]);

  const claimPrize = async (claimGameId) => {
    try {
      const isPrizesClaimed = await unSigner.contract.prizesClaimed(
        claimGameId
      );
      console.log("isPrizesClaimed", isPrizesClaimed);
      if (!isPrizesClaimed) {
        const tx = await signer.contract.claimPrize(claimGameId);
        const receipt = await tx.wait();
        console.log("claimPrize (hash):", receipt.transactionHash);
      } else {
        console.log("Game Prize Claimed");
      }
    } catch (error) {
      console.log("claimPrize (error):", error);
    }
    setShowWinnerLoserPopup(true);
    onClose();
  };

  const setPrizesStorage = async (prizeIndex, winner) => {
    let localWinners = await dispatch(
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

    console.log("localWinners:", localWinners);
    if (!localWinners) {
      dispatch(
        setStorage({
          key: `prizes-${gameId}-${Number(prizeIndex)}`,
          value: [winner],
          type: "local",
        })
      );
    } else {
      if (!localWinners.includes({ winner })) {
        localWinners.push(winner);
      }
      dispatch(
        setStorage({
          key: `prizes-${gameId}-${Number(prizeIndex)}`,
          value: localWinners,
          type: "local",
        })
      );
    }
  };

  useEffect(() => {
    if (
      prizesPopupParams &&
      prizesPopupParams.prizeIndex > -1 &&
      prizesPopupParams.winners.length > 0 &&
      drawnNumbers.length > 0
    ) {
      console.log(prizesPopupParams);
      prizesPopupParams.winners.forEach(async (winner) => {
        const info = await dispatch(
          getInfo({
            unSigner,
            user: winner.toLowerCase(),
            gameId: Number(gameId),
          })
        )
          .then((result) => {
            if (result.payload) {
              return result.payload;
            }
          })
          .catch((error) => {
            console.log(error);
          });

        await dispatch(
          checkWinCard({
            dispatch,
            gameId,
            cardCount: Number(info.playerCardsLength),
            unSigner,
            user: winner.toLowerCase(),
            prizeIndex: Number(prizesPopupParams.prizeIndex),
            drawnNumbers,
            isManuelCloseCard: false,
          })
        )
          .then(async (result) => {
            console.log(result.payload);
            if (result.payload.isFound) {
              const playersObj = {
                winnerAddress: winner,
                avatar: "avatar6.png",
                username: "username",
                cardIndex: result.payload.cardIndex,
                arrayCard: result.payload.arrayCard,
              };
              setPlayers((oldArry) => [...oldArry, playersObj]);
              setPrizesStorage(prizesPopupParams.prizeIndex, winner);
            } else {
              console.log(`kazanan kart yok`);
            }
          })
          .catch((err) => console.log(err));
      });
    }
  }, [prizesPopupParams, drawnNumbers]);

  useEffect(() => {
    const countdown = setInterval(() => {
      if (seconds === 0) {
        clearInterval(countdown);
        if (prizesPopupParams && prizesPopupParams.prizeIndex !== 0) {
          onClose();
        }
        return;
      }
      setSeconds(seconds - 1);
    }, 1000);
    return () => {
      clearInterval(countdown);
    };
  }, [seconds, prizesPopupParams]);

  return (
    <div className="popup-wrapper continues-wrapper">
      <CloseButton
        onClose={onClose}
        to={search}
        extraAction={{
          type: "claimPrize",
          action:
            prizesPopupParams.prizeIndex === 0
              ? () => claimPrize(gameId)
              : undefined,
        }}
      />
      <div className="in">
        <div className="text-top-area continues-title">
          The
          {prizesPopupParams
            ? prizesPopupParams.prizeIndex === 4
              ? " 1st Jam "
              : prizesPopupParams.prizeIndex === 3
              ? " 2nd Jam "
              : prizesPopupParams.prizeIndex === 2
              ? " 3rd Jam "
              : prizesPopupParams.prizeIndex === 1
              ? " 4th Jam "
              : prizesPopupParams.prizeIndex === 0
              ? " JAMMY "
              : null
            : null}
          Goes to
        </div>
        <div className="card-bottom-area">
          <div className="card-container">
            <div className="item-card-area">
              {players.length > 0
                ? players.map((winner, index) => (
                    <Fragment key={index}>
                      <div>
                        <div className="info-box-wrapper">
                          <Link
                            to={`${process.env.REACT_APP_NETWORKURL}address/${winner.winnerAddress}`}
                            target="blank"
                          >
                            <div className="profile-info-box" key={index}>
                              <div className="img">
                                <img
                                  // src={`${process.env.REACT_APP_PHOTO_SERVICE}avatars/${winner.avatar}`}
                                  src={avatar}
                                  alt="avatar"
                                />
                              </div>
                              <div className="right">
                                <span>{winner.username}</span>
                                <small>
                                  Wallet: {formatAddress(winner.winnerAddress)}
                                </small>
                              </div>
                            </div>
                          </Link>
                        </div>
                        <div className="item-card">
                          <span>{winner.cardIndex}</span>
                          <div className="in" style={{ margin: "25px 0" }}>
                            {winner.arrayCard.map((numbers, numberindex) => (
                              <div
                                className={
                                  numbers === 0 ? "item revealed" : "item"
                                }
                                key={numberindex}
                              >
                                {numbers !== 0 ? numbers : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Fragment>
                  ))
                : prizesPopupParams &&
                  prizesPopupParams.winners.map((k, index) => (
                    <div className="item-card" key={index}>
                      <div className="d-flex w-100 h-100 justify-content-center align-items-center">
                        <img src={logo} alt="" />
                        <Loading text="Loading card..." />
                      </div>
                    </div>
                  ))}
            </div>
            <div className="right-area">
              {prizesPopupParams && prizesPopupParams.prizeIndex !== 0 ? (
                <div className="text">
                  <span>The Game Continues!</span>
                  <small>Roll up your sleeves to be the next!</small>
                </div>
              ) : (
                <div className="text">
                  <span>Buddy, The Game is Over!</span>
                  <small>Let's see the bucks for the new game!</small>
                  <Link
                    to={search}
                    className="right-btn-o"
                    onClick={() => claimPrize(gameId)}
                  >
                    {" "}
                    OKAY
                  </Link>
                </div>
              )}
            </div>
          </div>
          {prizesPopupParams && prizesPopupParams.prizeIndex !== 0 ? (
            <span style={{ float: "right", paddingRight: "8%" }}>
              Close in ({seconds}) sec.
            </span>
          ) : null}
        </div>
        <img src={continuesBgImg} className="popup-bg" alt="" />
      </div>
    </div>
  );
};

export default PrizesPopup;
