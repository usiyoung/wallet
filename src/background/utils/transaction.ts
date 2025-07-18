import { Crypto, Signature } from "./crypto";

export interface TransactionRequest {
  nonce: string;
  from: string;
  to: string;
  value: string;
  data: string;
}

const remove0x = (str: string): string => str.replace(/^0x/, "");
const add0x = (str: string): string =>
  str.startsWith("0x") ? str : `0x${str}`;
const numberToHex = (num: number): string => num.toString(16);
const hexToUint8Array = (hex: string): number[] => {
  const cleanHex = remove0x(hex);
  const result: number[] = [];
  for (let i = 0; i < cleanHex.length; i += 2) {
    result.push(parseInt(cleanHex.substr(i, 2), 16));
  }
  return result;
};
const uint8ArrayToHex = (arr: Uint8Array): string => {
  return Array.from(arr, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const createTransactionRequest = (
  nonce: string,
  from: string,
  to: string,
  value: string | number,
  data: string = "00"
): TransactionRequest => ({
  nonce,
  from: remove0x(from),
  to: remove0x(to),
  value: typeof value === "number" ? numberToHex(value) : value,
  data,
});

const getTxUintArray = (tx: TransactionRequest): Uint8Array => {
  const txEntries = Object.entries(tx) as [keyof TransactionRequest, string][];
  const allBytes = txEntries.reduce((acc: number[], [, value]) => {
    return acc.concat(...hexToUint8Array(value));
  }, []);
  return new Uint8Array(allBytes);
};

const getMessage = (txUintArray: Uint8Array): string =>
  uint8ArrayToHex(txUintArray);

const signTransaction = (
  privateKey: string,
  tx: TransactionRequest
): Signature => {
  const txUintArray = getTxUintArray(tx);
  const message = getMessage(txUintArray);
  return Crypto.signMessage(message, privateKey);
};

export interface TransactionInfo {
  nonce: string;
  from: string;
  to: string;
  value: string;
  data: string;
  signatureR: string;
  signatureS: string;
  signerX: string;
  signerY: string;
}

export const createTxInfo = (
  privateKey: string,
  nonce: string,
  from: string,
  to: string,
  value: string | number,
  data: string = "ab"
): TransactionInfo => {
  const tx = createTransactionRequest(nonce, from, to, value, data);
  const signature = signTransaction(privateKey, tx);
  const publicKey = Crypto.generatePublicKey(privateKey);

  return {
    nonce: tx.nonce,
    from: tx.from,
    to: tx.to,
    value: add0x(typeof value === "number" ? numberToHex(value) : value),
    data: tx.data,
    signatureR: signature.r,
    signatureS: signature.s,
    signerX: publicKey.x,
    signerY: publicKey.y,
  };
};

export const TransactionUtils = {
  remove0x,
  add0x,
  numberToHex,
  hexToUint8Array,
  uint8ArrayToHex,
  createTransactionRequest,
  getTxUintArray,
  getMessage,
  signTransaction,
  createTxInfo,
};
