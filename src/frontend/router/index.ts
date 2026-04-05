import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("../views/LoginView.vue"),
      meta: { guest: true },
    },
    {
      path: "/register",
      name: "register",
      component: () => import("../views/RegisterView.vue"),
      meta: { guest: true },
    },
    {
      path: "/",
      component: () => import("../views/AppLayout.vue"),
      meta: { auth: true },
      children: [
        {
          path: "",
          name: "dashboard",
          component: () => import("../views/DashboardView.vue"),
        },
        {
          path: "bookmarks",
          name: "bookmarks",
          component: () => import("../views/BookmarksView.vue"),
        },
        {
          path: "folders/:folderId?",
          name: "folders",
          component: () => import("../views/BookmarksView.vue"),
        },
        {
          path: "tags",
          name: "tags",
          component: () => import("../views/TagsView.vue"),
        },
        {
          path: "search",
          name: "search",
          component: () => import("../views/SearchView.vue"),
        },
        {
          path: "settings",
          name: "settings",
          component: () => import("../views/SettingsView.vue"),
        },
        {
          path: "admin",
          name: "admin",
          component: () => import("../views/AdminView.vue"),
          meta: { admin: true },
        },
      ],
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/",
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Session laden (wenn noch nicht geladen)
  if (!authStore.initialized) {
    await authStore.fetchSession();
  }

  // Authentifizierung prüfen
  if (to.meta.auth && !authStore.isAuthenticated) {
    return next({ name: "login", query: { redirect: to.fullPath } });
  }

  // Gast-Seiten (Login/Register) — wenn eingeloggt → Dashboard
  if (to.meta.guest && authStore.isAuthenticated) {
    return next({ name: "dashboard" });
  }

  // Admin-Check
  if (to.meta.admin && !authStore.isAdmin) {
    return next({ name: "dashboard" });
  }

  next();
});

export { router };
