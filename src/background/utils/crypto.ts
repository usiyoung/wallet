import { ec as EC } from "elliptic";
import sha256 from "sha256";

const ec = new EC("secp256k1");

export interface PublicKey {
  x: string;
  y: string;
}

export interface Signature {
  r: string;
  s: string;
  recoveryParam?: number;
}

const generatePrivateKey = (): string => {
  return ec.genKeyPair().getPrivate().toString("hex");
};

const generatePublicKey = (privateKey: string): PublicKey => {
  const publicKey = ec.keyFromPrivate(privateKey).getPublic();
  return {
    x: publicKey.getX().toString("hex"),
    y: publicKey.getY().toString("hex"),
  };
};

const signMessage = (message: string, privateKey: string): Signature => {
  const hash = sha256(message).toString();
  const key = ec.keyFromPrivate(privateKey);
  const signature: any = key.sign(hash);
  return {
    r: signature.r.toString("hex"),
    s: signature.s.toString("hex"),
    recoveryParam: signature.recoveryParam,
  };
};

const verifyMessage = (
  message: string,
  publicKey: PublicKey,
  signature: Signature
): boolean => {
  const hash = sha256(message).toString();
  const key = ec.keyFromPublic({ x: publicKey.x, y: publicKey.y }, "hex");
  return key.verify(hash, {
    r: signature.r,
    s: signature.s,
    recoveryParam: signature.recoveryParam,
  });
};

const arbuf2hex = (buffer: ArrayBuffer) => {
  const hexCodes: string[] = [];
  const view = new DataView(buffer);
  for (let i = 0; i < view.byteLength; i += 4) {
    const value = view.getUint32(i);
    const stringValue = value.toString(16);
    const padding = "00000000";
    const paddedValue = (padding + stringValue).slice(-padding.length);
    hexCodes.push(paddedValue);
  }

  return hexCodes.join("");
};

const sha256Veta = async (hexstr: string): Promise<string> => {
  const buffer = new Uint8Array(
    hexstr.match(/[\da-f]{2}/gi)!.map((h) => parseInt(h, 16))
  );
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return arbuf2hex(hash);
};

const privateKeyToAddress = async (privateKey: string): Promise<string> => {
  try {
    const { x, y } = generatePublicKey(privateKey);
    const address = (await sha256Veta(x.concat(y))).substring(0, 40);
    return address;
  } catch (error) {
    console.log(error);
    return "";
  }
};

export const Crypto = {
  generatePrivateKey,
  generatePublicKey,
  signMessage,
  verifyMessage,
  arbuf2hex,
  sha256Veta,
  privateKeyToAddress,
};
