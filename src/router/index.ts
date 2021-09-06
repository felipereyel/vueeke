import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "Contacts",
    component: () => import("../views/Contacts.vue"),
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("../views/Login.vue"),
  },
  {
    path: "/chat/:id",
    name: "Chat",
    component: () => import("../views/Chat.vue"),
  },
  {
    path: "/about",
    name: "About",
    component: () => import("../views/About.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
