import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import hre, { ethers } from "hardhat";
import { toASCII } from "punycode";

import { arrayToHex } from "../scripts/createBingoCards";
import { Jammy, VRFCoordinatorV2_5Mock } from "../types";

const {
  utils: { parseEther },
  provider,
} = ethers;

const timeTravel = async (seconds: number) => {
  await hre.network.provider.send("evm_increaseTime", [seconds]);
  await hre.network.provider.send("evm_mine");
};

enum GameStatus {
  INVALID,
  CREATED,
  READY,
  STARTED,
  ENDED,
  EXPIRED,
  CANCELLED,
}

enum RandomRequestType {
  INVALID,
  CARD_REVEAL,
  CARD_REDRAW,
  GAME_SEED,
}

const mockCards = [
  [
    [6, 18, 32, 49, 66],
    [4, 22, 43, 46, 63],
    [9, 16, 0, 52, 67],
    [14, 21, 35, 51, 70],
    [5, 20, 33, 57, 71],
  ],
  [
    [14, 18, 36, 50, 72],
    [12, 16, 39, 57, 61],
    [5, 24, 0, 53, 70],
    [10, 28, 38, 54, 63],
    [7, 20, 32, 46, 74],
  ],
  [
    [11, 19, 44, 53, 73],
    [15, 39, 40, 60, 73], // will be the winner of 1st row
    [5, 21, 0, 51, 64],
    [12, 24, 38, 50, 67],
    [3, 18, 36, 57, 61],
  ],
  [
    [14, 25, 32, 57, 70], // will be the winner of 4rd row
    [6, 19, 31, 41, 56], // will be the winner of 3rd row
    [3, 45, 0, 52, 72], // will be the winner of 2st row
    [15, 39, 40, 60, 73], // will be the winner of 1st row
    [1, 17, 21, 46, 61], // will be the winner of Jammy
  ],
  [
    [6, 28, 38, 60, 71],
    [12, 26, 37, 55, 66],
    [4, 16, 0, 57, 70],
    [10, 22, 45, 59, 64],
    [7, 29, 36, 54, 74],
  ],
  [
    [1, 21, 44, 56, 66],
    [13, 23, 42, 48, 69],
    [4, 29, 0, 59, 71],
    [15, 22, 37, 51, 61],
    [11, 19, 32, 49, 62],
  ],
];

const newCards = mockCards.map((c) => ethers.BigNumber.from(arrayToHex(c)));
console.log({ newCards });

describe("Jammy.sol", () => {
  let jammyContract: Jammy,
    vrfContract: VRFCoordinatorV2_5Mock,
    subId: BigNumber,
    deployer: SignerWithAddress,
    alice: SignerWithAddress,
    bob: SignerWithAddress,
    admin: SignerWithAddress,
    host: SignerWithAddress,
    team1Address: SignerWithAddress,
    team2Address: SignerWithAddress,
    dummies: Array<SignerWithAddress>;

  const _BASE_FEE = parseEther("0.1");
  const _GAS_PRICE_LINK = 1e9;
  const _WEIPERUNITLINK = 4471706886692984;

  before(async () => {
    [deployer, alice, bob, admin, host, team1Address, team2Address, ...dummies] = await ethers.getSigners();
  });

  beforeEach(async () => {
    let mockFactory = await ethers.getContractFactory("VRFCoordinatorV2_5Mock");
    vrfContract = (await mockFactory.deploy(_BASE_FEE, _GAS_PRICE_LINK, _WEIPERUNITLINK)) as VRFCoordinatorV2_5Mock;
    await vrfContract.deployed();
    let factory = await ethers.getContractFactory("Jammy");
    //SET SUBID
    const createSubResponse = await vrfContract.createSubscription();
    const createSubReciept = await createSubResponse.wait(1);
    subId = createSubReciept.events[0].args.subId;

    //CONTRACT
    jammyContract = (await factory.deploy(
      vrfContract.address,
      "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae", //keyhash
      subId,
      500000, //callBackGasLimit (100000)
      4000,
      6000,
      team1Address.address,
      team2Address.address,
    )) as Jammy;
    await jammyContract.deployed();

    //Add Fund & Consumer
    const fundResponse = await vrfContract.fundSubscription(subId, parseEther("5000"));
    await fundResponse.wait(1);

    const addConsumerResponse = await vrfContract.addConsumer(subId, jammyContract.address);
    await addConsumerResponse.wait(1);
  });

  describe("Protocol Setup", () => {
    it("Shares should be setup correctly", async () => {
      expect(await jammyContract.team1Shares()).to.eq(4000);
      expect(await jammyContract.team2Shares()).to.eq(6000);
      expect(await jammyContract.team1Address()).to.eq(team1Address.address);
      expect(await jammyContract.team2Address()).to.eq(team2Address.address);
    });
    
    it("Only deployer can setup admins", async () => {
      await expect(jammyContract.connect(alice).setAdmin(admin.address, true)).revertedWithCustomError(
        jammyContract,
        "Unauthorized",
      );

      expect(await jammyContract.admins(admin.address)).to.eq(false);

      await expect(jammyContract.connect(deployer).setAdmin(admin.address, true))
        .to.emit(jammyContract, "AdminSet")
        .withArgs(admin.address, true);

      expect(await jammyContract.admins(admin.address)).to.eq(true);

      await expect(await jammyContract.connect(deployer).setAdmin(admin.address, false))
        .to.emit(jammyContract, "AdminSet")
        .withArgs(admin.address, false);

      expect(await jammyContract.admins(admin.address)).to.eq(false);
    });

    it("Only admins can setup hosts", async () => {
      await expect(jammyContract.connect(deployer).setAdmin(admin.address, true))
        .to.emit(jammyContract, "AdminSet")
        .withArgs(admin.address, true);

      await expect(jammyContract.connect(deployer).setHost(host.address, true)).revertedWithCustomError(
        jammyContract,
        "Unauthorized",
      );

      expect(await jammyContract.hosts(host.address)).to.eq(false);

      await expect(jammyContract.connect(admin).setHost(host.address, true))
        .to.emit(jammyContract, "HostSet")
        .withArgs(host.address, true);

      expect(await jammyContract.hosts(host.address)).to.eq(true);

      await expect(jammyContract.connect(admin).setHost(host.address, false))
        .to.emit(jammyContract, "HostSet")
        .withArgs(host.address, false);

      expect(await jammyContract.hosts(host.address)).to.eq(false);
    });

    it("Admin can add and update cards", async () => {
      await expect(jammyContract.connect(deployer).setAdmin(admin.address, true))
        .to.emit(jammyContract, "AdminSet")
        .withArgs(admin.address, true);

      await expect(jammyContract.connect(deployer).batchAddCards(newCards)).revertedWithCustomError(
        jammyContract,
        "Unauthorized",
      );

      await expect(jammyContract.connect(admin).batchAddCards(newCards))
        .to.emit(jammyContract, "CardsAdded")
        .withArgs(6, 6);

      await expect(jammyContract.connect(admin).batchUpdateCards([1], newCards)).revertedWithCustomError(
        jammyContract,
        "InputValidation",
      );

      await expect(
        jammyContract.connect(admin).batchUpdateCards([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], newCards),
      ).revertedWithCustomError(jammyContract, "InputValidation");

      await expect(jammyContract.connect(admin).batchUpdateCards([0, 1], [newCards[4], newCards[5]]))
        .to.emit(jammyContract, "CardsUpdated")
        .withArgs(2);

      await expect(jammyContract.connect(admin).batchAddCards(newCards))
        .to.emit(jammyContract, "CardsAdded")
        .withArgs(6, 12);

      expect(await jammyContract.cards(0)).to.eq(newCards[4]);
      expect(await jammyContract.cards(2)).to.eq(newCards[2]);
      expect(await jammyContract.cards(4)).to.eq(newCards[4]);
      expect(await jammyContract.cards(7)).to.eq(newCards[1]);
      expect(await jammyContract.cards(9)).to.eq(newCards[3]);
    });
  });

  describe("Lobby Mechanics", () => {
    beforeEach(async () => {
      await expect(jammyContract.connect(deployer).setAdmin(admin.address, true))
        .to.emit(jammyContract, "AdminSet")
        .withArgs(admin.address, true);

      await expect(jammyContract.connect(admin).setHost(host.address, true))
        .to.emit(jammyContract, "HostSet")
        .withArgs(host.address, true);

      await expect(jammyContract.connect(admin).batchAddCards(newCards))
        .to.emit(jammyContract, "CardsAdded")
        .withArgs(6, 6);
    });

    it("Create a new Game", async () => {
      const blockNo = await provider.getBlockNumber();
      const timestamp = (await provider.getBlock(blockNo)).timestamp;

      const newGame = {
        startDate: timestamp + 60 * 60,
        maxCardsPerPlayer: 3,
        cardPrice: parseEther("2"),
        houseShare: 1000, // 10%
        prizes: [
          4000, // 40%
          2000, // 20%
          1500, // 15%
          1000, // 10%
          500, // 5%
        ],
      };

      expect(await jammyContract.gameStatus(0)).to.eq(GameStatus.INVALID);

      await expect(
        jammyContract
          .connect(alice)
          .createGame(
            newGame.startDate,
            newGame.maxCardsPerPlayer,
            newGame.cardPrice,
            newGame.houseShare,
            newGame.prizes,
          ),
      ).revertedWithCustomError(jammyContract, "Unauthorized");

      // Wrong max card amount
      await expect(
        jammyContract
          .connect(host)
          .createGame(newGame.startDate, 0, newGame.cardPrice, newGame.houseShare, newGame.prizes),
      ).revertedWithCustomError(jammyContract, "InputValidation");

      // Wrong timestamp
      await expect(
        jammyContract
          .connect(host)
          .createGame(timestamp, newGame.maxCardsPerPlayer, newGame.cardPrice, newGame.houseShare, newGame.prizes),
      ).revertedWithCustomError(jammyContract, "InputValidation");

      // Wrong shares sum
      await expect(
        jammyContract
          .connect(host)
          .createGame(newGame.startDate, newGame.maxCardsPerPlayer, newGame.cardPrice, newGame.houseShare, [
            newGame.prizes[0],
            newGame.prizes[1],
            newGame.prizes[2],
            newGame.prizes[3],
            600, // 6%
          ]),
      ).revertedWithCustomError(jammyContract, "InputValidation");

      await expect(
        jammyContract
          .connect(host)
          .createGame(
            newGame.startDate,
            newGame.maxCardsPerPlayer,
            newGame.cardPrice,
            newGame.houseShare,
            newGame.prizes,
          ),
      )
        .to.emit(jammyContract, "GameCreated")
        .withArgs(host.address, 1);

      const gameInfo = await jammyContract.games(1);

      expect(gameInfo[0]).to.eq(host.address);
      expect(gameInfo[5]).to.eq(newGame.houseShare);
      expect(gameInfo[6]).to.eq(0); //no seed

      expect(await jammyContract.gameStatus(1)).to.eq(GameStatus.CREATED);

      expect(await jammyContract.numbers(1, 0)).to.eq(1);
      expect(await jammyContract.numbers(1, 74)).to.eq(75);

      const gameRule1 = await jammyContract.gamePrizes(1, 0);
      const gameRule2 = await jammyContract.gamePrizes(1, 1);
      const gameRule3 = await jammyContract.gamePrizes(1, 2);
      const gameRule4 = await jammyContract.gamePrizes(1, 3);
      const gameRule5 = await jammyContract.gamePrizes(1, 4);

      expect(gameRule1[0]).to.eq(4000);

      expect(gameRule2[0]).to.eq(2000);

      expect(gameRule3[0]).to.eq(1500);

      expect(gameRule4[0]).to.eq(1000);

      expect(gameRule5[0]).to.eq(500);

      // 30 mins later still not ready
      await timeTravel(60 * 30);
      expect(await jammyContract.gameStatus(1)).to.eq(GameStatus.CREATED);

      // 60 mins later it is ready to start
      await timeTravel(60 * 30);
      expect(await jammyContract.gameStatus(1)).to.eq(GameStatus.READY);

      // 60 mins after startDate it is still waiting to start
      await timeTravel(60 * 60);
      expect(await jammyContract.gameStatus(1)).to.eq(GameStatus.READY);

      // 120 mins after startDate it is expired
      await timeTravel(60 * 60);
      expect(await jammyContract.gameStatus(1)).to.eq(GameStatus.EXPIRED);
    });

    it("Cancel Game && Refund", async () => {
      const blockNo = await provider.getBlockNumber();
      const timestamp = (await provider.getBlock(blockNo)).timestamp;

      const newGame = {
        startDate: timestamp + 60 * 60,
        maxCardsPerPlayer: 3,
        cardPrice: parseEther("2"),
        houseShare: 1000, // 10%
        prizes: [
          5000, //50%
          2000, //20%
          2000, //20%
          0,
          0,
        ],
      };

      await expect(
        jammyContract
          .connect(host)
          .createGame(
            newGame.startDate,
            newGame.maxCardsPerPlayer,
            newGame.cardPrice,
            newGame.houseShare,
            newGame.prizes,
          ),
      )
        .to.emit(jammyContract, "GameCreated")
        .withArgs(host.address, 1);

      expect(await jammyContract.gameStatus(1)).to.eq(GameStatus.CREATED);

      await expect(jammyContract.connect(alice).joinGame(1, 2, { value: parseEther("4") }))
        .to.emit(jammyContract, "PlayerJoined")
        .withArgs(1, alice.address, 2);

      await expect(jammyContract.connect(bob).joinGame(1, 1, { value: parseEther("2") }))
        .to.emit(jammyContract, "PlayerJoined")
        .withArgs(1, bob.address, 1);

      await expect(jammyContract.connect(alice).cancelGame(1)).revertedWithCustomError(jammyContract, "Unauthorized");

      await expect(jammyContract.connect(alice).claimRefund(1)).revertedWithCustomError(
        jammyContract,
        "WrongGameStatus",
      );

      await expect(jammyContract.connect(alice).claimRefund(10)).revertedWithCustomError(
        jammyContract,
        "WrongGameStatus",
      );

      await expect(jammyContract.connect(host).cancelGame(1)).to.emit(jammyContract, "GameCancelled").withArgs(1);

      await expect(jammyContract.connect(dummies[0]).claimRefund(1)).revertedWithCustomError(
        jammyContract,
        "NothingToRefund",
      );

      await expect(await jammyContract.connect(alice).claimRefund(1)).to.changeEtherBalance(alice, parseEther("4"));
      await expect(await jammyContract.connect(bob).claimRefund(1)).to.changeEtherBalance(bob, parseEther("2"));

      await expect(jammyContract.connect(alice).claimRefund(1)).revertedWithCustomError(
        jammyContract,
        "AlreadyRefunded",
      );
    });

    it("Expired Game && Refund", async () => {
      const blockNo = await provider.getBlockNumber();
      const timestamp = (await provider.getBlock(blockNo)).timestamp;

      const newGame = {
        startDate: timestamp + 60 * 60,
        maxCardsPerPlayer: 3,
        cardPrice: parseEther("2"),
        houseShare: 1000, // 10%
        prizes: [
          5000, //50%
          2000, //20%
          2000, //20%
          0,
          0,
        ],
      };

      await expect(
        jammyContract
          .connect(host)
          .createGame(
            newGame.startDate,
            newGame.maxCardsPerPlayer,
            newGame.cardPrice,
            newGame.houseShare,
            newGame.prizes,
          ),
      )
        .to.emit(jammyContract, "GameCreated")
        .withArgs(host.address, 1);

      await expect(jammyContract.connect(alice).joinGame(1, 2, { value: parseEther("4") }))
        .to.emit(jammyContract, "PlayerJoined")
        .withArgs(1, alice.address, 2);

      await expect(jammyContract.connect(bob).joinGame(1, 1, { value: parseEther("2") }))
        .to.emit(jammyContract, "PlayerJoined")
        .withArgs(1, bob.address, 1);

      await expect(jammyContract.connect(dummies[0]).claimRefund(1)).revertedWithCustomError(
        jammyContract,
        "WrongGameStatus",
      );
      // Game expires after (1 + 2) 3 hours
      await timeTravel(180 * 60);
      expect(await jammyContract.gameStatus(1)).to.eq(GameStatus.EXPIRED);

      await expect(jammyContract.connect(dummies[0]).claimRefund(1)).revertedWithCustomError(
        jammyContract,
        "NothingToRefund",
      );

      await expect(await jammyContract.connect(alice).claimRefund(1)).to.changeEtherBalance(alice, parseEther("4"));
      await expect(await jammyContract.connect(bob).claimRefund(1)).to.changeEtherBalance(bob, parseEther("2"));

      await expect(jammyContract.connect(alice).claimRefund(1)).revertedWithCustomError(
        jammyContract,
        "AlreadyRefunded",
      );

      await expect(jammyContract.connect(bob).claimRefund(1)).revertedWithCustomError(jammyContract, "AlreadyRefunded");
    });

    it("Join a Game", async () => {
      const blockNo = await provider.getBlockNumber();
      const timestamp = (await provider.getBlock(blockNo)).timestamp;

      const newGame = {
        startDate: timestamp + 60 * 60,
        maxCardsPerPlayer: 3,
        cardPrice: parseEther("2"),
        houseShare: 1000, // 10%
        prizes: [
          5000, //50%
          2000, //20%
          2000, //20%
          0,
          0,
        ],
      };

      await expect(jammyContract.connect(alice).joinGame(1, 1)).revertedWithCustomError(
        jammyContract,
        "WrongGameStatus",
      );

      await expect(
        jammyContract
          .connect(host)
          .createGame(
            newGame.startDate,
            newGame.maxCardsPerPlayer,
            newGame.cardPrice,
            newGame.houseShare,
            newGame.prizes,
          ),
      )
        .to.emit(jammyContract, "GameCreated")
        .withArgs(host.address, 1);

      expect(await jammyContract.gameStatus(1)).to.eq(GameStatus.CREATED);

      // 30 mins to Game startDate
      await timeTravel(60 * 30);

      // 0 cards
      await expect(jammyContract.connect(alice).joinGame(1, 0)).revertedWithCustomError(
        jammyContract,
        "InputValidation",
      );

      // more than max cards
      await expect(jammyContract.connect(alice).joinGame(1, 10)).revertedWithCustomError(
        jammyContract,
        "InputValidation",
      );

      // no payment
      await expect(jammyContract.connect(alice).joinGame(1, 2)).revertedWithCustomError(jammyContract, "WrongPayment");

      // small payment
      await expect(jammyContract.connect(alice).joinGame(1, 2, { value: parseEther("1") })).revertedWithCustomError(
        jammyContract,
        "WrongPayment",
      );

      // big payment
      await expect(jammyContract.connect(alice).joinGame(1, 2, { value: parseEther("10") })).revertedWithCustomError(
        jammyContract,
        "WrongPayment",
      );

      // correctly joins the game
      await expect(jammyContract.connect(alice).joinGame(1, 2, { value: parseEther("4") }))
        .to.emit(jammyContract, "PlayerJoined")
        .withArgs(1, alice.address, 2);

      // can not join twice
      await expect(jammyContract.connect(alice).joinGame(1, 1, { value: parseEther("2") })).revertedWithCustomError(
        jammyContract,
        "AlreadyJoined",
      );

      // someone else can still join
      await expect(jammyContract.connect(bob).joinGame(1, 1, { value: parseEther("2") }))
        .to.emit(jammyContract, "PlayerJoined")
        .withArgs(1, bob.address, 1);

      // Game state correctly saved
      const game = await jammyContract.games(1);
      expect(game.totalCardsSold).to.eq(3);
      expect(game.totalPlayerCount).to.eq(2);

      // can not join after sold out
      await expect(
        jammyContract.connect(dummies[1]).joinGame(1, 1, { value: parseEther("2") }),
      ).revertedWithCustomError(jammyContract, "CardsSoldOut");

      // Alices cards are in expecting random numbers state
      expect(await jammyContract.playerCards(1, alice.address, 0)).to.eq(1);
      expect(await jammyContract.playerCards(1, alice.address, 1)).to.eq(1);
      // there should not be a 3rd card
      await expect(jammyContract.playerCards(1, alice.address, 2)).revertedWithoutReason();
      // Bobs card  in expecting random numbers state
      expect(await jammyContract.playerCards(1, bob.address, 0)).to.eq(1);
      // there should not be a 2nd card
      await expect(jammyContract.playerCards(1, bob.address, 1)).revertedWithoutReason();

      // start date is passed, game is in ready state, no one can join
      await timeTravel(60 * 30);
      await expect(
        jammyContract.connect(dummies[0]).joinGame(1, 1, { value: parseEther("2") }),
      ).revertedWithCustomError(jammyContract, "WrongGameStatus");
    });
  });

  describe("Play Game", () => {
    beforeEach(async () => {
      await expect(jammyContract.connect(deployer).setAdmin(admin.address, true))
        .to.emit(jammyContract, "AdminSet")
        .withArgs(admin.address, true);

      await expect(jammyContract.connect(admin).setHost(host.address, true))
        .to.emit(jammyContract, "HostSet")
        .withArgs(host.address, true);

      await expect(jammyContract.connect(admin).batchAddCards(newCards))
        .to.emit(jammyContract, "CardsAdded")
        .withArgs(6, 6);

      const blockNo = await provider.getBlockNumber();
      const timestamp = (await provider.getBlock(blockNo)).timestamp;

      const newGame = {
        startDate: timestamp + 60 * 60,
        maxCardsPerPlayer: 3,
        cardPrice: parseEther("2"),
        houseShare: 1000, // 10%
        prizes: [
          4000, //40%
          2000, //20%
          1500, //15%
          1000, //10%
          500, //5%
        ],
      };

      await expect(
        jammyContract
          .connect(host)
          .createGame(
            newGame.startDate,
            newGame.maxCardsPerPlayer,
            newGame.cardPrice,
            newGame.houseShare,
            newGame.prizes,
          ),
      )
        .to.emit(jammyContract, "GameCreated")
        .withArgs(host.address, 1);
    });

    it("Requests and recieves cards", async () => {
      await expect(jammyContract.connect(alice).joinGame(1, 2, { value: parseEther("4") }))
        .to.emit(jammyContract, "PlayerJoined")
        .withArgs(1, alice.address, 2);

      await expect(jammyContract.connect(bob).joinGame(1, 1, { value: parseEther("2") }))
        .to.emit(jammyContract, "PlayerJoined")
        .withArgs(1, bob.address, 1);

      const reqAlice = await jammyContract.randomRequests(1);
      const reqBob = await jammyContract.randomRequests(2);

      expect(reqAlice.gameId).to.eq(1);
      expect(reqAlice.player).to.eq(alice.address);
      expect(reqAlice.requestType).to.eq(RandomRequestType.CARD_REVEAL);

      expect(reqBob.gameId).to.eq(1);
      expect(reqBob.player).to.eq(bob.address);
      expect(reqBob.requestType).to.eq(RandomRequestType.CARD_REVEAL);

      expect(await jammyContract.playerCards(1, alice.address, 0)).to.eq(1);
      expect(await jammyContract.playerCards(1, alice.address, 1)).to.eq(1);

      // 123123123123123 = 0x6FFAD60473B3
      // 987987987987987 = 0x38291E110FE13
      await vrfContract.fulfillRandomWordsWithOverride(1, jammyContract.address, [123123123123123, 987987987987987]);

      const reqAlice2 = await jammyContract.randomRequests(1);

      expect(reqAlice2.gameId).to.eq(1);
      expect(reqAlice2.player).to.eq(alice.address);
      expect(reqAlice.requestType).to.eq(RandomRequestType.CARD_REVEAL);

      //Alices cards are ready
      const expectedAliceCardNo1 = newCards[(123123123123123 & 0xffff) % 6]; // 3

      const expectedAliceCardNo2 = newCards[(987987987987987 & 0xffff) % 6]; // 3
      const expectedAliceCardNo2Correct = newCards[((987987987987987 >> 16) & 0xffff) % 6]; // 4

      expect(await jammyContract.playerCards(1, alice.address, 0)).to.eq(expectedAliceCardNo1);
      expect(await jammyContract.playerCards(1, alice.address, 1)).to.not.eq(expectedAliceCardNo2);
      expect(await jammyContract.playerCards(1, alice.address, 1)).to.eq(expectedAliceCardNo2Correct);

      // there is only 2 cards
      await expect(jammyContract.playerCards(1, alice.address, 2)).revertedWithoutReason();

      //Bobs card is not ready so seed = 1
      expect(await jammyContract.playerCards(1, bob.address, 0)).to.eq(1);

      await vrfContract.fulfillRandomWordsWithOverride(2, jammyContract.address, [123123123123123]);
      const expectedBobCardNo1 = newCards[((123123123123123 >> 16) & 0xffff) % 6]; // 2

      //Bobs card is now ready
      expect(await jammyContract.playerCards(1, bob.address, 0)).to.eq(expectedBobCardNo1);
    });

    it("Redraw cards", async () => {
      await expect(jammyContract.connect(alice).joinGame(1, 2, { value: parseEther("4") }))
        .to.emit(jammyContract, "PlayerJoined")
        .withArgs(1, alice.address, 2);

      await expect(jammyContract.connect(bob).joinGame(1, 1, { value: parseEther("2") }))
        .to.emit(jammyContract, "PlayerJoined")
        .withArgs(1, bob.address, 1);

      // 123123123123123 = 0x6FFAD60473B3
      // 987987987987987 = 0x38291E110FE13
      const seed1 = BigNumber.from("12312312413325235345312637182");
      const seed2 = BigNumber.from("21748123612873671831243214123");
      await vrfContract.fulfillRandomWordsWithOverride(1, jammyContract.address, [seed1, seed2]);

      //Alices cards are ready
      const expectedAliceCardNo1 = newCards[4]; // (seed1 & 0xffff) % 6
      const expectedAliceCardNo2 = newCards[3]; // (seed2 & 0xffff) % 6

      expect(await jammyContract.playerCards(1, alice.address, 0)).to.eq(expectedAliceCardNo1);
      expect(await jammyContract.playerCards(1, alice.address, 1)).to.eq(expectedAliceCardNo2);

      await expect(jammyContract.connect(bob).redrawCard(1, 0)).revertedWithCustomError(jammyContract, "CardNotReady");

      await vrfContract.fulfillRandomWordsWithOverride(2, jammyContract.address, [seed1]);
      const expectedBobCardNo1 = newCards[0]; //((seed1 >> 16) & 0xffff) % 6

      //Bobs card is now ready
      expect(await jammyContract.playerCards(1, bob.address, 0)).to.eq(expectedBobCardNo1);

      await expect(jammyContract.connect(host).redrawCard(1, 0)).revertedWithCustomError(jammyContract, "CardNotFound");

      await expect(jammyContract.connect(alice).redrawCard(1, 0)).revertedWithCustomError(
        jammyContract,
        "WrongPayment",
      );
      await expect(jammyContract.connect(alice).redrawCard(1, 0, { value: parseEther("2") })).revertedWithCustomError(
        jammyContract,
        "WrongPayment",
      );

      await expect(jammyContract.connect(alice).redrawCard(1, 1, { value: parseEther("1") }))
        .to.emit(jammyContract, "CardRedrawn")
        .withArgs(1, alice.address, 1);

      const reqAlice = await jammyContract.randomRequests(3);
      expect(reqAlice.player).to.eq(alice.address);
      expect(reqAlice.requestType).to.eq(RandomRequestType.CARD_REDRAW);

      await expect(jammyContract.connect(alice).redrawCard(1, 1, { value: parseEther("1") })).revertedWithCustomError(
        jammyContract,
        "CardNotReady",
      );
      const seed3 = BigNumber.from("1231231213325235322343632110");

      await vrfContract.fulfillRandomWordsWithOverride(3, jammyContract.address, [seed3]);
      const newAliceCard = newCards[2]; // (seed3  & 0xffff) % 6 // first drawn card is available

      //Alices new card is now ready
      expect(await jammyContract.playerCards(1, alice.address, 1)).to.eq(newAliceCard);

      await expect(jammyContract.connect(alice).redrawCard(1, 1, { value: parseEther("1") }))
        .to.emit(jammyContract, "CardRedrawn")
        .withArgs(1, alice.address, 1);

      await vrfContract.fulfillRandomWordsWithOverride(4, jammyContract.address, [seed1]);
      // the card choosen at the first time
      const aliceCardNo2 = newCards[3]; // (a & 0xffff) % 6 first card is still  available

      //Alices new card is now ready
      expect(await jammyContract.playerCards(1, alice.address, 1)).to.eq(aliceCardNo2);

      await expect(jammyContract.connect(alice).redrawCard(1, 1, { value: parseEther("1") }))
        .to.emit(jammyContract, "CardRedrawn")
        .withArgs(1, alice.address, 1);

      const newSeed = BigNumber.from("12312312413325235345312637189");

      await vrfContract.fulfillRandomWordsWithOverride(5, jammyContract.address, [newSeed]);
      const aliceCardNo3 = newCards[5];

      expect(await jammyContract.playerCards(1, alice.address, 1)).to.eq(aliceCardNo3);

      await expect(jammyContract.connect(alice).withdraw(parseEther("1"))).revertedWithCustomError(
        jammyContract,
        "Unauthorized",
      );

      await expect(jammyContract.connect(deployer).withdraw(parseEther("4"))).revertedWithCustomError(
        jammyContract,
        "WrongAmount",
      );

      await expect(jammyContract.connect(deployer).withdraw(parseEther("3"))).to.changeEtherBalances(
        [jammyContract.address, team1Address, team2Address],
        [
          parseEther("3").mul("-1"), // ALL money  sent
          parseEther("3").div("10").mul("4"), // 40% of total pot
          parseEther("3").div("10").mul("6"), // 60% of total pot
        ],
      );

      await expect(jammyContract.connect(deployer).withdraw(parseEther("1"))).revertedWithCustomError(
        jammyContract,
        "WrongAmount",
      );
    });

    it("Reveals numbers correctly", async () => {
      await expect(jammyContract.connect(alice).joinGame(1, 2, { value: parseEther("4") }))
        .to.emit(jammyContract, "PlayerJoined")
        .withArgs(1, alice.address, 2);

      await expect(jammyContract.connect(bob).joinGame(1, 1, { value: parseEther("2") }))
        .to.emit(jammyContract, "PlayerJoined")
        .withArgs(1, bob.address, 1);
      await vrfContract.fulfillRandomWordsWithOverride(1, jammyContract.address, [123123123123123, 987987987987987]);
      await vrfContract.fulfillRandomWordsWithOverride(2, jammyContract.address, [123123123123123]);

      await timeTravel(60 * 60);

      await expect(jammyContract.connect(alice).startGame(1)).revertedWithCustomError(jammyContract, "Unauthorized");
      await expect(jammyContract.connect(alice).revealNumber(1)).revertedWithCustomError(jammyContract, "Unauthorized");
      await expect(jammyContract.connect(host).revealNumber(1)).revertedWithCustomError(
        jammyContract,
        "WrongGameStatus",
      );

      await expect(jammyContract.connect(host).startGame(1)).to.emit(jammyContract, "GameStarted").withArgs(1);
      await expect(jammyContract.connect(host).revealNumber(1)).revertedWithCustomError(jammyContract, "PendingSeed");

      await vrfContract.fulfillRandomWordsWithOverride(3, jammyContract.address, [888777999]);

      await expect(jammyContract.connect(host).revealNumber(1))
        .to.emit(jammyContract, "NumberRevealed")
        .withArgs(1, 39);
      expect(await jammyContract.numbers(1, 0)).to.eq(1);
      expect(await jammyContract.numbers(1, 37)).to.eq(38);
      expect(await jammyContract.numbers(1, 39)).to.eq(40);
      // because 39 is used and swapped with 75
      expect(await jammyContract.numbers(1, 38)).to.eq(75);
      await expect(jammyContract.numbers(1, 74)).to.revertedWithoutReason();

      await expect(jammyContract.connect(host).revealNumber(1))
        .to.emit(jammyContract, "NumberRevealed")
        .withArgs(1, 40);
      await expect(jammyContract.connect(host).revealNumber(1))
        .to.emit(jammyContract, "NumberRevealed")
        .withArgs(1, 60);
      await expect(jammyContract.connect(host).revealNumber(1))
        .to.emit(jammyContract, "NumberRevealed")
        .withArgs(1, 37);

      expect(await jammyContract.numbers(1, 70)).to.eq(71);
      await expect(jammyContract.numbers(1, 71)).to.revertedWithoutReason();
      // original array should not change
      expect(await jammyContract.availableNumbers(74)).to.eq(75);
    });

    it("Full game loop", async () => {
      await expect(jammyContract.connect(alice).joinGame(1, 2, { value: parseEther("4") }))
        .to.emit(jammyContract, "PlayerJoined")
        .withArgs(1, alice.address, 2);

      await expect(jammyContract.connect(bob).joinGame(1, 1, { value: parseEther("2") }))
        .to.emit(jammyContract, "PlayerJoined")
        .withArgs(1, bob.address, 1);
      await vrfContract.fulfillRandomWordsWithOverride(1, jammyContract.address, [123123123123123, 987987987987987]);
      await vrfContract.fulfillRandomWordsWithOverride(2, jammyContract.address, [123123123123123]);

      await timeTravel(60 * 60);

      // Game did not start
      await expect(jammyContract.connect(alice).winPrize(1, 0, 0)).to.be.revertedWithCustomError(
        jammyContract,
        "WrongGameStatus",
      );

      await expect(jammyContract.connect(host).startGame(1)).to.emit(jammyContract, "GameStarted").withArgs(1);

      await vrfContract.fulfillRandomWordsWithOverride(3, jammyContract.address, [888777999]);

      await expect(jammyContract.connect(host).revealNumber(1))
        .to.emit(jammyContract, "NumberRevealed")
        .withArgs(1, 39);

      await expect(jammyContract.connect(host).revealNumber(1))
        .to.emit(jammyContract, "NumberRevealed")
        .withArgs(1, 40);
      await expect(jammyContract.connect(host).revealNumber(1))
        .to.emit(jammyContract, "NumberRevealed")
        .withArgs(1, 60);
      await expect(jammyContract.connect(host).revealNumber(1))
        .to.emit(jammyContract, "NumberRevealed")
        .withArgs(1, 37);

      await expect(jammyContract.connect(host).revealNumber(1))
        .to.emit(jammyContract, "NumberRevealed")
        .withArgs(1, 15);

      await expect(jammyContract.connect(host).revealNumber(1))
        .to.emit(jammyContract, "NumberRevealed")
        .withArgs(1, 73);

      // Game does not exist
      await expect(jammyContract.connect(alice).winPrize(3, 1, 1)).to.be.revertedWithCustomError(
        jammyContract,
        "WrongGameStatus",
      );

      // Card does not exist
      await expect(jammyContract.connect(alice).winPrize(1, 0, 2)).to.be.revertedWithCustomError(
        jammyContract,
        "NoCardFound",
      );

      await expect(jammyContract.connect(alice).winPrize(1, 4, 0))
        .to.emit(jammyContract, "PrizeWon")
        .withArgs(1, 4, alice.address);

      await expect(jammyContract.connect(bob).winPrize(1, 4, 0))
        .to.emit(jammyContract, "PrizeWon")
        .withArgs(1, 4, bob.address);

      expect(await jammyContract.prizeWinners(1, 4, 0)).to.eq(alice.address);
      expect(await jammyContract.prizeWinners(1, 4, 1)).to.eq(bob.address);

      await expect(jammyContract.prizeWinners(1, 4, 2)).to.revertedWithoutReason();

      const gameInfo = await jammyContract.getGameInfo(1, alice.address, 4);
      expect(gameInfo.availableNumbersLength).to.eq(75);
      expect(gameInfo.gamePrizesLength).to.eq(5);
      expect(gameInfo.prizeWinnersLength).to.eq(2);
      expect(gameInfo.numbersLength).to.eq(69);
      expect(gameInfo.cardsLength).to.eq(6);
      expect(gameInfo.playerCardsLength).to.eq(2);

      await expect(jammyContract.connect(host).revealNumber(1))
        .to.emit(jammyContract, "NumberRevealed")
        .withArgs(1, 52);

      await expect(jammyContract.connect(alice).winPrize(1, 4, 0)).to.be.revertedWithCustomError(
        jammyContract,
        "PrizeAlreadyWon",
      );

      await expect(jammyContract.connect(host).revealNumber(1))
        .to.emit(jammyContract, "NumberRevealed")
        .withArgs(1, 45);

      await expect(jammyContract.connect(host).revealNumber(1))
        .to.emit(jammyContract, "NumberRevealed")
        .withArgs(1, 72);
      await expect(jammyContract.connect(host).revealNumber(1))
        .to.emit(jammyContract, "NumberRevealed")
        .withArgs(1, 31);
      await expect(jammyContract.connect(host).revealNumber(1))
        .to.emit(jammyContract, "NumberRevealed")
        .withArgs(1, 41);
      await expect(jammyContract.connect(host).revealNumber(1))
        .to.emit(jammyContract, "NumberRevealed")
        .withArgs(1, 56);
      await expect(jammyContract.connect(host).revealNumber(1)).to.emit(jammyContract, "NumberRevealed").withArgs(1, 3);

      await expect(jammyContract.connect(alice).winPrize(1, 3, 0))
        .to.emit(jammyContract, "PrizeWon")
        .withArgs(1, 3, alice.address);

      await expect(jammyContract.connect(alice).winPrize(1, 3, 0)).to.be.revertedWithCustomError(
        jammyContract,
        "AlreadyInWinnersList",
      );

      // Same address with two cards can not win same prize
      await expect(jammyContract.connect(alice).winPrize(1, 3, 1)).to.be.revertedWithCustomError(
        jammyContract,
        "AlreadyInWinnersList",
      );

      await expect(jammyContract.connect(bob).winPrize(1, 3, 0)).to.be.revertedWithCustomError(
        jammyContract,
        "CardDoesNotWin",
      );

      await expect(jammyContract.connect(host).revealNumber(1))
        .to.emit(jammyContract, "NumberRevealed")
        .withArgs(1, 32);

      expect(await jammyContract.prizeWinners(1, 3, 0)).to.eq(alice.address);

      await expect(jammyContract.connect(bob).winPrize(1, 3, 0)).to.be.revertedWithCustomError(
        jammyContract,
        "PrizeAlreadyWon",
      );

      await expect(jammyContract.connect(host).revealNumber(1))
        .to.emit(jammyContract, "NumberRevealed")
        .withArgs(1, 58);
      await expect(jammyContract.connect(host).revealNumber(1)).to.emit(jammyContract, "NumberRevealed").withArgs(1, 1);
      await expect(jammyContract.connect(host).revealNumber(1))
        .to.emit(jammyContract, "NumberRevealed")
        .withArgs(1, 38);
      await expect(jammyContract.connect(host).revealNumber(1))
        .to.emit(jammyContract, "NumberRevealed")
        .withArgs(1, 46);
      await expect(jammyContract.connect(host).revealNumber(1))
        .to.emit(jammyContract, "NumberRevealed")
        .withArgs(1, 43);
      await expect(jammyContract.connect(host).revealNumber(1))
        .to.emit(jammyContract, "NumberRevealed")
        .withArgs(1, 14);
      await expect(jammyContract.connect(host).revealNumber(1)).to.emit(jammyContract, "NumberRevealed").withArgs(1, 6);
      await expect(jammyContract.connect(host).revealNumber(1))
        .to.emit(jammyContract, "NumberRevealed")
        .withArgs(1, 57);
      await expect(jammyContract.connect(host).revealNumber(1))
        .to.emit(jammyContract, "NumberRevealed")
        .withArgs(1, 19);
      await expect(jammyContract.connect(host).revealNumber(1))
        .to.emit(jammyContract, "NumberRevealed")
        .withArgs(1, 25);
      await expect(jammyContract.connect(host).revealNumber(1))
        .to.emit(jammyContract, "NumberRevealed")
        .withArgs(1, 17);
      await expect(jammyContract.connect(host).revealNumber(1))
        .to.emit(jammyContract, "NumberRevealed")
        .withArgs(1, 16);
      await expect(jammyContract.connect(host).revealNumber(1))
        .to.emit(jammyContract, "NumberRevealed")
        .withArgs(1, 61);
      await expect(jammyContract.connect(host).revealNumber(1))
        .to.emit(jammyContract, "NumberRevealed")
        .withArgs(1, 20);
      await expect(jammyContract.connect(host).revealNumber(1))
        .to.emit(jammyContract, "NumberRevealed")
        .withArgs(1, 70);
      await expect(jammyContract.connect(host).revealNumber(1))
        .to.emit(jammyContract, "NumberRevealed")
        .withArgs(1, 21);

      // All numbers are drawn all prizes can be won
      await expect(jammyContract.connect(alice).winPrize(1, 2, 0))
        .to.emit(jammyContract, "PrizeWon")
        .withArgs(1, 2, alice.address);
      await expect(jammyContract.connect(alice).winPrize(1, 1, 0))
        .to.emit(jammyContract, "PrizeWon")
        .withArgs(1, 1, alice.address);
      await expect(jammyContract.connect(alice).winPrize(1, 0, 0))
        .to.emit(jammyContract, "PrizeWon")
        .withArgs(1, 0, alice.address);

      await expect(jammyContract.connect(bob).claimPrize(1)).to.be.revertedWithCustomError(
        jammyContract,
        "WrongGameStatus",
      );

      await expect(jammyContract.connect(host).revealNumber(1)).to.emit(jammyContract, "GameEnds").withArgs(1);

      expect(await jammyContract.gameStatus(1)).to.eq(GameStatus.ENDED);

      await expect(jammyContract.connect(host).claimPrize(1)).to.changeEtherBalances(
        [jammyContract.address, team1Address, team2Address, alice.address, bob.address],
        [
          parseEther("6").mul("-1"), // ALL prizes are sent
          parseEther("6").div("100").mul("4"), // 4% of total pot
          parseEther("6").div("100").mul("6"), // 6% of total pot
          parseEther("6").div("1000").mul("875"), // 40% + 20% + 15%+ 10% + 2.5% = %87.5
          parseEther("6").div("1000").mul("25"), //  2.5%
        ],
      );
      await expect(jammyContract.connect(host).claimPrize(1)).to.be.revertedWithCustomError(
        jammyContract,
        "PrizeAlreadyClaimed",
      );
    });
  });
});
