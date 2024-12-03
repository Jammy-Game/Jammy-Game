import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useMetaMask } from "../../../utility/hooks/useMetaMask";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import Carousel from "../../../components/Carousel/Carousel";
import { Link, useLocation } from "react-router-dom";
import Countdown from "../Countdown/Countdown";
//Images
import SendGifImg1 from "../../../assets/img/chatgifts/gift1.png";
import SendGifImg2 from "../../../assets/img/chatgifts/gift2.png";
import SendGifImg3 from "../../../assets/img/chatgifts/gift3.png";
import SendGifImg4 from "../../../assets/img/chatgifts/gift4.png";
import SendGifImg5 from "../../../assets/img/chatgifts/gift5.png";
import NeonArrowRightImg from "../../../assets/img/neonArrowRight.png";
import NeonArrowLeftImg from "../../../assets/img/neonArrowLeft.png";
import ArrowRightImg from "../../../assets/img/arrow-right.svg";
import ProfileImg from "../../../assets/img/profile-img.png";
import PoligonLogoImg from "../../../assets/img/polygon-logo.png";
import ChatBgImg from "../../../assets/img/chat-bg.png";
import ChatBg1Img from "../../../assets/img/chat-bg1.png";
import TextBgImg from "../../../assets/img/text-bg.png";
import GiftBgImg from "../../../assets/img/gift-slide-bg.png";

function NeonArrowRight(props) {
  const { className, onClick } = props;
  return (
    <img
      className={className}
      src={NeonArrowRightImg}
      onClick={onClick}
      alt=""
    />
  );
}

function NeonArrowLeft(props) {
  const { className, onClick } = props;
  return (
    <img
      className={className}
      src={NeonArrowLeftImg}
      onClick={onClick}
      alt=""
    />
  );
}
const RightLine = ({
  game,
  gameStatus,
  drawnNumbers,
}) => {
  const { search } = useLocation();
  const gameId = useSelector((state) => state.gameStore.gameId);

  const { wallet, signer, unSigner } = useMetaMask();
  const [active, setActive] = useState(2);
  const chatLinks = ["message-btn", "adult-btn", "transactions-btn"];
  const giftImgs = [
    // [src , matic value]
    [SendGifImg1, 5],
    [SendGifImg2, 5],
    [SendGifImg3, 5],
    [SendGifImg4, 5],
    [SendGifImg5, 5],
  ];

  // useEffect(() => {}, []);

  return (
    <>
      <div className="item-chat-right d-flex col-2">
        <form className="w-100">
          <div className={`chat-container ${active === 2 ? "last" : ""}`}>
            <img
              className="w-100 position-absolute h-100"
              alt=""
              src={active === 2 ? ChatBg1Img : ChatBgImg}
            />
            <div className="btns-top">
              {chatLinks.map((link, index) => {
                return (
                  <Link
                    to={search}
                    key={index}
                    className={link + ` ${active === index ? "active" : ""}`}
                    // onClick={() => setActive(index)} //TODO : Chat ve senf gift açılacak
                  />
                );
              })}
            </div>
            {/* TODO: Geçiçi olarak buraya eklendi. */}
            {!signer.isHost && (
              <div className="btns-top" style={{ paddingTop: "4px" }}>
                <Countdown game={game} gameStatus={gameStatus} />
              </div>
            )}

            <div
              className="tab-content"
              style={active === 0 ? { display: "block" } : { display: "none" }}
            >
              <OverlayScrollbarsComponent
                className="scrollbarCustom content"
                options={{ scrollbars: { theme: "os-theme-light" } }}
              >
                <ul className="messages-list">
                  <li>
                    <div className="img">
                      <img src={ProfileImg} alt="" />
                    </div>
                    <div className="text-right">
                      <span>Cameron Williamson</span>
                      <small>
                        Convergent and divergent plate marginsConvergent and
                        divergent plate margins
                      </small>
                    </div>
                  </li>
                </ul>
              </OverlayScrollbarsComponent>
              <div className="bottom-message">
                <Link to={search}>Hello</Link>
                <Link to={search}>GL!</Link>
                <Link to={search}>HF!</Link>
                <Link to={search}>Congrats</Link>
                <Link to={search}>QQ</Link>
              </div>
              <div className="message-send">
                <img className="w-100" alt="" src={TextBgImg} />
                <input
                  type="text"
                  placeholder="Enter your message.."
                  className="text-write"
                />
                <button type="reset" />
              </div>
            </div>
            <div
              className="tab-content memberTab"
              style={active === 1 ? { display: "block" } : { display: "none" }}
            >
              <div className="members">
                <OverlayScrollbarsComponent
                  className="scrollbarCustom content"
                  options={{ scrollbars: { theme: "os-theme-light" } }}
                >
                  <div className="items-area">
                    {/* TODO : member area, API return result list */}
                    {(() => {
                      let memberElements = [];
                      for (let i = 0; i < 20; i++) {
                        memberElements.push(
                          <div key={i} className="item">
                            <div className="form-group">
                              <input type="checkbox" id={`item${i}`} />
                              <label htmlFor={`item${i}`}>
                                <img src={ProfileImg} alt="" />
                                <span>Jambo</span>
                              </label>
                            </div>
                          </div>
                        );
                      }
                      return memberElements;
                    })()}
                  </div>
                </OverlayScrollbarsComponent>
                {/* TODO : hangi simge gönderildiyse chat box listesindeki PP'lerin yanında o simge belirecek.
                    Bir kişiye birden fazla simge gönderilirse en son hangisi gönderilmişse o kalır. */}
                <div className="btns">
                  <Link to={search}>Send</Link>
                  <Link to={search}>Send All</Link>
                </div>
              </div>
              <div className="gift-slide">
                <img className="w-100" src={GiftBgImg} alt="" />
                <div className="gift-slide-area">
                  {
                    <Carousel
                      slidesToShow={3}
                      nextArrow={<NeonArrowRight />}
                      prevArrow={<NeonArrowLeft />}
                      carouselData={giftImgs.map((item, index) => {
                        return (
                          // TODO : image click event
                          <div key={index}>
                            <Link to={search}>
                              <div className="item">
                                <img src={item[0]} alt="" />
                                <div className="value">
                                  <span>{item[1]} </span>
                                  <img src={PoligonLogoImg} alt=""></img>
                                </div>
                              </div>
                            </Link>
                          </div>
                        );
                      })}
                    />
                  }
                </div>
              </div>
            </div>
            <div
              className="tab-content"
              style={active === 2 ? { display: "block" } : { display: "none" }}
            >
              <div className="transactions">
                <OverlayScrollbarsComponent
                  className="scrollbarCustom content transactions-container"
                  options={{ scrollbars: { theme: "os-theme-light" } }}
                >
                  <ul className="transactions-list">
                    {drawnNumbers.length > 0 &&
                      drawnNumbers.map((items, index) => (
                        <li key={index}>
                          <span>
                            "{items.number}"
                          </span>
                          <Link
                            to={`${process.env.REACT_APP_NETWORKURL}tx/${items.transaction}`}
                            target="blank"
                          >
                            <span>View TX</span>{" "}
                            <img src={ArrowRightImg} alt="" />
                          </Link>
                        </li>
                      ))}
                  </ul>
                </OverlayScrollbarsComponent>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default RightLine;
