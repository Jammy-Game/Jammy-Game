import React, { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { create5x5, arrayToHex } from "../../components/CreateCards";
import { useMetaMask } from "../../utility/hooks/useMetaMask";
import UserProfile from "../../components/UserProfile/UserProfile";

function Panel() {
  const { wallet, signer, unSigner } = useMetaMask();

  const [isAuth, setIsAuth] = useState(false);
  const [txId, setTxId] = useState(null);

  const adminAddress = useRef();
  const hostAddress = useRef();

  const mockCards = [];
  for (let i = 0; i < 192; i++) {
    mockCards.push(create5x5());
  }

  const setAdmin = async (newState) => {
    try {
      if (typeof window.ethereum !== "undefined") {
        if (adminAddress.current.value !== "") {
          const tx = await signer.contract.setAdmin(
            adminAddress.current.value,
            newState
          );
          const receipt = await tx.wait();
          setTxId(receipt.transactionHash);
          console.log("receipt:", receipt);
        } else {
          setTxId("admin addr null !!");
        }
      }
    } catch (error) {
      console.error(error.reason);
    }
  };

  const setHost = async (newState) => {
    try {
      if (typeof window.ethereum !== "undefined") {
        if (hostAddress.current.value !== "") {
          const tx = await signer.contract.setHost(
            hostAddress.current.value,
            newState
          );
          const receipt = await tx.wait();
          setTxId(receipt.transactionHash);
          console.log("receipt:", receipt);
        } else {
          setTxId("host addr null !!");
        }
      }
    } catch (error) {
      console.error(error.reason);
    }
  };

  const batchAddCards = async () => {
    try {
      if (typeof window.ethereum !== "undefined") {
        const newCards = mockCards.map((c) =>
          ethers.BigNumber.from(arrayToHex(c))
        );
        const tx = await signer.contract.batchAddCards(newCards);
        const receipt = await tx.wait();
        setTxId(receipt.transactionHash);
        console.log("receipt:", receipt);
      }
    } catch (error) {
      console.error(error.reason);
    }
  };

  const batchUpdateCards = async () => {
    try {
      if (typeof window.ethereum !== "undefined") {
        const newCards = mockCards.map((c) =>
          ethers.BigNumber.from(arrayToHex(c))
        );
        const tx = await signer.contract.batchUpdateCards(
          [0, 1],
          [newCards[4], newCards[5]]
        );
        const receipt = await tx.wait();
        setTxId(receipt.transactionHash);
        console.log("receipt:", receipt);
      }
    } catch (error) {
      console.error(error.reason);
    }
  };

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      try {
        if (wallet.accounts.length > 0 && signer) {
          if (
            wallet.accounts[0].toLowerCase() === signer.deployer.toLowerCase() || signer.isAdmin
          ) {
            setIsAuth(true);
          } else {
            setIsAuth(false);
            window.location.href = "/";
          }
        } else {
          console.log("else:", signer);
        }
      } catch (error) {
        console.error(error.reason);
      }
    }
  }, [signer, wallet.accounts]);

  //Event Listeners
  useEffect(() => {
    if (!unSigner.contract) return;

    const listenerAdminSet = (account, state) => {
      console.log("AdminSet event was emmited");
      console.log("account:", account.toString());
      console.log("state:", state.toString());
    };
    const listenerHostSet = (account, state) => {
      console.log("HostSet event was emmited");
      console.log("account:", account.toString());
      console.log("state:", state.toString());
    };
    const listenerCardsAdded = (amount, newCount) => {
      console.log("CardsAdded event was emmited");
      console.log("amount:", amount.toString());
      console.log("newCount:", newCount.toString());
      console.log("cards array:", mockCards);
    };
    const listenerCardsUpdated = (amount) => {
      console.log("CardsUpdated event was emmited");
      console.log("amount:", amount.toString());
    };

    unSigner.contract?.on("AdminSet", listenerAdminSet);
    unSigner.contract?.on("HostSet", listenerHostSet);
    unSigner.contract?.on("CardsAdded", listenerCardsAdded);
    unSigner.contract?.on("CardsUpdated", listenerCardsUpdated);
    return () => {
      unSigner.contract?.off("AdminSet", listenerAdminSet);
      unSigner.contract?.off("HostSet", listenerHostSet);
      unSigner.contract?.off("CardsAdded", listenerCardsAdded);
      unSigner.contract?.off("CardsUpdated", listenerCardsUpdated);
    };
  }, [unSigner.contract]);

  return (
    <div className="AppPanel" style={{ textAlign: "center" }}>
      <header
        style={{
          backgroundColor: "#444",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#000",
        }}
      >
        {!isAuth ? (
          <h2 style={{ color: "red", textAlign: "center" }}>No Auth!</h2>
        ) : (
          <>
            <div>
              <UserProfile />
            </div>
            <div>
              <h4>Protocol Setups</h4>
              <div
                style={{
                  border: "2px solid #fff",
                  padding: "10px",
                  margin: "4px",
                  borderRadius: "12px",
                }}
              >
                <p>
                  <input
                    type="text"
                    placeholder="new admin addr"
                    ref={adminAddress}
                    style={{ color: "black" }}
                  />
                  <button
                    onClick={() => setAdmin(true)}
                    style={{
                      color: "#369",
                      padding: "0 8px",
                      borderRadius: "6px",
                    }}
                  >
                    setAdmin (true)
                  </button>
                  <button
                    onClick={() => setAdmin(false)}
                    style={{
                      color: "#369",
                      padding: "0 8px",
                      borderRadius: "6px",
                    }}
                  >
                    setAdmin (false)
                  </button>
                </p>
                <p>
                  <input
                    type="text"
                    placeholder="new host addr"
                    ref={hostAddress}
                    style={{ color: "black" }}
                  />
                  <button
                    onClick={() => setHost(true)}
                    style={{
                      color: "#369",
                      padding: "0 8px",
                      borderRadius: "6px",
                    }}
                  >
                    setHost (true)
                  </button>
                  <button
                    onClick={() => setHost(false)}
                    style={{
                      color: "#369",
                      padding: "0 8px",
                      borderRadius: "6px",
                    }}
                  >
                    setHost (false)
                  </button>
                </p>
                <button
                  onClick={batchAddCards}
                  style={{
                    color: "#369",
                    padding: "0 8px",
                    borderRadius: "6px",
                  }}
                >
                  batchAddCards
                </button>
                <br />
                <button
                  onClick={batchUpdateCards}
                  style={{
                    color: "#369",
                    padding: "0 8px",
                    borderRadius: "6px",
                  }}
                >
                  batchUpdateCards
                </button>
                <br />
              </div>
            </div>
            <p
              style={{
                fontSize: "11pt",
                border: "2px solid #fff",
                borderRadius: "12px",
                padding: "6px 12px",
              }}
            >
              TX Hash: <span style={{ color: "#ddd" }}>{txId}</span>
            </p>
          </>
        )}
      </header>
    </div>
  );
}

export default Panel;
