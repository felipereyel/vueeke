import Peer, { DataConnection } from "peerjs";
import User from "./user";

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
  addMessage: AddMessageHandler | null = null;

  private constructor() { }

  init(onConnect: ConnectionHandler) {
    if (!User.current) throw new Error("user not found");

    this.peer = new Peer(User.current.connectionId, {
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

  connectTo(id: string, addMessage: AddMessageHandler, onClose: CloserHandler) {
    if (!this.peer) throw new Error("no peer found");

    this.addMessage = addMessage;
    if (this.conn) this.conn.close();
    const c = this.peer.connect(id, {
      reliable: true,
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
          if (!this.addMessage) throw new Error("No message handler");
          this.addMessage(data.content, c.peer);
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

  sendMessage(content: string) {
    if (!this.conn || !this.conn.open) throw new Error("Connection is closed");
    this.conn.send({ type: "message", content });
  }

  close() {
    this.conn?.close();
    this.conn = null;
  }
}

export default MyPeer.instance;
