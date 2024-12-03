import React, { Fragment, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import CloseButton from "../../CloseButton/CloseButton";
import { useDispatch, useSelector } from "react-redux";
import { useMetaMask } from "../../../utility/hooks/useMetaMask";
import { checkGamePrizes } from "../../../pages/Game/store";
import { formatAddress } from "../../../utility/Utils";
//images
import purpleNeonImg from "../../../assets/img/Purple-Neon.png";
import Loading from "../../Loading/Loading";
import avatar from "../../../assets/img/avatars/avatar6.png";

const WinningHistoryPopup = ({ prizeIndex, onClose }) => {
  const { search } = useLocation();
  const dispatch = useDispatch();
  const gameId = useSelector((state) => state.gameStore.gameId);

  const { wallet, signer, unSigner } = useMetaMask();
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    if (!unSigner.contract) return;
    if (wallet.accounts.length < 1) return;
    if (!gameId) return;
    
      dispatch(
        checkGamePrizes({
          dispatch,
          unSigner,
          gameId,
          user: wallet.accounts[0].toLowerCase(),
        })
      )
        .then((result) => {
          result.payload.map((item, index) => {
            if (
              index === prizeIndex &&
              item.winners &&
              item.winners.length > 0
            ) {
              item.winners.forEach(async (winner) => {
                //TODO: kartlar bulunacak (api)
                // const arrayCard = hexToArry(
                //   await unSigner.contract.cards(Number(winner.cardIndex))
                // );
                setPlayers((oldArry) => [
                  ...oldArry,
                  {
                    avatar: "avatar6.png",
                    username: "username",
                    winnerAddress: winner,
                    prizeIndex,
                    cardIndex: null, //Number(winner.cardIndex),
                    arrayCard: [], //arrayCard,
                  },
                ]);
              });
            }
          });
        })
        .catch((error) => console.log(error));
    
  }, [unSigner.contract, wallet.accounts]);

  return (
    <div className="popup-wrapper always-wrapper">
      {!players.length > 0 && <Loading text="Waiting winners..." />}
      <CloseButton onClose={onClose} to={search} />
      <div className="in">
        <div className="text-top-area always-popup">Winning History</div>
        <div className="title-sub-box-o">
          winners of{" "}
          {(prizeIndex === 4 && "1st Jam") ||
            (prizeIndex === 3 && "2nd Jam") ||
            (prizeIndex === 2 && "3rd Jam") ||
            (prizeIndex === 1 && "4th Jam") ||
            (prizeIndex === 0 && "Jammy")}{" "}
          prize
        </div>
        <div className="card-bottom-area">
          <div className="card-container">
            <Fragment>
              {/* TODO: cardindexi ve cssi ayarlanacak */}
              {players.length > 0 &&
                players.map((player, index) => (
                  <div className="col-3 " key={index}>
                    {/* TODO : player name düzeltilecek */}
                    <Link
                      to={`${process.env.REACT_APP_NETWORKURL}address/${player.winnerAddress}`}
                      target="blank"
                    >
                      <div
                        className="position-relative d-inline-flex align-items-center justify-content-center gap-3 z-index-100"
                        style={{
                          fontSize: "calc(2px + 0.8vw + 0.4vh)",
                        }}
                        title={formatAddress(player.winnerAddress)}
                      >
                        <img
                          style={{
                            width: "10%",
                            border: "2px solid #ddd",
                            borderRadius: "50%",
                          }}
                          //TODO: avatar ayarlanacak
                          // src={`${process.env.REACT_APP_PHOTO_SERVICE}avatars/${player.avatar}`}
                          src={avatar}
                          alt="avatar"
                        />
                        {player.username}
                      </div>
                    </Link>
                    <div className="item-card w-100" key={index}>
                      <span>{player.cardIndex}</span>

                      <div className="in" style={{ margin: "25px 0" }}>
                        {player.arrayCard.map((number, numberindex) => (
                          <div key={numberindex} className="item">
                            {number !== 0 ? number : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
            </Fragment>
          </div>
        </div>
        <img src={purpleNeonImg} className="popup-bg" alt="" />
      </div>
    </div>
  );
};

export default WinningHistoryPopup;
