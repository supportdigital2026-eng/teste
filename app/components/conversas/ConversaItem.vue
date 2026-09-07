<script setup lang="ts">
import type { Conversa } from '~/types/chat'

defineProps<{ conversa: Conversa; active?: boolean }>()
defineEmits<{ select: [id: string] }>()

const icons = useIcons()
</script>

<template>
  <div
    class="flex items-center gap-3.5 px-3.5 py-2.5 cursor-pointer transition-colors hover:bg-hover-row"
    :class="{ 'bg-active-row': active }"
    @click="$emit('select', conversa.id)"
  >
    <!-- avatar -->
    <div
      class="w-12.5 h-12.5 rounded-full shrink-0 overflow-hidden grid place-items-center bg-[#d9f0e3] text-[#6b7c84]"
      :style="conversa.color ? { background: conversa.color, color: '#fff' } : undefined"
    >
      <img v-if="conversa.img" :src="conversa.img" alt="" class="w-full h-full object-cover" />
      <span v-else-if="conversa.initials">{{ conversa.initials }}</span>
      <span v-else class="w-7.5 h-7.5" v-html="icons.person" />
    </div>

    <!-- corpo -->
    <div class="flex-1 min-w-0">
      <div class="flex justify-between items-baseline gap-2">
        <span class="text-base text-text-primary font-normal">{{ conversa.name }}</span>
        <span class="text-xs text-text-secondary shrink-0">{{ conversa.time }}</span>
      </div>
      <div class="flex items-center gap-0.75 text-sm text-text-secondary mt-0.5 overflow-hidden">
        <span
          v-if="conversa.sent"
          class="text-check shrink-0 inline-flex [&_svg]:w-4 [&_svg]:h-4"
          v-html="icons.doubleCheck"
        />
        <span class="overflow-hidden text-ellipsis whitespace-nowrap">{{ conversa.preview }}</span>
      </div>
    </div>
  </div>
</template>
