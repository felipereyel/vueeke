import jwt from 'jsonwebtoken';
import { ec as EC } from 'elliptic';

import { createKey, genSignature, Pub } from "../utils/crypto";

export type UserAuth = {
  username: string;
  connection: string;
  pubkey: Pub;
};

const basePath = `https://${process.env.VUE_APP_PEER_SERVER_HOST}:${process.env.VUE_APP_PEER_SERVER_PORT}`;
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
    const { privkey, pubkey } = createKey();
    await fetcher("users", "PUT", { username, pubkey });
    return privkey;
  }

  static async login(username: string, privStr: string): Promise<User> {
    const { message, signature } = genSignature(privStr);
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
  connection: string;
  pubkey: Pub;

  constructor(userAuth: UserAuth) {
    this.username = userAuth.username;
    this.connection = userAuth.connection;
    this.pubkey = userAuth.pubkey;
  }
}