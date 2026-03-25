<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  activeView: {
    type: String,
    default: 'dashboard'
  },
  displayName: {
    type: String,
    default: 'Operador'
  },
  displayEmail: {
    type: String,
    default: 'vault@local'
  },
  totalCount: {
    type: Number,
    default: 0
  },
  websiteCount: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  unlocked: {
    type: Boolean,
    default: false
  }
})

defineEmits(['logout'])

const categories = computed(() => [
  {
    label: 'Contraseñas',
    count: props.totalCount,
    to: '/dashboard',
    active: props.activeView === 'dashboard'
  },
  {
    label: 'Sitios web',
    count: props.websiteCount,
    to: '/dashboard',
    active: false
  },
  {
    label: 'Revisar',
    count: props.reviewCount,
    to: '/dashboard',
    active: false
  }
])
</script>

<template>
  <aside class="min-w-0 xl:min-h-[calc(100vh-2.5rem)]">
    <div class="flex h-full flex-col gap-4">
      <div class="panel-surface rounded-[24px] p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-14 w-14 items-center justify-center rounded-[18px] border border-cyan-400/20 bg-cyan-500/10 text-cyan-300 shadow-[0_18px_50px_rgba(7,156,193,0.18)]">
            <svg viewBox="0 0 24 24" class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.7 2.1 5.6 3 8 3v4.9c0 4.8-3.2 9.1-8 10.8-4.8-1.7-8-6-8-10.8V6c2.4 0 5.3-.9 8-3Z" />
            </svg>
          </div>

          <div class="min-w-0">
            <h1 class="truncate text-2xl font-semibold text-slate-50">Cinnamon Key</h1>
            <p class="mt-0.5 text-sm text-slate-400">Password Manager</p>
          </div>
        </div>

        <div class="mt-4 rounded-[18px] border border-white/6 bg-white/[0.02] p-3.5">
          <p class="text-[11px] uppercase tracking-[0.24em] text-slate-500">Sesión actual</p>
          <p class="mt-2 truncate text-base font-semibold text-slate-100">{{ displayName }}</p>
          <p class="mt-1 truncate text-sm text-slate-400">{{ displayEmail }}</p>
          <p class="mt-2 text-xs" :class="unlocked ? 'text-emerald-300' : 'text-amber-300'">
            {{ unlocked ? 'Bóveda desbloqueada' : 'Bóveda bloqueada' }}
          </p>
        </div>
      </div>

      <RouterLink
        to="/dashboard/new"
        class="button-primary flex items-center justify-center gap-3 rounded-[18px] px-4 py-3.5 text-lg font-semibold transition"
        :class="activeView === 'new' ? 'ring-2 ring-cyan-200/20' : ''"
      >
        <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 5.25v13.5M18.75 12H5.25" />
        </svg>
        Nuevo registro
      </RouterLink>

      <nav class="panel-surface rounded-[24px] p-3.5">
        <p class="px-2 pb-2 text-[11px] uppercase tracking-[0.25em] text-slate-500">Categorías</p>
        <div class="space-y-1.5">
          <RouterLink
            v-for="item in categories"
            :key="item.label"
            :to="item.to"
            class="flex items-center justify-between rounded-[16px] px-3 py-2.5 transition"
            :class="item.active ? 'bg-cyan-500/10 text-cyan-300' : 'text-slate-300 hover:bg-white/[0.03]'"
          >
            <div class="flex items-center gap-3">
              <span class="h-2 w-2 rounded-full" :class="item.active ? 'bg-cyan-300' : 'bg-slate-600'"></span>
              <span class="text-sm font-medium">{{ item.label }}</span>
            </div>
            <span class="rounded-full px-2.5 py-0.5 text-xs" :class="item.active ? 'bg-cyan-400/18 text-cyan-200' : 'bg-slate-700/50 text-slate-400'">
              {{ item.count }}
            </span>
          </RouterLink>
        </div>
      </nav>

      <div class="panel-surface rounded-[24px] p-3.5 xl:mt-auto">
        <button class="flex w-full items-center gap-3 rounded-[16px] px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-white/[0.03]">
          <svg viewBox="0 0 24 24" class="h-4.5 w-4.5 text-slate-500" fill="none" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9m-9 6h9m-9 6h9M4.5 6h.008v.008H4.5V6Zm0 6h.008v.008H4.5V12Zm0 6h.008v.008H4.5V18Z" />
          </svg>
          Configuración
        </button>
        <button
          class="mt-1.5 flex w-full items-center gap-3 rounded-[16px] px-3 py-2.5 text-left text-sm text-rose-300 transition hover:bg-rose-500/10"
          @click="$emit('logout')"
        >
          <svg viewBox="0 0 24 24" class="h-4.5 w-4.5" fill="none" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M18 15l3-3m0 0-3-3m3 3H9" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </div>
  </aside>
</template>
