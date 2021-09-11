import { ec as EC } from 'elliptic';

export type Pub = {
    x: string;
    y: string;
};

const ec = new EC('secp256k1');

function pubP(p): Pub {
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

export class Cipher {}

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
        const toB = this.pubkey.getPublic().mul(this.sessionKey.getPrivate().add(this.privkey.getPrivate()));
        const SX = privP(this.privkey.getPrivate().add(this.sessionKey.getPrivate()));
        const toOther = ec.keyFromPrivate(SX);

        return pub(toOther);
    }

    end(received: Pub) {
        const receivedKey = ec.keyFromPublic(received, 'hex');
        const invPrivKey = this.privkey.getPrivate().invm(ec.n);

        // privKeyInv = pow(self.privKey, -1, self.curve.field.n)
        // myPartialShared =  (received * privKeyInv) - self.otherPub
        // shared = self.mySelfPartialShared + myPartialShared

        // self.cipher = AESCipher(shared.x)
        // return shared.x
    }
}
