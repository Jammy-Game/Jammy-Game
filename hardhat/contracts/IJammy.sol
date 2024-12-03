// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IJammy {
    struct Game {
        address host;
        uint256 startDate;
        uint256 maxCardsPerPlayer;
        uint256 cardPrice; // wei
        uint256 totalCardsSold;
        uint256 houseShare; // PRECISION_BASIS = 10_000
        uint256 seed;
        bool cancelled;
        uint256 totalPlayerCount;
    }

    struct GetInfo {
        uint256 availableNumbersLength;
        uint256 gamePrizesLength;
        uint256 prizeWinnersLength;
        uint256 numbersLength;
        uint256 cardsLength;
        uint256 playerCardsLength;
    }

    struct GamePrize {
        uint256 share; // PRECISION_BASIS = 10_000
        bool won;
    }

    struct RandomRequest {
        uint256 gameId;
        address player;
        RandomRequestType requestType;
    }

    enum RandomRequestType {
        INVALID,
        CARD_REVEAL,
        CARD_REDRAW,
        GAME_SEED
    }

    enum GameStatus {
        INVALID,
        CREATED,
        READY,
        STARTED,
        ENDED,
        EXPIRED,
        CANCELLED
    }

    error Unauthorized();
    error InputValidation();
    error WrongGameStatus();
    error WrongPayment();
    error WrongAmount();
    error AlreadyJoined();
    error CardsSoldOut();
    error ReqNotFound(uint256 reqId);
    error CardNotFound();
    error CardNotReady();
    error AlreadyRefunded();
    error NothingToRefund();
    error TransferFailed();
    error GameAlreadyStarted();
    error UnknownRequest();
    error PendingSeed();
    error PrizeAlreadyWon();
    error AlreadyInWinnersList();
    error NoCardFound();
    error CardDoesNotWin();
    error PrizeAlreadyClaimed();

    // This Should Never Happen;
    error CatchFire();

    event AdminSet(address account, bool state);
    event HostSet(address account, bool state);
    event GameCreated(address indexed host, uint256 gameId);
    event PlayerJoined(uint256 gameId, address player, uint256 cardsCount);
    event CardRedrawn(uint256 gameId, address player, uint256 playerCardIndex);
    event RequestSent(uint256 requestId, uint32 numberOfWords);
    event RequestFulfilled(uint256 requestId, RandomRequestType indexed reqType, address player, uint256 numberOfWords);
    event GameCancelled(uint256 gameId);
    event RefundSent(uint256 indexed gameId, address indexed account, uint256 amount);
    event CardsUpdated(uint256 amount);
    event CardsAdded(uint256 amount, uint256 newCount);
    event GameStarted(uint256 gameId);
    event NumberRevealed(uint256 gameId, uint8 revealedNum);
    event PrizeWon(uint256 gameId, uint256 prizeIndex, address winner);
    event GameEnds(uint256 gameId);
    event PrizeCollected(uint256 gameId, uint256 totalAmount);
}
