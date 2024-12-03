import React, { Fragment } from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import CloseButton from "../../CloseButton/CloseButton";
import Card0 from "../Cards/Card0";
import Card1 from "../Cards/Card1";
import Card2 from "../Cards/Card2";
import Card3 from "../Cards/Card3";
//images
import purpleNeonImg from "../../../assets/img/Purple-Neon.png";

const CardsTxPopup = ({ hash, onClose }) => {
  const { search } = useLocation();
  const cardCount = useSelector((state) => state.gameStore.cardCount);

  return (
    <div className="popup-wrapper always-wrapper">
      <CloseButton onClose={onClose} to={search} />
      <div className="in">
        <div className="text-top-area always-popup">JAMMY IS ALWAYS</div>
        <div className="title-sub-box-o">FULL-TRANSPARENT AND TRUSWORTHY!</div>
        <div className="card-bottom-area">
          <div className="card-container">
            {hash && (
              <Fragment>
                {cardCount >= 1 && <Card0 inComponent={"CardTx"} hash={hash} />}
                {cardCount >= 2 && <Card1 inComponent={"CardTx"} hash={hash} />}
                {cardCount >= 3 && <Card2 inComponent={"CardTx"} hash={hash} />}
                {cardCount === 4 && (
                  <Card3 inComponent={"CardTx"} hash={hash} />
                )}
              </Fragment>
            )}
          </div>
        </div>
        <img src={purpleNeonImg} className="popup-bg" alt="" />
      </div>
    </div>
  );
};

export default CardsTxPopup;
