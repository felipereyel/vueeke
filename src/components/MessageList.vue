<template>
  <div class="message-list">
    <div v-for="msg in messages" :key="msg.sendedAt" class="message">
      <img
        class="message-icon"
        :title="'Sender: ' + msg.sender"
        src="../assets/prof1.png"
        v-if="msg.sender !== 'me'"
      />
      <div :class="['content', messageClass(msg)]">
        <pre>{{ msg.content }}</pre>
      </div>
      <img
        class="message-icon"
        :title="'Sender: ' + msg.sender"
        src="../assets/prof2.png"
        v-if="msg.sender === 'me'"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";

interface Message {
  content: String;
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
}
</script>

<style scoped>
.message-list {
  overflow: auto;
}

.message {
  display: flex;
  flex-direction: row;
}

.message .message-icon {
  height: 24px;
  width: 24px;
}

.message .content {
  flex-grow: 1;
  height: 100%;
  margin: 10px;
  border-radius: 8px;
}

.message .self-message {
  background: #cceced;
  border-top-right-radius: 0;
  margin-left: 100px;
}

.message .other-message {
  background: #cef0da;
  border-top-left-radius: 0;
  margin-right: 100px;
}
</style>
