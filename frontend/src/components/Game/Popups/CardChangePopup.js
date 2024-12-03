import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { useMetaMask } from "../../../utility/hooks/useMetaMask";
import CloseButton from "../../CloseButton/CloseButton";
import Card0 from "../Cards/Card0";
import Card1 from "../Cards/Card1";
import Card2 from "../Cards/Card2";
import Card3 from "../Cards/Card3";
//images
import purpleNeonImg from "../../../assets/img/Purple-Neon.png";

const CardChangePopup = ({ game, gameStatus, onClose }) => {
  console.log("#-> CardChange(popup) rendered");
  const { search } = useLocation();
  const gameId = useSelector((state) => state.gameStore.gameId);
  const cardCount = useSelector((state) => state.gameStore.cardCount);

  const { wallet, signer, unSigner } = useMetaMask();
  const [redrawPCI, setRedrawPCI] = useState(-1); //0-1-2-3 (player card index)

  useEffect(() => {
    if (!unSigner.contract) return;
    if (wallet.accounts.length < 1) return;
    if (!gameId) return;

    const listenerRequestFulfilled = async (
      requestId,
      reqType,
      player,
      numberOfWords
    ) => {
      const reqResult = await unSigner.contract.randomRequests(requestId);
      if (
        Number(reqType) === 2 &&
        Number(reqResult.gameId) === gameId &&
        player.toLowerCase() === wallet.accounts[0].toLowerCase()
      ) {
        console.log("#RequestFulfilled (cardchange) event was emmited");
        onClose();
      }
    };

    unSigner.contract?.on("RequestFulfilled", listenerRequestFulfilled);
    return () => {
      unSigner.contract?.off("RequestFulfilled", listenerRequestFulfilled);
    };
  }, [unSigner.contract, wallet.accounts, gameId]);

  return (
    <div className="popup-wrapper always-wrapper">
      <CloseButton onClose={onClose} to={search} />
      <div className="in">
        <div className="text-top-area always-popup">Are you sure?</div>
        <div className="title-sub-box-o">
          Click the card you want to change! Chop-chop mam!
        </div>
        <div className="card-bottom-area">
          <div className="card-container">
            {cardCount >= 1 && (
              <Card0
                game={game}
                gameStatus={gameStatus}
                inComponent={"CardChange"}
                redrawPCI={redrawPCI}
                setRedrawPCI={setRedrawPCI}
              />
            )}
            {cardCount >= 2 && (
              <Card1
                game={game}
                gameStatus={gameStatus}
                inComponent={"CardChange"}
                redrawPCI={redrawPCI}
                setRedrawPCI={setRedrawPCI}
              />
            )}
            {cardCount >= 3 && (
              <Card2
                game={game}
                gameStatus={gameStatus}
                inComponent={"CardChange"}
                redrawPCI={redrawPCI}
                setRedrawPCI={setRedrawPCI}
              />
            )}
            {cardCount === 4 && (
              <Card3
                game={game}
                gameStatus={gameStatus}
                inComponent={"CardChange"}
                redrawPCI={redrawPCI}
                setRedrawPCI={setRedrawPCI}
              />
            )}
          </div>
        </div>
        <img src={purpleNeonImg} className="popup-bg" alt="" />
      </div>
    </div>
  );
};

export default CardChangePopup;
