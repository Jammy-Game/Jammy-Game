import React from "react";
import Spinner from "react-bootstrap/Spinner";
import "./Loading.css";

const Loading = (props) => {
  return (
    <div className="loading-area" style={props.extraStyle && props.extraStyle}>
      <div className={props.fullscreen ? "fullscreen" : "area"}>
        <Spinner animation="border"></Spinner>
        <span>{props.text}</span>
      </div>
    </div>
  );
};

export default Loading;
