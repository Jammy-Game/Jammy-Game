import React, { useState, useEffect } from "react";
import "./PopupsGameStyle.css";
import CloseButton from "../../CloseButton/CloseButton";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useMetaMask } from "../../../utility/hooks/useMetaMask";
import {
  allStorageClear,
  checkGamePrizes,
  checkWinCard,
} from "../../../pages/Game/store";
import Loading from "../../Loading/Loading";
import { utils } from "ethers";
//images
import facebookImg from "../../../assets/img/facebook.png";
import twitterImg from "../../../assets/img/twitter.png";
import invite2Img from "../../../assets/img/invite2.png";
import popupBgImg from "../../../assets/img/popup-bg.png";
import logo from "../../../assets/img/logo.svg";
import avatar from "../../../assets/img/avatars/avatar6.png";

const WinnerLoserPopup = ({ game, drawnNumbers, onClose }) => {
  const { search } = useLocation();
  const dispatch = useDispatch();
  const gameId = useSelector((state) => state.gameStore.gameId);
  const cardCount = useSelector((state) => state.gameStore.cardCount);

  const { wallet, signer, unSigner } = useMetaMask();
  const [prizesWon, setPrizesWon] = useState([]);
  const [prizeWonAmounts, setprizeWonAmounts] = useState([]);
  const [jammy, setJammy] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const winnersImages = require.context(
    "../../../assets/img/winpopupheaders",
    true
  );

  const winnersImageList = winnersImages
    .keys()
    .map((image) => winnersImages(image));

  const losersImages = require.context(
    "../../../assets/img/losepopupheaders",
    true
  );

  const losersImageList = losersImages
    .keys()
    .map((image) => losersImages(image));

  const generate_random_number = (max) => Math.floor(Math.random() * max);

  const getPrizeAmount = async (prizeIndex, winnerCount) => {
    const totalPot = Number(game[2] * game[4]);
    const share = (await unSigner.contract.gamePrizes(gameId, prizeIndex))[0];
    const precisionBasis = Number(await unSigner.contract.PRECISION_BASIS());
    return (Number(totalPot) * share) / precisionBasis / winnerCount;
  };

  useEffect(() => {
    if (!unSigner.contract) return;
    if (wallet.accounts.length < 1) return;
    if (!gameId) return;
    if (!cardCount) return;
    if (drawnNumbers.length < 1) return;

    dispatch(
      checkGamePrizes({
        dispatch,
        unSigner,
        gameId,
        user: wallet.accounts[0].toLowerCase(),
      })
    )
      .then((result) => {
        console.log("data:", result.payload);
        result.payload.map(async (item, prizeIndex) => {
          if (
            item.winners &&
            item.winners.find(
              (addr) => addr.toLowerCase() === wallet.accounts[0].toLowerCase()
            ) &&
            !prizesWon.includes(prizeIndex)
          ) {
            setPrizesWon((oldArry) => [...oldArry, prizeIndex]);
            getPrizeAmount(prizeIndex, item.winners.length)
              .then((prizeAmount) => {
                setprizeWonAmounts((oldArry) => [
                  ...oldArry,
                  { prizeIndex, prizeAmount },
                ]);
              })
              .catch((error) => console.log(error));

            if (prizeIndex === 0) {
              const winner = item.winners.find(
                (addr) =>
                  addr.toLowerCase() === wallet.accounts[0].toLowerCase()
              );
              await dispatch(
                checkWinCard({
                  dispatch,
                  gameId,
                  cardCount,
                  unSigner,
                  user: wallet.accounts[0].toLowerCase(),
                  prizeIndex,
                  drawnNumbers,
                  isManuelCloseCard: false,
                })
              )
                .then(async (result) => {
                  console.log(result.payload);
                  if (result.payload.isFound) {
                    setJammy([
                      result.payload.cardIndex,
                      result.payload.arrayCard,
                    ]);
                  } else {
                    console.log(`kazanan kart yok`);
                  }
                })
                .catch((err) => console.log(err));
            }
          }
          setIsLoading(false);
        });
      })
      .catch((error) => console.log(error));

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
  }, [signer, unSigner.contract, wallet.accounts, gameId, cardCount, drawnNumbers]);

  return (
    <>
      <div className="popup-wrapper">
        <CloseButton
          onClose={onClose}
          to={search}
          extraAction={{
            type: "winnerLoser",
            action: () => (window.location.href = "/"), //cacheleri önlemek için reload
          }}
        />
        <div className="in">
          {!isLoading ? (
            prizesWon.length > 0 ? (
              <div className="text-top-area">
                <img
                  src={
                    winnersImageList[
                      generate_random_number(winnersImageList.length)
                    ]
                  }
                  alt=""
                ></img>
              </div>
            ) : (
              <div className="text-top-area">
                <img
                  src={
                    losersImageList[
                      generate_random_number(losersImageList.length)
                    ]
                  }
                  alt=""
                ></img>
              </div>
            )
          ) : (
            <div className="text-top-area">
              <Loading />
            </div>
          )}

          <div className="card-bottom-area">
            <div className="card-container">
              {!isLoading ? (
                prizesWon.length > 0 ? (
                  prizesWon[0] === 0 ? (
                    <div className="item-card">
                      <span>{jammy.length > 0 && jammy[0]}</span>
                      <div className="in" style={{ margin: "25px 0" }}>
                        {jammy.length > 0 &&
                          jammy[1].map((numbers, numberindex) => (
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
                  ) : (
                    <div className="item-card">
                      <div className="d-flex w-100 h-100 justify-content-center align-items-center">
                        <img src={logo} alt="" />
                        <span>{prizesWon[0]}</span>
                        <span>
                          {prizesWon[0] === 1 && "Biggest prize won is 4th JAM"}
                          {prizesWon[0] === 2 && "Biggest prize won is 3rd JAM"}
                          {prizesWon[0] === 3 && "Biggest prize won is 2nd JAM"}
                          {prizesWon[0] === 4 && "Biggest prize won is 1st JAM"}
                        </span>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="item-card">
                    <div className="d-flex w-100 h-100 justify-content-center align-items-center">
                      <img src={logo} alt="" />
                      <span>You lose :(</span>
                    </div>
                  </div>
                )
              ) : (
                <div className="item-card">
                  <div className="d-flex w-100 h-100 justify-content-center align-items-center">
                    <img src={logo} alt="" />
                    <Loading text="Loading card..." />
                  </div>
                </div>
              )}
              <div className="right-area">
                <div className="info-box-wrapper">
                  <div className="profile-info-box">
                    <div className="img">
                      <img
                        // src={`${process.env.REACT_APP_PHOTO_SERVICE}avatars/currentUser.avatar`}
                        src={avatar}
                        alt="user"
                      />
                    </div>
                    <div className="right">
                      <span>username</span>
                      <small>{wallet.accounts[0]}</small>
                    </div>
                  </div>
                </div>
                <div className="buttons">
                  <Link to={search}>
                    <img src={facebookImg} alt="" />
                    <span>Share</span>
                  </Link>
                  <Link to={search}>
                    <img src={twitterImg} alt="" />
                    <span>Tweet</span>
                  </Link>
                  <Link to={search}>
                    <img src={invite2Img} alt="" />
                    <span>Invite</span>
                  </Link>
                </div>
              </div>
              <ul
                style={{ display: "flex", padding: "0px", marginTop: "-15px" }}
              >
                <li>Your Prizes:</li>
                {!isLoading ? (
                  prizeWonAmounts.length > 0 ? (
                    prizeWonAmounts.map((prize, index) => (
                      <li style={{ padding: "0px 6px" }} key={index}>
                        {prize.prizeIndex === 4 && "1st Jam: "}
                        {prize.prizeIndex === 3 && "2nd Jam: "}
                        {prize.prizeIndex === 2 && "3rd Jam: "}
                        {prize.prizeIndex === 1 && "4th Jam: "}
                        {prize.prizeIndex === 0 && "JAMMY: "}
                        {utils.formatEther(prize.prizeAmount.toString())}{" "}
                        {process.env.REACT_APP_NETWORKSYMBOL}
                      </li>
                    ))
                  ) : (
                    <li style={{ padding: "0px 6px" }}>No prizes won</li>
                  )
                ) : (
                  <li style={{ padding: "0px 6px" }}>loading prizes...</li>
                )}
              </ul>
            </div>
          </div>
          <img src={popupBgImg} className="popup-bg" alt="" />
        </div>
      </div>
    </>
  );
};

export default WinnerLoserPopup;
