<template>
  <div class="register">
    <h2>Register</h2>
    <div class="register-input" v-if="!privKey">
      <input placeholder="Username" v-model="username" />
      <button :disabled="loading" @click="register">
        Register {{ loading ? " ⌛" : "" }}
      </button>
      <button @click="login">Login</button>
    </div>
    <div class="register-result" v-else>
      <label>Username</label>
      <textarea :value="username" readonly />
      <label>Private key - Take note</label>
      <textarea :value="privKey" readonly />
      <button @click="login">Go to Login</button>
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
  loading = false;

  mounted() {
    if (User.current) {
      this.$router.push({ name: "Contacts" });
    }
  }

  async register() {
    if (!this.username) {
      alert("fill username");
      return;
    }

    try {
      this.loading = true;
      this.privKey = await User.register(this.username);
    } catch (e) {
      alert(e.message);
    } finally {
      this.loading = false;
    }
  }

  login() {
    this.$router.push({ name: "Login" });
  }
}
</script>

<style scoped>
.register-input button {
  margin-left: 5px;
}

.register-input input {
  margin-right: 5px;
}

.register-result {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.register-result textarea {
  margin-bottom: 10px;
  width: 450px;
}

.register-result label {
  width: 450px;
}

.register-result button {
  width: 450px;
}
</style>
