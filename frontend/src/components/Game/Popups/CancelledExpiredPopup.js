import React, { useEffect, useState } from "react";
import { BigNumber, utils } from "ethers";
import "./CancelledExpiredPopup.css";
import CloseButton from "../../CloseButton/CloseButton";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { checkGameStatus } from "../../../pages/store";
import { allStorageClear } from "../../../pages/Game/store";
import { useMetaMask } from "../../../utility/hooks/useMetaMask";
//images
import warnPopupImg from "../../../assets/img/warnpopup.png";
import warnTitleImg from "../../../assets/img/warntitle.png";

const GameCancelledPopup = ({ isCancelExpired, onClose }) => {
  const { search } = useLocation();
  const dispatch = useDispatch();
  const gameId = useSelector((state) => state.gameStore.gameId);

  const { signer, unSigner, wallet } = useMetaMask();
  const [gameStatus, setGameStatus] = useState(0);
  const [resultText, setResultText] = useState("Get your payments back!");
  const [buttonText, setButtonText] = useState("Okay");
  const [buttonLoading, setButtonLoading] = useState(false);
  const [hash, setHash] = useState(null);
  const [viewTx, setViewTx] = useState(false);

  const claimRefund = async (refundGameId) => {
    setButtonLoading(true);
    setButtonText("Wait (Metamask)");
    try {
      const tx = await signer.contract.claimRefund(refundGameId);
      const receipt = await tx.wait();
      console.log("receipt-claimRefund:", receipt);
      if (receipt.events) {
        setHash(receipt.transactionHash);
        console.log(
          Number(
            utils.formatEther(BigNumber.from(receipt.events[0].args.amount))
          )
        );
        setResultText(
          `${Number(
            utils.formatEther(BigNumber.from(receipt.events[0].args.amount))
          )} ${process.env.REACT_APP_NETWORKSYMBOL} refunded.`
        );
        setViewTx(true);
        setButtonText("Close");
        setButtonLoading(false);
        dispatch(
          allStorageClear({ gameId, user: wallet.accounts[0].toLowerCase() })
        )
          .then((result) => {
            if (result.payload) {
              console.log("all storage clear");
            }
          })
          .catch((error) => console.log(error));
      }
    } catch (error) {
      console.log(error.reason);
      setButtonLoading(false);
      setButtonText("Okay");
      onClose();
      //TODO: NothingToRefund() gibi durumlar var
    }
  };

  useEffect(() => {
    if (!unSigner.contract) return;
    if (!gameId) return;
    
    dispatch(checkGameStatus({ gameId, unSigner }))
      .then((result) => {
        if (result.payload) {
          setGameStatus(result.payload);
        }
      })
      .catch((error) => console.log(error));
  }, [unSigner.contract, hash]);
  return (
    <>
      <div className="popup-warning popup">
        <CloseButton
          onClose={onClose}
          to={search}
          extraAction={{
            type: "claimRefund",
            action:
              (gameStatus === 6 || gameStatus === 5) && buttonText !== "Close"
                ? () => claimRefund(gameId)
                : undefined,
          }}
          extraStyle={buttonLoading && "btnloading"}
          redirect={buttonText === "Close" && "/"} //lobby yönlendirmesi
        />
        <div className="in">
          <img src={warnPopupImg} className="w-100" alt="" />
          <p className="title">
            <span>This game has been {isCancelExpired && isCancelExpired}</span>
            <img src={warnTitleImg} className="" alt="" />
          </p>
          <p className="text">{resultText}</p>
          {viewTx && (
            <Link
              className="txlink"
              to={`${process.env.REACT_APP_NETWORKURL}tx/${hash}`}
              target="blank"
            >
              View TX
            </Link>
          )}
        </div>
        <div className="btns-bottom">
          <Link
            onClick={
              (gameStatus === 6 || gameStatus === 5) && buttonText !== "Close"
                ? () => claimRefund(gameId)
                : () => undefined
            }
            to={buttonText === "Close" ? "/" : search}
            className={!buttonLoading ? "btn-sub" : "btn-sub btnloading"}
          >
            {buttonText}
          </Link>
        </div>
      </div>
    </>
  );
};

export default GameCancelledPopup;
