/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, createContext, useContext, useCallback, } from "react";
import detectEthereumProvider from "@metamask/detect-provider";
import { formatBalance } from "../Utils";
import { Contract, providers, utils } from "ethers";
import Bingo from "../../abis/artifacts/contracts/Jammy.sol/Jammy.json";
import VRF from "../../abis/artifacts/@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol/VRFCoordinatorV2_5Mock.json";

const disconnectedState = { accounts: [], balance: "", chainId: "" };
const initialSigner = {
  provider: null,
  signer: null,
  contract: null,
  deployer: null,
  isAdmin: false,
  isHost: false,
};

const initialUnSigner = {
  provider: null,
  contract: null,
};

const MetaMaskContext = createContext();

export const MetaMaskContextProvider = ({ children }) => {
  const [hasProvider, setHasProvider] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(window.ethereum ? "" : "notMM");
  const clearError = () => setErrorMessage("");
  const [wallet, setWallet] = useState(disconnectedState);

  const [signer, setSigner] = useState(initialSigner);
  const [unSigner, setUnSigner] = useState(initialUnSigner);
  const [mockVRF, setMockVRF] = useState(null);

  const _loadWallet = useCallback(async (providedAccounts) => {
    if (window.ethereum) {
      const chainId = await window.ethereum.request({
        method: "eth_chainId",
      });

      if (chainId.toLowerCase() !== process.env.REACT_APP_NETWORKID.toLowerCase()) {
        try {
          setErrorMessage("wallet_switchEthereumChain")
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: process.env.REACT_APP_NETWORKID }],
          });
        } catch (error) {
          if (error.code === 4902) {
            setErrorMessage("wallet_addEthereumChain")
          }
          console.log(error);
        }
      } else {
        setErrorMessage("");
        try {
          // set unsigner Contract
          const jsonRpcProvider = new providers.JsonRpcProvider(
            `${process.env.REACT_APP_RPCURL}`
          );
          const _unSignerContract = new Contract(
            process.env.REACT_APP_CONTRACT_ADDRESS,
            Bingo.abi,
            jsonRpcProvider
          );

          if (_unSignerContract) {
            setUnSigner({
              provider: jsonRpcProvider,
              contract: _unSignerContract,
            });
          }

          const accounts =
            providedAccounts ||
            (await window.ethereum.request({ method: "eth_accounts" }));

          let formatAccounts = [];
          if (accounts.length === 0) {
            // If there are no accounts, then the user is disconnected
            setWallet(disconnectedState);
            setSigner(initialSigner);
            return;
          } else {
            accounts.forEach((element) => {
              formatAccounts.push(utils.getAddress(element));
            });
          }

          //TODO: Balance düzeltilecek
          const balance = formatBalance(
            await window.ethereum.request({
              method: "eth_getBalance",
              params: [accounts[0], "latest"],
            })
          );

          setWallet({ accounts: formatAccounts, balance, chainId })
          
          // const userData = window.sessionStorage.getItem("userData");
          // if (!userData) {
          //   setErrorMessage("wallet_login")
          // }

          // set ethers Contract & Auths
          // const eventsProvider = new providers.WebSocketProvider(process.env.REACT_APP_WEBSOCKET_URL);
          // const bingoEventsContract = new Contract(process.env.REACT_APP_CONTRACT_ADDRESS, Bingo.abi, eventsProvider);
          
          // set Signer Contract
          const provider = new providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          const _bingoContract = new Contract(
            process.env.REACT_APP_CONTRACT_ADDRESS,
            Bingo.abi,
            signer
          );

          if (Number(process.env.REACT_APP_NETWORKVERSION) === 31337) {
            const _vrf = new Contract(
              process.env.REACT_APP_VRF_CONTRACT_ADDRESS,
              VRF.abi,
              signer
            );
  
            if (_vrf) {
              setMockVRF(_vrf);
            }
          }

          if (_bingoContract) {
            setSigner({
              provider,
              signer,
              contract: _bingoContract,
              deployer: await _bingoContract.deployer(),
              isAdmin: await _bingoContract.admins(accounts[0]),
              isHost: await _bingoContract.hosts(accounts[0]),
            });
          }
        } catch (error) {
          console.log("useMM:", error);
        }
      }
    } else {
      console.log(
        "MetaMask is not installed. Please consider installing it: https://metamask.io/download.html"
      );
    }
  }, []);

  // useCallback ensures that you don't uselessly recreate the _updateWallet function on every render
  const _updateWallet = useCallback(async (providedAccounts) => {
    _loadWallet(providedAccounts);
    // handleLogout()
    // login()
    // set Contract & Auths
  }, []);

  const updateWalletAndAccounts = useCallback(
    () => _updateWallet(),
    [_updateWallet]
  );
  const loadWallet = useCallback(
    (accounts) => _loadWallet(accounts),
    [_loadWallet]
  );
  const updateWallet = useCallback(
    (accounts) => _updateWallet(accounts),
    [_updateWallet]
  );

  useEffect(() => {
    const getProvider = async () => {
      const provider = await detectEthereumProvider({ silent: true });
      setHasProvider(Boolean(provider));

      if (provider) {
        loadWallet();
        window.ethereum.on("accountsChanged", updateWallet);
        window.ethereum.on("chainChanged", updateWalletAndAccounts);
      }
    };

    getProvider();

    return () => {
      window.ethereum?.removeListener("accountsChanged", updateWallet);
      window.ethereum?.removeListener("chainChanged", updateWalletAndAccounts);
    };
  }, [loadWallet, updateWallet, updateWalletAndAccounts]);

  const connectMetaMask = async () => {
    setIsConnecting(true);

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      clearError();
      updateWallet(accounts);
    } catch (err) {
      console.log(err.message);
      if (!window.ethereum) {
        setErrorMessage("notMM");
      }
    }
    setIsConnecting(false);
  };

  return (
    <MetaMaskContext.Provider
      value={{
        wallet,
        signer,
        unSigner,
        mockVRF,
        hasProvider,
        error: !!errorMessage,
        errorMessage,
        isConnecting,
        connectMetaMask,
        clearError,
      }}
    >
      {children}
    </MetaMaskContext.Provider>
  );
};

export const useMetaMask = () => {
  const context = useContext(MetaMaskContext);
  if (context === undefined) {
    throw new Error(
      'useMetaMask must be used within a "MetaMaskContextProvider"'
    );
  }
  return context;
};
