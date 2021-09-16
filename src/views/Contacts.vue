<template>
  <div class="contacts">
    <div class="header">
      <button @click="contacts">Contacts</button>
      <h3 v-if="user">{{ user.username }}: {{ user.connection }}</h3>
      <button @click="logout">Logout</button>
    </div>

    <div class="id-input">
      <input placeholder="Connection ID" v-model="idToConnect" />
      <button @click="connect">Connect</button>
      <button @click="copyId">Copy ID</button>
      <button @click="refreshUsers">Refresh contacts</button>
    </div>

    <div class="contact-list">
      <div class="contact" v-for="u in activeUsers" :key="u.connection">
        <div class="info">
          <span>User: {{ u.username }}</span>
          <span class="pubkey"
            ><pre>Public Key: {{ hashKey(u.pubkey) }}</pre></span
          >
        </div>
        <button @click="connectTo(u.connection)">Connect</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";

import User, { UserAuth } from "../models/user";
import { hashKey } from "../utils/crypto";
import peers from "../utils/peers";
import peer from "../models/peer";
import copy from "../utils/copy";

@Options({
  components: {},
})
export default class Contacts extends Vue {
  hashKey = hashKey;

  idToConnect = "";
  user: User | null = null;

  users: UserAuth[] = [];
  updateInterval: any;

  mounted() {
    if (!User.current) this.$router.push({ name: "Login" });
    this.user = User.current;
    if (!peer.peer) {
      peer.init((c) => {
        this.$router.push({
          name: "Chat",
          params: { id: c.peer },
        });
      });
    }
    this.refreshUsers();
    this.updateInterval = setInterval(() => this.refreshUsers(), 3000);
  }

  beforeUnmount() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  async refreshUsers() {
    const users = await User.listUsers();
    const connectedPeers = await peers();
    console.log({ connectedPeers, users });
    this.users = users.filter((u) => connectedPeers.includes(u.connection));
  }

  get activeUsers(): UserAuth[] {
    return this.users.filter((u) => u.connection !== this.user?.connection);
  }

  copyId() {
    copy(`${this.user?.connection}`);
  }

  connectTo(id: string) {
    this.$router.push({
      name: "Chat",
      params: { id },
    });
  }

  connect() {
    if (this.idToConnect) {
      this.$router.push({
        name: "Chat",
        params: { id: this.idToConnect },
      });
    }
  }

  logout() {
    peer.close();
    User.logout();
    this.$router.push({ name: "Login" });
  }

  contacts() {
    // already here
  }
}
</script>

<style scoped>
.id-input button {
  margin-left: 5px;
}

.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.contact-list {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.contact {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  margin-top: 10px;

  background-color: rgb(165, 204, 172);
  padding: 10px;
  border-radius: 10px;
}

.info {
  display: flex;
  flex-direction: column;
  align-items: start;
  margin-right: 1rem;
}

.pubkey {
  font-size: 0.55rem;
}
</style>
