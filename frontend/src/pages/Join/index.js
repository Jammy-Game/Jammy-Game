import React, { useState, useEffect, useRef } from "react";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { utils } from "ethers";
import BottomLine from "../../components/BottomLine/BottomLine";
import niceSelect from "../../utility/niceSelect/niceSelectModule";
import { getFilterTimes, gameFiltering } from "./store";
import {
  setStorage,
  getStorage,
  getCreatedGames,
  getStartedGames,
  getReadyGames,
  getInfo,
  setAllCards,
} from "../store";
import { useDispatch } from "react-redux";
import { useMetaMask } from "../../utility/hooks/useMetaMask";
import Loading from "../../components/Loading/Loading";
import HeadLine from "../../components/HeadLine/HeadLine";
import MockGetRandom from "../../components/MockGetRandom/MockGetRandom";
//images
import levelImg from "../../assets/img/level-img.svg";
import ranksRight4Img from "../../assets/img/ranks-right-icon-4.png";
import level2Img from "../../assets/img/level-img-2.svg";
import maticImg from "../../assets/img/matic.svg";
import matic2Img from "../../assets/img/matic-icon.svg";
import prevImg from "../../assets/img/prev-btn.png";
import filterBgImg from "../../assets/img/filter-bg.png";
import userImg from "../../assets/img/user-icon.svg";
import bronzeImg from "../../assets/img/bronze-icon.svg";
import cardRowBgImg from "../../assets/img/card-row-bg.svg";
//css
import "./index.css";

const Join = () => {
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { wallet, signer, unSigner } = useMetaMask();
  const [gameList, setGameList] = useState([]);
  const [gameListLoading, setGameListLoading] = useState(false);
  const [filterGameTypes, setfilterGameTypes] = useState([]);
  const [filterTimes, setFilterTimes] = useState([]);
  const [filterGameList, setFilterGameList] = useState([]);
  const [isFilter, setIsFilter] = useState(false);
  const filterGamePot = useRef();
  const filterGameCardPrice = useRef();
  const filterGameTime = useRef();
  const cardsCount = useRef();
  const [isNiceSelectLoad, setIsNiceSelectLoad] = useState(false);
  const [joinLoading, setJoinLoading] = useState(-1);
  const [joinLoadingText, setJoinLoadingText] = useState(null);
  const [joinTx, setJoinTx] = useState(null);

  const cardsCountIncrease = (gameId, maxCardsPerPlayer) => {
    if (cardsCount[gameId].innerText < Number(maxCardsPerPlayer))
      cardsCount[gameId].innerText++;
  };

  const cardsCountDecrease = (gameId) => {
    if (cardsCount[gameId].innerText > 1) cardsCount[gameId].innerText--;
  };

  const applyFilter = () => {
    const pot = filterGamePot.current.value;
    const cardprice = filterGameCardPrice.current.value;
    const time = filterGameTime.current.value.replace("-", " ");

    if (cardprice === "0" && time === "0" && pot === "0") {
      clearFilter();
    } else {
      dispatch(gameFiltering({ unSigner, gameList, pot, cardprice, time }))
        .then((result) => {
          console.log("applyFilter:", result.payload);
          setIsFilter(true);
          setFilterGameList(result.payload);
        })
        .catch((error) => console.log(error));
    }
  };

  const clearFilter = () => {
    setFilterGameList([]);
    setIsFilter(false);
  };

  const joinGame = async (
    joingameId,
    cardscount,
    cardsprice,
    totalCardsSold
  ) => {
    console.log(joingameId, Number(cardscount), cardsprice, totalCardsSold);
    // if (totalCardsSold + Number(cardscount) > cardsLength / 2) {
    //   //TODO: Popup ile alet içeriği verilecek
    //   alert(
    //     `You can buy a maximum of ${Math.floor(
    //       cardsLength / 2 - totalCardsSold
    //     )} cards!`
    //   );
    // } else {
    setJoinLoading(joingameId);
    setJoinLoadingText("Waiting metamask...");
    try {
      if (typeof ethereum !== "undefined") {
        if (signer.isHost) {
          navigate({
            pathname: "/game",
            search: `?gameId=${joingameId}`,
          });
        } else {
          const joinValue = (Number(cardscount) * cardsprice).toString();
          console.log("Total join Payment Amount:", joinValue);
          const tx = await signer.contract.joinGame(
            joingameId,
            Number(cardscount),
            { value: joinValue }
          );
          dispatch(
            setStorage({
              key: `join-${joingameId}-${wallet.accounts[0].toLowerCase()}`,
              value: `start-`,
              type: "local",
            })
          );
          setJoinLoadingText("Joining the game...");
          const receipt = await tx.wait();
          console.log("receipt-join:", receipt);
          if (receipt.events.length > 0) {
            receipt.events.forEach((element) => {
              if (element.event && element.event === "RequestSent") {
                setJoinTx(receipt.transactionHash);
                dispatch(
                  setStorage({
                    key: `join-${joingameId}-${wallet.accounts[0].toLowerCase()}`,
                    value: `wait-${receipt.transactionHash}`,
                    type: "local",
                  })
                );
                setJoinLoadingText("Waiting transaction...");
              }
            });
          }
        }
      }
    } catch (error) {
      setJoinLoading(-1);
      localStorage.removeItem(
        `join-${joingameId}-${wallet.accounts[0].toLowerCase()}`
      );
      setJoinLoadingText(null);
      console.log(">>>", error.message);
      // if (error.message.search("CardsSoldOut") !== -1) {
      //   alert("This game Soldout!");
      // }
    }
    // }
  };

  const checkPlayerCard = async (joingameId) => {
    let hexCard = null;
    try {
      hexCard = await unSigner.contract.playerCards(
        joingameId,
        wallet.accounts[0].toLowerCase(),
        0
      );
    } catch (error) {}
    return Number(hexCard);
  };

  useEffect(() => {
    document.title = "Join Game - Jammy";
    if (!unSigner.contract) return;
    if (wallet.accounts.length < 1) return;

    if (!filterTimes.length > 0 && !filterGameTypes.length > 0) {
      dispatch(
        getFilterTimes({
          endHour: Number(searchParams.get("end")),
          timeZone: searchParams.get("ap"),
        })
      )
        .then((result) => {
          setFilterTimes(result.payload);
        })
        .catch((error) => console.log(error));

      dispatch(getStorage({ key: "gameTypes", type: "session" }))
        .then((result) => {
          if (result.payload) {
            setfilterGameTypes(result.payload);
          }
        })
        .catch((error) => console.log(error));
    } else {
      if (!isNiceSelectLoad) {
        niceSelect(filterGameTime);
        niceSelect(filterGamePot);
        niceSelect(filterGameCardPrice);
        setIsNiceSelectLoad(true);
      }
    }

    if (gameList.length === 0 && filterTimes.length > 0 && isNiceSelectLoad) {
      setGameListLoading(true);
      setGameList([]);

      //TODO: Game list sıralama yapılacak(oyunun başlama saatine göre)
      dispatch(
        getStartedGames({
          dispatch,
          unSigner,
          user: wallet.accounts[0].toLowerCase(),
        })
      ).then((result) => {
        if (result.payload) {
          console.log(result.payload);
          result.payload.startedGames.forEach((game) => {
            if (game.isJoined) {
              setGameList((oldList) => [
                ...oldList,
                !oldList.includes(game) && game,
              ]);
            }
          });
        }
      });

      dispatch(
        getReadyGames({
          dispatch,
          unSigner,
          user: wallet.accounts[0].toLowerCase(),
        })
      ).then((result) => {
        if (result.payload) {
          console.log(result.payload);
          result.payload.readyGames.forEach((game) => {
            if (game.isJoined) {
              setGameList((oldList) => [
                ...oldList,
                !oldList.includes(game) && game,
              ]);
            }
          });
        }
      });

      dispatch(
        getCreatedGames({
          dispatch,
          unSigner,
          user: wallet.accounts[0].toLowerCase(),
        })
      ).then((result) => {
        if (result.payload) {
          console.log(result.payload);
          result.payload.createdGames.forEach((game) => {
            let gameHour = Number(game.startDateAMPM.split("-")[0]);
            if (gameHour === 12) gameHour = 0;

            if (
              gameHour >= Number(searchParams.get("start")) &&
              gameHour <= Number(searchParams.get("end")) &&
              game.startDateAMPM.split("-")[2] === searchParams.get("ap")
            ) {
              setGameList((oldList) => [
                ...oldList,
                !oldList.includes(game) && game,
              ]);
            } else if (game.isJoined) {
              setGameList((oldList) => [
                ...oldList,
                !oldList.includes(game) && game,
              ]);
            }
          });
          // createdGames.sort(function (a, b) {
          //   return b.startDate - a.startDate;
          // });
        }
      });
    }
  }, [
    isNiceSelectLoad,
    unSigner.contract,
    wallet.accounts,
    filterTimes.length,
  ]);

  useEffect(() => {
    if (gameList.length > 0 && wallet.accounts.length > 0) {
      setGameListLoading(false);
      console.log("gameList:", gameList);

      gameList.forEach(async (game) => {
        dispatch(
          getStorage({
            key: `join-${game.gameId}-${wallet.accounts[0].toLowerCase()}`,
            type: "local",
          })
        )
          .then((result) => {
            if (result.payload) {
              setJoinLoading(game.gameId);
              if (result.payload.split("-")[0] === "start") {
                setJoinLoadingText("Joining the game...");
              }
              if (result.payload.split("-")[0] === "wait") {
                setJoinLoadingText("Waiting transaction...");
                checkPlayerCard(game.gameId)
                  .then((res) => {
                    if (res > 1) {
                      setJoinLoadingText("Success");
                      window.location.href = `game?gameId=${game.gameId}`;
                    }
                  })
                  .catch((error) => console.log(error));
              }
            }
          })
          .catch((error) => console.log(error));
      });
    }
  }, [gameList, wallet.accounts]);

  //Event listeners
  useEffect(() => {
    if (!unSigner.contract) return;
    if (wallet.accounts.length < 1) return;

    // if (!sessionStorage.getItem("syncAllCards")) {
    //   dispatch(setAllCards({ dispatch, unSigner }));
    // }

    const listenerCardsAdded = () => {
      console.log("#CardsAdded (join) event was emmited");
      // dispatch(setAllCards({ dispatch, unSigner }));
      dispatch(getInfo({ unSigner }));
    };
    const listenerCardsUpdated = () => {
      console.log("#CardsUpdated (join) event was emmited");
      // dispatch(setAllCards({ dispatch, unSigner }));
      dispatch(getInfo({ unSigner }));
    };
    const listenerRequestFulfilled = async (
      requestId,
      reqType,
      player,
      numberOfWords
    ) => {
      console.log("#RequestFulfilled (join) event was emmited");
      try {
        const reqResult = await unSigner.contract.randomRequests(requestId);
        if (
          player.toLowerCase() === wallet.accounts[0].toLowerCase() &&
          Number(reqType) === 1 &&
          localStorage.getItem(
            `join-${reqResult.gameId}-${player.toLowerCase()}`
          )
        ) {
          setJoinLoadingText("Success");
          window.location.href = `game?gameId=${Number(reqResult.gameId)}`;
        }
      } catch (error) {
        // window.location.href = search;
        console.log(error);
      }
    };

    unSigner.contract?.on("CardsAdded", listenerCardsAdded);
    unSigner.contract?.on("CardsUpdated", listenerCardsUpdated);
    unSigner.contract?.on("RequestFulfilled", listenerRequestFulfilled);

    return () => {
      unSigner.contract?.off("CardsAdded", listenerCardsAdded);
      unSigner.contract?.off("CardsUpdated", listenerCardsUpdated);
      unSigner.contract?.off("RequestFulfilled", listenerRequestFulfilled);
    };
  }, [unSigner.contract, wallet.accounts]);

  return (
    <>
      {Number(process.env.REACT_APP_NETWORKVERSION) === 31337 && (
        <MockGetRandom />
      )}
      <HeadLine />

      <div className="price-area">
        <div className="level">
          <img src={levelImg} className="bg" alt="" />
          <span>LEVEL: NEWBY</span>
          <img src={ranksRight4Img} className="icon-right" alt="" />
        </div>
        <div className="level">
          <img src={level2Img} className="bg" alt="" />
          {wallet.balance ? (
            <span style={{ marginLeft: "-25px" }}>
              {wallet.balance} {process.env.REACT_APP_NETWORKSYMBOL}
            </span>
          ) : (
            <span>0 {process.env.REACT_APP_NETWORKSYMBOL}</span>
          )}
          <img src={maticImg} className="icon-matic" alt="" />
        </div>
      </div>
      <Link to="/" className="prev-btn-join">
        <img src={prevImg} alt="" />
        <span>
          Back to
          <br /> Lobby
        </span>
      </Link>

      <div className="container-card">
        <div className="filter">
          <img src={filterBgImg} alt="" />
          <div className="filter-content">
            <div className="item-list">
              <span>Card:</span>
              <select ref={filterGameCardPrice} className="nice">
                <option value="0">ALL CARDS</option>
                {filterGameTypes.map((gametype, index) => {
                  return (
                    <option key={index} value={gametype.price}>
                      {gametype.name}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="item-list">
              <span>Pot:</span>
              <select ref={filterGamePot} className="nice">
                <option value="0">ALL POTS</option>
                <option value="0-200">0-200</option>
                <option value="200-400">200-400</option>
                <option value="400-600">400-600</option>
                <option value="600-800">600-800</option>
                <option value="800-1000">800-1000</option>
                <option value="1000-1200">1000-1200</option>
                <option value="1200-1400">1200-1400</option>
                <option value="1400-1600">1400-1600</option>
              </select>
            </div>
            <div className="item-list">
              <span>Time:</span>
              <select ref={filterGameTime} className="nice">
                {filterTimes.length > 0 &&
                  filterTimes.map((time, index) => (
                    <option
                      value={time === "ALL TIMES" ? 0 : time.replace(" ", "-")}
                      key={index}
                    >
                      {time}
                    </option>
                  ))}
              </select>
            </div>
            <div className="item-list">
              <button onClick={() => applyFilter()} style={{ margin: 0 }}>
                Apply
              </button>
            </div>
            <div className="item-list">
              <button onClick={() => clearFilter()} style={{ margin: 0 }}>
                Clear
              </button>
            </div>
          </div>
        </div>
        <OverlayScrollbarsComponent
          className="scrollbarCustom content"
          options={{ scrollbars: { theme: "os-theme-dark" } }}
        >
          <div className="in">
            {gameListLoading ? <Loading text="Loading games..." /> : null}
            {/* item */}
            {!isFilter ? (
              gameList
                .sort(function (a, b) {
                  return b.startDate - a.startDate;
                })
                .map((gameItems, index) => (
                  <div className="item" key={index}>
                    {joinLoading === gameItems.gameId && (
                      <Loading text={joinLoadingText} />
                    )}
                    <div className="box-center-area">
                      <span className="time">
                        {gameItems.startDateAMPM.split("-")[0]}:
                        {gameItems.startDateAMPM.split("-")[1]}{" "}
                        {gameItems.startDateAMPM.split("-")[2].toUpperCase()}
                      </span>
                      <div
                        className="join-btn"
                        style={
                          gameItems.isSoldOut ? { cursor: "not-allowed" } : null
                        }
                        onClick={() =>
                          gameItems.isSoldOut === true
                            ? null //TODO: soldout olmuş olsa bile joined olan kişiler oyuna gidebilmeli
                            : !gameItems.isJoined
                            ? joinGame(
                                gameItems.gameId,
                                cardsCount[gameItems.gameId].innerText,
                                gameItems.startedPrice,
                                gameItems.totalCardsSold
                              )
                            : (window.location.href = `game?gameId=${gameItems.gameId}`)
                        }
                      >
                        <span>
                          {gameItems.isSoldOut === true
                            ? "SOLDOUT"
                            : !gameItems.isJoined
                            ? "JOIN"
                            : "JOINED"}
                        </span>
                      </div>
                      <div className="info">
                        <div className="row-area">
                          <div className="icon">
                            <img src={matic2Img} alt="" />
                          </div>
                          <span>
                            {utils.formatEther(
                              gameItems.startedPrice.toString()
                            )}{" "}
                            {process.env.REACT_APP_NETWORKSYMBOL}
                          </span>
                        </div>
                        <div className="row-area">
                          <div className="icon">
                            <img src={userImg} alt="" />
                          </div>
                          {/* TODO: contratta verilmeli */}
                          <span>{gameItems.totalPlayerCount} People</span>
                        </div>
                        <div className="row-area">
                          <div className="icon">
                            <img src={bronzeImg} alt="" />
                          </div>
                          <span>{gameItems.gameTypeName}</span>
                        </div>
                      </div>
                      <div className="buttons">
                        <div className="left-btn">
                          <div
                            className="decrease"
                            onClick={() => cardsCountDecrease(gameItems.gameId)}
                          />
                          <div className="value">
                            <div
                              ref={(element) =>
                                (cardsCount[gameItems.gameId] = element)
                              }
                              id={"cardscount-" + gameItems.gameId}
                              className="input"
                            >
                              1
                            </div>
                            <span>CARD</span>
                          </div>
                          <div
                            className="increase"
                            onClick={() =>
                              cardsCountIncrease(
                                gameItems.gameId,
                                gameItems.maxCardsPerPlayer
                              )
                            }
                          />
                        </div>
                        <div className="right-btn">
                          <span>
                            {utils.formatEther(
                              gameItems.startedPrice.toString()
                            )}{" "}
                            {process.env.REACT_APP_NETWORKSYMBOL}
                          </span>
                        </div>
                      </div>
                    </div>
                    <img src={cardRowBgImg} className="item-bg" alt="" />
                  </div>
                ))
            ) : filterGameList.length === 0 ? (
              <h4 style={{ marginTop: "130px" }}>Game not found!</h4>
            ) : (
              filterGameList.map((gameItems, index) => (
                <div className="item" key={index}>
                  <div className="box-center-area">
                    <span className="time">
                      {gameItems.startDateAMPM.split("-")[0]}:
                      {gameItems.startDateAMPM.split("-")[1]}{" "}
                      {gameItems.startDateAMPM.split("-")[2]}
                    </span>
                    <div
                      className="join-btn"
                      style={
                        gameItems.isSoldOut ? { cursor: "not-allowed" } : null
                      }
                      onClick={() =>
                        gameItems.isSoldOut === true
                          ? null
                          : !gameItems.isJoined
                          ? joinGame(
                              gameItems.gameId,
                              cardsCount[gameItems.gameId].innerText,
                              gameItems.startedPrice,
                              gameItems.totalCardsSold
                            )
                          : (window.location.href = `game?gameId=${gameItems.gameId}`)
                      }
                    >
                      <span>
                        {gameItems.isSoldOut === true
                          ? "SOLDOUT"
                          : gameItems.isJoined
                          ? "JOINED"
                          : "JOIN"}
                      </span>
                    </div>
                    <div className="info">
                      <div className="row-area">
                        <div className="icon">
                          <img src={matic2Img} alt="" />
                        </div>
                        <span>
                          {gameItems.startedPrice}{" "}
                          {process.env.REACT_APP_NETWORKSYMBOL}
                        </span>
                      </div>
                      <div className="row-area">
                        <div className="icon">
                          <img src={userImg} alt="" />
                        </div>
                        <span>{gameItems.peopleCount} People</span>
                      </div>
                      <div className="row-area">
                        <div className="icon">
                          <img src={bronzeImg} alt="" />
                        </div>
                        <span>{gameItems.gameTypeName}</span>
                      </div>
                    </div>
                    <div className="buttons">
                      <div className="left-btn">
                        <div
                          className="decrease"
                          onClick={() => cardsCountDecrease(gameItems.gameId)}
                        />
                        <div className="value">
                          <div
                            id={"cardscount-" + gameItems.gameId}
                            className="input"
                          >
                            1
                          </div>
                          <span>CARD</span>
                        </div>
                        <div
                          className="increase"
                          onClick={() =>
                            cardsCountIncrease(
                              gameItems.gameId,
                              gameItems.maxCardsPerPlayer
                            )
                          }
                        />
                      </div>
                      <div className="right-btn">
                        <span>
                          {gameItems.startedPrice}{" "}
                          {process.env.REACT_APP_NETWORKSYMBOL}
                        </span>
                      </div>
                    </div>
                  </div>
                  <img src={cardRowBgImg} className="item-bg" alt="" />
                </div>
              ))
            )}
            {/* item */}
          </div>
        </OverlayScrollbarsComponent>
      </div>
      <BottomLine />
    </>
  );
};

export default Join;
