import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { parseEther } from "ethers/lib/utils";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

import { VRFCoordinatorV2_5Mock } from "../../types";
import type { Jammy } from "../../types/Jammy";
import type { Jammy__factory } from "../../types/factories/Jammy__factory";

const deployParams = {
  goerli: [
    "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
    "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
    7096,
    500_000,
    2500,
    7500,
    "0xDD1DC3e4D8C1b5FA806567F98c968DFC9E51390A",
    "0xDD1DC3e4D8C1b5FA806567F98c968DFC9E51390A",
  ],
  "polygon-mumbai": [
    "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed",
    "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
    2722,
    500_000,
    2500,
    7500,
    "0xDD1DC3e4D8C1b5FA806567F98c968DFC9E51390A",
    "0xDD1DC3e4D8C1b5FA806567F98c968DFC9E51390A",
  ],
};

task("deploy:Jammy").setAction(async function (taskArguments: TaskArguments, { ethers, network }) {
  console.log(`Starting to deploy to ${network.name.toUpperCase()}`);
  const args = deployParams[network.name] as (string | number)[];

  const signers: SignerWithAddress[] = await ethers.getSigners();
  const JammyFactory: Jammy__factory = <Jammy__factory>await ethers.getContractFactory("Jammy");
  console.log(...args);
  const Jammy: Jammy = <Jammy>await JammyFactory.connect(signers[0]).deploy(...args);
  await Jammy.deployed();
  console.log("Jammy deployed to: ", Jammy.address);
  console.log(
    `Verify with:\n npx hardhat verify --network ${network.name} ${Jammy.address} ${args
      .toString()
      .replace(/,/g, " ")}`,
  );
});

task("deploy:JammyLocal").setAction(async function (taskArguments: TaskArguments, { ethers, network }) {
  console.log(`Starting to deploy to ${network.name.toUpperCase()}`);
  //VRF
  const _BASE_FEE = parseEther("0.1");
  const _GAS_PRICE_LINK = 1e9;
  const _WEIPERUNITLINK = 4471706886692984;

  const signers: SignerWithAddress[] = await ethers.getSigners();

  let mockFactory = await ethers.getContractFactory("VRFCoordinatorV2_5Mock");
  const vrfContract = (await mockFactory.deploy(_BASE_FEE, _GAS_PRICE_LINK, _WEIPERUNITLINK)) as VRFCoordinatorV2_5Mock;
  await vrfContract.deployed();
  console.log(`Mock VRF Contract is deployed to: ${vrfContract.address}`);
  console.log(`Call fulfillRandomWords() on mock VRF to send a random seed to Jammy Contract`);

  //SET SUBID
  const createSubResponse = await vrfContract.createSubscription();
  const createSubReciept = await createSubResponse.wait(1);
  const subId = createSubReciept.events[0].args.subId;

  let factory = await ethers.getContractFactory("Jammy");
  const JammyContract = (await factory.deploy(
    vrfContract.address,
    ethers.constants.HashZero,
    subId,
    500000, //callBackGasLimit (100000)
    4000,
    6000,
    signers[0].address,
    signers[1].address,
  )) as Jammy;
  await JammyContract.deployed();

  //Add Fund & Consumer
  const fundResponse = await vrfContract.fundSubscription(subId, parseEther("5000"));
  await fundResponse.wait(1);

  const addConsumerResponse = await vrfContract.addConsumer(subId, JammyContract.address);
  await addConsumerResponse.wait(1);

  console.log(`Jammy Contract is deployed to: ${JammyContract.address}`);
});

task("deploy:BSCTestnet").setAction(async function (taskArguments: TaskArguments, { ethers, network }) {
  console.log(`Starting to deploy to ${network.name.toUpperCase()}...`);

  let factory = await ethers.getContractFactory("Jammy");
  const JammyContract = (await factory.deploy(
    "0xda3b641d438362c440ac5458c57e00a712b66700", //_vrfCoordinator,
    "0x8596b430971ac45bdf6088665b9ad8e8630c9d5049ab54b14dff711bee7c0e26", //_keyhash,
    "87466514065665585202058077900160327756119050904890139325943116686922749980967", //_subscriptionId
    500000, //_callbackGasLimit 100000
    4000,
    6000,
    "0xd73A1EEa7831ef758cF14407c671875f453c8aF1",
    "0xd73A1EEa7831ef758cF14407c671875f453c8aF1",
  )) as Jammy;
  await JammyContract.deployed();

  console.log(`Jammy Contract is deployed to: ${JammyContract.address}`);
});

task("deploy:BSCMainnet").setAction(async function (taskArguments: TaskArguments, { ethers, network }) {
  console.log(`Starting to deploy to ${network.name.toUpperCase()}...`);

  let factory = await ethers.getContractFactory("Jammy");
  const JammyContract = (await factory.deploy(
    "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9", //_vrfCoordinator,
    "0xeb0f72532fed5c94b4caf7b49caf454b35a729608a441101b9269efb7efe2c6c", //_keyhash,
    "45369170548168961308990518646622305713441217840851900896712016602292091460373", //_subscriptionId
    500000, //_callbackGasLimit 100000
    4000,
    6000,
    "0xd73A1EEa7831ef758cF14407c671875f453c8aF1",
    "0xd73A1EEa7831ef758cF14407c671875f453c8aF1",
  )) as Jammy;
  await JammyContract.deployed();

  console.log(`Jammy Contract is deployed to: ${JammyContract.address}`);
});
