<template>
  <div class="login">
    <h2>Login</h2>
    <div class="login-input">
      <input placeholder="Username" v-model="username" />
      <input placeholder="Password" type="password" v-model="password" />
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
  password = "";

  async login() {
    try {
      await User.login(this.username, this.password);
      this.$router.push({ name: "Home" });
    } catch (e) {
      alert(e.message);
    }
  }

  async register() {
    try {
      await User.register(this.username, this.password);
      this.$router.push({ name: "Home" });
    } catch (e) {
      alert(e.message);
    }
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
