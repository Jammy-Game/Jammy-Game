import React, { useEffect, useState } from "react";

// TODO: nerde kullanılacagına karar verildiğinde kullanılacak
const Countdown = ({ game, gameStatus }) => {
  const nowtimestamp = Math.floor(Date.now() / 1000);
  const gametimestamp = Number(game[1]);
  let { initialSeconds = Number(gametimestamp - nowtimestamp) } = "props";
  const [seconds, setSeconds] = useState(
    initialSeconds <= 0 ? 0 : initialSeconds
  );

  useEffect(() => {
    if (game) {
      setSeconds(initialSeconds <= 0 ? 0 : initialSeconds);
    }

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
  }, [seconds, game]);

  return (
    <div
      style={{
        height: "4%",
        width: "90%",
        padding: "0px 6px",
        margin: "0",
        textAlign: "center",
      }}
    >
      {gameStatus === 1 && (
        !isNaN(seconds) && seconds > 0 ? (
          seconds / 3600 >= 1 ? (
            "More than 1 hour"
          ):(
            seconds < 60 && seconds > 0 ? (
              `Starts in: 00 : ${seconds < 10 ? `0${seconds}` : seconds}`
            ):(
              `Starts in: ${
                Math.floor(seconds / 60) < 10
                  ? `0${Math.floor(seconds / 60)}`
                  : Math.floor(seconds / 60)
              } : ${seconds % 60 < 10 ? `0${seconds % 60}` : seconds % 60}`
            )
          )
        ):("Game starting")
      )}
      {gameStatus === 2 && "Game starting"}
      {gameStatus === 3 && "Game started"}
      {gameStatus === 4 && "Game Over"}
    </div>
  );
};

export default Countdown;
