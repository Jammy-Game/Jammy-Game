import React, { useEffect, useState } from "react";
import CloseButton from "../CloseButton/CloseButton";
import { Link, useLocation } from "react-router-dom";
import { useMetaMask } from "../../utility/hooks/useMetaMask";
//css
import "./MetaMaskError.css";
//images
import warnPopupImg from "../../assets/img/warnpopup.png";
import warnTitleImg from "../../assets/img/warntitle.png";

const MetaMaskError = () => {
  const { error, errorMessage, clearError } = useMetaMask();

  // console.log(error, errorMessage);
  const { search } = useLocation();
  const [btnLoading, setBtnLoading] = useState(false);
  const [openPopup, setOpenPopup] = useState(false); //true or false

  const changeNetwork = async () => {
    setBtnLoading(true);
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: process.env.REACT_APP_NETWORKID }],
      });
      setBtnLoading(false);
      clearError();
    } catch (error) {
      console.log(error);
      setBtnLoading(false);
    }
  };

  const addNetwork = async () => {
    setBtnLoading(true);
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: process.env.REACT_APP_NETWORKID,
            rpcUrls: [process.env.REACT_APP_RPCURL], //ekleme işleminden sonra https http olarak mm içinden manuel güncellenmesi gerekir.
            chainName: process.env.REACT_APP_NETWORKNAME,
            nativeCurrency: {
              name: process.env.REACT_APP_NETWORKNAME,
              symbol: process.env.REACT_APP_NETWORKSYMBOL, // 2-6 characters long
              decimals: 18,
            },
            blockExplorerUrls: [process.env.REACT_APP_BLOCKEXPLORERURL],
          },
        ],
      });
      setBtnLoading(false);
      clearError();
    } catch (error) {
      console.log(error);
      setBtnLoading(false);
    }
  };

  useEffect(() => {
    setOpenPopup(error);
    if (sessionStorage.getItem("userData") && errorMessage.toString() === "wallet_login") {
      setOpenPopup(false);
    }
  }, [sessionStorage.getItem("userData"), error]);

  return (
    openPopup && (
      <div className="popup-warning popup">
        <CloseButton onClose={() => setOpenPopup(false)} to={search} />
        <div className="in">
          <img src={warnPopupImg} className="w-100" alt="" />
          <p className="title">
            <span>Metamask Error</span>
            <img src={warnTitleImg} className="" alt="" />
          </p>
          <p className="text">
            {errorMessage.toString() === "wallet_switchEthereumChain" && (
              <span>Change {process.env.REACT_APP_NETWORKNAME} Network</span>
            )}
            {errorMessage.toString() === "wallet_addEthereumChain" && (
              <>
                <span>
                  Network Chain ID: {process.env.REACT_APP_NETWORKVERSION}
                </span>
                <span>Network Name: {process.env.REACT_APP_NETWORKNAME}</span>
                <span>
                  Network Symbol: {process.env.REACT_APP_NETWORKSYMBOL}
                </span>
                <span>Network RPC: {process.env.REACT_APP_RPCURL}</span>
              </>
            )}
            {errorMessage.toString() === "notMM" && (
              <>
                <span style={{ display: "block" }}>
                  Metamask is not installed!
                </span>
                <span>Please consider installing it.</span>
              </>
            )}
            {errorMessage.toString() === "wallet_login" && (
              <>
                <span>You cannot enter the game without logging in</span>
              </>
            )}
          </p>
        </div>
        <div className="btns-bottom">
          {errorMessage.toString() === "wallet_switchEthereumChain" && (
            <Link
              to={search}
              className={!btnLoading ? "btn-sub" : "btn-sub btnloading"}
              onClick={() => changeNetwork()}
            >
              Change Network
            </Link>
          )}
          {errorMessage.toString() === "wallet_addEthereumChain" && (
            <Link
              to={search}
              className={!btnLoading ? "btn-sub" : "btn-sub btnloading"}
              onClick={() => addNetwork()}
            >
              Add Network
            </Link>
          )}
          {errorMessage.toString() === "notMM" && (
            <Link
              to={"https://metamask.io/download.html"}
              target="_blank"
              className="btn-sub"
            >
              Download Metamask
            </Link>
          )}
          {errorMessage.toString() === "wallet_login" && (
            <Link
              to={search}
              className={!btnLoading ? "btn-sub" : "btn-sub btnloading"}
              // onClick={() => login()}
            >
              Please Login
            </Link>
          )}
        </div>
      </div>
    )
  );
};

export default MetaMaskError;