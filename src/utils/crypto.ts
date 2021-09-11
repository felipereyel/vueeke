import { ec as EC, curve } from 'elliptic';
import BN from "bn.js";
import CryptoJS from "crypto-js";

export type Pub = {
    x: string;
    y: string;
};

const ec = new EC('secp256k1');

function pubP(p: curve.base.BasePoint): Pub {
    const x = p.getX().toString('hex');
    const y = p.getY().toString('hex');
    return { x, y };
}

function pub(key: EC.KeyPair): Pub {
    const p = key.getPublic();
    return pubP(p);
}

function privP(p: BN): string {
    return p.toString("hex")
}

function priv(key: EC.KeyPair): string {
    const p = key.getPrivate();
    return privP(p);
}

export function hashKey(key: Pub) {
    return Buffer.from(JSON.stringify(key.x)).toString('base64');
}

export function createKey(): { privkey: string, pubkey: Pub } {
    const key = ec.genKeyPair();
    return { 
        privkey: priv(key), 
        pubkey: pub(key)
    };
}

export function genSignature(privkey: string): { message: number[], signature: number[] } {
    const key = ec.keyFromPrivate(privkey);
    const message = Array.from({length: 10}, () => Math.floor(Math.random() * 100));
    const signature = key.sign(message).toDER();
    return { message, signature };
}

export class EKE {
    privkey: EC.KeyPair;
    pubkey: EC.KeyPair;

    sessionKey: EC.KeyPair | null = null;

    constructor(privkey: string, otherPub: Pub) {
        this.privkey = ec.keyFromPrivate(privkey);
        this.pubkey = ec.keyFromPublic(otherPub, 'hex');
    }

    start(): Pub {
        this.sessionKey = ec.genKeyPair();
        const toOther = this.pubkey.getPublic().mul(this.sessionKey.getPrivate().add(this.privkey.getPrivate()));        
        return pubP(toOther);
    }

    end(received: Pub): Pub {
        if (!this.sessionKey || !ec.n) throw new Error("session did not start");
        const toMe = ec.keyFromPublic(received, 'hex').getPublic();
        
        const myPartialShared = toMe
            .mul(this.privkey.getPrivate().invm(ec.n))
            .add(this.pubkey.getPublic().neg());

        const shared = myPartialShared.add(this.sessionKey.getPublic());
        return pubP(shared);
    }
}

export function encrypt(plainText: string, key: Pub): string {
    return CryptoJS.AES.encrypt(plainText, hashKey(key)).toString();
}

export function decrypt(cipherText: string, key: Pub): string {
    const bytes = CryptoJS.AES.decrypt(cipherText, hashKey(key));
    return bytes.toString(CryptoJS.enc.Utf8);
}
