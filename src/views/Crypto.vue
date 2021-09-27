<template>
  <div class="crypto">
    <h2>Crypto Test</h2>
    <div class="t-input">
      <label>Secret key</label>
      <textarea v-model="key" />
    </div>
    <div class="crypt-input">
      <div class="t-input txt">
        <label>Plain Text</label>
        <textarea v-model="plainText" />
      </div>
      <div class="t-input bts">
        <button @click="cypher">Encrypt &gt;&gt;&gt;</button>
        <button @click="decypher"> &lt;&lt;&lt; Decrypt</button>
      </div>
      <div class="t-input txt">
        <label>Cypher Text</label>
        <textarea v-model="cypherText" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { encrypt, decrypt } from "../utils/crypto";

@Options({})
export default class Login extends Vue {
  key = "";
  plainText = "";
  cypherText = "";

  cypher() {
    this.cypherText = "";

    if (!this.key) {
      alert("fill key");
      return;
    }

    if (!this.plainText) {
      alert("fill plainText");
      return;
    }

    try {
      this.cypherText = encrypt(this.plainText, this.key);
    } catch (e) {
      alert(e.message);
    }
  }

  decypher() {
    this.plainText = "";

    if (!this.key) {
      alert("fill key");
      return;
    }

    if (!this.cypherText) {
      alert("fill cypherText");
      return;
    }

    try {
      this.plainText = decrypt(this.cypherText, this.key);
    } catch (e) {
      alert(e.message);
    }
  }
}
</script>

<style scoped>
.crypto {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.crypt-input {
  display: flex;
  flex-direction: row;
  align-items: end;
  width: 100%;
}

.t-input {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bts {
  width: 100px;
}

.txt {
  width: calc(50% - 50px);
}

textarea {
  width: 450px;
}
</style>
