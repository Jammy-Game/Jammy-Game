import React, { useEffect, useState } from "react";
import "./Warning.css";
import CloseButton from "../CloseButton/CloseButton";
import { Link } from "react-router-dom";
//images
import warnPopupImg from "../../assets/img/warnpopup.png";
import warnTitleImg from "../../assets/img/warntitle.png";


const Warning = (props) => {

  const [href, setHref] = useState('');

  function stringLink(str) {
    let index = str.indexOf("http");
    return setHref(str.substr(index));
  }
  useEffect(() => {
    if (props.text.includes("https://")) {
      stringLink(props.text);
    }
  }, [props.text])
  
  return (
    <>
      {props.show ? (
        <div className="popup-warning popup">
          <CloseButton onClose={props.onClose} />
          <div className="in">
            <img src={warnPopupImg} className="w-100" alt="" />
            <p className="title">
              <span>{props.title}</span>
              <img src={warnTitleImg} className="" alt="" />
            </p>
            <p className="text">
              {props.text.includes("https://") ? (
                <Link rel="noopener noreferrer" target="_blank" to={href} >{props.text}</Link>
              ) : (
                props.text
              )}
            </p>
          </div>
          <div className="btns-bottom">
            <Link onClick={props.onClose} className="btn-sub">
              Close
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Warning;
