import React from "react";
import "./AdsOpen.css";

const AdsOpen = (props) => {
  return (
    <>
      {props.adsopen && (
        <div className={"add_pop"}>
          <div className={"ads_top"}>
            <div
              onClick={() => {
                props.setAdsopen(false);
                window.location.reload();
              }}
              className={"add_close"}
            >
              X
            </div>
            <div className={"timers"}>{props.countdown}</div>
          </div>
          <img
            src={
              "https://metagalaxyland.com/upload/images/metaverse/images/1690318521806-add.jpg"
            }
            alt=""
          />
        </div>
      )}
    </>
  );
};

export default AdsOpen;
