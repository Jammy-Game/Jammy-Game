import React from "react";
import { Link } from "react-router-dom";
import "./CloseButton.css";
import CloseImg from "../../assets/img/close.svg";

const CloseButton = ({ onClose, to, extraAction, extraStyle, redirect }) => {
  const handleClick = () => {
    if (extraAction) {
      if (extraAction.type === "claimRefund" && extraAction.action) {
        console.log(extraAction.action);
        extraAction.action(); //onClose GameCancelledPopup içinde yapılıyor.
      } else if (extraAction.type === "claimPrize" && extraAction.action) {
        extraAction.action(); //onClose action fonksiyonu içinde gerçekleşiyor.
      } else if (extraAction.type === "winnerLoser" && extraAction.action) {
        extraAction.action(); //onClose action fonksiyonu içinde gerçekleşiyor.
      } else {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <Link
      to={redirect ? redirect : to}
      onClick={() => handleClick()}
      className={!extraStyle ? "close-btn" : `close-btn ${extraStyle}`}
    >
      <img src={CloseImg} className="w-100" alt="" />
    </Link>
  );
};

export default CloseButton;
