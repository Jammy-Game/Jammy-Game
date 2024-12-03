import React from "react";
import "./Leaderboard.css";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import CloseButton from "../CloseButton/CloseButton";
import { Link, useLocation } from "react-router-dom";
//images
import leaderboard1Img from "../../assets/img/leaderboard1.png"
import profileImg from "../../assets/img/profile-img.png"
import leaderboard2Img from "../../assets/img/leaderboard2.png"
import leaderboard3Img from "../../assets/img/leaderboard3.png"
import leaderboardImg from "../../assets/img/leaderboard.png"

const Leaderboard = (props) => {
  const { search } = useLocation();

  return (
    <>
      {props.show ? (
        <div
          className="popup-leaderboard popup"
        >
          <CloseButton onClose={props.onClose} to={search} />
          <div className="in">
            <div className="content-area">
              <div className="search-box">
                <input type="text" placeholder="Search" />
              </div>
              <OverlayScrollbarsComponent
                className="scrollbarCustom content"
                options={{ scrollbars: { theme: "os-theme-light" } }}
              >
                {/* TODO : her bir profil oluşturulurken bilgiler o profile ait olmalı! UserProfile.js ile beraber uygun düzenleme yapılmalı! */}
                <div className="list-area">
                  <div className="item-row">
                    <img src={leaderboard1Img} className="num" alt="" />
                    <div className="profile-img">
                      <img src={profileImg} alt="" />
                    </div>
                    <div className="info-area">
                      <div className="name">Jammy</div>
                      <div className="wallet-id">
                        0xb55360B41.............7Fa85A3b3B6
                      </div>
                      <div className="right">
                        <div className="total-text">
                          Total Earnings
                          <br />
                          45.988 {process.env.REACT_APP_NETWORKSYMBOL}
                        </div>
                        
                      </div>
                    </div>
                  </div>
                  <div className="item-row">
                    <img src={leaderboard2Img} className="num" alt="" />
                    <div className="profile-img">
                      <img src={profileImg} alt="" />
                    </div>
                    <div className="info-area">
                      <div className="name">Jammy</div>
                      <div className="wallet-id">
                        0xb55360B41.............7Fa85A3b3B6
                      </div>
                      <div className="right">
                        <div className="total-text">
                          Total Earnings
                          <br />
                          45.988 {process.env.REACT_APP_NETWORKSYMBOL}
                        </div>
                        
                      </div>
                    </div>
                  </div>
                  <div className="item-row">
                    <img src={leaderboard3Img} className="num" alt="" />
                    <div className="profile-img">
                      <img src={profileImg} alt="" />
                    </div>
                    <div className="info-area">
                      <div className="name">Jammy</div>
                      <div className="wallet-id">
                        0xb55360B41.............7Fa85A3b3B6
                      </div>
                      <div className="right">
                        <div className="total-text">
                          Total Earnings
                          <br />
                          45.988 {process.env.REACT_APP_NETWORKSYMBOL}
                        </div>
                        
                      </div>
                    </div>
                  </div>
                  <div className="item-row">
                    <div className="num">4</div>
                    <div className="profile-img">
                      <img src={profileImg} alt="" />
                    </div>
                    <div className="info-area">
                      <div className="name">Jammy</div>
                      <div className="wallet-id">
                        0xb55360B41.............7Fa85A3b3B6
                      </div>
                      <div className="right">
                        <div className="total-text">
                          Total Earnings
                          <br />
                          45.988 {process.env.REACT_APP_NETWORKSYMBOL}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="item-row">
                    <div className="num">5</div>
                    <div className="profile-img">
                      <img src={profileImg} alt="" />
                    </div>
                    <div className="info-area">
                      <div className="name">Jammy</div>
                      <div className="wallet-id">
                        0xb55360B41.............7Fa85A3b3B6
                      </div>
                      <div className="right">
                        <div className="total-text">
                          Total Earnings
                          <br />
                          45.988 {process.env.REACT_APP_NETWORKSYMBOL}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="item-row">
                    <div className="num">6</div>
                    <div className="profile-img">
                      <img src={profileImg} alt="" />
                    </div>
                    <div className="info-area">
                      <div className="name">Jammy</div>
                      <div className="wallet-id">
                        0xb55360B41.............7Fa85A3b3B6
                      </div>
                      <div className="right">
                        <div className="total-text">
                          Total Earnings
                          <br />
                          45.988 {process.env.REACT_APP_NETWORKSYMBOL}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </OverlayScrollbarsComponent>
            </div>
            <img src={leaderboardImg} className="w-100" alt="" />
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Leaderboard;
