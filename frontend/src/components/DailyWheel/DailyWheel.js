import React, { useEffect, useRef, useState } from "react";
import "./DailyWheel.css";
import { Link, useLocation } from "react-router-dom";
import { Contract, ethers } from "ethers";
import Roulette from "../../abis/Roulette.sol/Roulette.json";
import VRF from "../../abis/artifacts/@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol/VRFCoordinatorV2_5Mock.json";
import { Buffer } from "buffer";
import Token from "../../abis/Token.json";
import axios from "axios";
import Web3 from "web3";
//components
import CloseButton from "../CloseButton/CloseButton";
//images
import BgWheelImg from "../../assets/img/wheel/bgWheel.png";
import BackWheelImg from "../../assets/img/wheel/backWheel.png";
import WheelImg from "../../assets/img/wheel/wheel.png";
import ArrowImg from "../../assets/img/wheel/Arrow.png";
import SpinButtonImg from "../../assets/img/wheel/buttonBg.png";
import AdButtonImg from "../../assets/img/wheel/adButton.png";
import ClaimButtonImg from "../../assets/img/wheel/claim.png";
import CloseButtonImg from "../../assets/img/wheel/close.png";
import Prize0 from "../../assets/img/wheel/prize0.png";
import Prize1 from "../../assets/img/wheel/prize1.png";
import Prize2 from "../../assets/img/wheel/prize2.png";
import Prize3 from "../../assets/img/wheel/prize3.png";
import Prize4 from "../../assets/img/wheel/prize4.png";
import Prize5 from "../../assets/img/wheel/prize5.png";
import Prize6 from "../../assets/img/wheel/prize6.png";
import Prize7 from "../../assets/img/wheel/prize7.png";
import Warning from "../Warning/Warning";
import AdsOpen from "../AdsOpen/AdsOpen";

const prizeImgList = [
  Prize0,
  Prize1,
  Prize2,
  Prize3,
  Prize4,
  Prize5,
  Prize6,
  Prize7,
];

const messagesList = {
  70: "70-yakın zamanda oyun oynamamış reddet", //gamefark>1gün
  //"status":"error","countdown":0,"message":"70-yakın zamanda oyun oynamamış reddet"
  78: "78-yakın zamanda oyun oynamış bonus kazanabilir", //gamefark < 1gün
  //"status":"success",  "countdown":0,"message":"78-yakın zamanda oyun oynamış bonus kazanabilir"
  71: "70 oyun oynamamış bonus kazanamaz", //hiç oyun oynamamış
  //"status":"error", "countdown":timeDifferenceInSeconds, "message":"70 oyun oynamamış bonus kazanamaz"
  97: "97-Henüz reklam izlemediniz", //rfark>1gün
  //"status": "error",  "countdown":timeDifferenceInSeconds,  "message": "97-Henüz reklam izlemediniz"
  108: "108-son oyunun süresi henüz dolmadı. lütfen biraz daha bekleyin", //reklam izlenmiş karşılığı alınmış
  //"status": "error",  "countdown":timeDifferenceInSeconds,  "message": "108-son oyunun süresi henüz dolmadı. lütfen biraz daha bekleyin"
  116: "116-Reklam izlendiği için ekstra çevirme hakkı verilyior",
  //"status": "success",  "countdown":0,  "message": "116-Reklam izlendiği için ekstra çevirme hakkı verilyior"
  229: "229-son oyunun süresi henüz dolmadı. lütfen biraz daha bekleyin", //hiç reklam izlememiş
  //"status": "error", "postdate":pastDate, "countdown":timeDifferenceInSeconds, "message": "229-son oyunun süresi henüz dolmadı. lütfen biraz daha bekleyin"
  168: "168-yakın zamanda oyun oynamamış reddet",
  //"status":"error", "countdown":86400, "message":"168-yakın zamanda oyun oynamamış reddet"
  169: "168-yakın zamanda oyun oynamış bonus kazanabilir",
  // "status":"success",  "countdown":0, "message":"168-yakın zamanda oyun oynamış bonus kazanabilir"
  114: "114-oyun oynamamış bonus kazanamaz",
  // "status":"error", "countdown":0, "message":"114-oyun oynamamış bonus kazanamaz"
  98: "Code:98 Lütfen cüzdan bağlantınız kontrol edin.",
  // "status":"error", "countdown":86400, "message":"Code:98 Lütfen cüzdan bağlantınız kontrol edin."
};

const DailyWheel = (props) => {
  const { search } = useLocation();
  const finishSpinningTime = 5000;

  //çark ödül fotoya göre saat yönünün tersine yazılmalı
  const prizes = [
    0, //"Pass",
    4, //"Blue",
    2, //"Green",
    3, //"Yellow",
    1, //"Red",
    0, //"Pass",
    2, //"Green",
    1, //"Red",
  ];

  const [rotateWheelStyle, setRotateWheelStyle] = useState();
  const [rotateArrowStyle, setRotateArrowStyle] = useState();
  const [rotateBackRadialStyle, setRotateBackRadialStyle] = useState();
  const [wheelAreaStyle, setWheelAreaStyle] = useState();
  const [prizeArea, setPrizeArea] = useState(false);
  const [rotateWheelAnimKeys, setRotateWheelAnimKeys] = useState("");

  const arrow = useRef();
  const wheelArea = useRef();

  const [prizeNumber, setPrizeNumber] = useState();
  const [isSpin, setisSpin] = useState(false);
  const [isSpinning, setisSpinning] = useState(false);
  const [spinstatus, setSpinstatus] = useState("");
  const [claimDailyStatus, setClaimDailyStatus] = useState(true);
  const [contract, setContract] = useState(null);
  const [vrf, setVrf] = useState(null);
  const [isOnBehalfOf, setisOnBehalfOf] = useState([]);
  const [warning, setWarning] = useState("");
  const [warnstatus, setWarnstatus] = useState(false);
  const [addwarning, setAddwarning] = useState("");
  const [addwarnstatus, setAddwarnstatus] = useState("");
  const [addwarnopen, setAddwaropen] = useState(false);
  const [ads, setAds] = useState(false);
  const [addtime, setAddtime] = useState(30);

  //çarkın dönmeye başlaması
  const onStart = () => {
    if (isSpin) {
      setisSpinning(true);
      contractFunc();
      setRotateWheelStyle({
        animation: "500ms linear infinite forwards radialAnimation",
      });
      setRotateBackRadialStyle({
        animation: "2s linear infinite forwards radialAnimation",
      });

      setRotateArrowStyle({
        animation: "500ms linear infinite arrowAnimation",
      });
      setisSpin(false);
    }
  };

  //toplam spin zamanından sonra çalışacak bitiş eventi
  const onFinished = () => {
    setisSpinning(false);
    setRotateBackRadialStyle({
      animation: `30000ms linear infinite forwards radialAnimation`,
    });
    setWheelAreaStyle({
      transitionDuration: "1s",
      transform: "scale(0)",
      opacity: "0",
    });
    setTimeout(() => {
      setPrizeArea(true);
    }, 1000);
  };
  const onClaim = async () => {
    console.log("claim ediliyor");
    if (window.ethereum) {
      const exampleMessage = "Do you want to claim your daily bonus prize? ";
      try {
        const from = props.currentAccount;
        // const from = "0x0478d26dBf11089EfCBa13d119f51cDc5bB8a817";
        // For historical reasons, you must submit the message to sign in hex-encoded UTF-8.
        // This uses a Node.js-style buffer shim in the browser.
        // const msg = `0x${Buffer.from(exampleMessage, "utf8").toString("hex")}`;
        const sign = await window.ethereum.request({
          method: "personal_sign",
          params: [exampleMessage, from],
        });
        console.log("signddd");
        console.log(sign);
        if (sign.length > 0) {
          console.log("ödülü gönder");
          sendbonus();
          sendErcToken();
        } else {
          console.log("hata ödülü gönderme");
        }
      } catch (err) {
        console.error(err);
        console.log("catch hata ödülü gönderme");
      }
    }
    closeDailyWin();
    setisSpin(false);
  };
  async function sendErcToken() {
    console.log("sendERCTOKEN");
    let privateKey = Buffer.from(
      "5f13761f488b548071c707b8e9dd3de1e2a6d2334d2b4a3ab5e2b7567d4afd23",
      "hex"
    ); //kasa cüzdanı
    let amount = Number(prizes[prizeNumber]) / 10000; //TODO : Test->/10000 kalkacak //Number(props.rand) - 100;
    let toAddress = props.currentAccount;
    console.log("amount: ");
    console.log(amount);
    const web3 = new Web3(
      new Web3.providers.HttpProvider(
        `https://dark-greatest-pond.matic-testnet.discover.quiknode.pro/03535388d4be50c36965ddcce5fc0e5dfed9d381/`
      )
    );
    // Creating a signing account from a private key
    const signer = web3.eth.accounts.privateKeyToAccount(privateKey);
    console.log("signer: ");
    console.log(signer);
    web3.eth.accounts.wallet.add(signer);
    // Creating the transaction object
    const tx = {
      from: signer.address,
      to: toAddress,
      chainId: 80001,
      value: web3.utils.toWei(amount, "ether"),
    };
    console.log("tx: ");
    console.log(tx);
    // Assigning the right amount of gas
    tx.gas = await web3.utils.toHex(400000);
    console.log("txgas: ");
    console.log(tx.gas);
    // Sending the transaction to the network
    // ERROR! Transaction has been reverted by the EVM
    const receipt = await web3.eth
      .sendTransaction(tx)
      .once("transactionHash", (txhash) => {
        console.log(`Mining transaction ...`);
        console.log(`Transaction hash: ${txhash}`);
        // Link en sonda olmalı!
        setWarning(`Transaction hash: https://mumbai.polygonscan.com/tx/${txhash}`);
        setClaimDailyStatus(false);
        closeDailyWin();
        setWarnstatus(true);
      });
    console.log("receipt: ");
    console.log(receipt);
    // The transaction is now on chain!
    console.log(`Mined in block ${receipt.blockNumber}`);
  }
  function sendbonus() {
    console.log("Ödülünüz gönderiliyor...");
    let data = {
      user: props.currentAccount,
      prize: prizes[prizeNumber],
    };
    //TODO : api değişecek
    // axios
    //   .post("http://localhost:5000/api/general/claim",
    //    data,
    //    {
    //     headers: { "Content-Type": "application/json" },
    //   })
    //   .then((response) => {
    //     console.log("claim response.data");
    //     console.log(response.data);
    //   })
    //   .catch((error) => {
    //     console.log(error.data);
    //   });
    console.log("http://localhost:5000/api/general/claim");

    console.log("Ödülünüz başarı ile gönderildi...");
  }
  function closeDailyWin() {
    setPrizeArea(false);
    setWheelAreaStyle();
    setSpinstatus("");
    setisSpin(false);
    setRotateWheelStyle();
  }
  const checkPlayStatus = () => {
    let data = {
      user: props.currentAccount,
    };
    // TODO : api değişecek
    // axios
    //   .post(
    //     "http://localhost:5000/api/general/checkplaytime",
    //     data,

    //     { headers: { "Content-Type": "application/json" } }
    //   )
    //   .then((response) => {
    //     console.log("play time response.data");
    //     console.log(response.data);
    //     if (response.data.status === "success") {
    //       setWarning("");
    //       setSpinstatus("success");
    //       setisSpin(true);
    //     } else {
    //       setSpinstatus("error");
    //       if (response.data.message === messagesList[97]) {
    //         setWarning(
    //           "Yo, you sneaky lil' Jammy! Hold up, you can't just come runnin' for the bonus! " +
    //             "You are not watch an ad today! Watch and spin wheel!"
    //         );
    //       } else if (response.data.message === messagesList[108]) {
    //         setWarning(
    //           "Yo, you sneaky lil' Jammy! Hold up, you can't just come runnin' for the bonus! " +
    //             "You already claimed bonus spin wheel! Try again tomorrow!"
    //         );
    //       } else if (response.data.message === messagesList[229]) {
    //         setWarning(
    //           "Yo, you sneaky lil' Jammy! Hold up, you can't just come runnin' for the bonus! " +
    //             "You are not watch an ad! Watch and spin wheel!"
    //         );
    //       } else {
    //         setWarning("");
    //       }

    //       setWarnstatus(true);
    //     }
    //   })
    //   .catch((error) => {
    //     console.log(error.data);
    //   });

    // TODO : silinecek -> api success dondurdu
    setWarning("");
    setSpinstatus("success");
    setisSpin(true);

    // <TEST : aşağısı test
    // let responseDataStatus = "error"; // TEST : response data status
    // let responseMsg = messagesList[97];
    // if (responseDataStatus === "success") {
    //   setWarning("");
    //   setSpinstatus("success");
    //   setisSpin(true);
    // } else {
    //   setSpinstatus("error");
    //   if (responseMsg === messagesList[97]) {
    //     setWarning(
    //       "Yo, you sneaky lil' Jammy! Hold up, you can't just come runnin' for the bonus! " +
    //         "You are not watch an ad today! Watch and spin wheel!"
    //     );
    //   } else if (responseMsg === messagesList[108]) {
    //     setWarning(
    //       "Yo, you sneaky lil' Jammy! Hold up, you can't just come runnin' for the bonus! " +
    //         "You already claimed bonus spin wheel! Try again tomorrow!"
    //     );
    //   } else if (responseMsg === messagesList[229]) {
    //     setWarning(
    //       "Yo, you sneaky lil' Jammy! Hold up, you can't just come runnin' for the bonus! " +
    //         "You are not watch an ad! Watch and spin wheel!"
    //     );
    //   } else {
    //     setWarning("");
    //   }

    //   setWarnstatus(true);
    // }
    // />TEST
  };

  const checkNetwork = async () => {
    try {
      console.log("Checking network...");
      if (
        props.currentAccount &&
        window.ethereum.networkVersion !== process.env.REACT_APP_NETWORKVERSION
      ) {
        console.log(
          `Changing network to ${process.env.REACT_APP_NETWORKNAME}...`
        );
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: process.env.REACT_APP_NETWORKID }],
        });
        console.log(`Network changed to ${process.env.REACT_APP_NETWORKNAME}.`);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const contractFunc = async () => {
    let privateKey = Buffer.from(
      process.env.REACT_APP_WHEEL_PRIVATE_SENDER_KEY,
      "hex"
    );
    const onBehalfOf1 = props.currentAccount;
    try {
      const provider = new ethers.providers.JsonRpcProvider(
        process.env.REACT_APP_RPCURL
      );
      const signer = new ethers.Wallet(privateKey, provider);
      let rouletteContract = new Contract(
        process.env.REACT_APP_WHEEL_CONTRACT,
        Roulette.abi,
        signer
      );
      let vrfContract = new Contract(
        process.env.REACT_APP_VRF_CONTRACT_ADDRESS,
        VRF.abi,
        signer
      );
      if (!contract) setContract(rouletteContract);
      if (!vrf) setVrf(vrfContract);
      if (contract && props.currentAccount) {
        try {
          if (typeof ethereum !== "undefined") {
            const tx = await contract.requestRandom(onBehalfOf1); //onBehalfOf1, onBehalfOf2, onBehalfOf3 adresler adına requestid isteği yapılılabilir.
            const receipt = await tx.wait();
            console.log("receipt:", receipt);
            // RequestSent(uint256 indexed requestId, address indexed onBehalfOf) > tetiklenir.
          }
        } catch (error) {
          console.error(error);
        }

        // event RequestSent(uint256 indexed requestId, address indexed onBehalfOf) dinliyor
        contract.once("RequestSent", async (requestId, onBehalfOf) => {
          console.log("RequestSent event was emmited");
          console.log("requestId:", requestId.toString());
          console.log("onBehalfOf:", onBehalfOf.toString());

          const reqResult = await contract.randomRequests(requestId);
          console.log("reqResult:", Number(reqResult));
          // 1337 > request sonucu random sayı beklediğini gösterir (daha random sayı istenmediği anlamına gelir).
          // her requestid rasgele sayı gelene kadar default olarak önce 1337 ayarlanır.
          setisOnBehalfOf([
            onBehalfOf.toString(),
            Number(requestId),
            Number(reqResult),
          ]);

          if (Number(reqResult) === 1337) {
            const tx = await vrf.mockFulfillment(requestId, [653297]); // vfr ten rasgele sayı isteği sonucu 999, 155, 350, 653297 .. gibi sayılar geldiği simüle ediliyor.
            console.log("Gelecek olan rasgele sayı:", (653297 % 8) + 100); // vrf ten gelen 653297 bu sayı kontratta 101, 102, .. gibi sayılara çevriliyor.
            const receipt = await tx.wait();
            console.log("mockFulfillment:", receipt);
          }
        });

        // event RequestFulfilled(uint256 indexed requestId, uint256 result) dinliyor
        contract.once("RequestFulfilled", async (requestId, result) => {
          console.log("RequestFulfilled event was emmited");
          console.log("requestId:", requestId.toString());
          console.log("randomwords:", result.toString()); // sonuç olarak gelen random sayı budur.
          console.log(result.toString());
          setisOnBehalfOf([isOnBehalfOf[0], Number(requestId), Number(result)]);
          console.log(
            "randomwords:",
            Number(await contract.randomRequests(requestId))
          ); // randomRequests(requestId) 1337 den gelen random sayıya güncellenir.
          setPrizeNumber(
            Number(await contract.randomRequests(requestId)) - 100
          );
          console.log("prizenumber:", prizeNumber);

          setRotateArrowStyle({
            rotate: "0deg",
          });
          setRotateWheelAnimKeys(`@keyframes rotatePrizeAnimation{
            from {
              transform: translate(-50%, -50%) rotate(0deg)
            }
            to{
              transform: translate(-50%, -50%) rotate(${
                (Number(await contract.randomRequests(requestId)) - 100) *
                  (360 / prizes.length) +
                360 * 2
              }deg)
            }
          }`);
          setRotateWheelStyle({
            animation: "3000ms ease-out forwards rotatePrizeAnimation",
          });

          setTimeout(() => {
            onFinished();
          }, finishSpinningTime);
        });

        window.ethereum.once("accountsChanged", async (event_accounts) => {
          if (event_accounts[0] === undefined) {
            sessionStorage.clear(); // bağlantı kesilir veya mm kilitlenirse undefined döner
          } else {
            sessionStorage.setItem("accountMM", event_accounts[0]);
          }

          props.setCurrentAccount(event_accounts[0]);
          console.log("accountsChanged:", event_accounts[0]);
        });
      }
    } catch (error) {
      console.error(error);
    }
    // <TEST :
    // setTimeout(() => {
    //   setPrizeNumber(104 - 100);
    //   console.log("prizenumber:", prizeNumber);

    //   setRotateArrowStyle({
    //     rotate: "0deg",
    //   });
    //   setRotateWheelAnimKeys(`@keyframes rotatePrizeAnimation{
    //           from {
    //             transform: translate(-50%, -50%) rotate(0deg)
    //           }
    //           to{
    //             transform: translate(-50%, -50%) rotate(${
    //               (104 - 100) * (360 / prizes.length) + 360 * 2
    //             }deg)
    //           }
    //         }`);
    //   setRotateWheelStyle({
    //     animation: "3000ms ease-out forwards rotatePrizeAnimation",
    //   });
    // }, 4000);
    // setTimeout(() => {
    //   onFinished();
    // }, finishSpinningTime + 4000);
    // />TEST
  };
  function countDownFrom(seconds) {
    if (seconds < 0) {
      console.log("Cannot count down from a negative number.");
      return;
    }

    let timer = setInterval(() => {
      console.log(seconds);
      seconds--;
      setAddtime(seconds);
      if (seconds < 0) {
        clearInterval(timer);
        console.log("Close Ads");
        setAddtime(0);
        sendAdddata();
      }
    }, 1000);
  }
  const sendAdddata = () => {
    let data = {
      user: props.currentAccount,
    };
    console.log("send add data");
    // axios
    //   .post(
    //     "http://localhost:5000/api/general/userads",
    //     data,

    //     { headers: { "Content-Type": "application/json" } }
    //   )
    //   .then((response) => {
    //     console.log("banner response.data");
    //     console.log(response.data);

    //     setisSpin(true);
    //     window.location.reload();
    //   })
    //   .catch((error) => {
    //     console.log(error.data);
    //   });

    // TODO : Silinecek -> api response
    console.log("http://localhost:5000/api/general/userads");
    setisSpin(true);
    window.location.reload();
  };

  const getbanner = () => {
    console.log("banner çekiliyor");
    let data = {
      user: props.currentAccount,
    };
    // axios
    //   .post(
    //     "http://localhost:5000/api/general/ads",
    //     data,

    //     { headers: { "Content-Type": "application/json" } }
    //   )

    //   .then((response) => {
    //     console.log("banner response.data");
    //     console.log(response.data);

    //     if (response.data.bstatus === "error") {
    //     setWarning("An Error Get Banner");
    //   console.log("An Error Get Banner");
    //   setAds(false);
    //   setWarnstatus(true);
    //     } else {
    //   setWarning("");
    //   setAddwaropen(false);
    //   console.log(addwarnstatus);
    //   console.log("addwarning success");
    //   setAds(true);
    //   countDownFrom(30);
    //     }
    //   })
    //   .catch((error) => {
    //     console.log(error.data);
    //   });
    // TODO : silinecek -> api success döndürdü
    console.log("http://localhost:5000/api/general/ads");
    setWarning("");
    setAddwaropen(false);
    console.log(addwarnstatus);
    console.log("addwarning success");
    setAds(true);
    countDownFrom(30);

    // <TEST : aşağısı test
    // let responseBstatus = "success";
    // if (responseBstatus === "error") {
    //   setWarning("An Error Get Banner");
    //   console.log("An Error Get Banner");
    //   setAds(false);
    //   setWarnstatus(true);
    // } else {
    //   setWarning("");
    //   setAddwaropen(false);
    //   console.log(addwarnstatus);
    //   console.log("addwarning success");
    //   setAds(true);
    //   countDownFrom(30);
    // }
    // />TEST
  };
  //Reklam butonu
  const onAdClick = () => {
    let data = {
      user: props.currentAccount,
    };
    // axios
    //   .post(
    //     "http://localhost:5000/api/general/checkplaytime",
    //     data,

    //     { headers: { "Content-Type": "application/json" } }
    //   )
    //   .then((response) => {
    //     console.log("play time response.data");
    //     console.log(response.data);
    //     if (response.data.status === "success") {
    //       getbanner();
    //     } else {
    //       setSpinstatus("error");
    //       setWarnstatus(true);
    //     }
    //   })
    //   .catch((error) => {
    //     console.log(error.data);
    //   });
    //TODO : silinecek -> api success döndürdü
    console.log("http://localhost:5000/api/general/checkplaytime");
    getbanner();
    // <TEST : aşağısı test
    // let responseDataStatus = "success"; // TEST : response data status
    // let responseMsg = messagesList[97];
    // if (responseDataStatus === "success") {
    //   console.log("error");
    //   getbanner();
    // } else {
    //   console.log("errorrr");
    //   setSpinstatus("error");

    // setWarnstatus(true);
    // }
    // />TEST
  };
  const onAdClickWarn = () => {
    setWarning(
      "You already have a chance to try it, first click the spin button!"
    );
    setWarnstatus(true);
  };

  useEffect(() => {
    if (props.currentAccount) {
      checkPlayStatus();
    }
  }, [props.currentAccount]);
  useEffect(() => {
    if (isSpinning) {
      if (typeof window.ethereum !== "undefined") {
        checkNetwork();
        contractFunc();
      }
    }
  }, [contract]);

  return (
    <>
      {props.show ? (
        <>
          <div className="popup-daily-wheel popup">
            <style>{rotateWheelAnimKeys}</style>
            <CloseButton onClose={props.onClose} to={search} />
            
            <AdsOpen adsopen={ads} setAdsopen={setAds} countdown={addtime} />
            
            {warning.length > 0 ? (
              <Warning
                show={warnstatus}
                onClose={() => setWarnstatus(!warnstatus)}
                title="Warning"
                text={warning}
              />
            ) : null}
            <div className="in">
              <img
                src={BgWheelImg}
                style={rotateBackRadialStyle}
                className="w-100 wheel"
                alt=""
              />
              <div ref={wheelArea} style={wheelAreaStyle}>
                <img src={BackWheelImg} className="w-100" alt="" />
                <img
                  src={WheelImg}
                  style={rotateWheelStyle}
                  className="w-100 wheel"
                  alt=""
                />
                <img
                  src={ArrowImg}
                  style={rotateArrowStyle}
                  className="arrow"
                  alt=""
                  ref={arrow}
                />
                <div className="button-area">
                  {
                    <Link
                      onClick={spinstatus === "success" && onStart}
                      className="spin-button"
                      style={
                        isSpin
                          ? { opacity: "1" }
                          : { opacity: "0.5", pointerEvents: "none" }
                      }
                    >
                      <img src={SpinButtonImg} className="w-100" alt="" />
                      {isSpinning ? (
                        <span className="buttonText">SPIN</span>
                      ) : (
                        <span>SPIN</span>
                      )}
                    </Link>
                  }
                  {
                    <Link
                      onClick={
                        spinstatus !== "success" ? onAdClick : onAdClickWarn
                      }
                      className="ad-button"
                    >
                      <img src={AdButtonImg} className="w-100" alt="" />
                    </Link>
                  }
                </div>
              </div>
              {prizeArea && (
                <div className="popup-daily-win">
                  <div className="area">
                    <img
                      src={prizeImgList[prizeNumber]}
                      className="prizeImg"
                      alt=""
                    ></img>
                    <span>{prizes[prizeNumber]} {process.env.REACT_APP_NETWORKSYMBOL}</span>

                    {claimDailyStatus ? (
                      prizes[prizeNumber] !== 0 ? (
                        <Link onClick={onClaim} className="claim-button">
                          <img src={ClaimButtonImg} className="w-100" alt="" />
                        </Link>
                      ) : (
                        <Link onClick={closeDailyWin} className="claim-button">
                          <img src={CloseButtonImg} className="w-100" alt="" />
                        </Link>
                      )
                    ) : (
                      <Link onClick={closeDailyWin} className="claim-button">
                        <img src={CloseButtonImg} className="w-100" alt="" />
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
};

export default DailyWheel;
