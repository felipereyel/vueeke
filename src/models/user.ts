import jwt from 'jsonwebtoken';

type UserAuth = {
  username: string;
  connectionId: string;
};

const basePath = `https://${process.env.VUE_APP_PEER_SERVER_HOST}`;
const localStorageKey = 'peereke-user-token';

async function fetcher(
  path: string,
  method: string,
  body: Record<string, any> = {},
  headers: Record<string, any> = {}
): Promise<Record<string, any>> {
  const response = await fetch(`${basePath}/${path}`, {
    method,
    body: JSON.stringify(body),
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

  static async register(username: string, password: string): Promise<User> {
    const { token } = await fetcher("users", "PUT", { username, password });
    localStorage.setItem(localStorageKey, token);
    return User.fromToken(token);
  }

  static async login(username: string, password: string): Promise<User> {
    const { token } = await fetcher("users/login", "POST", { username, password });
    localStorage.setItem(localStorageKey, token);
    return User.fromToken(token);
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

  username: string;
  connectionId: string;

  constructor(userAuth: UserAuth) {
    this.username = userAuth.username;
    this.connectionId = userAuth.connectionId;
  }
}