import React, { useEffect, useRef, useState } from "react";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { utils } from "ethers";
import { Link, useLocation } from "react-router-dom";
import CloseButton from "../CloseButton/CloseButton";
import { useDispatch } from "react-redux";
import niceSelect from "../../utility/niceSelect/niceSelectModule";
import {
  createGameTimes,
  getCreatedGames,
  getReadyGames,
  getStartedGames,
  getStorage,
} from "../../pages/store";
import { useMetaMask } from "../../utility/hooks/useMetaMask";
import { formatTimestampToAMPM } from "../../utility/Utils";
//css
import "./HostPanel.css";
//images
import hostPanelBg from "../../assets/img/hostpanel-bg.png";

const HostPanel = (props) => {
  const { search } = useLocation();
  const dispatch = useDispatch();

  const { signer, unSigner, wallet, connectMetaMask } = useMetaMask();
  const [hostCreatedGames, setHostCreatedGames] = useState([]);
  const [hostReadyGames, setHostReadyGames] = useState([]);
  const [hostStartedGames, setHostStartedGames] = useState([]);
  const [createTimes, setCreateTimes] = useState([]);
  const [gameTypes, setGameTypes] = useState([]);

  const createGameAPTimeRef = useRef();
  const createGameCardPriceRef = useRef();
  const initialButtons = {
    create: false,
    cancel: false,
    start: false,
  };
  const [buttonsLoading, setButtonsLoading] = useState(initialButtons);

  const createGame = async () => {
    let gamePrice = 0;

    gameTypes.forEach((gametype) => {
      if (
        Number(createGameCardPriceRef.current.value) === Number(gametype.price)
      ) {
        gamePrice = gametype.price;
      }
    });
    console.log("gamePrice:", gamePrice);

    setButtonsLoading({ create: true, cancel: false, start: false });
    try {
      const selectedTime = createGameAPTimeRef.current.value;
      const hoursminutes = selectedTime.split("-")[0];
      const ap = selectedTime.split("-")[1];
      const today = new Date().toLocaleDateString();

      let timestamp =
        Date.parse(
          `${today.split(".")[1]}/${today.split(".")[0]}/${
            today.split(".")[2]
          } ${hoursminutes}:00 ${ap}`,
          `yyy-dd-mm HH:mm:ss`
        ) / 1000;

      const newGame = {
        startDate: timestamp,
        maxCardsPerPlayer: 4,
        cardPrice: utils.parseEther(gamePrice.toString()),
        houseShare: 1000, // 10%
        prizes: [
          4000, // 40% (0. index > jammy)
          2000, // 20% (1. index > jams4)
          1500, // 15% (2. index > jams3)
          1000, // 10% (3. index > jams2)
          500, // 5% (4. index > jams1)
        ],
      };

      let roomId = 0;
      const rooms = JSON.parse(sessionStorage.getItem("rooms"));

      if (rooms) {
        rooms.forEach((element) => {
          if (
            formatTimestampToAMPM(newGame.startDate).room.split("-")[0] ===
              element.startHour.toString() &&
            formatTimestampToAMPM(newGame.startDate).room.split("-")[1] ===
              element.endHour.toString() &&
            formatTimestampToAMPM(newGame.startDate).room.split("-")[2] ===
              element.timeZone.toString()
          ) {
            roomId = element.id;
          }
        });
      }

      const tx = await signer.contract.createGame(
        newGame.startDate,
        newGame.maxCardsPerPlayer,
        newGame.cardPrice,
        newGame.houseShare,
        newGame.prizes
      );
      const receipt = await tx.wait();
      console.log("receipt Game:", receipt);
      if (receipt.events[0].args.gameId && receipt.events[0].args.host) {
        wallet.accounts[0] &&
          dispatch(
            getCreatedGames({
              dispatch,
              unSigner,
              host: wallet.accounts[0].toLowerCase(),
            })
          )
            .then((result) => {
              if (result.payload) {
                setHostCreatedGames(result.payload.createdGames);
              }
            })
            .catch((error) => {
              console.log(error);
            });
      }
      setButtonsLoading(initialButtons);
    } catch (error) {
      console.error(error);
      setButtonsLoading(initialButtons);
    }
  };

  const cancelGame = async (cancelledgameId) => {
    setButtonsLoading({ create: false, cancel: true, start: false });
    try {
      const tx = await signer.contract.cancelGame(cancelledgameId);
      const receipt = await tx.wait();
      console.log("cancel-receipt:", receipt);
      const canceledGameId = Number(receipt.events[0].args.gameId);
      if (canceledGameId) {
        wallet.accounts[0] &&
          (await dispatch(
            getCreatedGames({
              dispatch,
              unSigner,
              host: wallet.accounts[0].toLowerCase(),
            })
          )
            .then((result) => {
              if (result.payload) {
                setHostCreatedGames(result.payload.createdGames);
              }
            })
            .catch((error) => {
              console.log(error);
            }));
      }
      setButtonsLoading(initialButtons);
    } catch (error) {
      console.error(error);
      setButtonsLoading(initialButtons);
    }
  };

  useEffect(() => {
    if (props.show) {
      dispatch(getStorage({ key: "gameTypes", type: "session" }))
        .then((result) => {
          if (result.payload && gameTypes.length === 0) {
            setGameTypes(result.payload);
            return true;
          } else {
            return false;
          }
        })
        .then((result) => {
          if (!result) {
            niceSelect(createGameCardPriceRef);
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }, [props.show, gameTypes]);

  useEffect(() => {
    if (props.show) {
      dispatch(createGameTimes())
        .then((result) => {
          if (createTimes.length === 0) {
            setCreateTimes(result.payload);
            return true;
          } else {
            return false;
          }
        })
        .then((result) => {
          if (result) {
            niceSelect(createGameAPTimeRef);
          }
        })
        .catch((error) => console.log(error));

      if (unSigner.contract && wallet.accounts.length > 0) {
        dispatch(
          getCreatedGames({
            dispatch,
            unSigner,
            host: wallet.accounts[0].toLowerCase(),
          })
        )
          .then((result) => {
            if (result.payload) {
              console.log("getCreatedGames:", result.payload.createdGames);
              setHostCreatedGames(result.payload.createdGames);
            }
          })
          .catch((error) => console.log(error));

        dispatch(
          getReadyGames({
            dispatch,
            unSigner,
            host: wallet.accounts[0].toLowerCase(),
          })
        )
          .then((result) => {
            if (result.payload) {
              console.log("getReadyGames:", result.payload.readyGames);
              setHostReadyGames(result.payload.readyGames);
            }
          })
          .catch((error) => console.log(error));

        dispatch(
          getStartedGames({
            dispatch,
            unSigner,
            host: wallet.accounts[0].toLowerCase(),
          })
        )
          .then((result) => {
            if (result.payload) {
              console.log("getStartedGames:", result.payload.startedGames);
              setHostStartedGames(result.payload.startedGames);
            }
          })
          .catch((error) => console.log(error));
      } else {
        connectMetaMask();
      }
    }

    if (!props.show) {
      setCreateTimes([]);
    }
  }, [props.show, unSigner.contract, wallet.accounts, gameTypes]);

  return (
    <>
      {props.show && (
        <div className="popup-host-panel popup">
          <CloseButton onClose={props.onClose} to={search} />
          <div className="in">
            <img src={hostPanelBg} className="w-100" alt="" />
            <div className="box-in">
              <div className="left-colm">
                <h3>Create a New Game</h3>
                <h4>Create a New Game</h4>
                <p>
                  Specify the time <br />
                  you want the game to start.
                </p>
                <div className="selects-area">
                  <select ref={createGameAPTimeRef} className="nice">
                    {createTimes.length > 0 &&
                      createTimes.map((time, index) => (
                        <option value={time.replace(" ", "-")} key={index}>
                          {time}
                        </option>
                      ))}
                  </select>

                  <select ref={createGameCardPriceRef} className="nice">
                    {gameTypes.map((gametype, index) => {
                      return (
                        <option key={index} value={gametype.price}>
                          {gametype.name}
                        </option>
                      );
                    })}
                  </select>

                  <div className="btns-bottom justify-content-start">
                    <Link
                      onClick={() => createGame()}
                      className={
                        !buttonsLoading.create
                          ? "btn-sub"
                          : "btn-sub btnloading"
                      }
                      style={{ marginLeft: 0 }}
                    >
                      Create
                    </Link>
                  </div>
                </div>
              </div>
              <div className="right-colm ">
                <h3>
                  Game Schedule <span>Game Schedule</span>
                </h3>
                <div className="right-in ">
                  <OverlayScrollbarsComponent
                    className="item-list-wrapper scrollbarCustom content"
                    options={{ scrollbars: { theme: "os-theme-dark" } }}
                  >
                    {hostCreatedGames.length > 0 &&
                      hostCreatedGames.map((gameItems, index) => (
                        <div key={index} className="item-row">
                          <div className="time">
                            {gameItems.startDateAMPM.split("-")[0]}:
                            {gameItems.startDateAMPM.split("-")[1]}{" "}
                            {gameItems.startDateAMPM.split("-")[2]}
                          </div>
                          <div className="name">{gameItems.gameTypeName}</div>
                          <div className="btns-area">
                            <Link
                              href="#"
                              className={
                                !buttonsLoading.cancel
                                  ? "cancel"
                                  : "cancel btnloading"
                              }
                              onClick={() => cancelGame(gameItems.gameId)}
                            >
                              Cancel
                            </Link>
                            <Link
                              to={`/game?gameId=${gameItems.gameId}`}
                              className="start"
                            >
                              Go
                            </Link>
                          </div>
                        </div>
                      ))}

                    {hostReadyGames.length > 0 &&
                      hostReadyGames.map((gameItems, index) => (
                        <div key={index} className="item-row">
                          <div className="time">
                            {gameItems.startDateAMPM.split("-")[0]}:
                            {gameItems.startDateAMPM.split("-")[1]}{" "}
                            {gameItems.startDateAMPM.split("-")[2]}
                          </div>
                          <div className="name">{gameItems.gameTypeName}</div>
                          <div className="btns-area">
                            <Link
                              to={`/game?gameId=${gameItems.gameId}`}
                              className="start"
                            >
                              Start
                            </Link>
                          </div>
                        </div>
                      ))}

                    {hostStartedGames.length > 0 &&
                      hostStartedGames.map((gameItems, index) => (
                        <div key={index} className="item-row">
                          <div className="time">
                            {gameItems.startDateAMPM.split("-")[0]}:
                            {gameItems.startDateAMPM.split("-")[1]}{" "}
                            {gameItems.startDateAMPM.split("-")[2]}
                          </div>
                          <div className="name">{gameItems.gameTypeName}</div>
                          <div className="btns-area">
                            <Link
                              to={`/game?gameId=${gameItems.gameId}`}
                              className="start"
                            >
                              Continue
                            </Link>
                          </div>
                        </div>
                      ))}
                  </OverlayScrollbarsComponent>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HostPanel;
