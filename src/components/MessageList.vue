<template>
  <div class="message-list">
    <div v-for="msg in messages" :key="msg.sendedAt" class="row">
      <div class="column" v-if="msg.sender !== 'me'">
        <img
          class="message-icon"
          :title="'Sender: ' + msg.sender"
          src="../assets/prof1.png"
        />
        <img
          class="cipher-icon"
          src="../assets/lock.jpg"
          @click="showSecret(msg)"
        />
      </div>

      <div :class="['plain', messageClass(msg)]">
        <pre>{{ msg.plainText }}</pre>
      </div>

      <div class="column" v-if="msg.sender === 'me'">
        <img
          class="message-icon"
          :title="'Sender: ' + msg.sender"
          src="../assets/prof2.png"
        />
        <img
          class="cipher-icon"
          src="../assets/lock.jpg"
          @click="showSecret(msg)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";

interface Message {
  plainText: String;
  cipherText: String;
  sender: String;
  sendedAt: String;
}

@Options({
  props: {
    messages: Object,
  },
})
export default class MessageList extends Vue {
  messages!: Message[];

  messageClass(msg: Message) {
    return msg.sender === "me" ? "self-message" : "other-message";
  }

  showSecret(msg: Message) {
    alert('Ciphertext:\n' + msg.cipherText);
  }
}
</script>

<style scoped>
.column {
  display: flex;
  flex-direction: column;
}

.row {
  display: flex;
  flex-direction: row;
}

.message-list {
  overflow: auto;
}

.message-icon {
  height: 24px;
  width: 24px;
}

.cipher-icon {
  cursor: pointer; 
  height: 17px;
  width: 20px;
}

.plain {
  flex-grow: 1;
  height: 100%;
  margin: 10px;
  border-radius: 8px;
}

.self-message {
  background: #cceced;
  border-top-right-radius: 0;
  margin-left: 100px;
}

.other-message {
  background: #cef0da;
  border-top-left-radius: 0;
  margin-right: 100px;
}
</style>
