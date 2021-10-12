import jwt from 'jsonwebtoken';

import { createKey, genSignature, Pub } from "../utils/crypto";
import Debugger from "../utils/debugger";

export type UserAuth = {
  username: string;
  connection: string;
  pubkey: Pub;
};

const basePath = `https://${process.env.VUE_APP_PEER_SERVER_HOST}:${process.env.VUE_APP_PEER_SERVER_PORT}`;
const sessionStorageKey = 'peereke-user-storage';
sessionStorage

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

function getStored(): { token: string, privkey: string } | null {
  const stored = sessionStorage.getItem(sessionStorageKey);
  if (!stored) return null;
  const { token, privkey } = JSON.parse(stored);
  return { token, privkey };
}

function setStored(token: string, privkey: string) {
  sessionStorage.setItem(sessionStorageKey, JSON.stringify({token, privkey}));
}

function removeStored() {
  sessionStorage.removeItem(sessionStorageKey);
}

export default class User {
  static fromToken(token: string, privkey: string): User {
    const decoded = jwt.decode(token) as UserAuth;
    return new User(decoded, privkey);
  }

  static async register(username: string): Promise<string> {
    const { privkey, pubkey } = createKey();
    Debugger.print({ step: "regiger", username, privkey, pubkey });
    await fetcher("users", "PUT", { username, pubkey });
    return privkey;
  }

  static async login(username: string, privkey: string): Promise<User> {
    const { message, signature } = genSignature(privkey);
    Debugger.print({ step: "login", username, message, signature });
    const { token } = await fetcher("users/login", "POST", { username, message, signature });
    setStored(token, privkey);
    return User.fromToken(token, privkey);
  }

  static logout() {
    removeStored();
  }

  static get current(): User | null {
    try {
      const stored = getStored();
      if (!stored) return null;
      return User.fromToken(stored.token, stored.privkey);
    } catch (e) {
      return null;
    }
  }

  static async listUsers(): Promise<UserAuth[]> {
    const stored = getStored();
    if (!stored) return []; // fix me
    const { users } = await fetcher("users", "GET", {}, { "Authorization": stored.token });
    return users;
  }

  static async findByConnection(connection: string): Promise<UserAuth | null> {
    const stored = getStored();
    if (!stored) return null; // fix me
    const { user } = await fetcher(`users/${connection}`, "GET", {}, { "Authorization": stored.token });
    return user;
  }

  username: string;
  connection: string;
  pubkey: Pub;
  privkey: string;

  constructor(userAuth: UserAuth, privkey: string) {
    this.username = userAuth.username;
    this.connection = userAuth.connection;
    this.pubkey = userAuth.pubkey;
    this.privkey = privkey;
  }
}