// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "./IJammy.sol";

import { VRFConsumerBaseV2Plus } from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import { VRFV2PlusClient } from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import { VRFCoordinatorV2Interface } from "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";

/**
 * @title Jammy
 * @notice A decentralized Bingo
 */
contract Jammy is IJammy, VRFConsumerBaseV2Plus {
    // PRECISION_BASIS is used to calculated shares with fractionals
    uint256 public constant PRECISION_BASIS = 10**4;

    uint256 public constant EXPIRATION_DURATION = 2 hours;
    uint256 public constant PRIZE_COUNT = 5;
    uint256 public constant MAX_NUMBER = 75;

    uint8[] public availableNumbers;

    uint256 public immutable team1Shares;
    uint256 public immutable team2Shares;
    address public immutable team1Address;
    address public immutable team2Address;

    //--------- VRF --------//
    address public immutable vrfCoordinator;
    bytes32 public immutable keyhash;
    uint256 public immutable subscriptionId;
    uint32 public immutable callbackGasLimit;
    mapping(uint256 => RandomRequest) public randomRequests;
    //----------------------//

    // protocol deployer
    address public immutable deployer;
    // protocol admins
    mapping(address => bool) public admins;
    // protocol hosts
    mapping(address => bool) public hosts;

    // game id counter
    uint256 public gameCounter;

    // all games(gameId => Game)
    mapping(uint256 => Game) public games;

    // gamePrizes(gameId => GamePrize[])
    mapping(uint256 => GamePrize[]) public gamePrizes;

    // prizeWinners (gameId => prizeIndex => winner[])
    // same prize can be won by two different addresses in the same round
    mapping(uint256 => mapping(uint256 => address[])) public prizeWinners;

    // numbers available for a game (gameId => numbers[])
    mapping(uint256 => uint8[]) public numbers;

    // numbers drawn in a game (gameId => number => bool);
    mapping(uint256 => mapping(uint8 => bool)) public drawnNumbers;

    // possible cards in the game cardId => Card
    // cards are hold as uint256
    // every byte holds a single number on the card
    uint256[] public cards;

    // revealed cards by gameId
    mapping(uint256 => mapping(uint256 => bool)) public revealedCards;

    // cards of a player in a game(gameId => playerAddress => cards[])
    mapping(uint256 => mapping(address => uint256[])) public playerCards;

    // prizes claimed for gameId
    mapping(uint256 => bool) public prizesClaimed;

    // refunds processed for address
    mapping(uint256 => mapping(address => bool)) public refunds;

    uint256 public pendingFunds;

    /**
     * @dev Modifier to check if the caller is a host.
     * @param gameId The ID of the game.
     */
    modifier onlyHost(uint256 gameId) {
        // check if the caller a host
        if (!hosts[msg.sender]) {
            revert Unauthorized();
        }
        // if a positive gameId is passed, caller should be the host of that game
        if (gameId != 0 && games[gameId].host != msg.sender) {
            revert Unauthorized();
        }
        _;
    }

    /**
     * @dev Modifier to check if the game is in a specific status.
     * @param gameId The ID of the game.
     * @param status The required game status.
     */
    modifier inStatus(uint256 gameId, GameStatus status) {
        // check if the  game in a status
        if (gameStatus(gameId) != status) {
            revert WrongGameStatus();
        }
        _;
    }

    /**
     * @dev Constructor to initialize the Jammy contract.
     * @param _vrfCoordinator The address of the VRF coordinator.
     * @param _keyhash The key hash for the VRF.
     * @param _subscriptionId The subscription ID for the VRF.
     * @param _callbackGasLimit The gas limit for the VRF callback.
     * @param _team1Shares The share percentage for team 1.
     * @param _team2Shares The share percentage for team 2.
     * @param _team1Address The address for team 1.
     * @param _team2Address The address for team 2.
     */
    constructor(
        address _vrfCoordinator,
        bytes32 _keyhash,
        uint256 _subscriptionId,
        uint32 _callbackGasLimit,
        uint256 _team1Shares,
        uint256 _team2Shares,
        address _team1Address,
        address _team2Address
    ) VRFConsumerBaseV2Plus(_vrfCoordinator) {
        if (_team1Shares + _team2Shares != PRECISION_BASIS) {
            revert InputValidation();
        }
        team1Shares = _team1Shares;
        team2Shares = _team2Shares;
        team1Address = _team1Address;
        team2Address = _team2Address;
        deployer = msg.sender;
        vrfCoordinator = _vrfCoordinator;
        keyhash = _keyhash;
        subscriptionId = _subscriptionId;
        callbackGasLimit = _callbackGasLimit;

        for (uint8 i = 1; i <= MAX_NUMBER; ) {
            availableNumbers.push(i);
            unchecked {
                i++;
            }
        }
    }

    /**
     * @dev Sets an admin for the contract.
     * @param addr The address of the admin.
     * @param state The state to set for the admin (true for admin, false for not).
     */
    function setAdmin(address addr, bool state) external {
        // only deployer can call setAdmin
        if (msg.sender != deployer) {
            revert Unauthorized();
        }
        admins[addr] = state;
        emit AdminSet(addr, state);
    }

    /**
     * @dev Sets a host for the contract.
     * @param addr The address of the host.
     * @param state The state to set for the host (true for host, false for not).
     */
    function setHost(address addr, bool state) external {
        // only admins can call setHost
        if (!admins[msg.sender]) {
            revert Unauthorized();
        }
        hosts[addr] = state;
        emit HostSet(addr, state);
    }

    /**
     * @dev Adds multiple cards to the game.
     * @param newCards The array of new cards to add.
     */
    function batchAddCards(uint256[] calldata newCards) external {
        if (!admins[msg.sender]) {
            revert Unauthorized();
        }
        for (uint256 i; i < newCards.length; ) {
            cards.push(newCards[i]);
            unchecked {
                i++;
            }
        }
        emit CardsAdded(newCards.length, cards.length);
    }

    /**
     * @dev Updates multiple cards in the game.
     * @param indexes The indexes of the cards to update.
     * @param newCards The new card values.
     */
    function batchUpdateCards(uint256[] calldata indexes, uint256[] calldata newCards) external {
        if (!admins[msg.sender]) {
            revert Unauthorized();
        }
        if (indexes.length != newCards.length) {
            revert InputValidation();
        }
        uint256 k;
        for (uint256 i; i < indexes.length; ) {
            cards[indexes[i]] = newCards[k];
            unchecked {
                k++;
                i++;
            }
        }
        emit CardsUpdated(newCards.length);
    }

    /**
     * @dev Creates a new game.
     * @param startDate The start date of the game.
     * @param maxCardsPerPlayer The maximum number of cards per player.
     * @param cardPrice The price of each card in wei.
     * @param houseShare The share of the house.
     * @param prizeShares The shares of the prizes.
     */
    function createGame(
        uint256 startDate,
        uint256 maxCardsPerPlayer,
        uint256 cardPrice, // in wei
        uint256 houseShare,
        uint256[] calldata prizeShares // PRECISION_BASIS = 10_000
    ) external onlyHost(0) {
        if (startDate < block.timestamp) {
            revert InputValidation();
        }

        if (prizeShares.length != PRIZE_COUNT) {
            revert InputValidation();
        }

        if (maxCardsPerPlayer == 0) {
            revert InputValidation();
        }

        unchecked {
            gameCounter++;
        }

        uint256 totalShares = houseShare;

        for (uint256 i; i < PRIZE_COUNT; ) {
            totalShares += prizeShares[i];
            GamePrize memory gp;
            gp.share = prizeShares[i];
            gamePrizes[gameCounter].push(gp);
            unchecked {
                i++;
            }
        }

        if (totalShares != PRECISION_BASIS) {
            revert InputValidation();
        }

        Game memory game;
        game.host = msg.sender;
        game.startDate = startDate;
        game.maxCardsPerPlayer = maxCardsPerPlayer;
        game.cardPrice = cardPrice;
        game.houseShare = houseShare;

        games[gameCounter] = game;

        numbers[gameCounter] = availableNumbers;

        emit GameCreated(game.host, gameCounter);
    }

    /**
     * @dev Returns the status of a game.
     * @param gameId The ID of the game.
     * @return The status of the game.
     */
    function gameStatus(uint256 gameId) public view returns (GameStatus) {
        Game memory game = games[gameId];

        if (game.startDate == 0) {
            return GameStatus.INVALID;
        }

        if (gamePrizes[gameId][0].won) {
            return GameStatus.ENDED;
        }

        if (game.cancelled) {
            return GameStatus.CANCELLED;
        }

        if (block.timestamp < game.startDate) {
            return GameStatus.CREATED;
        }

        if (block.timestamp < game.startDate + EXPIRATION_DURATION) {
            if (game.seed > 0) {
                return GameStatus.STARTED;
            }
            return GameStatus.READY;
        }

        return GameStatus.EXPIRED;
    }

    /**
     * @dev Allows a player to join a game.
     * @param gameId The ID of the game.
     * @param cardsCount The number of cards the player wants to buy.
     */
    function joinGame(uint256 gameId, uint256 cardsCount) external payable inStatus(gameId, GameStatus.CREATED) {
        Game memory game = games[gameId];

        if (cardsCount > game.maxCardsPerPlayer || cardsCount == 0) {
            revert InputValidation();
        }

        if (msg.value != game.cardPrice * cardsCount) {
            revert WrongPayment();
        }

        if (playerCards[gameId][msg.sender].length > 0) {
            revert AlreadyJoined();
        }

        // Only half of the cards can be sold
        // This is a precaution to prevent too many re-rolls on duplicate cards
        if (game.totalCardsSold + cardsCount > cards.length / 2) {
            revert CardsSoldOut();
        }

        games[gameId].totalCardsSold += cardsCount;
        games[gameId].totalPlayerCount++;

        // push "1" to playerCards array indicating waiting for random cards
        for (uint256 i = 0; i < cardsCount; ) {
            playerCards[gameId][msg.sender].push(1);
            unchecked {
                i++;
            }
        }
        _requestRandomWords(uint32(cardsCount), gameId, msg.sender, RandomRequestType.CARD_REVEAL);

        emit PlayerJoined(gameId, msg.sender, cardsCount);
    }

    /**
     * @dev Allows a player to redraw a card.
     * @param gameId The ID of the game.
     * @param playerCardIndex The index of the card to redraw.
     */
    function redrawCard(uint256 gameId, uint256 playerCardIndex) external payable inStatus(gameId, GameStatus.CREATED) {
        if (playerCardIndex >= playerCards[gameId][msg.sender].length) {
            revert CardNotFound();
        }
        uint256 currentCard = playerCards[gameId][msg.sender][playerCardIndex];

        if (currentCard < 2) {
            revert CardNotReady();
        }

        revealedCards[gameId][currentCard] = false;

        Game memory game = games[gameId];

        if (msg.value != game.cardPrice / 2) {
            revert WrongPayment();
        }

        pendingFunds += msg.value;

        // set "1" to playerCard indicating waiting for random
        playerCards[gameId][msg.sender][playerCardIndex] = 1;

        _requestRandomWords(uint32(1), gameId, msg.sender, RandomRequestType.CARD_REDRAW);

        emit CardRedrawn(gameId, msg.sender, playerCardIndex);
    }

    /**
     * @dev Starts a game.
     * @param gameId The ID of the game.
     */
    function startGame(uint256 gameId) external onlyHost(gameId) inStatus(gameId, GameStatus.READY) {
        if (games[gameId].seed != 0) {
            revert GameAlreadyStarted();
        }
        _requestRandomWords(1, gameId, address(0), RandomRequestType.GAME_SEED);
        games[gameId].seed = 1; //indicates it is waiting for seed
        emit GameStarted(gameId);
    }

    /**
     * @dev Reveals a number in the game.
     * @param gameId The ID of the game.
     * @return revealedNumber The number that was revealed.
     */
    function revealNumber(uint256 gameId)
        external
        onlyHost(gameId)
        inStatus(gameId, GameStatus.STARTED)
        returns (uint8 revealedNumber)
    {
        uint256 seed = games[gameId].seed;
        if (seed < 2) {
            revert PendingSeed();
        }
        bool gameEnds = _checkForWonPrizes(gameId);

        if (gameEnds) {
            emit GameEnds(gameId);
            // GameEnds no number revealed
            return 0;
        }

        uint256 revealedNumberCount = MAX_NUMBER - numbers[gameId].length;
        uint256 index = uint256(keccak256(abi.encode(seed + revealedNumberCount))) % numbers[gameId].length;
        revealedNumber = numbers[gameId][index];

        assert(drawnNumbers[gameId][revealedNumber] == false);

        numbers[gameId][index] = numbers[gameId][numbers[gameId].length - 1];
        numbers[gameId].pop();

        drawnNumbers[gameId][revealedNumber] = true;

        emit NumberRevealed(gameId, revealedNumber);
    }

    /**
     * @dev Checks for won prizes in the game.
     * @param gameId The ID of the game.
     * @return gameEnds True if the game ends, false otherwise.
     */
    function _checkForWonPrizes(uint256 gameId) private returns (bool gameEnds) {
        for (uint256 i; i < PRIZE_COUNT; ) {
            if (!gamePrizes[gameId][i].won && prizeWinners[gameId][i].length > 0) {
                gamePrizes[gameId][i].won = true;
                // if Jammy is claimed, game ends
                if (i == 0) gameEnds = true;
            }
            unchecked {
                i++;
            }
        }
    }

    /**
     * @dev Allows a player to win a prize.
     * @param gameId The ID of the game.
     * @param prizeIndex The index of the prize.
     * @param playerCardIndex The index of the player's card.
     * Adds winner to the list of winners for a specific prize in a round
     * Limitation: a player can win a prize with just one card.
     * Double prize winning in a single round using two different cards is not possible
     */

    function winPrize(
        uint256 gameId,
        uint256 prizeIndex,
        uint256 playerCardIndex
    ) external inStatus(gameId, GameStatus.STARTED) {
        GamePrize memory prize = gamePrizes[gameId][prizeIndex];
        // if prize is already won, reverts
        if (prize.won) {
            revert PrizeAlreadyWon();
        }
        address[] memory winners = prizeWinners[gameId][prizeIndex];
        // if the caller is already in the winners list, reverts
        for (uint256 i; i < winners.length; ) {
            if (msg.sender == winners[i]) {
                revert AlreadyInWinnersList();
            }
            unchecked {
                i++;
            }
        }

        if (playerCardIndex >= playerCards[gameId][msg.sender].length) {
            revert NoCardFound();
        }

        bool res = _checkWin(gameId, playerCards[gameId][msg.sender][playerCardIndex], prizeIndex);
        if (!res) {
            revert CardDoesNotWin();
        }

        prizeWinners[gameId][prizeIndex].push(msg.sender);
        emit PrizeWon(gameId, prizeIndex, msg.sender);
    }

    /**
     * @dev Allows a player to claim a prize.
     * @param gameId The ID of the game.
     */
    function claimPrize(uint256 gameId) external inStatus(gameId, GameStatus.ENDED) {
        if (prizesClaimed[gameId]) {
            revert PrizeAlreadyClaimed();
        }
        Game memory game = games[gameId];
        uint256 totalPot = game.cardPrice * game.totalCardsSold;

        uint256 houseAmount = (totalPot * game.houseShare) / PRECISION_BASIS;
        uint256 team1Amount = (houseAmount * team1Shares) / PRECISION_BASIS;
        uint256 team2Amount = (houseAmount * team2Shares) / PRECISION_BASIS;

        // prizesClaimed set to true earlier to prevent reentrancy
        prizesClaimed[gameId] = true;

        // Team addresses are assumed to be safe
        // If transfer to teamAddress fails for some reason
        // whole claim fails
        _safeTransferNative(team1Address, team1Amount);
        _safeTransferNative(team2Address, team2Amount);

        for (uint256 i; i < PRIZE_COUNT; ) {
            address[] memory winners = prizeWinners[gameId][i];
            GamePrize memory gp = gamePrizes[gameId][i];

            uint256 prizeAmount = (totalPot * gp.share) / PRECISION_BASIS;
            uint256 prizePerWinner = prizeAmount / winners.length;

            for (uint256 k; k < winners.length; ) {
                // unsafe transfer is used to prevent griefing on claims
                // if call to winner address fails for any reason
                // failed winner does not get the prize but the rest will receive the funds
                // a manual transfer can be used to handle non-griefing errors
                (bool success, ) = winners[k].call{ value: prizePerWinner }(new bytes(0));
                if (!success) {
                    pendingFunds += prizePerWinner;
                }
                unchecked {
                    k++;
                }
            }
            unchecked {
                i++;
            }
        }
        emit PrizeCollected(gameId, totalPot);
    }

    /**
     * @dev Returns information about a game for a player.
     * @param gameId The ID of the game.
     * @param playerAddr The address of the player.
     * @param prizeIndex The index of the prize.
     * @return info Information about the game.
     */
    function getGameInfo(
        uint256 gameId,
        address playerAddr,
        uint256 prizeIndex
    ) public view returns (GetInfo memory info) {
        info.availableNumbersLength = availableNumbers.length;
        info.gamePrizesLength = gamePrizes[gameId].length;
        info.prizeWinnersLength = prizeWinners[gameId][prizeIndex].length;
        info.numbersLength = numbers[gameId].length;
        info.cardsLength = cards.length;
        info.playerCardsLength = playerCards[gameId][playerAddr].length;
    }

    /**
     * @dev Checks if a player's card wins a prize.
     * @param gameId The ID of the game.
     * @param playerCard The player's card.
     * @param prizeIndex The index of the prize.
     * @return True if the card wins, false otherwise.
     */
    function _checkWin(
        uint256 gameId,
        uint256 playerCard,
        uint256 prizeIndex
    ) private view returns (bool) {
        // If the card is not revealed for some reason
        if (playerCard == 1) {
            return false;
        }
        uint256 rowsToMatch = PRIZE_COUNT - prizeIndex;
        uint256 matchedRows;

        for (uint256 i; i < 5; ) {
            uint256 seen;
            for (uint256 k; k < 5; ) {
                uint8 num = uint8(playerCard & 0xFF);
                playerCard = playerCard >> 8;
                if (drawnNumbers[gameId][num] || num == 0) seen++;
                if (seen == 5) matchedRows++;
                unchecked {
                    k++;
                }
            }
            if (matchedRows >= rowsToMatch) return true;
            unchecked {
                i++;
            }
        }
        return false;
    }

    /**
     * @dev Requests random words from the VRF.
     * @param numberOfWords The number of random words to request.
     * @param gameId The ID of the game.
     * @param player The address of the player.
     * @param requestType The type of random request.
     * @return requestId The ID of the request.
     */
    function _requestRandomWords(
        uint32 numberOfWords,
        uint256 gameId,
        address player,
        RandomRequestType requestType
    ) private returns (uint256 requestId) {
        VRFV2PlusClient.RandomWordsRequest memory req = VRFV2PlusClient.RandomWordsRequest({
            keyHash: keyhash,
            subId: subscriptionId,
            requestConfirmations: 3,
            callbackGasLimit: callbackGasLimit,
            numWords: numberOfWords,
            extraArgs: VRFV2PlusClient._argsToBytes(
                VRFV2PlusClient.ExtraArgsV1({ nativePayment: false }) //use link
            )
        });
        requestId = s_vrfCoordinator.requestRandomWords(req);

        randomRequests[requestId] = RandomRequest({ gameId: gameId, player: player, requestType: requestType });
        emit RequestSent(requestId, numberOfWords);
    }

    /**
     * @dev Safely transfers native currency.
     * @param to The address to transfer to.
     * @param value The amount to transfer.
     */
    function _safeTransferNative(address to, uint256 value) private {
        (bool success, ) = to.call{ value: value }(new bytes(0));
        if (!success) {
            revert TransferFailed();
        }
    }

    /**
     * @dev Fulfills random words from the VRF.
     * @param _requestId The ID of the request.
     * @param _randomWords The random words received.
     */
    function fulfillRandomWords(uint256 _requestId, uint256[] calldata _randomWords) internal override {
        RandomRequest memory req = randomRequests[_requestId];
        if (req.requestType == RandomRequestType.INVALID) {
            revert ReqNotFound(_requestId);
        }
        if (req.requestType == RandomRequestType.CARD_REVEAL && playerCards[req.gameId][req.player][0] == 1) {
            for (uint256 i; i < _randomWords.length; ) {
                uint256 seed = _randomWords[i];
                uint256 card = _pickCardUsingSeed(req.gameId, seed);
                revealedCards[req.gameId][card] = true;
                playerCards[req.gameId][req.player][i] = card;
                unchecked {
                    i++;
                }
            }
        } else if (req.requestType == RandomRequestType.CARD_REDRAW) {
            uint256 cardIndex = type(uint256).max;
            for (uint256 i; i < playerCards[req.gameId][req.player].length; ) {
                if (playerCards[req.gameId][req.player][i] == 1) {
                    cardIndex = i;
                    break;
                }
                unchecked {
                    i++;
                }
            }
            if (cardIndex == type(uint256).max) {
                revert CardNotFound();
            }
            uint256 seed = _randomWords[0];
            uint256 card = _pickCardUsingSeed(req.gameId, seed);
            revealedCards[req.gameId][card] = true;
            playerCards[req.gameId][req.player][cardIndex] = card;
        } else if (req.requestType == RandomRequestType.GAME_SEED && games[req.gameId].seed == 1) {
            games[req.gameId].seed = _randomWords[0];
        } else {
            revert UnknownRequest();
        }

        emit RequestFulfilled(_requestId, req.requestType, req.player, _randomWords.length);
    }

    /**
     * @dev Picks a card using a seed.
     * @param gameId The ID of the game.
     * @param seed The seed to use.
     * @return card The card picked.
     */
    function _pickCardUsingSeed(uint256 gameId, uint256 seed) private view returns (uint256 card) {
        card = cards[(seed & 0xFFFF) % cards.length];
        while (revealedCards[gameId][card]) {
            seed = seed >> 16;
            card = cards[(seed & 0xFFFF) % cards.length];
        }
    }

    //--------- Cancel & Refunds --------//

    /**
     * @dev Cancels a game.
     * @param gameId The ID of the game.
     */
    function cancelGame(uint256 gameId) external onlyHost(gameId) inStatus(gameId, GameStatus.CREATED) {
        games[gameId].cancelled = true;
        emit GameCancelled(gameId);
    }

    /**
     * @dev Allows a player to claim a refund.
     * @param gameId The ID of the game.
     */
    function claimRefund(uint256 gameId) external {
        GameStatus gs = gameStatus(gameId);

        if (gs != GameStatus.CANCELLED && gs != GameStatus.EXPIRED) {
            revert WrongGameStatus();
        }

        uint256 amount = playerCards[gameId][msg.sender].length * games[gameId].cardPrice;
        if (amount == 0) {
            revert NothingToRefund();
        }
        if (refunds[gameId][msg.sender]) {
            revert AlreadyRefunded();
        }

        refunds[gameId][msg.sender] = true;

        emit RefundSent(gameId, msg.sender, amount);

        _safeTransferNative(msg.sender, amount);
    }

    /**
     * @dev Withdraws reroll payments.
     * @param amount The amount to withdraw.
     */
    function withdraw(uint256 amount) external {
        if (msg.sender != deployer) {
            revert Unauthorized();
        }

        if (amount > pendingFunds) {
            revert WrongAmount();
        }

        pendingFunds = 0;

        uint256 team1Amount = (amount * team1Shares) / PRECISION_BASIS;
        uint256 team2Amount = (amount * team2Shares) / PRECISION_BASIS;

        // Team addresses are assumed to be safe
        // If transfer to teamAddress fails for some reason
        // whole claim fails
        _safeTransferNative(team1Address, team1Amount);
        _safeTransferNative(team2Address, team2Amount);
    }
}
