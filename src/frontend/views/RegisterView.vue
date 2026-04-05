<template>
  <div class="flex justify-center items-center bg-linear-to-br from-primary-50 dark:from-gray-950 to-primary-100 dark:to-gray-900 p-4 min-h-screen">
    <div class="w-full max-w-md animate-fade-in">
      <!-- Logo -->
      <div class="mb-8 text-center">
        <div class="inline-flex justify-center items-center bg-primary-500 shadow-lg mb-4 rounded-2xl w-16 h-16">
          <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
        <h1 class="font-bold text-gray-900 dark:text-white text-3xl">Keepomat</h1>
        <p class="mt-1 text-gray-500 dark:text-gray-400">Smart Bookmark Manager</p>
      </div>

      <!-- Register-Formular -->
      <div class="bg-white dark:bg-gray-900 shadow-xl p-8 border border-gray-200 dark:border-gray-800 rounded-2xl">
        <h2 class="mb-2 font-semibold text-gray-900 dark:text-white text-xl">Konto erstellen</h2>
        <p v-if="isFirstUser" class="flex items-center gap-1.5 mb-6 text-amber-600 dark:text-amber-400 text-sm">
          <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          Der erste Benutzer wird automatisch Administrator.
        </p>

        <form @submit.prevent="handleRegister" class="space-y-4">
          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">Name</label>
            <input
              v-model="name"
              type="text"
              required
              placeholder="Dein Name"
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 focus:border-transparent dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white transition placeholder-gray-400"
            />
          </div>

          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">E-Mail</label>
            <input
              v-model="email"
              type="email"
              required
              placeholder="du@beispiel.de"
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 focus:border-transparent dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white transition placeholder-gray-400"
            />
          </div>

          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">Passwort</label>
            <input
              v-model="password"
              type="password"
              required
              minlength="8"
              placeholder="Mindestens 8 Zeichen"
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 focus:border-transparent dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white transition placeholder-gray-400"
            />
          </div>

          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">Passwort bestätigen</label>
            <input
              v-model="confirmPassword"
              type="password"
              required
              placeholder="Passwort wiederholen"
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 focus:border-transparent dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white transition placeholder-gray-400"
            />
          </div>

          <div v-if="error" class="bg-red-50 dark:bg-red-900/20 p-3 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="loading || !registrationOpen"
            class="flex justify-center items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 shadow-sm px-4 py-2.5 rounded-xl w-full font-medium text-white transition"
          >
            <svg v-if="loading" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ loading ? 'Wird erstellt...' : 'Konto erstellen' }}
          </button>
        </form>

        <div v-if="!registrationOpen" class="bg-amber-50 dark:bg-amber-900/20 mt-4 p-3 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-400 text-sm text-center">
          Registrierung ist derzeit deaktiviert.
        </div>

        <div class="mt-6 text-center">
          <p class="text-gray-500 dark:text-gray-400 text-sm">
            Bereits ein Konto?
            <router-link to="/login" class="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
              Anmelden
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const name = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const error = ref("");
const loading = ref(false);
const isFirstUser = ref(false);
const registrationOpen = ref(true);

onMounted(async () => {
  try {
    const res = await fetch("/api/admin/registration-status");
    if (res.ok) {
      const data = await res.json();
      isFirstUser.value = data.isFirstUser;
      registrationOpen.value = data.registrationOpen || data.isFirstUser;
    }
  } catch {
    // Standardmäßig offen lassen
  }
});

async function handleRegister() {
  error.value = "";

  if (password.value !== confirmPassword.value) {
    error.value = "Passwörter stimmen nicht überein";
    return;
  }

  if (password.value.length < 8) {
    error.value = "Passwort muss mindestens 8 Zeichen lang sein";
    return;
  }

  loading.value = true;
  try {
    await authStore.register(name.value, email.value, password.value);
    router.push("/");
  } catch (e: any) {
    error.value = e.message || "Registrierung fehlgeschlagen";
  } finally {
    loading.value = false;
  }
}
</script>
