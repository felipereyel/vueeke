<template>
  <div class="chat" v-if="peer">
    <div class="header">
      <button @click="contacts">Contacts</button>
      <h3
        :title="
          peer.sessionSecret
            ? 'Session secret:\n' + hashKey(peer.sessionSecret)
            : 'unset'
        "
      >
        {{ peer.status }}
      </h3>
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

import User, { UserAuth } from "../models/user";
import peer, { MyPeer } from "../models/peer";
import { hashKey } from "../utils/crypto";

interface Message {
  plainText: String;
  cipherText: String;
  sender: String;
  sendedAt: String;
}

@Options({
  components: {
    MessageList,
  },
})
export default class Chat extends Vue {
  hashKey = hashKey;
  messages: Message[] = [];
  contentToSend = "";

  peer: MyPeer | null = null;
  userTo: UserAuth | null = null;

  async mounted() {
    if (!User.current) return this.toLogout();
    if (!this.$route.params.id || !peer.peer) return this.toContacts();

    const connection = this.$route.params.id as string;
    const userTo = await User.findByConnection(connection);
    if (!userTo) return this.toContacts();

    this.peer = peer; // bind para usar no v-if e status
    this.userTo = userTo;

    if (peer.conn && peer.conn.peer === connection) {
      peer.addMessage = this.addMessage;
      console.log("already connected");
    } else {
      try {
        peer.connectTo(
          this.userTo.connection,
          this.userTo.pubkey,
          this.addMessage
        );
      } catch (e) {
        alert(`Error: ${e.message}`);
        this.toContacts();
      }
    }

    peer.status = "Connected to: " + userTo.username;
  }

  addMessage(plainText: string, cipherText: string, sender: string) {
    this.messages.push({
      plainText,
      cipherText,
      sender,
      sendedAt: Date(),
    });
  }

  sendMessage() {
    if (!this.contentToSend) return;
    try {
      peer.sendMessage(this.contentToSend);
      this.contentToSend = "";
    } catch (e) {
      alert(`Error: ${e.message}`);
    }
  }

  beforeUnmount() {
    peer.close();
  }

  toLogout() {
    User.logout();
    this.$router.push({ name: "Login" });
    peer.close();
  }

  toContacts() {
    this.$router.push({ name: "Contacts" });
    peer.conn?.close();
  }
}
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  height: 40px;
}

.chat {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chat-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.message-list {
  max-height: calc(100vh - 110px);
}

.message-input {
  display: flex;
  height: 35px;
  margin-bottom: 8px;
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
</style>
