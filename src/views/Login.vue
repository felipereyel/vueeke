<template>
  <div class="login">
    <h2>Login</h2>
    <div class="login-input">
      <input placeholder="Username" v-model="username" />
      <input placeholder="Private Key" type="password" v-model="privKey" />
      <button @click="login">Login</button>
      <button @click="register">Register</button>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import User from "../models/user";

@Options({})
export default class Login extends Vue {
  username = "";
  privKey = "";

  mounted() {
    if (User.current) {
      this.$router.push({ name: "Contacts" });
    }
  }

  async login() {
    try {
      await User.login(this.username, this.privKey);
      this.$router.push({ name: "Contacts" });
    } catch (e) {
      alert(e.message);
    }
  }

  async register() {
    this.$router.push({ name: "Register" });
  }
}
</script>

<style scoped>
.login-input button {
  margin-left: 5px;
}

.login-input input {
  margin-right: 5px;
}
</style>
