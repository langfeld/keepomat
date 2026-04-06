<template>
  <div class="p-6 lg:p-8 animate-fade-in">
    <h1 class="mb-6 font-bold text-gray-900 dark:text-white text-2xl">{{ t('settings.title') }}</h1>

    <div class="space-y-6">
      <!-- Allgemein -->
      <div class="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 rounded-2xl">
        <h2 class="mb-4 font-semibold text-gray-900 dark:text-white text-lg">{{ t('settings.general') }}</h2>

        <div class="space-y-4">
          <!-- Theme -->
          <div>
            <label class="block mb-2 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('settings.theme') }}</label>
            <div class="flex gap-2">
              <button
                v-for="theme in themes"
                :key="theme.value"
                @click="updateTheme(theme.value)"
                :class="[
                  'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition',
                  settingsStore.settings?.theme === theme.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                ]"
              >
                <span v-html="theme.icon" />
                {{ theme.label }}
              </button>
            </div>
          </div>

          <!-- Sprache -->
          <div>
            <label class="block mb-2 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('settings.language') }}</label>
            <SearchableSelect
              :model-value="language"
              :options="languageOptions"
              @update:model-value="language = String($event); saveSetting('language', language)"
            />
          </div>

          <!-- Ordnermodus -->
          <div>
            <label class="block mb-2 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('settings.folderMode') }}</label>
            <div class="flex gap-2">
              <button
                @click="saveSetting('folderMode', 'single')"
                :class="[
                  'px-4 py-2 rounded-xl border text-sm font-medium transition',
                  settingsStore.settings?.folderMode === 'single'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                ]"
              >
                {{ t('settings.folderModeSingle') }}
              </button>
              <button
                @click="saveSetting('folderMode', 'multi')"
                :class="[
                  'px-4 py-2 rounded-xl border text-sm font-medium transition',
                  settingsStore.settings?.folderMode === 'multi'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                ]"
              >
                {{ t('settings.folderModeMulti') }}
              </button>
            </div>
            <p class="mt-1 text-gray-400 dark:text-gray-500 text-xs">
              {{ settingsStore.settings?.folderMode === 'multi' ? t('settings.folderModeMultiHint') : t('settings.folderModeSingleHint') }}
            </p>
          </div>
        </div>
      </div>

      <!-- API-Schlüssel -->
      <div id="api-keys" class="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 rounded-2xl transition-shadow duration-700">
        <div class="flex justify-between items-center mb-2">
          <h2 class="font-semibold text-gray-900 dark:text-white text-lg">{{ t('settings.apiKeys') }}</h2>
          <button
            @click="createApiKey"
            class="bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg font-medium text-white text-sm transition"
          >
            {{ t('settings.apiKeyNew') }}
          </button>
        </div>
        <p class="mb-4 text-gray-500 dark:text-gray-400 text-sm">{{ t('settings.apiKeysDescription') }}</p>

        <!-- Neuer Schlüssel anzeigen -->
        <div v-if="newApiKey" class="bg-green-50 dark:bg-green-900/20 mb-4 p-4 border border-green-200 dark:border-green-800 rounded-xl">
          <p class="mb-2 font-medium text-green-700 dark:text-green-400 text-sm">{{ t('settings.apiKeyCreatedMsg') }}</p>
          <div class="flex items-center gap-2">
            <code class="flex-1 bg-green-100 dark:bg-green-900/40 px-3 py-2 rounded-lg font-mono text-green-800 dark:text-green-300 text-sm break-all">{{ newApiKey }}</code>
            <button @click="copyKey" class="bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg text-white text-sm transition">
              {{ t('common.copy') }}
            </button>
          </div>
        </div>

        <div v-if="apiKeys.length" class="space-y-2">
          <div
            v-for="key in apiKeys"
            :key="key.id"
            class="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-xl"
          >
            <div>
              <p class="font-medium text-gray-900 dark:text-white text-sm">{{ key.name }}</p>
              <p class="text-gray-400 text-xs">{{ t('settings.apiKeyCreatedAt') }} {{ formatDate(key.createdAt) }}</p>
            </div>
            <button
              @click="deleteApiKey(key.id)"
              class="p-1 text-red-500 hover:text-red-700 transition"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        <p v-else class="text-gray-400 dark:text-gray-500 text-sm">{{ t('settings.apiKeysEmpty') }}</p>
      </div>

      <!-- Browser-Erweiterung -->
      <div id="extension" class="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 rounded-2xl transition-shadow duration-700">
        <div class="flex items-center gap-3 mb-2">
          <div class="flex justify-center items-center bg-blue-100 dark:bg-blue-900/30 rounded-xl w-10 h-10">
            <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <h2 class="font-semibold text-gray-900 dark:text-white text-lg">{{ t('settings.extension') }}</h2>
        </div>
        <p class="mb-4 text-gray-500 dark:text-gray-400 text-sm">{{ t('settings.extensionDescription') }}</p>

        <!-- Features -->
        <div class="mb-4">
          <h3 class="mb-2 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('settings.extensionFeatures') }}</h3>
          <ul class="space-y-1.5">
            <li class="flex items-start gap-2 text-gray-600 dark:text-gray-400 text-sm">
              <svg class="w-4 h-4 mt-0.5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              {{ t('settings.extensionFeature1') }}
            </li>
            <li class="flex items-start gap-2 text-gray-600 dark:text-gray-400 text-sm">
              <svg class="w-4 h-4 mt-0.5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              {{ t('settings.extensionFeature2') }}
            </li>
            <li class="flex items-start gap-2 text-gray-600 dark:text-gray-400 text-sm">
              <svg class="w-4 h-4 mt-0.5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              {{ t('settings.extensionFeature3') }}
            </li>
          </ul>
        </div>

        <!-- Setup-Anleitung -->
        <details class="group">
          <summary class="flex items-center gap-2 cursor-pointer text-primary-600 dark:text-primary-400 text-sm font-medium hover:text-primary-700 dark:hover:text-primary-300 transition">
            <svg class="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            {{ t('settings.extensionSetup') }}
          </summary>
          <div class="mt-3 ml-6 space-y-2">
            <ol class="space-y-2 text-gray-600 dark:text-gray-400 text-sm list-decimal list-inside">
              <li>{{ t('settings.extensionStep1', { folder: 'extension/' }) }}</li>
              <li>
                {{ t('settings.extensionStep2', { page: '' }) }}
                <code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs">chrome://extensions</code>
              </li>
              <li>{{ t('settings.extensionStep3') }}</li>
              <li>{{ t('settings.extensionStep4', { folder: 'extension/' }) }}</li>
              <li>{{ t('settings.extensionStep5') }}</li>
            </ol>
            <p class="mt-3 text-amber-600 dark:text-amber-400 text-xs font-medium">
              💡 {{ t('settings.extensionNeedsKey') }}
            </p>
          </div>
        </details>
      </div>

      <!-- Userscript (Alternative) -->
      <div id="userscript" class="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 rounded-2xl transition-shadow duration-700">
        <div class="flex items-center gap-3 mb-2">
          <div class="flex justify-center items-center bg-amber-100 dark:bg-amber-900/30 rounded-xl w-10 h-10">
            <svg class="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <h2 class="font-semibold text-gray-900 dark:text-white text-lg">{{ t('settings.userscript') }}</h2>
        </div>
        <p class="mb-4 text-gray-500 dark:text-gray-400 text-sm">{{ t('settings.userscriptDescription') }}</p>

        <!-- Features -->
        <div class="mb-4">
          <h3 class="mb-2 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('settings.userscriptFeatures') }}</h3>
          <ul class="space-y-1.5">
            <li class="flex items-start gap-2 text-gray-600 dark:text-gray-400 text-sm">
              <svg class="w-4 h-4 mt-0.5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              {{ t('settings.userscriptFeature1') }}
            </li>
            <li class="flex items-start gap-2 text-gray-600 dark:text-gray-400 text-sm">
              <svg class="w-4 h-4 mt-0.5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              {{ t('settings.userscriptFeature2') }}
            </li>
            <li class="flex items-start gap-2 text-gray-600 dark:text-gray-400 text-sm">
              <svg class="w-4 h-4 mt-0.5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              {{ t('settings.userscriptFeature3') }}
            </li>
            <li class="flex items-start gap-2 text-gray-600 dark:text-gray-400 text-sm">
              <svg class="w-4 h-4 mt-0.5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              {{ t('settings.userscriptFeature4') }}
            </li>
          </ul>
        </div>

        <!-- Install-Link -->
        <div class="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 mb-4 p-3 border border-amber-200 dark:border-amber-800 rounded-xl">
          <svg class="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <a
            :href="userscriptUrl"
            class="font-medium text-amber-700 dark:text-amber-400 text-sm hover:underline"
          >
            {{ t('settings.userscriptInstallLink') }}
          </a>
        </div>

        <!-- Kompatibilität -->
        <p class="mb-2 text-gray-500 dark:text-gray-400 text-xs">{{ t('settings.userscriptManagers') }}</p>
        <div class="flex flex-wrap gap-2 mb-4">
          <a href="https://www.tampermonkey.net/" target="_blank" rel="noopener" class="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-2.5 py-1 rounded-lg text-gray-600 dark:text-gray-400 text-xs transition">Tampermonkey</a>
          <a href="https://violentmonkey.github.io/" target="_blank" rel="noopener" class="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-2.5 py-1 rounded-lg text-gray-600 dark:text-gray-400 text-xs transition">Violentmonkey</a>
          <a href="https://www.greasespot.net/" target="_blank" rel="noopener" class="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-2.5 py-1 rounded-lg text-gray-600 dark:text-gray-400 text-xs transition">Greasemonkey</a>
        </div>

        <!-- Setup-Anleitung -->
        <details class="group">
          <summary class="flex items-center gap-2 cursor-pointer text-primary-600 dark:text-primary-400 text-sm font-medium hover:text-primary-700 dark:hover:text-primary-300 transition">
            <svg class="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            {{ t('settings.userscriptInstall') }}
          </summary>
          <div class="mt-3 ml-6 space-y-2">
            <ol class="space-y-2 text-gray-600 dark:text-gray-400 text-sm list-decimal list-inside">
              <li>{{ t('settings.userscriptStep1', { manager: 'Tampermonkey' }) }}</li>
              <li>{{ t('settings.userscriptStep2') }}</li>
              <li>{{ t('settings.userscriptStep3') }}</li>
              <li>{{ t('settings.userscriptStep4') }}</li>
              <li>{{ t('settings.userscriptStep5') }}</li>
            </ol>
            <p class="mt-3 text-amber-600 dark:text-amber-400 text-xs font-medium">
              💡 {{ t('settings.userscriptNeedsKey') }}
            </p>
          </div>
        </details>
      </div>

      <!-- Telegram -->
      <div id="telegram" class="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 rounded-2xl transition-shadow duration-700">
        <div class="flex items-center gap-3 mb-2">
          <div class="flex justify-center items-center bg-sky-100 dark:bg-sky-900/30 rounded-xl w-10 h-10">
            <svg class="w-5 h-5 text-sky-600 dark:text-sky-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </div>
          <div class="flex-1">
            <h2 class="font-semibold text-gray-900 dark:text-white text-lg">{{ t('settings.telegram') }}</h2>
          </div>
          <span v-if="telegramLinked" class="bg-green-100 dark:bg-green-900/20 px-2.5 py-1 rounded-full text-green-700 dark:text-green-400 text-xs font-medium">
            {{ t('settings.telegramLinked') }}
          </span>
          <span v-else class="bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full text-gray-500 dark:text-gray-400 text-xs font-medium">
            {{ t('settings.telegramNotLinked') }}
          </span>
        </div>
        <p class="mb-4 text-gray-500 dark:text-gray-400 text-sm">
          {{ t('settings.telegramDescription') }}
        </p>

        <!-- Features -->
        <div class="mb-4">
          <h3 class="mb-2 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('settings.telegramFeatures') }}</h3>
          <ul class="space-y-1.5">
            <li class="flex items-start gap-2 text-gray-600 dark:text-gray-400 text-sm">
              <svg class="w-4 h-4 mt-0.5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              {{ t('settings.telegramFeature1') }}
            </li>
            <li class="flex items-start gap-2 text-gray-600 dark:text-gray-400 text-sm">
              <svg class="w-4 h-4 mt-0.5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              {{ t('settings.telegramFeature2') }}
            </li>
            <li class="flex items-start gap-2 text-gray-600 dark:text-gray-400 text-sm">
              <svg class="w-4 h-4 mt-0.5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              {{ t('settings.telegramFeature3') }}
            </li>
            <li class="flex items-start gap-2 text-gray-600 dark:text-gray-400 text-sm">
              <svg class="w-4 h-4 mt-0.5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              {{ t('settings.telegramFeature4') }}
            </li>
          </ul>
        </div>

        <!-- Verknüpfungs-Status -->
        <div v-if="telegramLinked" class="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 mb-4 p-3 border border-green-200 dark:border-green-800 rounded-xl">
          <svg class="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span class="text-green-700 dark:text-green-400 text-sm">{{ t('settings.telegramLinked') }}</span>
        </div>

        <!-- Bot-Befehle -->
        <div class="mb-4">
          <h3 class="mb-2 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('settings.telegramCommands') }}</h3>
          <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl space-y-1">
            <p class="text-gray-600 dark:text-gray-400 font-mono text-xs">{{ t('settings.telegramCmdStart') }}</p>
            <p class="text-gray-600 dark:text-gray-400 font-mono text-xs">{{ t('settings.telegramCmdRecent') }}</p>
            <p class="text-gray-600 dark:text-gray-400 font-mono text-xs">{{ t('settings.telegramCmdSearch') }}</p>
            <p class="text-gray-600 dark:text-gray-400 font-mono text-xs">{{ t('settings.telegramCmdHelp') }}</p>
          </div>
        </div>

        <!-- Setup-Anleitung -->
        <details v-if="!telegramLinked" class="group">
          <summary class="flex items-center gap-2 cursor-pointer text-primary-600 dark:text-primary-400 text-sm font-medium hover:text-primary-700 dark:hover:text-primary-300 transition">
            <svg class="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            {{ t('settings.telegramSetup') }}
          </summary>
          <div class="mt-3 ml-6">
            <ol class="space-y-2 text-gray-600 dark:text-gray-400 text-sm list-decimal list-inside">
              <li>{{ t('settings.telegramStep1') }}</li>
              <li>
                {{ t('settings.telegramStep2').split('/start')[0] }}<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs">/start</code>{{ t('settings.telegramStep2').split('/start')[1] || '' }}
              </li>
              <li>{{ t('settings.telegramStep3') }}</li>
              <li>{{ t('settings.telegramStep4') }}</li>
            </ol>
          </div>
        </details>
      </div>

      <!-- Eigener AI-Provider -->
      <div class="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 rounded-2xl">
        <div class="flex justify-between items-center mb-2">
          <h2 class="font-semibold text-gray-900 dark:text-white text-lg">{{ t('settings.ai') }}</h2>
          <span
            v-if="settingsStore.settings.aiProvider && settingsStore.settings.aiApiKey"
            class="bg-green-100 dark:bg-green-900/20 px-2.5 py-1 rounded-full text-green-700 dark:text-green-400 text-xs font-medium"
          >
            {{ t('settings.aiActive') }}
          </span>
          <span
            v-else
            class="bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full text-gray-500 dark:text-gray-400 text-xs font-medium"
          >
            {{ t('settings.aiUsingSystem') }}
          </span>
        </div>
        <p class="mb-4 text-gray-500 dark:text-gray-400 text-sm">{{ t('settings.aiDescription') }}</p>

        <div class="space-y-4">
          <!-- Provider -->
          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('settings.aiProvider') }}</label>
            <SearchableSelect
              :model-value="aiProvider"
              :options="aiProviderOptions"
              :placeholder="t('settings.aiProviderNone')"
              @update:model-value="aiProvider = String($event); onAiProviderChange()"
            />
          </div>

          <!-- API Key (nur wenn Provider gewählt) -->
          <div v-if="aiProvider && aiProvider !== 'ollama'">
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('settings.aiApiKey') }}</label>
            <input
              v-model="aiApiKey"
              type="password"
              :placeholder="t('settings.aiApiKeyPlaceholder')"
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 focus:border-transparent dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white transition placeholder-gray-400"
            />
            <p class="mt-1 text-gray-400 dark:text-gray-500 text-xs">{{ t('settings.aiApiKeyHint') }}</p>
          </div>

          <!-- Modell -->
          <div v-if="aiProvider">
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('settings.aiModel') }}</label>
            <input
              v-model="aiModel"
              type="text"
              :placeholder="aiModelPlaceholder"
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 focus:border-transparent dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white transition placeholder-gray-400"
            />
          </div>

          <!-- Base URL (nur für Ollama oder Custom) -->
          <div v-if="aiProvider === 'ollama'">
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('settings.aiBaseUrl') }}</label>
            <input
              v-model="aiBaseUrl"
              type="url"
              :placeholder="t('settings.aiBaseUrlPlaceholder')"
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 focus:border-transparent dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white transition placeholder-gray-400"
            />
            <p class="mt-1 text-gray-400 dark:text-gray-500 text-xs">{{ t('settings.aiBaseUrlHint') }}</p>
          </div>

          <!-- Buttons -->
          <div class="flex flex-wrap gap-2 pt-2">
            <button
              @click="saveAiSettings"
              :disabled="!aiProvider || (aiProvider !== 'ollama' && !aiApiKey)"
              class="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed px-4 py-2 rounded-xl font-medium text-white disabled:text-gray-500 text-sm transition"
            >
              {{ t('common.save') }}
            </button>
            <button
              v-if="aiProvider"
              @click="testAiConnection"
              :disabled="aiTesting || !aiProvider || (aiProvider !== 'ollama' && !aiApiKey)"
              class="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 disabled:opacity-50 px-4 py-2 rounded-xl font-medium text-gray-700 dark:text-gray-300 text-sm transition"
            >
              {{ aiTesting ? t('settings.aiTesting') : t('settings.aiTest') }}
            </button>
            <button
              v-if="settingsStore.settings.aiProvider"
              @click="removeAiConfig"
              class="hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-xl font-medium text-red-500 hover:text-red-700 text-sm transition"
            >
              {{ t('settings.aiRemove') }}
            </button>
          </div>

          <!-- Test-Ergebnis -->
          <div v-if="aiTestResult" :class="[
            'p-3 rounded-xl text-sm border',
            aiTestResult.success
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
          ]">
            {{ aiTestResult.success
              ? t('settings.aiTestSuccess', { message: aiTestResult.message, duration: aiTestResult.duration })
              : t('settings.aiTestFailed', { message: aiTestResult.message }) }}
          </div>
        </div>
      </div>

      <!-- Import/Export Einstellungen -->
      <div class="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 rounded-2xl">
        <h2 class="mb-4 font-semibold text-gray-900 dark:text-white text-lg">{{ t('settings.importExport') }}</h2>
        <div class="flex gap-3">
          <button
            @click="exportSettings"
            class="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-4 py-2 rounded-xl font-medium text-gray-700 dark:text-gray-300 text-sm transition"
          >
            {{ t('settings.export') }}
          </button>
          <label class="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-4 py-2 rounded-xl font-medium text-gray-700 dark:text-gray-300 text-sm transition cursor-pointer">
            {{ t('settings.import') }}
            <input type="file" accept=".json" class="hidden" @change="importSettings" />
          </label>
        </div>
      </div>

      <!-- Gespeichert-Meldung -->
      <div v-if="saved" class="right-6 bottom-6 z-50 fixed bg-green-600 shadow-lg px-4 py-2.5 rounded-xl font-medium text-white text-sm animate-slide-up">
        {{ t('settings.saved') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import { useRoute } from "vue-router";
import { useSettingsStore } from "../stores/settings";
import { useI18n } from "../composables/useI18n";
import { useConfirm } from "../composables/useConfirm";
import { useToast } from "../composables/useToast";
import SearchableSelect from "../components/SearchableSelect.vue";
import type { SelectOption } from "../components/SearchableSelect.vue";

const route = useRoute();

const settingsStore = useSettingsStore();
const { t } = useI18n();
const { confirm } = useConfirm();
const toast = useToast();

const language = ref("de");
const languageOptions: SelectOption[] = [
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'English' },
];
const apiKeys = ref<any[]>([]);
const newApiKey = ref("");
const telegramLinked = ref(false);
const saved = ref(false);

// AI-Einstellungen
const aiProvider = ref("");
const aiProviderOptions: SelectOption[] = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'groq', label: 'Groq' },
  { value: 'mistral', label: 'Mistral' },
  { value: 'ollama', label: 'Ollama (lokal)' },
  { value: 'kimi', label: 'Kimi (Moonshot)' },
];
const aiApiKey = ref("");
const aiModel = ref("");
const aiBaseUrl = ref("");
const aiTesting = ref(false);
const aiTestResult = ref<{ success: boolean; message: string; duration: number } | null>(null);

const defaultModels: Record<string, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-sonnet-4-20250514",
  groq: "llama-3.3-70b-versatile",
  mistral: "mistral-small-latest",
  ollama: "llama3.2",
  kimi: "kimi-k2-turbo-preview",
};

const aiModelPlaceholder = computed(() => {
  if (!aiProvider.value) return t("settings.aiModelPlaceholder");
  return defaultModels[aiProvider.value] || t("settings.aiModelPlaceholder");
});

const userscriptUrl = computed(() => {
  return `${window.location.origin}/keepomat.user.js`;
});

const themes = computed(() => [
  { value: "light", label: t('settings.themeLight'), icon: "☀️" },
  { value: "dark", label: t('settings.themeDark'), icon: "🌙" },
  { value: "system", label: t('settings.themeSystem'), icon: "💻" },
]);

onMounted(async () => {
  await settingsStore.fetchSettings();
  language.value = settingsStore.settings?.language || "de";
  // AI-Einstellungen laden
  aiProvider.value = settingsStore.settings?.aiProvider || "";
  aiApiKey.value = settingsStore.settings?.aiApiKey || ""; // Maskierter Wert z.B. "****5678"
  aiModel.value = settingsStore.settings?.aiModel || "";
  aiBaseUrl.value = settingsStore.settings?.aiBaseUrl || "";
  await loadApiKeys();

  // Hash-basiertes Scrollen + Highlight
  await nextTick();
  const hash = route.hash?.slice(1);
  if (hash) {
    const el = document.getElementById(hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("settings-highlight");
      setTimeout(() => el.classList.remove("settings-highlight"), 2000);
    }
  }
});

function updateTheme(theme: string) {
  saveSetting("theme", theme);
}

async function saveSetting(key: string, value: string) {
  await settingsStore.updateSettings({ [key]: value });
  showSaved();
}

function showSaved() {
  saved.value = true;
  setTimeout(() => (saved.value = false), 2000);
}

async function loadApiKeys() {
  try {
    const res = await fetch("/api/keys");
    if (res.ok) apiKeys.value = await res.json();
  } catch {}
}

async function createApiKey() {
  const name = prompt(t('settings.apiKeyNamePrompt'));
  if (!name) return;

  try {
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const data = await res.json();
      newApiKey.value = data.key;
      await loadApiKeys();
    }
  } catch {}
}

async function deleteApiKey(id: string) {
  const ok = await confirm({
    title: t('common.delete'),
    message: t('settings.apiKeyDeleteConfirm'),
    confirmText: t('common.delete'),
    variant: 'danger',
  });
  if (!ok) return;
  try {
    await fetch(`/api/keys/${id}`, { method: "DELETE" });
    await loadApiKeys();
    if (newApiKey.value) newApiKey.value = "";
    toast.success(t('toast.apiKeyDeleted'));
  } catch {
    toast.error(t('common.saveError'));
  }
}

function copyKey() {
  navigator.clipboard.writeText(newApiKey.value);
}

async function exportSettings() {
  try {
    const res = await fetch("/api/settings/export");
    if (res.ok) {
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "keepomat-settings.json";
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch {}
}

async function importSettings(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    const res = await fetch("/api/settings/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      await settingsStore.fetchSettings();
      showSaved();
    }
  } catch {
    toast.error(t('common.importFailed'));
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("de-DE");
}

// ── AI-Einstellungen ──

function onAiProviderChange() {
  aiModel.value = "";
  aiApiKey.value = "";
  aiBaseUrl.value = "";
  aiTestResult.value = null;
}

async function saveAiSettings() {
  try {
    const data: Record<string, any> = {
      aiProvider: aiProvider.value || null,
      aiModel: aiModel.value || null,
      aiBaseUrl: aiBaseUrl.value || null,
    };
    // API-Key nur senden wenn er geändert wurde (nicht der maskierte Wert)
    if (aiApiKey.value && !aiApiKey.value.startsWith("****")) {
      data.aiApiKey = aiApiKey.value;
    }
    await settingsStore.updateSettings(data);
    showSaved();
  } catch {
    toast.error(t("common.saveError"));
  }
}

async function removeAiConfig() {
  try {
    await settingsStore.updateSettings({
      aiProvider: null,
      aiApiKey: null,
      aiModel: null,
      aiBaseUrl: null,
    });
    aiProvider.value = "";
    aiApiKey.value = "";
    aiModel.value = "";
    aiBaseUrl.value = "";
    aiTestResult.value = null;
    showSaved();
  } catch {
    toast.error(t("common.saveError"));
  }
}

async function testAiConnection() {
  // Erst speichern, dann testen
  await saveAiSettings();
  aiTesting.value = true;
  aiTestResult.value = null;
  try {
    const res = await fetch("/api/settings/ai/test", {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) {
      aiTestResult.value = await res.json();
    } else {
      aiTestResult.value = { success: false, message: "Server error", duration: 0 };
    }
  } catch {
    aiTestResult.value = { success: false, message: "Network error", duration: 0 };
  } finally {
    aiTesting.value = false;
  }
}
</script>

<style scoped>
.settings-highlight {
  box-shadow: 0 0 0 3px var(--color-primary-400);
  animation: settings-highlight-fade 2s ease-out forwards;
}

@keyframes settings-highlight-fade {
  0% { box-shadow: 0 0 0 3px var(--color-primary-400); }
  70% { box-shadow: 0 0 0 3px var(--color-primary-400); }
  100% { box-shadow: 0 0 0 0 transparent; }
}
</style>
