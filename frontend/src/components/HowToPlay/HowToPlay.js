import React from "react";
import CloseButton from "../CloseButton/CloseButton";
import "./HowToPlay.css";
import { useLocation } from "react-router-dom";
//images
import howToImg from "../../assets/img/how-to-Popup.png"

const HowToPlay = (props) => {
  const { search } = useLocation();

  return (
    <>
      {props.show ? (
        <div
          className="popup-how-to-play popup"
        >
          <CloseButton onClose={props.onClose} to={search} />
          <div className="in">
            <img src={howToImg} className="w-100" alt="" />
          </div>
        </div>
      ) : null}
    </>
  );
};

export default HowToPlay;
