<template>
  <div class="home">
    <div class="connection-header">
      <h2>{{ status }}</h2>
      <h3 v-if="user">{{ user.username }}: {{ user.connectionId }}</h3>
    </div>

    <div v-if="conn" class="chat-container">
      <message-list :messages="messages" />
      <div class="message-input">
        <textarea placeholder="Type the message here" v-model="contentToSend" />
        <button @click="sendMessage">Send</button>
      </div>
    </div>
    <div v-else-if="peer" class="id-input">
      <input placeholder="ID of user" v-model="idToConnect" />
      <button @click="connect">Connect</button>
      <button @click="copyId">Copy ID</button>
      <button @click="copyLink">Copy Link</button>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import Peer, { DataConnection } from "peerjs";
import MessageList from "../components/MessageList.vue";
import User from "../models/user";

interface Message {
  content: String;
  sender: String;
  sendedAt: String;
}

function copyToClipboard(str: string) {
  const el = document.createElement("textarea");
  el.value = str;
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
}

@Options({
  components: {
    MessageList,
  },
})
export default class Home extends Vue {
  peer: Peer | null = null;
  conn: DataConnection | null = null;
  messages: Message[] = [];

  contentToSend = "";
  idToConnect = "";
  status = "Awaiting connection...";

  user: User | null = null;

  mounted() {
    if (!User.current) {
      this.$router.push({ name: "Login" });
    }
    this.user = User.current;
  
    this.peer = new Peer(this.user?.connectionId, {
      secure: Boolean(process.env.VUE_APP_PEER_SERVER_SECURE),
      port: Number(process.env.VUE_APP_PEER_SERVER_PORT),
      host: process.env.VUE_APP_PEER_SERVER_HOST,
      path: process.env.VUE_APP_PEER_SERVER_PATH,
      key: process.env.VUE_APP_PEER_SERVER_KEY,
    });

    this.peer.on("connection", this.handleConnection);

    this.peer.on("disconnected", () => {
      this.status = "Connection lost. Please reconnect";
      // auto reconnect
    });

    this.peer.on("close", () => {
      this.status = "Connection destroyed. Please refresh";
    });

    this.peer.on("error", (err) => {
      console.log(err);
      alert("" + err);
    });

    this.peer.on("open", () => {
      if (this.$route.query.connectTo) {
        setTimeout(() => {
          this.idToConnect = this.$route.query.connectTo as string;
          this.connect();
        }, 1000);
      }
    });
  }

  handleConnection(c: DataConnection) {
    if (this.conn && this.conn.open) {
      c.on("open", function() {
        c.send({ type: "rejected" });
        setTimeout(function() {
          c.close();
        }, 500);
      });
      return;
    }

    this.conn = c;
    this.status = "Connected to: " + c.peer;

    c.on("data", (data) => {
      if (typeof data === "object") {
        switch (data.type) {
          case "message":
            return this.addMessage(data.content, c.peer);
          default:
            console.error("Unknown data type:", data);
        }
      } else {
        console.error("Bad data:", data);
      }
    });

    c.on("close", () => {
      this.status = "Connection reset. Awaiting connection...";
      this.conn = null;
      this.messages = [];
      this.contentToSend = "";
    });
  }

  copyId() {
    copyToClipboard(`${this.user?.connectionId}`);
  }

  copyLink() {
    copyToClipboard(`${location.href}?connectTo=${this.user?.connectionId}`);
  }

  connect() {
    if (this.conn) {
      this.conn.close();
    }

    if (this.peer) {
      const c = this.peer.connect(this.idToConnect, {
        reliable: true,
      });

      this.handleConnection(c);
    }
  }

  addMessage(content: string, sender = "me") {
    this.messages.push({
      content,
      sender,
      sendedAt: Date(),
    });
  }

  sendMessage() {
    if (this.conn && this.conn.open) {
      this.conn.send({ type: "message", content: this.contentToSend });
      this.addMessage(this.contentToSend);
      this.contentToSend = "";
    } else {
      console.log("Connection is closed");
    }
  }
}
</script>

<style scoped>
.message-input {
  display: flex;
}

.message-input textarea {
  flex-grow: 20;
  resize: none;
  border-radius: 15px;
  border-color: #86b6cf;
}

.message-input button {
  flex-grow: 1;
  margin-left: 10px;
  border-radius: 15px;
  background: #a2ddfa;
  border-color: #86b6cf;
}

.id-input button {
  margin-left: 5px;
}
</style>
