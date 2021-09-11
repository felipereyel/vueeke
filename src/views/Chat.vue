<template>
  <div class="chat" v-if="peer">
    <div class="header">
      <button @click="contacts">Contacts</button>
      <h3>{{ peer.status }}</h3>
      <button @click="logout">Logout</button>
    </div>

    <div v-if="peer.conn" class="chat-container">
      <message-list :messages="messages" />
      <div class="message-input">
        <textarea placeholder="Type the message here" v-model="contentToSend" />
        <button @click="sendMessage">Send</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";

import MessageList from "../components/MessageList.vue";

import User from "../models/user";
import peer, { MyPeer } from "../models/peer";

interface Message {
  content: String;
  sender: String;
  sendedAt: String;
}

@Options({
  components: {
    MessageList,
  },
})
export default class Chat extends Vue {
  messages: Message[] = [];
  contentToSend = "";
  peer: MyPeer | null = null;
  user: User | null = null;

  async mounted() {
    if (!User.current) {
      this.$router.push({ name: "Login" });
      return;
    }
    if (!this.$route.params.id || !peer.peer) {
      this.$router.push({ name: "Contacts" });
      return;
    }

    const connection = this.$route.params.id as string;
    const userTo = await User.findByConnection(connection);
    if (!userTo) {
      this.$router.push({ name: "Contacts" });
      return;
    }

    this.user = User.current;
    this.peer = peer;

    try {
      peer.connectTo(userTo.connection, userTo.pubkey, this.addMessage, () => {
        alert("disconnected");
        this.$router.push({ name: "Contacts" });
      });
    } catch (e) {
      this.$router.push({ name: "Contacts" });
    }
  }

  beforeUnmount() {
    peer.close();
  }

  addMessage(content: string, sender = "me") {
    this.messages.push({
      content,
      sender,
      sendedAt: Date(),
    });
  }

  sendMessage() {
    if (!this.contentToSend) return;
    if (peer.conn && peer.conn.open) {
      peer.sendMessage(this.contentToSend);
      this.addMessage(this.contentToSend);
      this.contentToSend = "";
    } else {
      alert("Connection is closed");
    }
  }

  logout() {
    User.logout();
    this.$router.push({ name: "Login" });
  }

  contacts() {
    this.$router.push({ name: "Contacts" });
    this.peer?.close();
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

.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}
</style>
