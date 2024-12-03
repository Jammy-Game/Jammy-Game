import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Carousel from "react-slick";
import { useDispatch } from "react-redux";
import BottomLine from "../../components/BottomLine/BottomLine";
import { useMetaMask } from "../../utility/hooks/useMetaMask";
import { formatTimestampToAMPM } from "../../utility/Utils";
import {
  getGameTypes,
  getCreatedGames,
  getReadyGames,
  getStartedGames,
  getInfo,
  setAllCards,
} from "../store";
//images
import NextArrowImg from "../../assets/img/next.png";
import PrevArrowImg from "../../assets/img/prev.png";
import cardBgImg from "../../assets/img/card-bg.png";
import HeadLine from "../../components/HeadLine/HeadLine";
//css
import "./index.css";

const activeTimeBeetween = () => {
  const nowtimestamp = Date.parse(Date()) / 1000;
  return formatTimestampToAMPM(nowtimestamp).initialSlideIndex;
};

function NextArrow(props) {
  const { className, onClick } = props;
  return (
    <img className={className} src={NextArrowImg} onClick={onClick} alt="" />
  );
}

function PrevArrow(props) {
  const { className, onClick } = props;
  return (
    <img className={className} src={PrevArrowImg} onClick={onClick} alt="" />
  );
}

const Lobby = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { unSigner, wallet, connectMetaMask } = useMetaMask();
  const [activeGames, setActiveGames] = useState([]);
  const [jonedGameStatus, setJonedGameStatus] = useState(false);

  const handleClickRoom = async (room) => {
    if (wallet.accounts.length > 0) {
      if (Number(room.activeGameCount) > 0 || jonedGameStatus) {
        navigate({
          pathname: "join",
          search: `?room=${room.id}&start=${room.startTime}&end=${room.endTime}&ap=${room.timeZone}`,
        });
      }
    } else {
      connectMetaMask();
    }
  };

  const setRooms = async () => {
    dispatch(getCreatedGames({ dispatch, unSigner }))
      .then((result) => {
        let rooms = [
          {
            id: 0,
            activeGameCount: 0,
            title: "12 - 2 AM",
            startTime: 12,
            endTime: 2,
            timeZone: "am",
          },
          {
            id: 1,
            activeGameCount: 0,
            title: "3 - 5 AM",
            startTime: 3,
            endTime: 5,
            timeZone: "am",
          },
          {
            id: 2,
            activeGameCount: 0,
            title: "6 - 8 AM",
            startTime: 6,
            endTime: 8,
            timeZone: "am",
          },
          {
            id: 3,
            activeGameCount: 0,
            title: "9 - 11 AM",
            startTime: 9,
            endTime: 11,
            timeZone: "am",
          },
          {
            id: 4,
            activeGameCount: 0,
            title: "12 - 2 PM",
            startTime: 12,
            endTime: 2,
            timeZone: "pm",
          },
          {
            id: 5,
            activeGameCount: 0,
            title: "3 - 5 PM",
            startTime: 3,
            endTime: 5,
            timeZone: "pm",
          },
          {
            id: 6,
            activeGameCount: 0,
            title: "6 - 8 PM",
            startTime: 6,
            endTime: 8,
            timeZone: "pm",
          },
          {
            id: 7,
            activeGameCount: 0,
            title: "9 - 11 PM",
            startTime: 9,
            endTime: 11,
            timeZone: "pm",
          },
        ];
        result.payload.createdGames.forEach((game) => {
          const gameSlideIndex = formatTimestampToAMPM(
            game.startDate
          ).initialSlideIndex;
          rooms[gameSlideIndex].activeGameCount += 1;
        });
        console.log(rooms);
        setActiveGames(rooms);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // Set Rooms
  useEffect(() => {
    document.title = "Lobby - Jammy";
    if (unSigner.contract && activeGames.length === 0) {
      setRooms();
    }
  }, [unSigner.contract, activeGames]);

  // Set GameTypes & alert joined
  useEffect(() => {
    if (!unSigner.contract) return;
    if (wallet.accounts.length < 1) return;

    setJonedGameStatus(false);
    if (!sessionStorage.getItem("gameTypes")) {
      dispatch(getGameTypes({ dispatch }));
    }

    dispatch(
      getStartedGames({
        dispatch,
        unSigner,
        user: wallet.accounts[0].toLowerCase(),
      })
    )
      .then((result) => {
        if (result.payload) {
          console.log("getStartedGames:", result.payload.startedGames);
          result.payload.startedGames.forEach(async (game) => {
            if (game.isJoined) {
              setJonedGameStatus(true);
            }
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });

    dispatch(
      getReadyGames({
        dispatch,
        unSigner,
        user: wallet.accounts[0].toLowerCase(),
      })
    )
      .then((result) => {
        if (result.payload) {
          console.log("getReadyGames:", result.payload.readyGames);
          result.payload.readyGames.forEach(async (game) => {
            if (game.isJoined) {
              setJonedGameStatus(true);
            }
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });

    dispatch(
      getCreatedGames({
        dispatch,
        unSigner,
        user: wallet.accounts[0].toLowerCase(),
      })
    )
      .then((result) => {
        if (result.payload) {
          console.log("getCreatedGames:", result.payload.createdGames);
          result.payload.createdGames.forEach(async (game) => {
            if (game.isJoined) {
              setJonedGameStatus(true);
            }
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }, [unSigner.contract, wallet.accounts]);

  //Event listeners
  useEffect(() => {
    if (!unSigner.contract) return;

    // if (!sessionStorage.getItem("syncAllCards")) {
    //   dispatch(setAllCards({ dispatch, unSigner }));
    // }

    const listenerCardsAdded = () => {
      console.log("#CardsAdded (lobby) event was emmited");
      // dispatch(setAllCards({ dispatch, unSigner }));
      dispatch(getInfo({ unSigner }));
    };
    const listenerCardsUpdated = () => {
      console.log("#CardsUpdated (lobby) event was emmited");
      // dispatch(setAllCards({ dispatch, unSigner }));
      dispatch(getInfo({ unSigner }));
    };
    const listenerGameCreated = () => {
      console.log("#GameCreated (lobby) event was emmited");
      setRooms();
    };
    const listenerGameCancelled = () => {
      console.log("#GameCancelled (lobby) event was emmited");
      setRooms();
    };

    unSigner.contract?.on("CardsAdded", listenerCardsAdded);
    unSigner.contract?.on("CardsUpdated", listenerCardsUpdated);
    unSigner.contract?.on("GameCreated", listenerGameCreated);
    unSigner.contract?.on("GameCancelled", listenerGameCancelled);
    return () => {
      unSigner.contract?.off("CardsAdded", listenerCardsAdded);
      unSigner.contract?.off("CardsUpdated", listenerCardsUpdated);
      unSigner.contract?.off("GameCreated", listenerGameCreated);
      unSigner.contract?.off("GameCancelled", listenerGameCancelled);
    };
  }, [unSigner.contract]);

  return (
    <>
      <HeadLine />

      <div className="lobby-carousel-area">
        {jonedGameStatus && (
          <div className="isJoined">Joined Game Available</div>
        )}

        <Carousel
          centerMode={true}
          initialSlide={activeTimeBeetween()}
          infinite={true}
          slidesToShow={3} // Default olarak masaüstünde 3 göster
          nextArrow={<NextArrow />}
          prevArrow={<PrevArrow />}
          responsive={[
            {
              breakpoint: 768, // Mobil ekran boyutunda
              settings: {
                slidesToShow: 1, // Mobilde tek slide göster
              },
            },
          ]}
        >
          {activeGames &&
            activeGames.map((item, index) => (
              <div className="item" key={index}>
                <span className="time">{item.title}</span>
                <span className="game-number">
                  {item.activeGameCount} Active Games
                </span>
                <img
                  onClick={() => handleClickRoom(item)}
                  src={cardBgImg}
                  alt=""
                />
              </div>
            ))}
        </Carousel>
      </div>

      <BottomLine />
    </>
  );
};

export default Lobby;
