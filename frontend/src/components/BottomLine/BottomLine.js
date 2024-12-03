import React, { useEffect, useState } from "react";
import "./BottomLine.css";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import { useMetaMask } from "../../utility/hooks/useMetaMask";

import Quests from "../Quests/Quests";
import DailyWheel from "../DailyWheel/DailyWheel";
import Leaderboard from "../Leaderboard/Leaderboard";
import HowToPlay from "../HowToPlay/HowToPlay";
import HostPanel from "../HostPanel/HostPanel";
import Warning from "../Warning/Warning";
//images
import hostPanelImg from "../../assets/img/host-panel.png";
import howToImg from "../../assets/img/how_to.png";

const BottomLine = (props) => {
  const { search } = useLocation();
  const [showQuest, setShowQuest] = useState(false);
  const [showLeaderBoard, setShowLeaderBoard] = useState(false);
  const [showDailyWheel, setShowDailyWheel] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showHostPanel, setShowHostPanel] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [countdown, setCountdown] = useState(86400);
  const [playtime, setPlaytime] = useState(false);
  const [warning, setWarning] = useState("");
  const [warnstatus, setWarnstatus] = useState(false);

  const { wallet, hasProvider, signer, unSigner, connectMetaMask } =
    useMetaMask();

  // Geri sayımı biçimli bir şekilde döndürme
  const formatCountdown = () => {
    const hours = Math.floor(countdown / 3600);
    const minutes = Math.floor((countdown % 3600) / 60);
    const seconds = countdown % 60;

    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };
  // TODO : Test
  const checkPlaytime = () => {
    // aşağısı orjinal
    // let data = {
    //   user: currentAccount,
    // };
    // console.log("play time kontrol ediliyor..." + playtime);
    // axios
    //   .post("http://localhost:5000/api/general/checkplaytime", data, {
    //     headers: { "Content-Type": "application/json" },
    //   })
    //   .then((response) => {
    //     console.log("play time response.data : " + response.data);
    //     if (response.data.status === "error") {
    //       setCountdown(response.data.countdown);
    //       setWarning(
    //         "Hold up, you can't just come runnin' for the bonus! " +
    //           "Play one game, and have a blast, then we'll spin them wheels!"
    //       );
    //     } else {
    //       setCountdown(0);
    //       setPlaytime(true);
    //     }
    //   })
    //   .catch((error) => {
    //     console.log(error.data);
    //   });
    // <TEST : aşağısı test
    let responseDataStatus = "success"; // TEST : response data status
    let responseDataCountdown = 5; // TEST : response data countdown
    if (responseDataStatus === "error") {
      setCountdown(responseDataCountdown);
      setWarning(
        "Hold up, you can't just come runnin' for the bonus! " +
          "Play one game, and have a blast, then we'll spin them wheels!"
      );
    } else {
      setCountdown(0);
      setPlaytime(true);
    }
    // />TEST
  };
  const handleClickAccess = async () => {
    if (wallet.accounts.length > 0) {
      setWarning("");
      setWarnstatus(false);
    } else {
      connectMetaMask();
    }
  };
  const closeAllPopups = () => {
    setWarnstatus(false);
    setShowDailyWheel(false);
    setShowHostPanel(false);
    setShowHowToPlay(false);
    setShowLeaderBoard(false);
    setShowQuest(false);
  };

  useEffect(() => {
    if (hasProvider && wallet.accounts.length > 0) {
      setCurrentAccount(wallet.accounts[0]);
    }

    if (currentAccount) {
      checkPlaytime();
    } else {
      setWarning("Account does not exists!");
    }

    if (countdown === 0) return;
    const timer = setInterval(() => {
      setCountdown((prevCountdown) => prevCountdown - 1);
    }, 1000);
    // Komponent kaldırıldığında zamanlayıcıyı temizle
    return () => clearInterval(timer);
  }, [wallet.accounts, currentAccount]);
  return (
    <>
      <Warning
        show={warnstatus}
        onClose={() => setWarnstatus(!warnstatus)}
        title="Warning"
        text={warning}
      />
      {/* how to play */}
      <HowToPlay
        show={showHowToPlay}
        onClose={() => setShowHowToPlay(!showHowToPlay)}
      />
      {/* how to play */}

      {/* host panel */}
      {signer.isHost && (
        <HostPanel
          show={showHostPanel}
          onClose={() => setShowHostPanel(!showHostPanel)}
        />
      )}
      {/* host panel */}
      {/* Jammy Quests */}
      {currentAccount && (
        <Quests
          show={showQuest}
          currentAccount={currentAccount}
          onClose={() => setShowQuest(!showQuest)}
        />
      )}
      {/* Jammy Quests */}
      {/* Daily Wheel */}
      {playtime && currentAccount && (
        <DailyWheel
          show={showDailyWheel}
          onClose={() => setShowDailyWheel(!showDailyWheel)}
          currentAccount={currentAccount}
          setCurrentAccount={() => setCurrentAccount()}
        />
      )}
      {/* Daily Wheel */}
      {/* leaderboard popup */}
      <Leaderboard
        show={showLeaderBoard}
        onClose={() => setShowLeaderBoard(!showLeaderBoard)}
      />
      {/* leaderboard popup */}

      {signer.isHost && (
        <Link
          to={search}
          className="host-panel"
          onClick={() => {
            setShowHostPanel(!showHostPanel);
          }}
        >
          <img src={hostPanelImg} alt="" />
        </Link>
      )}
      <Link
        to={search}
        className="how-to"
        onClick={() => setShowHowToPlay(!showHowToPlay)}
      >
        <img src={howToImg} alt="" />
      </Link>
      <div className="bottom-line" onClick={() => handleClickAccess()}>
        <Link
          to={search}
          className="jammyQuests"
          // onClick={() => {
          //   warning.length > 0 ? setWarnstatus(true) : setShowQuest(!showQuest);
          // }}
        >
          <span className="comingSoonBottom">Coming Soon</span>
        </Link>
        <Link
          to={search}
          className="dailyWheel"
          onClick={() => {
            warning.length > 0
              ? setWarnstatus(true)
              : setShowDailyWheel(!showDailyWheel);
          }}
        >
          <div className="comingSoonBottom">Coming Soon!</div>
        </Link>

        <Link
          to={search}
          className="leaderBoard"
          onClick={() => setShowLeaderBoard(!showLeaderBoard)}
        >
          <div className="comingSoonBottom">Coming Soon!</div>
        </Link>

        <div className="time-container">
          {/* <span>{countdown > 0 ? formatCountdown() : "00:00:00"}</span> */}
        </div>
      </div>
    </>
  );
};

export default BottomLine;
