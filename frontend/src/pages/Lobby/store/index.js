// ** Redux Imports
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Contract, providers } from "ethers";
import Bingo from "../../../abis/artifacts/contracts/Jammy.sol/Jammy.json";

export const getAccount = createAsyncThunk("getAccount", async () => {
  const provider = new providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();

  const bingoContract = new Contract(
    process.env.REACT_APP_CONTRACT_ADDRESS,
    Bingo.abi,
    signer
  );

  const accounts = await window.ethereum.request({
    method: "eth_accounts",
  });

  const admins = await bingoContract.admins(accounts[0]);
  const hosts = await bingoContract.hosts(accounts[0]);

  if (accounts[0] && admins) {
    return {
      account: accounts[0],
      role: "admin",
    };
  } else if (accounts[0] && hosts) {
    return {
      account: accounts[0],
      role: "host",
    };
  } else if (accounts[0]) {
    return {
      account: accounts[0],
      role: "user",
    };
  }
});

export const lobbyStore = createSlice({
  name: "lobbyStore",
  initialState: {},
  reducers: {},
});

export default lobbyStore.reducer;
