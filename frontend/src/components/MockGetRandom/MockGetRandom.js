import React, { useEffect } from "react";
import { useMetaMask } from "../../utility/hooks/useMetaMask";

const MockGetRandom = () => {
  const { unSigner, mockVRF } = useMetaMask();

  const mockFulfillment = async () => {
    if (sessionStorage.getItem("lastRequestSent")) {
      const requestId = JSON.parse(
        sessionStorage.getItem("lastRequestSent")
      ).requestId;
      const numberOfWords = JSON.parse(
        sessionStorage.getItem("lastRequestSent")
      ).numberOfWords;

      let randomWords = [];
      for (let i = 0; i < numberOfWords; i++) {
        const randomNum =
          Math.floor(Math.random() * (999999 - 111111)) + 111111;
        randomWords.push(randomNum);
      }

      // mockVRF
      //   .mockFulfillment(requestId, randomWords)
      //   .then(async (result) => {
      //     const receipt = await result.wait();
      //     console.log("receipt (mockFulfillment)", receipt);
      //     sessionStorage.removeItem("lastRequestSent");
      //   })
      //   .catch((err) => {
      //     console.error("mockFulfillment Error:", err.message);
      //   });
      mockVRF
        .fulfillRandomWords(requestId, process.env.REACT_APP_CONTRACT_ADDRESS)
        .then(async (result) => {
          const receipt = await result.wait();
          console.log("receipt (fulfillRandomWords)", receipt);
          sessionStorage.removeItem("lastRequestSent");
        })
        .catch((err) => {
          console.error("fulfillRandomWords Error:", err.message);
        });
    } else {
      console.log("Not found sessionStorage (lastRequestSent)");
    }
  };

  //Event Listeners
  useEffect(() => {
    if (!unSigner.contract) return;

    const listenerRequestSent = (requestId, numberOfWords) => {
      console.log("#RequestSent (mock) event was emmited");
      console.log(">>>", Number(requestId), Number(numberOfWords));
      sessionStorage.setItem(
        "lastRequestSent",
        JSON.stringify({
          requestId: Number(requestId),
          numberOfWords: Number(numberOfWords),
        })
      );
    };
    const listenerRequestFulfilled = (requestId, reqType, user, numberOfWords) => {
      console.log("#RequestFulfilled (mock) event was emmited");
      console.log(
        ">>>",
        Number(requestId),
        Number(reqType),
        user,
        Number(numberOfWords)
      );
      sessionStorage.setItem(
        "lastRequestFulfilled",
        JSON.stringify({
          requestId: Number(requestId),
          reqType: Number(reqType),
          user: user,
          numberOfWords: Number(numberOfWords),
        })
      );
    };

    unSigner.contract?.on("RequestSent", listenerRequestSent);
    unSigner.contract?.on("RequestFulfilled", listenerRequestFulfilled);
    return () => {
      unSigner.contract?.off("RequestSent", listenerRequestSent);
      unSigner.contract?.off("RequestFulfilled", listenerRequestFulfilled);
    };
  }, [unSigner.contract]);

  return Number(process.env.REACT_APP_NETWORKVERSION) === 31337 ? (
    <div
      style={{
        position: "absolute",
        top: "60px",
        left: "250px",
        border: "1px solid #ddd",
        cursor: "pointer",
        padding: "2px 4px",
        borderRadius: "4px",
      }}
      onClick={() => mockFulfillment()}
      title="Join, Start game ve Card change için random sayı iste!"
    >
      getRandom (MOCK)
    </div>
  ) : null;
};

export default MockGetRandom;
