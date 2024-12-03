import React, { useState, useEffect } from "react";
import "./UserProfile.css";
import CloseButton from "../CloseButton/CloseButton";
import { Link, useLocation } from "react-router-dom";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { useMetaMask } from "../../utility/hooks/useMetaMask";
import { formatAddress } from "../../utility/Utils";
import { BigNumber, utils } from "ethers";
import Loading from "../Loading/Loading";
import { useDispatch } from "react-redux";
import {
  getCancelledGames,
  getEndedGames,
  getExpiredGames,
} from "../../pages/store";
import { checkGamePrizes } from "../../pages/Game/store";
import AvatarSelect from "../AvatarSelect/AvatarSelect";
//images
import btnBgImg from "../../assets/img/btn-bg.png";
import btnBgActiveImg from "../../assets/img/btn-bg-active.png";
import profilePopupImg from "../../assets/img/ProfilePopup.png";
import twitter2Img from "../../assets/img/twitter-icon-2.svg";
import joinBtn2Img from "../../assets/img/join-btn-2.png";
import visitBtnImg from "../../assets/img/visit-btn.svg";
import inviteImg from "../../assets/img/invite.png";
import tooltipBgImg from "../../assets/img/tooltip-click-bg.png";
import staticsImg from "../../assets/img/statics-shape.png";
//TODO : imageler değişecek
import totalJams1Img from "../../assets/img/total-jams.png";
import totalJams2Img from "../../assets/img/total-jams2.png";
import cardImg from "../../assets/img/card-icon.png";
import maticWonImg from "../../assets/img/matic-won.png";
import winnigImg from "../../assets/img/winnig.png";
import completedImg from "../../assets/img/completed-icon.png";
import leaderboardImg from "../../assets/img/leaderboard-icon.png";
import gameShapeImg from "../../assets/img/game-shape.png";
import createdImg from "../../assets/img/created.png";
import potImg from "../../assets/img/pot.png";
import peopleImg from "../../assets/img/people.png";
import created2Img from "../../assets/img/created2.png";
import starImg from "../../assets/img/stars-icon.png";
import rankRightNewby from "../../assets/img/ranks-right-icon-1.png";
import rankRightJunior from "../../assets/img/ranks-right-icon-1.png";
import rankRightPro from "../../assets/img/ranks-right-icon-1.png";
import rankRightElite from "../../assets/img/ranks-right-icon-1.png";
import rankRightSenior from "../../assets/img/ranks-right-icon-1.png";
import rankRightMaster from "../../assets/img/ranks-right-icon-1.png";
import rankRightLegendary from "../../assets/img/ranks-right-icon-1.png";
import rankRightAce from "../../assets/img/ranks-right-icon-1.png";
import rankNewby from "../../assets/img/ranks-icon-1.png";
import rankJunior from "../../assets/img/ranks-icon-2.png";
import rankPro from "../../assets/img/ranks-icon-3.png";
import rankElite from "../../assets/img/ranks-icon-4.png";
import rankSenior from "../../assets/img/ranks-icon-5.png";
import rankMaster from "../../assets/img/ranks-icon-6.png";
import rankLegendary from "../../assets/img/ranks-icon-7.png";
import rankAce from "../../assets/img/ranks-icon-8.png";
import profileBgImg from "../../assets/img/profile-join-bg.png";
import menuArrowImg from "../../assets/img/connectwallet/menuArrow.png";
import menuArrowHoverImg from "../../assets/img/connectwallet/menuArrowHover.png";
import menuBgImg from "../../assets/img/connectwallet/menuBg.png";
import disconnectImg from "../../assets/img/connectwallet/disconnect.png";
import disconnectHoverImg from "../../assets/img/connectwallet/disconnectHover.png";
import profileDetailsImg from "../../assets/img/connectwallet/profileDetails.png";
import profileDetailsHoverImg from "../../assets/img/connectwallet/profileDetailsHover.png";
import twitterImg from "../../assets/img/connectwallet/twitter.png";
import twitterHoverImg from "../../assets/img/connectwallet/twitterHover.png";
import webImg from "../../assets/img/connectwallet/web.png";
import webHoverImg from "../../assets/img/connectwallet/webHover.png";
import discordImg from "../../assets/img/connectwallet/discord.png";
import discordHoverImg from "../../assets/img/connectwallet/discordHover.png";
import seperatorImg from "../../assets/img/connectwallet/separator.png";
import avatar from "../../assets/img/avatars/avatar6.png";

const testRanksList = [
  {
    name: "NEWBY",
    minLevel: 1,
    maxLevel: 2000,
  },
  {
    name: "JUNIOR",
    minLevel: 2001,
    maxLevel: 4000,
  },
  {
    name: "PRO",
    minLevel: 4001,
    maxLevel: 6000,
  },
  {
    name: "ELITE",
    minLevel: 6001,
    maxLevel: 8000,
  },
  {
    name: "SENIOR",
    minLevel: 8001,
    maxLevel: 10000,
  },
  {
    name: "MASTER",
    minLevel: 10001,
    maxLevel: 12000,
  },
  {
    name: "LEGENDARY",
    minLevel: 12001,
    maxLevel: 15000,
  },
  {
    name: "ACE",
    minLevel: 15001,
    maxLevel: 20000,
  },
];

const UserProfile = () => {
  const { search } = useLocation();
  const dispatch = useDispatch();
  const [activeLink, setActiveLink] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [AvatarSelectOpen, setAvatarSelectOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const topLinks = ["PROFILE", "STATISTICS", "GAME HASH", "RANKS"];

  const { wallet, hasProvider, connectMetaMask, signer, unSigner } =
    useMetaMask();
  const [userRank, setUserRank] = useState("NEWBY");
  const [ranks, setRanks] = useState(testRanksList);

  const [gameHashList, setGameHashList] = useState([]); //oyuncunun katıldığı tüm oyunlar
  const [gameHashListLoading, setGameHashListLoading] = useState(false);
  const [gameDetail, setGameDetail] = useState([]);
  const [gameHashWinners, setGameHashWinners] = useState([]);
  const [gameHashDetailLoading, setgameHashDetailLoading] = useState(false);

  const claimRefund = async (refundGameId) => {
    try {
      const tx = await signer.contract.claimRefund(refundGameId);
      const receipt = await tx.wait();
      console.log("receipt-claimRefund:", receipt);
      alert(
        `${utils.formatEther(BigNumber.from(receipt.events[0].args.amount))} ${
          process.env.REACT_APP_NETWORKSYMBOL
        } refunded.` //TODO : Popup yapılacak
      );
      fetchUserGameList();
    } catch (error) {
      console.log(error);
    }
  };

  const claimPrize = async (prizeGameId) => {
    try {
      const tx = await signer.contract.claimPrize(prizeGameId);
      const receipt = await tx.wait();
      console.log("receipt-claimPrize:", receipt);
      alert(
        `Prizes claimed.` //TODO : Popup yapılacak
      );
      fetchUserGameList();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (gameHashList.length > 0) {
      fetchGameDetail(gameHashList[0]);
    }
  }, [gameHashList]);

  // TODO: loading çalışmıyor düzeltilecek
  const fetchUserGameList = async () => {
    setGameHashList([]);
    setGameDetail([]);
    setGameHashListLoading(true);
    setgameHashDetailLoading(true);
    //cancelled, expired and ended games
    //TODO: total oyun sayı üzerinden sayfalama yapılarak liste oluşturulacak
    dispatch(
      getCancelledGames({
        dispatch,
        unSigner,
        user: wallet.accounts[0].toLowerCase(),
      })
    )
      .then(async (result) => {
        if (result.payload.cancelledGames) {
          console.log(result.payload);
          result.payload.cancelledGames.forEach(async (game) => {
            if (game.isJoined) {
              const isRefunds = await unSigner.contract.refunds(
                game.gameId,
                wallet.accounts[0].toLowerCase()
              );
              game.isRefunds = isRefunds;
              game.gameStatus = "Cancelled";
              setGameHashList((oldArray) => [...oldArray, game]);
            }
          });
        }
      })
      .catch((error) => console.log(error));

    dispatch(
      getExpiredGames({
        dispatch,
        unSigner,
        user: wallet.accounts[0].toLowerCase(),
      })
    )
      .then(async (result) => {
        if (result.payload.expiredGames) {
          console.log(result.payload);
          result.payload.expiredGames.forEach(async (game) => {
            if (game.isJoined) {
              const isRefunds = await unSigner.contract.refunds(
                game.gameId,
                wallet.accounts[0].toLowerCase()
              );
              game.isRefunds = isRefunds;
              game.gameStatus = "Expired";
              setGameHashList((oldArray) => [...oldArray, game]);
            }
          });
        }
      })
      .catch((error) => console.log(error));

    dispatch(
      getEndedGames({
        dispatch,
        unSigner,
        user: wallet.accounts[0].toLowerCase(),
      })
    )
      .then(async (result) => {
        if (result.payload.endedGames) {
          console.log(result.payload);
          result.payload.endedGames.forEach(async (game) => {
            if (game.isJoined) {
              game.gameStatus = "Ended";
              setGameHashList((oldArray) => [...oldArray, game]);
            }
          });
        }
      })
      .catch((error) => console.log(error));

    setGameHashListLoading(false);
    setgameHashDetailLoading(false);
  };

  //TODO: loading çalışmıyor düzeltilecek
  const fetchGameDetail = async (game) => {
    setgameHashDetailLoading(true);
    setGameHashWinners([]);

    dispatch(
      checkGamePrizes({
        dispatch,
        unSigner,
        gameId: game.gameId,
        user: wallet.accounts[0].toLowerCase(),
      })
    )
      .then(async (result) => {
        if (result.payload) {
          console.log(result.payload);
          let winners = []; // tekrarı önlemek için
          result.payload.forEach((prize) => {
            // prize.winners &&
            //   prize.winners.forEach(async (winner) => {
            //     //tüm oyuncular tüm ödüller
            //     winners.push(winner);
            //     setGameHashWinners((oldArray) => [
            //       ...oldArray,
            //       { winner, prizeIndex: prize.prizeIndex },
            //     ]);
            //   });
            // prize.winners.forEach(async (winner) => {
            //   //sadece herhangi bir ödül kazanan oyuncular
            //   if (
            //     !winners.find(
            //       (arryWinner) =>
            //         arryWinner.toLowerCase() ===
            //         winner.toLowerCase()
            //     )
            //   ) {
            //     winners.push(winner);
            //     setGameHashWinners((oldArray) => [
            //       ...oldArray,
            //       { winner, prizeIndex: 5 },
            //     ]);
            //   }
            // });
            prize.winners.forEach(async (winner) => {
              //bağlı kullanıcının ilgili oyunda kazandığı ödüller
              if (winner.toLowerCase() === wallet.accounts[0].toLowerCase()) {
                winners.push(winner);
                setGameHashWinners((oldArray) => [
                  ...oldArray,
                  { winner, prizeIndex: prize.prizeIndex },
                ]);
              }
            });
          });
          return winners;
        }
      })
      .catch((error) => console.log(error));

    console.log("detailgame", game);
    setGameDetail([game]);
    setgameHashDetailLoading(false);
  };

  //TODO: gamehash tx için kullanılacak
  useEffect(()=>{
    if (!unSigner.contract)
      return;
    async function allGamesFilter () {
      await unSigner.contract
        ?.queryFilter("GameCreated") // TODO: block aralığı sınırlandırılacak (toBlock)
        .then(async (result) => {
          console.log("filter game:", result);
          // result.forEach(async (event) => {
          //   if (
          //     Number(event.args.gameId) === gameId &&
          //     Number(event.args.revealedNum) === revealedNum
          //   ) {
          //     blockTimestamp = (await event.getBlock()).timestamp;
          //     tx = event.transactionHash;
          //   }
          // });
        });
    }
    allGamesFilter();
    
  },[unSigner.contract]);

  // useEffect(() => {
  //   if (ranks.length === 0) {
  //     axios
  //       .get(`${process.env.REACT_APP_API}ranks`, {
  //         headers: { "Content-Type": "application/json" },
  //       })
  //       .then((response) => {
  //         setRanks(response.data);
  //       })
  //       .catch((err) => console.log(err));
  //   }

  //   if (!userRank) {
  //     axios
  //       .get(`${process.env.REACT_APP_API}users/profile`, {
  //         headers: { "Content-Type": "application/json" },
  //       })
  //       .then((response) => {
  //         setUserRank(response.data.rank.name);
  //       })
  //       .catch((error) => {
  //         console.log(error.data);
  //       });
  //   }
  // }, [userRank, ranks]);

  return (
    <>
      <div className="join-user-info col-4 col-xl-3">
        <img
          // src={`${process.env.REACT_APP_PHOTO_SERVICE}avatars/currentUser.avatar`}
          src={avatar}
          className="profile-img"
          alt=""
        />
        <img src={profileBgImg} className="bg" alt="" />

        {wallet.accounts.length < 1 && (
          <div
            className="text"
            style={{ cursor: "pointer", textAlign: "center" }}
            onClick={() => connectMetaMask()}
          >
            <div className="sub-title">Connect Wallet</div>
          </div>
        )}

        {hasProvider && wallet.accounts.length > 0 && (
          <>
            <div className="text">
              <>
                <div className="sub-title">username</div>
              </>
              <div className="wallet-id" id="disconn">
                {formatAddress(wallet.accounts[0])}
              </div>
            </div>
            <div className="wallet-arrow">
              <img
                className="arrow"
                style={menuOpen ? { rotate: "-180deg" } : { rotate: "0deg" }}
                alt=""
                src={menuArrowImg}
                onMouseOver={(e) => (e.currentTarget.src = menuArrowHoverImg)}
                onMouseOut={(e) => (e.currentTarget.src = menuArrowImg)}
                onClick={() => setMenuOpen(!menuOpen)}
              />
            </div>
            <div
              className="wallet-menu"
              style={
                menuOpen
                  ? { visibility: "visible", opacity: 1 }
                  : { visibility: "hidden", opacity: 0 }
              }
            >
              <img className="menu-bg" alt="" src={menuBgImg} />
              <div className="menu-in">
                <img
                  className="el"
                  alt=""
                  src={profileDetailsImg}
                  onMouseOver={(e) =>
                    (e.currentTarget.src = profileDetailsHoverImg)
                  }
                  onMouseOut={(e) => (e.currentTarget.src = profileDetailsImg)}
                  onClick={() => setProfileOpen(true)} //TODO: daha sonra açılacak
                />
                {/* TODO : Disconnect olayı metamaske yazılacak onClick eventi olarak eklenecek! */}
                <img
                  className="el"
                  alt=""
                  src={disconnectImg}
                  onMouseOver={(e) =>
                    (e.currentTarget.src = disconnectHoverImg)
                  }
                  onMouseOut={(e) => (e.currentTarget.src = disconnectImg)}
                />
                {/* TODO : social linkler güncellenecek! */}
                <div className="menu-social-area">
                  <img
                    className="pad3"
                    alt=""
                    src={webImg}
                    onMouseOver={(e) => (e.currentTarget.src = webHoverImg)}
                    onMouseOut={(e) => (e.currentTarget.src = webImg)}
                    onClick={(e) => {
                      e.preventDefault();
                      window.open("https://google.com", "_blank");
                    }}
                  />
                  <img alt="" src={seperatorImg} />
                  <img
                    className="pad3"
                    alt=""
                    src={twitterImg}
                    onMouseOver={(e) => (e.currentTarget.src = twitterHoverImg)}
                    onMouseOut={(e) => (e.currentTarget.src = twitterImg)}
                    onClick={(e) => {
                      e.preventDefault();
                      window.open("https://twitter.com", "_blank");
                    }}
                  />
                  <img alt="" src={seperatorImg} />
                  <img
                    className="pad3"
                    alt=""
                    src={discordImg}
                    onMouseOver={(e) => (e.currentTarget.src = discordHoverImg)}
                    onMouseOut={(e) => (e.currentTarget.src = discordImg)}
                    onClick={(e) => {
                      e.preventDefault();
                      window.open("https://discord.com", "_blank");
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      {profileOpen && (
        <div className="popup-profile popup">
          <CloseButton
            onClose={() => setProfileOpen(!profileOpen)}
            to={search}
          />
          <div className="in">
            <div className="top-links">
              {topLinks.map((link, index) => {
                return (
                  <Link
                    to={search}
                    key={index}
                    onClick={() => {
                      setActiveLink(index);
                      if (index === 2 && gameHashList.length === 0) {
                        fetchUserGameList();
                      }
                    }}
                    className={activeLink === index ? "active" : ""}
                  >
                    <img src={btnBgImg} alt="" />
                    <img className="activeBg" src={btnBgActiveImg} alt="" />
                    <span>{link}</span>
                  </Link>
                  // )
                );
              })}
            </div>
            <img src={profilePopupImg} className="w-100" alt="" />

            {/* PROFILE */}
            <div
              className="box-inner"
              style={
                activeLink === 0 ? { display: "block" } : { display: "none" }
              }
            >
              <div className="profil-image">
                <button
                  className="select"
                  // onClick={() => setAvatarSelectOpen(true)}
                >
                  SELECT
                </button>
                <img src={avatar} alt="profile-img" />
                {/* <div className="profile-change-buttons">
                  <Link to={search} className="prev-btn">
                    <img src={prevImg} alt="" />
                  </Link>
                  <Link to={search} className="next-btn">
                    <img src={nextImg} alt="" />
                  </Link>
                </div> */}
              </div>
              <div className="text-area">
                <div className="item-row">
                  <div className="col-name">USERNAME:</div>
                  <div className="col-right">username</div>
                </div>
                <div className="item-row">
                  <div className="col-name">WALLET ID:</div>
                  <div className="col-right">{wallet.accounts[0]}</div>
                </div>
                <div className="item-row">
                  <div className="col-name">MEMBERS SINCE:</div>
                  <div className="col-right">...</div>
                </div>
                <div className="item-row">
                  <div className="col-name">HOLDINGS:</div>
                  <div className="col-right">
                    {wallet.balance} {process.env.REACT_APP_NETWORKSYMBOL}
                  </div>
                </div>
                <div className="item-row">
                  <div className="col-name">RANK:</div>
                  <div className="col-right">{userRank ? userRank : "..."}</div>
                </div>
                <div className="item-row">
                  <div className="col-name">REF CODE:</div>
                  <div className="col-right">...</div>
                </div>
                <div className="bottom-links">
                  <Link to={search}>
                    <img src={twitter2Img} alt="" /> <span>FOLLOW US</span>
                  </Link>
                  <Link to={search}>
                    <img src={joinBtn2Img} alt="" /> <span>JOIN US</span>
                  </Link>
                  <Link to={search}>
                    <img src={visitBtnImg} alt="" /> <span>VISIT US</span>
                  </Link>
                  <Link to={search}>
                    <img src={inviteImg} width="60" alt="" />
                    <span>INVITE FRIENDS</span>
                    <small className="tooltip-content">
                      <img src={tooltipBgImg} alt="" />
                      <p>ref code copied to clipboard</p>
                    </small>
                  </Link>
                </div>
              </div>
            </div>

            {/* STATISTICS */}
            <div
              className="box-inner"
              style={
                activeLink === 1 ? { display: "block" } : { display: "none" }
              }
            >
              <div className="container-fluid statics">
                <div className="statics-shape">
                  <img src={staticsImg} alt="" />
                </div>
                <div className="row justify-content-center  d-flex">
                  <div className="col-3 item">
                    <img src={totalJams1Img} alt="" />
                    <span>TOTAL JAMS</span>
                    <small>2400</small>
                  </div>
                  <div className="col-3 item">
                    <img src={totalJams2Img} alt="" />
                    <span>TOTAL JAMMYS</span>
                    <small>2400</small>
                  </div>
                  <div className="col-3 item">
                    <img src={cardImg} alt="" />
                    <span>CARDS PLAYED</span>
                    <small>2400</small>
                  </div>
                  <div className="col-3 item">
                    <img src={maticWonImg} alt="" />
                    <span>{process.env.REACT_APP_NETWORKSYMBOL} WON</span>
                    <small>2400</small>
                  </div>
                  <div className="col-3 item">
                    <img src={winnigImg} alt="" />
                    <span>WINNIG PERCENTAGE</span>
                    <small>2400</small>
                  </div>
                  <div className="col-3 item">
                    <img src={completedImg} alt="" />
                    <span>COMPLETED QUESTS</span>
                    <small>2400</small>
                  </div>
                  <div className="col-3 item">
                    <img src={leaderboardImg} alt="" />
                    <span>TOP OF THE LEADERBOARD</span>
                    <small>2400</small>
                  </div>
                </div>
              </div>
            </div>

            {/* GAMEHASH */}
            <div
              className="box-inner"
              style={
                activeLink === 2 ? { display: "block" } : { display: "none" }
              }
            >
              <div className="container-fluid game-hash">
                <div className="game-shape">
                  <img src={gameShapeImg} alt="" />
                </div>
                <div className="items-container">
                  <OverlayScrollbarsComponent
                    className="items-area scrollbarCustom content"
                    options={{ scrollbars: { theme: "os-theme-light" } }}
                  >
                    {gameHashListLoading && <Loading text="Loading Games..." />}
                    {gameHashList.length > 0 ? (
                      gameHashList
                        .sort(function (a, b) {
                          return b.startDate - a.startDate;
                        })
                        .map((game, index) => (
                          <div
                            className="item"
                            key={index}
                            style={
                              !game.isRefunds || (game.gameStatus === "Ended" && game.isPrizesClaimed === false)
                                ? { color: "red", cursor: "pointer" }
                                : { cursor: "pointer" }
                            }
                            onClick={() => fetchGameDetail(game)}
                          >
                            GAME #{game.gameId}{" "}
                            {!game.isRefunds || (game.gameStatus === "Ended" && game.isPrizesClaimed === false) ? (
                              <span
                                style={{
                                  border: "1px solid #ddd",
                                  borderRadius: "6px",
                                  padding: "0px 4px",
                                  cursor: "pointer",
                                }}
                                onClick={() => game.gameStatus === "Ended" ? claimPrize(game.gameId) : claimRefund(game.gameId)}
                              >
                                claim
                              </span>
                            ) : null}
                          </div>
                        ))
                    ) : (
                      <h3 style={{ textAlign: "center" }}>
                        There are no games you have joined
                      </h3>
                    )}
                  </OverlayScrollbarsComponent>
                  <div className="game-info d-flex flex-column">
                    {gameHashDetailLoading && (
                      <Loading text="Loading Details..." />
                    )}
                    <h3>
                      GAME #
                      {gameDetail[0] &&
                        `${gameDetail[0].gameId} (${gameDetail[0].gameStatus})`}
                    </h3>
                    <div className="game-hash-info-area">
                      <div className="left-area">
                        <div className="item-row">
                          <div className="icon">
                            <img src={createdImg} alt="" />
                          </div>
                          <div className="text-right">
                            <h4>CREATED</h4>
                            {/* <h5>08.03.2023 00:44</h5> */}
                            <h5>
                              {gameDetail[0] &&
                                new Date(
                                  gameDetail[0].startDate * 1000
                                ).toLocaleString("en-US")}
                            </h5>
                          </div>
                        </div>
                        <div className="item-row">
                          <div className="icon">
                            <img src={potImg} alt="" />
                          </div>
                          <div className="text-right">
                            <h4>POT</h4>
                            <h5>
                              {gameDetail[0] &&
                                `${utils.formatEther(gameDetail[0].pot)} ${
                                  process.env.REACT_APP_NETWORKSYMBOL
                                }`}
                            </h5>
                          </div>
                        </div>
                        <div className="item-row">
                          <div className="icon">
                            <img src={peopleImg} alt="" />
                          </div>
                          <div className="text-right">
                            <h4>PEOPLE</h4>
                            <h5>
                              {gameDetail[0] && gameDetail[0].totalPlayerCount}
                            </h5>
                          </div>
                        </div>
                        <div className="item-row">
                          <div className="icon">
                            <img src={created2Img} alt="" />
                          </div>
                          <div className="text-right">
                            <h4>CREATED</h4>
                            <h5>
                              {gameDetail[0] &&
                                `${
                                  gameDetail[0].gameTypeName
                                } (${utils.formatEther(
                                  gameDetail[0].startedPrice
                                )} ${process.env.REACT_APP_NETWORKSYMBOL})`}
                            </h5>
                          </div>
                        </div>
                      </div>
                      <div className="right-area">
                        <div className="icon">
                          <img src={starImg} alt="" />
                        </div>
                        <div className="text-area-right">
                          <h4>WINNERS</h4>
                          <OverlayScrollbarsComponent
                            className="items-area scrollbarCustom content"
                            options={{
                              scrollbars: { theme: "os-theme-light" },
                            }}
                          >
                            {gameHashWinners.length > 0 &&
                              gameHashWinners.map((item, index) => (
                                <p key={index}>
                                  <Link
                                    to={`${process.env.REACT_APP_BLOCKEXPLORERURL}address/${item.winner}`}
                                    target="_blank"
                                    style={{ color: "white" }}
                                    title={formatAddress(item.winner)}
                                  >
                                    <img
                                      src={avatar}
                                      width={24}
                                      style={{
                                        margin: "4px",
                                        borderRadius: "50%",
                                        border: "1px solid #ddd",
                                      }}
                                      alt="avatar"
                                    />
                                    <span>
                                      username (
                                      {item.prizeIndex === 0
                                        ? "JAMMY"
                                        : item.prizeIndex === 1
                                        ? "4th Jam"
                                        : item.prizeIndex === 2
                                        ? "3rd Jam"
                                        : item.prizeIndex === 3
                                        ? "2nd Jam"
                                        : item.prizeIndex === 4
                                        ? "1st Jam"
                                        : null}
                                      )
                                    </span>
                                  </Link>
                                </p>
                              ))}
                          </OverlayScrollbarsComponent>
                        </div>
                      </div>
                    </div>
                    <div className="hash-id">
                      <span>HASH: </span>
                      {gameDetail[0] && (
                        <small>
                          <Link
                            to={`${process.env.REACT_APP_BLOCKEXPLORERURL}tx/${gameDetail[0].gameTransaction}`}
                            target="_blank"
                            style={{ color: "white" }}
                          >
                            {gameDetail[0].gameTransaction}
                          </Link>
                        </small>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RANKS */}
            <div
              className="box-inner"
              style={
                activeLink === 3 ? { display: "block" } : { display: "none" }
              }
            >
              <div className="container-fluid ranks">
                <div className="ranks-shape">
                  <img
                    src={
                      userRank &&
                      (userRank === "NEWBY"
                        ? rankRightNewby
                        : userRank === "JUNIOR"
                        ? rankRightJunior
                        : userRank === "PRO"
                        ? rankRightPro
                        : userRank === "ELITE"
                        ? rankRightElite
                        : userRank === "SENIOR"
                        ? rankRightSenior
                        : userRank === "MASTER"
                        ? rankRightMaster
                        : userRank === "LEGENDARY"
                        ? rankRightLegendary
                        : userRank === "ACE"
                        ? rankRightAce
                        : null)
                    }
                    alt=""
                  />
                </div>
                <div className="row">
                  <div className="col-lg-12">
                    <h3 className="text-center mb-3 mt-3">
                      TO BE A TRUE JAMMY MASTER!
                    </h3>
                  </div>
                </div>
                <div className="row justify-content-center  d-flex">
                  {ranks.length > 0 &&
                    ranks.map((rank, index) => (
                      <div className="col-lg-3 item" key={index}>
                        <img
                          src={
                            rank.name === "NEWBY"
                              ? rankNewby
                              : rank.name === "JUNIOR"
                              ? rankJunior
                              : rank.name === "PRO"
                              ? rankPro
                              : rank.name === "ELITE"
                              ? rankElite
                              : rank.name === "SENIOR"
                              ? rankSenior
                              : rank.name === "MASTER"
                              ? rankMaster
                              : rank.name === "LEGENDARY"
                              ? rankLegendary
                              : rank.name === "ACE"
                              ? rankAce
                              : null
                          }
                          alt={rank.name}
                        />
                        <span>{rank.name}</span>
                        <small>
                          {rank.minLevel}{" "}
                          {rank.maxLevel !== 0 ? `- ${rank.maxLevel}` : "+"}
                        </small>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <AvatarSelect
        show={AvatarSelectOpen}
        onClose={() => setAvatarSelectOpen(!AvatarSelectOpen)}
      />
    </>
  );
};
export default UserProfile;
