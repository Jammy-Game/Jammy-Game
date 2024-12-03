import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import CloseButton from "../CloseButton/CloseButton";
import "./Quests.css";
//images
import questPopupImg from "../../assets/img/Jammy-Quests-Popup.png";
import twitterImg from "../../assets/img/twitter-icon.png";
import playImg from "../../assets/img/play-icon.png";

import AdsOpen from "../AdsOpen/AdsOpen";
import axios from "axios";
import Web3 from "web3";
import Token from "../../abis/Token.json";
import { Buffer } from "buffer";
const { ethereum } = window;

const Quests = (props) => {
  const { search } = useLocation();
  const [countdownQuest, setCountdownQuest] = useState(-1);
  const [currentads, setCurrentAds] = useState(null);
  const [adsopen, setAdsopen] = useState(false);

  const [quests, setQuests] = useState([]);
  const [claim, setClaim] = useState(false);
  const [claimdata, setClaimdata] = useState(false);

  const checkQuests = () => {
    let data = {
      user: props.currentAccount,
    };
    console.log("quests  kontrol ediliyor");
    //TODO : api değişecek
    // axios.get(
    //     "https://jammygametest.10secondlabs.com/api/quests/my",
    //     data
    // )
    //     .then(response => {
    //       console.log(response.data);
          // if(response.data.status==="error") {
          //   setQuests([{}]);
          //   setClaim(false)

          // }
          // else {
          //   setQuests(response.data[1]);
          //   console.log("response.data[1]");  console.log(response.data[0]);
          //  if(response.data[0].count>4)
          //  {
          //    setClaim(true)
          //  }
          //  else {
          //    setClaim(false)
          //  }
          //   setClaimdata(response.data[0]);
          // }
        // })
        // .catch(error => {
        //   console.log(error.data)
        // });

    // TODO : silinecek -> api success dondurdu
    let responseDataStatus = "success";
    let questsData = [
      {
        title: "quest1",
        rewards: "rewards1",
        step: 5,
        completedsteps: 10,
        type: "WATCH_ADS",
        status: "PENDING",
      },
      {
        title: "quest2",
        rewards: "rewards2",
        step: 6,
        completedsteps: 10,
        type: "WATCH_ADS",
        status: "PENDING",
      },
      {
        title: "quest3",
        rewards: "rewards3",
        step: 7,
        completedsteps: 10,
        type: "WATCH_ADS",
        status: "PENDING",
      },{
        title: "quest1",
        rewards: "rewards1",
        step: 5,
        completedsteps: 10,
        type: "WATCH_ADS",
        status: "PENDING",
      },
      {
        title: "quest2",
        rewards: "rewards2",
        step: 6,
        completedsteps: 10,
        type: "WATCH_ADS",
        status: "PENDING",
      }
    ];
    if (responseDataStatus === "error") {
      console.log(questsData);
      setQuests([{}]);
      setClaim(false);
    } else {
      setQuests(questsData);
      if (true) {
        setClaim(true);
      } else {
        setClaim(false);
      }
      setClaimdata(questsData);
    }
  };

  function Sendadsdata() {
    console.log("Reklam bilgileri gönderiliyor");
    //TODO : api değişecek
    // axios.post(
    //     "http://localhost:5000/api/general/questadsdata",
    //     currentads,
    //     { headers: { 'Content-Type': 'application/json' }}
    // )
    //     .then(response => {
    //       console.log("questadsdata response.data"); console.log(response.data);

    //     })
    //     .catch(error => {
    //       // console.log(error.data)
    //     });
    // TODO : silinecek -> api
    console.log("http://localhost:5000/api/general/questadsdata");
  }

  const Adsopen = (item) => {
    console.log("adsopen çalışıyor");
    setAdsopen(true);
    setCountdownQuest(15);
    setCurrentAds(item);
    //  if (countdown === 0) return setAdsopen(false);
  };

  const onClaim = async () => {
    console.log("claim ediliyor");

    if (window.ethereum) {
      const exampleMessage =
        `Do you want to claim your prize? ${claimdata.claimamount} ${process.env.REACT_APP_NETWORKSYMBOL}`;
      try {
        const from = "0x0478d26dBf11089EfCBa13d119f51cDc5bB8a817";
        // For historical reasons, you must submit the message to sign in hex-encoded UTF-8.
        // This uses a Node.js-style buffer shim in the browser.
        const msg = `0x${Buffer.from(exampleMessage, "utf8").toString("hex")}`;
        const sign = await ethereum.request({
          method: "personal_sign",
          params: [exampleMessage, from],
        });
        console.log("signddd");
        console.log(sign);
        if (sign.length > 0) {
          console.log("ödülü gönder");

          sendErcToken();
          questclaimdata();
        } else {
          console.log("hata ödülü gönderme");
        }
      } catch (err) {
        console.error(err);
        console.log("catch hata ödülü gönderme");
      }
    }
  };

  async function sendErcToken() {
    const Web3js = new Web3(
      new Web3.providers.HttpProvider(
        "" +
          "https://dark-greatest-pond.matic-testnet.discover.quiknode.pro/03535388d4be50c36965ddcce5fc0e5dfed9d381/"
      )
    );
    //quicknode adres güncellenecek
    //private key eklenecek
    let tokenAddress = "";

    let fromAddress = "0x0478d26dBf11089EfCBa13d119f51cDc5bB8a817";
    let contract = new Web3js.eth.Contract(Token.abi, tokenAddress, {
      from: fromAddress,
    });
    let privateKey = Buffer.from(
      "22db1c94167e0b614128fce5d11219d14a6cef046492f68701078aa2339fb718",
      "hex"
    );
    let amount = claimdata.claimamount;
    let toAddress = "0xed91025D2aEf4Ae970e078E1955B56165323cad8";

    let data = contract.methods.transfer(toAddress, amount).encodeABI();
    const web3 = new Web3(
      new Web3.providers.HttpProvider(
        `https://dark-greatest-pond.matic-testnet.discover.quiknode.pro/03535388d4be50c36965ddcce5fc0e5dfed9d381/`
      )
    );
    // Creating a signing account from a private key
    const signer = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(signer);
    // Creating the transaction object
    const tx = {
      from: signer.address,
      to: toAddress,
      chainId: 80001,
      value: web3.utils.toWei(amount, "ether"),
    };
    // Assigning the right amount of gas
    tx.gas = await web3.utils.toHex(400000);

    // Sending the transaction to the network
    const receipt = await web3.eth
      .sendTransaction(tx)
      .once("transactionHash", (txhash) => {
        //console.log(`Mining transaction ...`);          console.log(`Transaction hash: ${txhash}`);

        setTimeout(function () {
          window.location.reload();
        }, 3000);
      });
    // The transaction is now on chain!
    console.log(`Mined in block ${receipt.blockNumber}`);
  }

  function questclaimdata() {
    console.log("claimddata çalışşıyor");
    let data = {
      user: props.currentAccount,
      amount: claimdata.claimamount,
      small: claimdata.small,
      big: claimdata.big,
    };
    //TODO : Api değişecek
    // axios
    //   .post("http://localhost:5000/api/general/questclaimdata", data, {
    //     headers: { "Content-Type": "application/json" },
    //   })
    //   .then((response) => {
    //     console.log("claim response.data");
    //     console.log(response.data);
    //   })
    //   .catch((error) => {
    //     // console.log(error.data)
    //   });
    // TODO : silinecek -> api
    console.log("http://localhost:5000/api/general/questclaimdata");
    console.log(data);
  }

  useEffect(() => {
    if (props.currentAccount && quests) {
      console.log("checkquest");
      if (quests.length < 1) {
        checkQuests();
      }
    }
  }, [props.currentAccount]);
  useEffect(() => {
    if (countdownQuest > -1) {
      const timer = setInterval(() => {
        console.log(countdownQuest);
        setCountdownQuest((prevCountdown) => prevCountdown - 1);
        if (countdownQuest < 1) {
          setAdsopen(false);
          Sendadsdata();
        }
      }, 1000);
      // Komponent kaldırıldığında zamanlayıcıyı temizle
      return () => clearInterval(timer);
    }
  }, [countdownQuest]);
  return (
    <>
      {props.show ? (
        <div className="popup-quests popup">
          <CloseButton onClose={props.onClose} to={search} />

          <AdsOpen
            adsopen={adsopen}
            setAdsopen={setAdsopen}
            countdown={countdownQuest}
          />
          <div className="in">
            <img src={questPopupImg} className="w-100" alt="" />

            <div className="content-area">
              {quests.map((item, index) => (
                <div className="item-row" key={index}>
                  <div className="name">
                    <span>{item.title}</span>
                    <small>Reward:{item.rewards}</small>
                  </div>
                  <div className="right-area">
                    <div className="icon">
                      <img src={twitterImg} alt="" />
                    </div>
                    <div className="num">
                      {item.step}/
                      {item.completedsteps ? item.completedsteps : 0}
                    </div>
                    {item.type === "WATCH_ADS" ? (
                      <Link
                        onClick={() => Adsopen(item)}
                        href="#"
                        className="btn-area done"
                      >
                        {item.status === "PENDING" ? "WATCH" : item.status}
                      </Link>
                    ) : (
                      <Link href="#" className="btn-area done">
                        {item.status === "PENDING" ? "GO" : item.status}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {claim && (
              <div onClick={() => onClaim()} className={"btnd"}>
                <Link className="btn-area btn-done">CLAIM ALL</Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Quests;
