<template>
  <div class="flex justify-center items-center bg-linear-to-br from-primary-50 dark:from-gray-950 to-primary-100 dark:to-gray-900 p-4 min-h-screen">
    <div class="w-full max-w-md animate-fade-in">
      <!-- Logo -->
      <div class="mb-8 text-center">
        <svg class="shadow-lg mx-auto mb-4 w-16 h-16" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#3b82f6"/>
          <path d="M8 8h6v2H10v12h4v2H8V8zm10 0h6v16h-6v-2h4V10h-4V8z" fill="white"/>
          <circle cx="16" cy="16" r="3" fill="#fbbf24"/>
        </svg>
        <h1 class="font-bold text-gray-900 dark:text-white text-3xl">{{ t('app.name') }}</h1>
        <p class="mt-1 text-gray-500 dark:text-gray-400">{{ t('app.tagline') }}</p>
      </div>

      <!-- Login-Formular -->
      <div class="bg-white dark:bg-gray-900 shadow-xl p-8 border border-gray-200 dark:border-gray-800 rounded-2xl">
        <h2 class="mb-6 font-semibold text-gray-900 dark:text-white text-xl">{{ t('auth.loginTitle') }}</h2>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('auth.email') }}</label>
            <input
              v-model="email"
              type="email"
              required
              :placeholder="t('auth.emailPlaceholder')"
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 focus:border-transparent dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white transition placeholder-gray-400"
            />
          </div>

          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('auth.password') }}</label>
            <input
              v-model="password"
              type="password"
              required
              :placeholder="t('auth.passwordPlaceholder')"
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 focus:border-transparent dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white transition placeholder-gray-400"
            />
          </div>

          <div v-if="error" class="bg-red-50 dark:bg-red-900/20 p-3 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="flex justify-center items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 shadow-sm px-4 py-2.5 rounded-xl w-full font-medium text-white transition"
          >
            <svg v-if="loading" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ loading ? t('auth.loggingIn') : t('auth.login') }}
          </button>
        </form>

        <div class="mt-6 text-center">
          <p class="text-gray-500 dark:text-gray-400 text-sm">
            {{ t('auth.noAccount') }}
            <router-link to="/register" class="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
              {{ t('auth.register') }}
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useI18n } from "../composables/useI18n";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { t } = useI18n();

const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

async function handleLogin() {
  error.value = "";
  loading.value = true;
  try {
    await authStore.login(email.value, password.value);
    const redirect = (route.query.redirect as string) || "/";
    router.push(redirect);
  } catch (e: any) {
    error.value = e.message || t('auth.loginFailed');
  } finally {
    loading.value = false;
  }
}
</script>
