import Peer, { DataConnection } from "peerjs";

import User from "./user";
import { EKE, encrypt, decrypt, Pub } from "../utils/crypto";

type ConnectionHandler = (c: DataConnection) => void;
type AddMessageHandler = (content: string, sender: string) => void;
type CloserHandler = () => void;

export class MyPeer {
  static _instance: MyPeer | null = null;

  static get instance(): MyPeer {
    if (!MyPeer._instance) {
      MyPeer._instance = new MyPeer();
    }
    return MyPeer._instance;
  }

  peer: Peer | null = null;
  status: string = "Awaiting connection...";
  conn: DataConnection | null = null;

  privkey: string;
  eke: EKE | null = null;
  sessionSecret: Pub | null = null;

  addMessage: AddMessageHandler | null = null;

  private constructor(privkey: string) {
    this.privkey = privkey;
  }

  init(onConnect: ConnectionHandler) {
    if (!User.current) throw new Error("user not found");

    this.peer = new Peer(User.current.connection, {
      secure: Boolean(process.env.VUE_APP_PEER_SERVER_SECURE),
      port: Number(process.env.VUE_APP_PEER_SERVER_PORT),
      host: process.env.VUE_APP_PEER_SERVER_HOST,
      path: process.env.VUE_APP_PEER_SERVER_PATH,
      key: process.env.VUE_APP_PEER_SERVER_KEY,
    });

    this.peer.on("disconnected", () => {
      this.status = "Connection lost. Please reconnect";
      // auto reconnect
    });

    this.peer.on("close", () => {
      this.status = "Connection destroyed. Please refresh";
    });

    this.peer.on("error", (err) => {
      alert("" + err);
    });

    this.peer.on("connection", c => {
      onConnect(c);
      this.handleConnection(c);
    });
  }

  connectTo(id: string, pubkey: Pub, addMessage: AddMessageHandler, onClose: CloserHandler) {
    if (!this.peer) throw new Error("no peer found");
    this.eke = new EKE(this.privkey, pubkey);
    this.addMessage = addMessage;

    if (this.conn) this.conn.close();
    const c = this.peer.connect(id, {
      reliable: true,
    });

    c.on("open", () => {
      // setTimeout
      this.startKE();
    });

    this.handleConnection(c, onClose);
  }

  handleConnection(c: DataConnection, onClose: CloserHandler = () => { }) {
    if (this.conn && this.conn.open) {
      c.on("open", () => {
        c.send({ type: "rejected" });
        setTimeout(function () {
          c.close();
        }, 500);
      });
      return;
    }

    this.conn = c;
    this.status = "Connected to: " + c.peer;

    c.on("data", (data) => {
      if (typeof data === "object") {
        if (data.type === "message") {
          this.receiveMessage(data.cipherText);
        } else if (data.type === "start_KE") {
          this.startKE(data.toOther);
        } else if (data.type === "end_KE") {
          this.endKE(data.toOther);
        } else {
          console.error("Unknown data type:", data);
        }
      } else {
        console.error("Bad data:", data);
      }
    });

    c.on("close", () => {
      this.status = "Connection reset. Awaiting connection...";
      this.conn = null;
      onClose();
    });
  }

  startKE(KE: Pub | null = null) {
    if (!this.conn || !this.conn.open) throw new Error("Connection is closed");
    if (!this.eke) throw new Error("eke not initialized");
    const toOther = this.eke.start();

    if (KE) {
      this.conn.send({ type: "end_KE", toOther });
    } else {
      this.conn.send({ type: "start_KE", toOther });
    }
  }

  endKE(KE: Pub) {
    if (!this.eke) throw new Error("eke not initialized");
    this.sessionSecret = this.eke.end(KE);
  }

  receiveMessage(cipherText: string, ) {
    if (!this.addMessage) throw new Error("No message handler");
    if (!this.sessionSecret) throw new Error("secret not stablished");

    const plainText = decrypt(cipherText, this.sessionSecret);
    this.addMessage(plainText, "other");
  }

  sendMessage(plainText: string) {
    if (!this.conn || !this.conn.open) throw new Error("Connection is closed");
    if (!this.sessionSecret) throw new Error("secret not stablished");
    
    const cipherText = encrypt(plainText, this.sessionSecret);
    this.conn.send({ type: "message", cipherText });
  }

  close() {
    this.conn?.close();
    this.conn = null;
  }
}

export default MyPeer.instance;
