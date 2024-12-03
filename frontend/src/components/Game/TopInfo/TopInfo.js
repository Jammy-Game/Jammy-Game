import React from "react";
import { utils } from "ethers";

const TopInfo = ({ game }) => {
  return (
    <>
      <div className="top-info">
        <div className="item">
          BET: {game.length > 0 ? utils.formatEther(game[2]) : "0"}{" "}
          {process.env.REACT_APP_NETWORKSYMBOL}
        </div>
        <div className="item">
          POT:{" "}
          {game.length > 0
            ? utils.formatEther((game[2] * game[4]).toString())
            : "0"}{" "}
          {process.env.REACT_APP_NETWORKSYMBOL}
        </div>
        <div className="item">
          JAMMY:{" "}
          {game.length > 0
            ? utils.formatEther((game[2] * game[4] * 0.4).toString())
            : "0"}{" "}
          {process.env.REACT_APP_NETWORKSYMBOL}
        </div>
      </div>
    </>
  );
};

export default React.memo(TopInfo);
