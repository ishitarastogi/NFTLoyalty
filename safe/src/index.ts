import { ethers } from "ethers";
import { GelatoRelayPack } from "@safe-global/relay-kit";
import Safe, {
  EthersAdapter,
  getSafeContract,
} from "@safe-global/protocol-kit";
import {
  MetaTransactionData,
  MetaTransactionOptions,
  OperationType,
  RelayTransaction,
} from "@safe-global/safe-core-sdk-types";

import ContractInfo from "../ABI.json";

const RPC_URL =
  "https://eth-goerli.g.alchemy.com/v2/L2rvt62zDN4AaOBQwK2OmyUj2-BWD1n0";

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(
  "27204a09afee7649efcb2d0d7f23eca1013d9a9127f1d97af20fbf5ea4d56709",
  provider
);

const safeAddress = "0x11FF6f9b62C88c33029caDcCE9646A2A34dF1388";
const chainId = 5;
const targetAddress = ContractInfo.address;
const GELATO_RELAY_API_KEY = "jX8Df3AGdD968yf8gBe4CjyXdelu3qJVDAZSHgrNd0A_";
const nftContract = new ethers.Contract(
  targetAddress,
  ContractInfo.abi,
  signer
);

const gasLimit = "8000000";

async function relayTransaction() {
  // Create a transaction object
  const relayKit = new GelatoRelayPack(GELATO_RELAY_API_KEY);

  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer,
  });

  const safeSDK = await Safe.create({
    ethAdapter,
    safeAddress,
  });

  const safeTransactionData: MetaTransactionData = {
    to: targetAddress,
    data: nftContract.interface.encodeFunctionData("earnPoints", [
      "0x0eaE0194784851Bf3515E3B6be3Cf7EC29268B8D",
      "3",
    ]),
    value: "0",
    operation: OperationType.Call,
  };
  const options: MetaTransactionOptions = {
    gasLimit,
    isSponsored: true,
  };

  const standardizedSafeTx = await relayKit.createRelayedTransaction(
    safeSDK,
    [safeTransactionData],
    options
  );

  const safeSingletonContract = await getSafeContract({
    ethAdapter: ethAdapter,
    safeVersion: await safeSDK.getContractVersion(),
  });

  const signedSafeTx = await safeSDK.signTransaction(standardizedSafeTx);

  const encodedTx = safeSingletonContract.encode("execTransaction", [
    signedSafeTx.data.to,
    signedSafeTx.data.value,
    signedSafeTx.data.data,
    signedSafeTx.data.operation,
    signedSafeTx.data.safeTxGas,
    signedSafeTx.data.baseGas,
    signedSafeTx.data.gasPrice,
    signedSafeTx.data.gasToken,
    signedSafeTx.data.refundReceiver,
    signedSafeTx.encodedSignatures(),
  ]);

  const relayTransaction: RelayTransaction = {
    target: safeAddress,
    encodedTransaction: encodedTx,
    chainId: chainId,
    options,
  };

  const response = await relayKit.relayTransaction(relayTransaction);
  console.log(
    `Relay Transaction Task ID: https://relay.gelato.digital/tasks/status/${response.taskId}`
  );
}
relayTransaction();
