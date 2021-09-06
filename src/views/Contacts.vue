<template>
  <div class="contacts">
    <div class="header">
      <button @click="contacts">Contacts</button>
      <h3 v-if="user">{{ user.username }}: {{ user.connectionId }}</h3>
      <button @click="logout">Logout</button>
    </div>

    <div class="id-input">
      <input placeholder="ID of user" v-model="idToConnect" />
      <button @click="connect">Connect</button>
      <button @click="copyId">Copy ID</button>
    </div>

    <div class="contact-list">
      <div class="contact" v-for="u in activeUsers" :key="u.connectionId">
        <span>{{ u.username }}</span>
        <button @click="connectTo(u.connectionId)">Connect</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";

import User, { UserAuth } from "../models/user";
import peer from "../models/peer";
import copy from "../utils/copy";

@Options({
  components: {},
})
export default class Contacts extends Vue {
  idToConnect = "";
  user: User | null = null;

  users: UserAuth[] = [];

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
    User.listUsers().then((r) => (this.users = r));
  }

  get activeUsers(): UserAuth[] {
    return this.users.filter((u) => u.connectionId !== this.user?.connectionId);
  }

  copyId() {
    copy(`${this.user?.connectionId}`);
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
    User.logout();
    this.$router.push({ name: "Login" });
  }

  contacts() {
    this.$router.push({ name: "Contacts" });
    peer.close();
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
  width: 300px;

  margin-top: 10px;

  background-color: rgb(165, 204, 172);
  padding: 10px;
  border-radius: 10px;
}
</style>
