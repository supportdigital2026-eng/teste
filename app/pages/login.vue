<script setup lang="ts">
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

async function login() {
  if (!email.value || !password.value) return

  loading.value = true
  errorMessage.value = ''
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })
    await navigateTo('/')
  } catch {
    errorMessage.value = 'E-mail ou senha inválidos.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-bg-app flex items-center justify-center p-6">
    <form
      class="w-full max-w-sm rounded-2xl border border-panel-divider bg-panel-bg p-7 shadow-xl"
      @submit.prevent="login"
    >
      <div class="mb-7">
        <p class="text-sm font-semibold uppercase tracking-[0.18em] text-bubble-meta">Atendimento</p>
        <h1 class="mt-2 text-2xl font-semibold text-primary">Entrar no painel</h1>
      </div>

      <label class="mb-4 block text-sm text-primary">
        E-mail
        <input
          v-model="email"
          type="email"
          autocomplete="email"
          required
          class="mt-2 w-full rounded-lg border border-panel-divider bg-bg-app px-3 py-2.5 text-primary outline-none focus:border-check"
        />
      </label>

      <label class="mb-5 block text-sm text-primary">
        Senha
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
          class="mt-2 w-full rounded-lg border border-panel-divider bg-bg-app px-3 py-2.5 text-primary outline-none focus:border-check"
        />
      </label>

      <p v-if="errorMessage" class="mb-4 text-sm text-red-500">{{ errorMessage }}</p>

      <button
        type="submit"
        :disabled="loading"
        class="w-full rounded-lg bg-check px-4 py-2.5 font-semibold text-white transition-opacity disabled:opacity-60"
      >
        {{ loading ? 'Entrando...' : 'Entrar' }}
      </button>
    </form>
  </main>
</template>
