<script setup lang="ts">
const icons = useIcons()

const dark = ref(false)
const filtro = ref('Favoritas')

// store Pinia: cacheia conversas e mensagens (volta instantânea, sem refetch)
const chat = useChatStore()
const {
  conversas,
  mensagens,
  activeId,
  hasMoreConversas,
  hasMoreMensagens,
} = storeToRefs(chat)

onMounted(async () => {
  try {
    await $fetch('/api/auth/me')
    await chat.loadConversas()
  } catch {
    await navigateTo('/login')
  }
})

const activePeer = computed(() => {
  const c = conversas.value.find((x) => x.id === activeId.value)
  return { name: c?.name ?? '', img: c?.img }
})

function toggleTheme() {
  dark.value = !dark.value
  document.documentElement.setAttribute('data-theme', dark.value ? 'dark' : 'light')
}

function enviarMensagem(text: string) {
  // envia via Datafy (com update otimista dentro da action)
  chat.sendMensagem(text)
}

async function sair() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await navigateTo('/login')
}
</script>

<template>
  <div class="grid grid-cols-[420px_1fr] h-screen bg-bg-app">
    <AreaConversas
      :conversas="conversas"
      :active-id="activeId"
      :filtro="filtro"
      :has-more="hasMoreConversas"
      @select="chat.selectConversa($event)"
      @filtro="filtro = $event"
      @load-more="chat.loadMoreConversas()"
      @logout="sair"
    />

    <AreaMensagens
      :peer="activePeer"
      :mensagens="mensagens"
      :conversation-id="activeId"
      :has-more="hasMoreMensagens"
      @send="enviarMensagem"
      @load-older="chat.loadOlderMensagens"
    />
  </div>

  <!-- toggle de tema flutuante -->
  <button
    class="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-header-bg border border-panel-divider text-icon px-3 py-2 rounded-full cursor-pointer text-[13px] shadow-[0_2px_8px_rgba(0,0,0,0.12)] [&_svg]:w-4 [&_svg]:h-4"
    @click="toggleTheme"
  >
    <span v-html="dark ? icons.sun : icons.moon" />
    {{ dark ? 'Modo claro' : 'Modo escuro' }}
  </button>
</template>
