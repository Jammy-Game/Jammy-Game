import React from "react";
import Loading from "../../Loading/Loading";
import portalTop from "../../../assets/img/portal-box-top.png";

const LeftLine = ({ drawnNumbers, passiveNumbers, gameStatus }) => {
  return (
    <>
      <div className="item-numbers-left d-flex col-2 position-relative">
        {!drawnNumbers.length > 0 && gameStatus === 3 && (
          <Loading text="Waiting drawn Numbers" extraStyle={{height:'80vh'}} />
        )}
        <div className="navigation-number">
          <div className="draw-numbers-area">
            {drawnNumbers.length > 0 &&
              drawnNumbers
                .sort(function (a, b) {
                  return b.datetime - a.datetime;
                })
                .slice(0, 5) // dizinin ilk 5 elemenı
                .map((item, numberindex) =>
                  item.number > 0 && item.number <= 15 ? (
                    numberindex === 0 ? (
                      <div className="item activeItem yellow" key={numberindex}>
                        {item.number}
                      </div>
                    ) : (
                      <div className="item yellow" key={numberindex}>
                        {item.number}
                      </div>
                    )
                  ) : item.number > 15 && item.number <= 30 ? (
                    numberindex === 0 ? (
                      <div className="item activeItem red" key={numberindex}>
                        {item.number}
                      </div>
                    ) : (
                      <div className="item red" key={numberindex}>
                        {item.number}
                      </div>
                    )
                  ) : item.number > 30 && item.number <= 45 ? (
                    numberindex === 0 ? (
                      <div className="item activeItem purple" key={numberindex}>
                        {item.number}
                      </div>
                    ) : (
                      <div className="item purple" key={numberindex}>
                        {item.number}
                      </div>
                    )
                  ) : item.number > 45 && item.number <= 60 ? (
                    numberindex === 0 ? (
                      <div className="item activeItem green" key={numberindex}>
                        {item.number}
                      </div>
                    ) : (
                      <div className="item green" key={numberindex}>
                        {item.number}
                      </div>
                    )
                  ) : item.number > 60 && item.number <= 75 ? (
                    numberindex === 0 ? (
                      <div className="item activeItem blue" key={numberindex}>
                        {item.number}
                      </div>
                    ) : (
                      <div className="item blue" key={numberindex}>
                        {item.number}
                      </div>
                    )
                  ) : null
                )}
          </div>
          <img className="w-100" alt="" src={portalTop} />
        </div>
        <div className="numbers-container">
          <div className="list-item">
            {passiveNumbers.length > 0 &&
              passiveNumbers.map(
                (number, numberindex) =>
                  number > 0 &&
                  number <= 15 && (
                    <span
                      className={
                        drawnNumbers &&
                        drawnNumbers.find(
                          (drawn) => drawn.number === Number(number)
                        )
                          ? "yellow"
                          : "passive"
                      }
                      key={numberindex}
                    >
                      <small>{number}</small>
                    </span>
                  )
              )}
          </div>
          <div className="list-item">
            {passiveNumbers.length > 0 &&
              passiveNumbers.map(
                (number, numberindex) =>
                  number > 15 &&
                  number <= 30 && (
                    <span
                      className={
                        drawnNumbers &&
                        drawnNumbers.find(
                          (drawn) => drawn.number === Number(number)
                        )
                          ? "red"
                          : "passive"
                      }
                      key={numberindex}
                    >
                      <small>{number}</small>
                    </span>
                  )
              )}
          </div>
          <div className="list-item">
            {passiveNumbers.length > 0 &&
              passiveNumbers.map(
                (number, numberindex) =>
                  number > 30 &&
                  number <= 45 && (
                    <span
                      className={
                        drawnNumbers &&
                        drawnNumbers.find(
                          (drawn) => drawn.number === Number(number)
                        )
                          ? "purple"
                          : "passive"
                      }
                      key={numberindex}
                    >
                      <small>{number}</small>
                    </span>
                  )
              )}
          </div>
          <div className="list-item">
            {passiveNumbers.length > 0 &&
              passiveNumbers.map(
                (number, numberindex) =>
                  number > 45 &&
                  number <= 60 && (
                    <span
                      className={
                        drawnNumbers &&
                        drawnNumbers.find(
                          (drawn) => drawn.number === Number(number)
                        )
                          ? "green"
                          : "passive"
                      }
                      key={numberindex}
                    >
                      <small>{number}</small>
                    </span>
                  )
              )}
          </div>
          <div className="list-item">
            {passiveNumbers.length > 0 &&
              passiveNumbers.map(
                (number, numberindex) =>
                  number > 60 &&
                  number <= 75 && (
                    <span
                      className={
                        drawnNumbers &&
                        drawnNumbers.find(
                          (drawn) => drawn.number === Number(number)
                        )
                          ? "blue"
                          : "passive"
                      }
                      key={numberindex}
                    >
                      <small>{number}</small>
                    </span>
                  )
              )}
          </div>
        </div>
      </div>
    </>
  );
};

export default React.memo(LeftLine);
