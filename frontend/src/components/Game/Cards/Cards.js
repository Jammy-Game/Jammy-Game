import React, { Fragment, useState } from "react";
import { useMetaMask } from "../../../utility/hooks/useMetaMask";
import HostRevealNumber from "../../../components/Game/HostGame/HostRevealNumber";
import HostStartGame from "../../../components/Game/HostGame/HostStartGame";
import Card0 from "./Card0";
import Card1 from "./Card1";
import Card2 from "./Card2";
import Card3 from "./Card3";
//Popups
import CardChangePopup from "../Popups/CardChangePopup";

const Cards = ({
  game,
  gameStatus,
  drawnNumbers,
  manuelCloseToggle,
  cardChangePopup,
  setCardChangePopup,
}) => {
  const { wallet, signer, unSigner } = useMetaMask();
  const [card0DrawnNumbers, setCard0DrawnNumbers] = useState([]);
  const [card1DrawnNumbers, setCard1DrawnNumbers] = useState([]);
  const [card2DrawnNumbers, setCard2DrawnNumbers] = useState([]);
  const [card3DrawnNumbers, setCard3DrawnNumbers] = useState([]);

  return (
    <>
      {cardChangePopup && (
        <CardChangePopup
          game={game}
          gameStatus={gameStatus}
          onClose={() => setCardChangePopup(false)}
        />
      )}

      <div className="card-container">
        {/* start game ekranı */}
        {signer.isHost && Number(game[5]) < 2 && (
          <HostStartGame game={game} gameStatus={gameStatus} />
        )}
        {/* sayı çekme ekranı */}
        {signer.isHost && Number(game[5]) > 1 && (
          <HostRevealNumber
            gameStatus={gameStatus}
            drawnNumbers={drawnNumbers}
          />
        )}

        {!signer.isHost ? (
          <Fragment>
            <div className="cards-area">
              <Card0
                gameStatus={gameStatus}
                inComponent={"Cards"}
                drawnNumbers={drawnNumbers}
                card0DrawnNumbers={card0DrawnNumbers}
                setCard0DrawnNumbers={setCard0DrawnNumbers}
                manuelCloseToggle={manuelCloseToggle}
                cardChangePopup={cardChangePopup}
              />
              <Card1
                gameStatus={gameStatus}
                inComponent={"Cards"}
                drawnNumbers={drawnNumbers}
                card1DrawnNumbers={card1DrawnNumbers}
                setCard1DrawnNumbers={setCard1DrawnNumbers}
                manuelCloseToggle={manuelCloseToggle}
                cardChangePopup={cardChangePopup}
              />
              <Card2
                gameStatus={gameStatus}
                inComponent={"Cards"}
                drawnNumbers={drawnNumbers}
                card2DrawnNumbers={card2DrawnNumbers}
                setCard2DrawnNumbers={setCard2DrawnNumbers}
                manuelCloseToggle={manuelCloseToggle}
                cardChangePopup={cardChangePopup}
              />
              <Card3
                gameStatus={gameStatus}
                inComponent={"Cards"}
                drawnNumbers={drawnNumbers}
                card3DrawnNumbers={card3DrawnNumbers}
                setCard3DrawnNumbers={setCard3DrawnNumbers}
                manuelCloseToggle={manuelCloseToggle}
                cardChangePopup={cardChangePopup}
              />
            </div>
          </Fragment>
        ) : null}
      </div>
    </>
  );
};

export default React.memo(Cards);
