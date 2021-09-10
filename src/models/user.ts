import jwt from 'jsonwebtoken';
import { ec as EC } from 'elliptic';

export type Pub = {
  x: string;
  y: string;
};

export type UserAuth = {
  username: string;
  connectionId: string;
  pubkey: Pub;
};

const basePath = `http://${process.env.VUE_APP_PEER_SERVER_HOST}:${process.env.VUE_APP_PEER_SERVER_PORT}`;
const localStorageKey = 'peereke-user-token';
const ec = new EC('secp256k1');

async function fetcher(
  path: string,
  method: string,
  body: Record<string, any> = {},
  headers: Record<string, any> = {}
): Promise<Record<string, any>> {
  const response = await fetch(`${basePath}/${path}`, {
    method,
    body: method !== "GET" ? JSON.stringify(body) : undefined,
    headers: {
      ...headers,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) throw new Error(await response.text());

  return await response.json();
}

export default class User {
  static fromToken(token: string): User {
    const decoded = jwt.decode(token) as UserAuth;
    return new User(decoded);
  }

  static async register(username: string): Promise<string> {
    const key = ec.genKeyPair();
    const pubPoint = key.getPublic();
    const x = pubPoint.getX().toString('hex');
    const y = pubPoint.getY().toString('hex');
    const pubkey = { x, y }; 

    await fetcher("users", "PUT", { username, pubkey });

    const privKey = key.getPrivate();
    return privKey.toString("hex");
  }

  static async login(username: string, privStr: string): Promise<User> {
    const key = ec.keyFromPrivate(privStr);
    const message = Array.from({length: 10}, () => Math.floor(Math.random() * 100));
    const signature = key.sign(message).toDER();

    const { token } = await fetcher("users/login", "POST", { username, message, signature });
    localStorage.setItem(localStorageKey, token);
    return User.fromToken(token);
  }

  static logout() {
    localStorage.removeItem(localStorageKey);
  }

  static get current(): User | null {
    try {
      const token = localStorage.getItem(localStorageKey);
      if (!token) return null;
      return User.fromToken(token);
    } catch (e) {
      return null;
    }
  }

  static async listUsers(): Promise<UserAuth[]> {
    const token = localStorage.getItem(localStorageKey);
    if (!token) return [];
    const { users } = await fetcher("users", "GET", {}, { "Authorization": token });
    return users;
  }

  username: string;
  connectionId: string;
  pubkey: Pub;

  constructor(userAuth: UserAuth) {
    this.username = userAuth.username;
    this.connectionId = userAuth.connectionId;
    this.pubkey = userAuth.pubkey;
  }
}