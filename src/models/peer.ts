import Peer, { DataConnection } from "peerjs";

import { goHome } from "@/router";
import User from "./user";
import { EKE, encrypt, decrypt, Pub, hashKey } from "../utils/crypto";

type ConnectionHandler = (c: DataConnection) => void;
type PrintMessage = (content: string, sender: string) => void;

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

  privkey: string | null = null;
  eke: EKE | null = null;
  sessionSecret: Pub | null = null;

  printMessage: PrintMessage | null = null;

  private constructor() {}

  init(onConnect: ConnectionHandler) {
    if (!User.current) throw new Error("user not found");
    this.privkey = User.current.privkey;

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

  connectTo(id: string, otherPubkey: Pub, printMessage: PrintMessage) {
    if (!this.peer) throw new Error("cant connectTo without peer");

    this.printMessage = printMessage;

    if (this.conn) this.conn.close();
    const c = this.peer.connect(id, {
      reliable: true,
    });

    c.on("open", () => {
      // setTimeout
      this.startKE(otherPubkey);
    });

    this.handleConnection(c);
  }

  handleConnection(c: DataConnection) {
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
          this.startAndEndKE(data.hanshake, c.peer);
        } else if (data.type === "end_KE") {
          this.endKE(data.hanshake);
        } else {
          console.error("Unknown data type:", data);
        }
      } else {
        console.error("Bad data:", data);
      }
    });

    c.on("close", () => {
      this.status = "Connection closed. Awaiting connection...";
      this.conn = null;
      alert("Connection closed");
      goHome();
    });
  }

  startKE(otherPubkey: Pub) {
    if (!this.conn || !this.conn.open) throw new Error("cant startKE when connection is closed");
    if (!this.privkey) throw new Error("cant startKE without privkey");    
    
    this.eke = new EKE(this.privkey, otherPubkey);
    const hanshake = this.eke.start();
    this.conn.send({ type: "start_KE", hanshake });
    //
    console.log(`my handshake: ${hashKey(hanshake)}`);
  }

  async startAndEndKE(hanshake: Pub, connection: string) {
    if (!this.conn || !this.conn.open) throw new Error("cant startAndEndKE when connection is closed");
    if (!this.privkey) throw new Error("cant startAndEndKE without privkey");

    const userTo = await User.findByConnection(connection);
    if (!userTo) throw new Error("cant startAndEndKE when userTo is unknown");
    
    this.eke = new EKE(this.privkey, userTo.pubkey);
    const myHanshake = this.eke.start();
    this.conn.send({ type: "end_KE", hanshake: myHanshake });
    //
    console.log(`my handshake: ${hashKey(myHanshake)}`);
    //
    this.endKE(hanshake);
  }

  endKE(hanshake: Pub) {
    console.log(`other handshake: ${hashKey(hanshake)}`)
    //
    if (!this.eke) throw new Error("cant endKE when eke is not initialized");
    this.sessionSecret = this.eke.end(hanshake);
    //
    console.log(`session secret: ${hashKey(this.sessionSecret)}`);
  }

  receiveMessage(cipherText: string) {
    if (!this.printMessage) throw new Error("cant receiveMessage without message handler");
    if (!this.sessionSecret) throw new Error("cant receiveMessage when secret is not stablished");

    const plainText = decrypt(cipherText, this.sessionSecret);
    this.printMessage(plainText, "other");
  }

  sendMessage(plainText: string) {
    if (!this.conn || !this.conn.open) throw new Error("cant sendMessage when connection is closed");
    if (!this.sessionSecret) throw new Error("cant sendMessage when secret is not stablished");
    
    const cipherText = encrypt(plainText, this.sessionSecret);
    this.conn.send({ type: "message", cipherText });
  }

  close() {
    this.conn?.close();
    this.conn = null;
  }
}

export default MyPeer.instance;
