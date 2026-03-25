<script setup>
import { computed, nextTick, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import SidebarNav from '@/components/dashboard/SidebarNav.vue'

const authStore = useAuthStore()
const router = useRouter()

const passwords = ref([])
const provider = ref('')
const password = ref('')
const link = ref('')
const search = ref('')
const sortMode = ref('recent')
const weakOnly = ref(false)
const showPassword = ref({})
const masterPassword = ref('')
const unlocked = ref(false)
const loadingVault = ref(false)
const savingEntry = ref(false)
const copiedId = ref(null)
const errorMessage = ref('')
const lastSyncAt = ref(null)
const providerInput = ref(null)

const palette = [
  ['#1d4ed8', '#38bdf8'],
  ['#16a34a', '#22c55e'],
  ['#9333ea', '#06b6d4'],
  ['#dc2626', '#f97316'],
  ['#ca8a04', '#2dd4bf'],
  ['#475569', '#38bdf8']
]

const displayName = computed(() => {
  if (!authStore.user) return 'Operador'
  return authStore.user.username || authStore.user.email?.split('@')[0] || 'Operador'
})

const displayEmail = computed(() => authStore.user?.email || 'vault@local')

const normalizeLink = (value) => {
  if (!value) return ''
  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

const providerInitials = (value) => value.trim().slice(0, 1).toUpperCase() || '?'

const providerTone = (value) => {
  const seed = [...value].reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const [start, end] = palette[seed % palette.length]
  return {
    background: `linear-gradient(135deg, ${start}, ${end})`,
    boxShadow: `0 10px 22px ${start}30`
  }
}

const providerMeta = (entry) => {
  const preparedLink = normalizeLink(entry.link)

  if (!preparedLink) {
    return displayEmail.value
  }

  try {
    const hostname = new URL(preparedLink).hostname.replace(/^www\./, '')
    return hostname
  } catch {
    return entry.link
  }
}

const passwordStrength = (value = '') => {
  let score = 0

  if (value.length >= 10) score += 1
  if (value.length >= 14) score += 1
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1
  if (/\d/.test(value)) score += 1
  if (/[^A-Za-z0-9]/.test(value)) score += 1

  if (score >= 4) {
    return {
      label: 'Fuerte',
      chipClass: 'bg-emerald-500/14 text-emerald-300 border border-emerald-400/10'
    }
  }

  if (score >= 3) {
    return {
      label: 'Media',
      chipClass: 'bg-amber-500/14 text-amber-300 border border-amber-400/10'
    }
  }

  return {
    label: 'Débil',
    chipClass: 'bg-rose-500/14 text-rose-300 border border-rose-400/10'
  }
}

const securityStats = computed(() => {
  const total = passwords.value.length
  const strong = passwords.value.filter((entry) => passwordStrength(entry.password).label === 'Fuerte').length
  const weak = passwords.value.filter((entry) => passwordStrength(entry.password).label === 'Débil').length

  const duplicates = passwords.value.reduce((acc, entry) => {
    acc[entry.password] = (acc[entry.password] || 0) + 1
    return acc
  }, {})

  const repeated = Object.values(duplicates).reduce((acc, count) => acc + (count > 1 ? count - 1 : 0), 0)
  const updated = Math.max(total - weak, 0)
  const score = total === 0 ? 100 : Math.max(18, Math.min(100, Math.round(((strong * 1.2) + updated - repeated - weak) / total * 100)))

  return { total, strong, weak, repeated, updated, score }
})

const scoreCircumference = 2 * Math.PI * 46
const scoreOffset = computed(() => scoreCircumference - (securityStats.value.score / 100) * scoreCircumference)

const websiteCount = computed(() => passwords.value.filter((entry) => entry.link).length)
const reviewCount = computed(() => securityStats.value.weak + securityStats.value.repeated)

const filteredPasswords = computed(() => {
  let entries = [...passwords.value]

  if (search.value.trim()) {
    const query = search.value.trim().toLowerCase()
    entries = entries.filter((entry) =>
      entry.provider.toLowerCase().includes(query) ||
      providerMeta(entry).toLowerCase().includes(query)
    )
  }

  if (weakOnly.value) {
    entries = entries.filter((entry) => passwordStrength(entry.password).label !== 'Fuerte')
  }

  entries.sort((a, b) => {
    if (sortMode.value === 'name') {
      return a.provider.localeCompare(b.provider)
    }

    return b.id - a.id
  })

  return entries
})

const formatRelativeSync = computed(() => {
  if (!lastSyncAt.value) return 'pendiente'

  const diffMs = Date.now() - lastSyncAt.value.getTime()
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000))

  if (diffMinutes === 0) return 'ahora mismo'
  if (diffMinutes === 1) return 'hace 1 min.'
  if (diffMinutes < 60) return `hace ${diffMinutes} min.`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours === 1) return 'hace 1 h'

  return `hace ${diffHours} h`
})

const recordStatus = (entry) => {
  const strength = passwordStrength(entry.password).label

  if (strength === 'Débil') return 'Revisar'
  if (entry.link) return 'Activo'
  return 'Local'
}

const logout = () => {
  authStore.logout()
  router.push('/login')
}

const fetchPasswords = async () => {
  const fetchedPasswords = await window.cinnamon.getPasswords({
    userId: authStore.user.id,
    masterPassword: masterPassword.value
  })

  passwords.value = fetchedPasswords
  lastSyncAt.value = new Date()
}

const unlock = async () => {
  loadingVault.value = true
  errorMessage.value = ''

  try {
    unlocked.value = true
    await fetchPasswords()
  } catch (error) {
    console.error('Error fetching passwords:', error)
    unlocked.value = false
    errorMessage.value = 'No se pudo abrir la bóveda. Verifica la contraseña maestra.'
  } finally {
    loadingVault.value = false
  }
}

const addPassword = async () => {
  if (!unlocked.value) return

  savingEntry.value = true
  errorMessage.value = ''

  try {
    await window.cinnamon.addPassword({
      userId: authStore.user.id,
      provider: provider.value,
      password: password.value,
      link: normalizeLink(link.value),
      masterPassword: masterPassword.value
    })

    provider.value = ''
    password.value = ''
    link.value = ''

    await fetchPasswords()
    await nextTick()
    providerInput.value?.focus()
  } catch (error) {
    console.error('Error adding password:', error)
    errorMessage.value = 'No se pudo guardar el registro. Inténtalo de nuevo.'
  } finally {
    savingEntry.value = false
  }
}

const copyToClipboard = async (id, value) => {
  await navigator.clipboard.writeText(value)
  copiedId.value = id

  setTimeout(() => {
    if (copiedId.value === id) {
      copiedId.value = null
    }
  }, 1400)
}
</script>

<template>
  <div class="app-shell text-slate-100">
    <div class="mx-auto grid min-h-screen max-w-[1560px] gap-4 px-4 py-4 xl:grid-cols-[260px_minmax(0,1fr)] xl:gap-5">
      <SidebarNav
        active-view="dashboard"
        :display-name="displayName"
        :display-email="displayEmail"
        :total-count="securityStats.total"
        :website-count="websiteCount"
        :review-count="reviewCount"
        :unlocked="unlocked"
        @logout="logout"
      />

      <main class="min-w-0">
        <div class="panel-surface min-h-full rounded-[26px] p-5 md:p-6">
          <header class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p class="text-[11px] uppercase tracking-[0.28em] text-cyan-300/70">Panel principal</p>
              <h2 class="mt-2 text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl xl:text-[2.8rem]">
                Bienvenido de vuelta <span class="text-cyan-300">{{ displayName }}</span>
              </h2>
              <p class="mt-3 max-w-3xl text-base text-slate-400 md:text-lg">
                Tu bóveda está segura. Última sincronización: {{ formatRelativeSync }}.
              </p>
            </div>

            <div class="rounded-[18px] border border-white/8 bg-white/[0.02] px-4 py-3 text-xs text-slate-400 md:text-sm">
              Estado de la bóveda:
              <span class="ml-2 font-medium" :class="unlocked ? 'text-emerald-300' : 'text-amber-300'">
                {{ unlocked ? 'Desbloqueada' : 'Bloqueada' }}
              </span>
            </div>
          </header>

          <section v-if="!unlocked" class="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_320px]">
            <div class="soft-surface rounded-[24px] p-6 md:p-8">
              <div class="mx-auto max-w-xl text-center">
                <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] border border-cyan-400/20 bg-cyan-500/10 text-cyan-300 shadow-[0_18px_50px_rgba(7,156,193,0.18)]">
                  <svg viewBox="0 0 24 24" class="h-8 w-8" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V7.875a4.5 4.5 0 1 0-9 0V10.5" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 10.5h12A1.5 1.5 0 0 1 19.5 12v6A1.5 1.5 0 0 1 18 19.5H6A1.5 1.5 0 0 1 4.5 18v-6A1.5 1.5 0 0 1 6 10.5Z" />
                  </svg>
                </div>

                <h3 class="mt-6 text-3xl font-semibold text-slate-50 md:text-4xl">Desbloquea tu bóveda</h3>
                <p class="mt-3 text-base leading-7 text-slate-400">
                  Introduce tu contraseña maestra para cargar las credenciales y activar la vista completa del panel.
                </p>
              </div>

              <form class="mx-auto mt-8 max-w-xl space-y-5" @submit.prevent="unlock">
                <div class="space-y-2">
                  <label for="masterPassword" class="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Contraseña maestra</label>
                  <div class="field-surface flex items-center gap-3 rounded-[18px] px-4 py-3 transition focus-within:border-cyan-300/35">
                    <svg viewBox="0 0 24 24" class="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" stroke-width="1.8">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V7.875a4.5 4.5 0 1 0-9 0V10.5" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 10.5h12A1.5 1.5 0 0 1 19.5 12v6A1.5 1.5 0 0 1 18 19.5H6A1.5 1.5 0 0 1 4.5 18v-6A1.5 1.5 0 0 1 6 10.5Z" />
                    </svg>
                    <input
                      id="masterPassword"
                      v-model="masterPassword"
                      type="password"
                      required
                      placeholder="Introduce la contraseña maestra"
                      class="w-full bg-transparent text-base text-slate-100 outline-none placeholder:text-slate-500"
                    >
                  </div>
                </div>

                <p v-if="errorMessage" class="rounded-2xl border border-red-400/15 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {{ errorMessage }}
                </p>

                <button
                  type="submit"
                  :disabled="loadingVault"
                  class="button-primary flex w-full items-center justify-center gap-3 rounded-[18px] px-5 py-3.5 text-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V7.875a4.5 4.5 0 1 0-9 0V10.5" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 10.5h12A1.5 1.5 0 0 1 19.5 12v6A1.5 1.5 0 0 1 18 19.5H6A1.5 1.5 0 0 1 4.5 18v-6A1.5 1.5 0 0 1 6 10.5Z" />
                  </svg>
                  {{ loadingVault ? 'Abriendo...' : 'Desbloquear bóveda' }}
                </button>
              </form>
            </div>

            <div class="soft-surface rounded-[24px] p-5">
              <p class="text-[11px] uppercase tracking-[0.25em] text-slate-500">Vista previa</p>
              <h3 class="mt-4 text-2xl font-semibold text-slate-50">Panel más compacto</h3>
              <div class="mt-6 grid gap-3">
                <div class="rounded-[16px] border border-white/6 bg-white/[0.02] p-4">
                  <p class="text-sm font-medium text-slate-100">Escala visual reducida</p>
                  <p class="mt-2 text-sm leading-6 text-slate-400">Textos, tarjetas y listados ocupan menos espacio cuando la ventana se hace más pequeña.</p>
                </div>
                <div class="rounded-[16px] border border-white/6 bg-white/[0.02] p-4">
                  <p class="text-sm font-medium text-slate-100">Nuevo registro independiente</p>
                  <p class="mt-2 text-sm leading-6 text-slate-400">Puedes abrir la vista de alta desde el sidebar sin desbloquear toda la bóveda.</p>
                </div>
              </div>
            </div>
          </section>

          <template v-else>
            <section class="grid gap-4 md:grid-cols-2 2xl:grid-cols-[repeat(3,minmax(0,1fr))_320px]">
              <div class="soft-surface rounded-[22px] p-5">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] uppercase tracking-[0.25em] text-slate-500">Total</span>
                  <svg viewBox="0 0 24 24" class="h-5 w-5 text-cyan-300" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 7.5h3.75A2.25 2.25 0 0 1 21 9.75v8.25A2.25 2.25 0 0 1 18.75 20.25H9.75A2.25 2.25 0 0 1 7.5 18V14.25" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 15A2.25 2.25 0 0 1 4.5 12.75V4.5h8.25A2.25 2.25 0 0 1 15 6.75V15H6.75Z" />
                  </svg>
                </div>
                <p class="mt-5 text-4xl font-semibold text-slate-50">{{ securityStats.total }}</p>
                <p class="mt-2 text-sm text-slate-400">Registros guardados</p>
              </div>

              <div class="soft-surface rounded-[22px] p-5">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] uppercase tracking-[0.25em] text-slate-500">Actualizadas</span>
                  <svg viewBox="0 0 24 24" class="h-5 w-5 text-emerald-300" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992V4.356" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.985 19.644v-4.992h4.992" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.929 11.7a7.5 7.5 0 0 1 12.495-4.95l3.591 3.598M19.071 12.3a7.5 7.5 0 0 1-12.495 4.95l-3.591-3.598" />
                  </svg>
                </div>
                <p class="mt-5 text-4xl font-semibold text-slate-50">{{ securityStats.updated }}</p>
                <p class="mt-2 text-sm text-slate-400">Con buen estado</p>
              </div>

              <div class="soft-surface rounded-[22px] p-5">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] uppercase tracking-[0.25em] text-slate-500">Revisar</span>
                  <svg viewBox="0 0 24 24" class="h-5 w-5 text-rose-300" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008Zm8.25-3.758c0 4.556-3.694 8.25-8.25 8.25s-8.25-3.694-8.25-8.25S7.444 4.5 12 4.5s8.25 3.694 8.25 8.25Z" />
                  </svg>
                </div>
                <p class="mt-5 text-4xl font-semibold text-slate-50">{{ reviewCount }}</p>
                <p class="mt-2 text-sm text-slate-400">Entradas a mejorar</p>
              </div>

              <div class="soft-surface rounded-[22px] p-5 md:col-span-2 2xl:col-span-1">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-[11px] uppercase tracking-[0.25em] text-slate-500">Puntuación</p>
                    <h3 class="mt-2 text-xl font-semibold text-slate-50">Seguridad general</h3>
                  </div>
                  <svg viewBox="0 0 24 24" class="h-6 w-6 text-cyan-300" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.7 2.1 5.6 3 8 3v4.9c0 4.8-3.2 9.1-8 10.8-4.8-1.7-8-6-8-10.8V6c2.4 0 5.3-.9 8-3Z" />
                  </svg>
                </div>

                <div class="mt-5 flex items-center gap-5">
                  <div class="relative h-28 w-28 shrink-0">
                    <svg viewBox="0 0 120 120" class="h-full w-full -rotate-90">
                      <circle cx="60" cy="60" r="46" stroke="rgba(148, 163, 184, 0.12)" stroke-width="10" fill="none" />
                      <circle
                        cx="60"
                        cy="60"
                        r="46"
                        stroke="#27c1ed"
                        stroke-width="10"
                        stroke-linecap="round"
                        fill="none"
                        :stroke-dasharray="scoreCircumference"
                        :stroke-dashoffset="scoreOffset"
                      />
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center text-3xl font-semibold text-slate-50">
                      {{ securityStats.score }}
                    </div>
                  </div>

                  <div class="space-y-2 text-sm text-slate-300">
                    <p class="flex items-center gap-2.5">
                      <span class="h-2 w-2 rounded-full bg-emerald-300"></span>
                      {{ securityStats.strong }} fuertes
                    </p>
                    <p class="flex items-center gap-2.5">
                      <span class="h-2 w-2 rounded-full bg-amber-300"></span>
                      {{ securityStats.repeated }} repetidas
                    </p>
                    <p class="flex items-center gap-2.5">
                      <span class="h-2 w-2 rounded-full bg-rose-300"></span>
                      {{ securityStats.weak }} débiles
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section class="mt-5 grid gap-5 2xl:grid-cols-[minmax(0,1fr)_320px]">
              <div class="soft-surface rounded-[24px] p-5">
                <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p class="text-[11px] uppercase tracking-[0.24em] text-slate-500">Búsqueda</p>
                    <h3 class="mt-2 text-xl font-semibold text-slate-50">Explora tus registros</h3>
                  </div>

                  <div class="flex gap-2.5">
                    <button
                      class="icon-button h-10 w-10"
                      :class="weakOnly ? 'border-cyan-300/35 text-cyan-200' : ''"
                      title="Mostrar solo las entradas que necesitan revisión"
                      @click="weakOnly = !weakOnly"
                    >
                      <svg viewBox="0 0 24 24" class="h-4.5 w-4.5" fill="none" stroke="currentColor" stroke-width="1.8">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9m-9 6h6.75m-6.75 6h4.5M4.5 6h.008v.008H4.5V6Zm0 6h.008v.008H4.5V12Zm0 6h.008v.008H4.5V18Z" />
                      </svg>
                    </button>
                    <button
                      class="icon-button h-10 w-10"
                      :class="sortMode === 'name' ? 'border-cyan-300/35 text-cyan-200' : ''"
                      :title="sortMode === 'name' ? 'Ordenando alfabéticamente' : 'Ordenando por fecha reciente'"
                      @click="sortMode = sortMode === 'recent' ? 'name' : 'recent'"
                    >
                      <svg viewBox="0 0 24 24" class="h-4.5 w-4.5" fill="none" stroke="currentColor" stroke-width="1.8">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h11.25M8.25 12h8.25M8.25 17.25h5.25M4.5 6.75l.75-.75m0 0L6 6.75m-.75-.75v12" />
                      </svg>
                    </button>
                    <button
                      class="icon-button h-10 w-10"
                      title="Abrir vista de nuevo registro"
                      @click="router.push('/dashboard/new')"
                    >
                      <svg viewBox="0 0 24 24" class="h-4.5 w-4.5" fill="none" stroke="currentColor" stroke-width="1.8">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 5.25v13.5M18.75 12H5.25" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div class="mt-4 field-surface flex items-center gap-3 rounded-[18px] px-4 py-3 focus-within:border-cyan-300/35">
                  <svg viewBox="0 0 24 24" class="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-4.35-4.35m0 0A7.65 7.65 0 1 0 5.85 5.85a7.65 7.65 0 0 0 10.8 10.8Z" />
                  </svg>
                  <input
                    v-model="search"
                    type="search"
                    placeholder="Buscar contraseñas, proveedor o dominio..."
                    class="w-full bg-transparent text-base text-slate-100 outline-none placeholder:text-slate-500"
                  >
                </div>

                <div class="mt-5 space-y-3.5">
                  <article
                    v-for="entry in filteredPasswords"
                    :key="entry.id"
                    class="group rounded-[20px] border border-white/6 bg-white/[0.02] p-4 transition hover:border-cyan-400/16 hover:bg-white/[0.03]"
                  >
                    <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div class="flex min-w-0 items-center gap-3">
                        <div
                          class="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] text-lg font-semibold text-white"
                          :style="providerTone(entry.provider)"
                        >
                          {{ providerInitials(entry.provider) }}
                        </div>

                        <div class="min-w-0">
                          <div class="flex flex-wrap items-center gap-2">
                            <h4 class="truncate text-xl font-semibold text-slate-50">{{ entry.provider }}</h4>
                            <span class="rounded-full px-2.5 py-1 text-xs font-medium" :class="passwordStrength(entry.password).chipClass">
                              {{ passwordStrength(entry.password).label }}
                            </span>
                          </div>
                          <p class="mt-1 truncate text-sm text-slate-400">{{ providerMeta(entry) }}</p>
                        </div>
                      </div>

                      <div class="flex flex-1 flex-col gap-3 xl:max-w-[430px]">
                        <div class="field-surface flex items-center gap-2.5 rounded-[18px] px-3 py-2.5">
                          <input
                            :type="showPassword[entry.id] ? 'text' : 'password'"
                            :value="entry.password"
                            readonly
                            class="min-w-0 flex-1 bg-transparent font-mono text-sm tracking-[0.22em] text-slate-200 outline-none"
                          >
                          <button
                            type="button"
                            class="icon-button h-9 w-9 shrink-0"
                            :title="showPassword[entry.id] ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                            @click="showPassword[entry.id] = !showPassword[entry.id]"
                          >
                            <svg viewBox="0 0 24 24" class="h-4.5 w-4.5" fill="none" stroke="currentColor" stroke-width="1.8">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12Z" />
                              <path stroke-linecap="round" stroke-linejoin="round" d="M12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            class="icon-button h-9 w-9 shrink-0"
                            :class="copiedId === entry.id ? 'border-cyan-300/35 text-cyan-200' : ''"
                            title="Copiar contraseña"
                            @click="copyToClipboard(entry.id, entry.password)"
                          >
                            <svg viewBox="0 0 24 24" class="h-4.5 w-4.5" fill="none" stroke="currentColor" stroke-width="1.8">
                              <rect x="9" y="9" width="10.5" height="10.5" rx="2" />
                              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 15H6A1.5 1.5 0 0 1 4.5 13.5V6A1.5 1.5 0 0 1 6 4.5h7.5A1.5 1.5 0 0 1 15 6v.75" />
                            </svg>
                          </button>
                        </div>

                        <div class="flex flex-wrap items-center gap-2.5 text-xs text-slate-400">
                          <span class="rounded-full border border-white/8 px-2.5 py-1 uppercase tracking-[0.18em]">
                            {{ recordStatus(entry) }}
                          </span>
                          <a
                            v-if="entry.link"
                            :href="normalizeLink(entry.link)"
                            target="_blank"
                            rel="noreferrer"
                            class="truncate text-cyan-300 transition hover:text-cyan-200"
                          >
                            {{ normalizeLink(entry.link) }}
                          </a>
                          <span v-if="copiedId === entry.id" class="text-cyan-200">Copiada</span>
                        </div>
                      </div>
                    </div>
                  </article>

                  <div v-if="filteredPasswords.length === 0" class="rounded-[20px] border border-dashed border-white/10 bg-white/[0.02] px-5 py-12 text-center">
                    <p class="text-lg font-medium text-slate-200">No hay resultados para esta búsqueda.</p>
                    <p class="mt-2 text-sm text-slate-400">Prueba otro término o desactiva el filtro de revisión.</p>
                  </div>
                </div>
              </div>

              <div class="soft-surface rounded-[24px] p-5">
                <p class="text-[11px] uppercase tracking-[0.24em] text-slate-500">Nuevo registro</p>
                <h3 class="mt-2 text-xl font-semibold text-slate-50">Guardar credencial</h3>
                <p class="mt-2 text-sm leading-6 text-slate-400">
                  Este bloque sigue disponible cuando la bóveda ya está abierta.
                </p>

                <form class="mt-5 space-y-4" @submit.prevent="addPassword">
                  <div class="space-y-2">
                    <label for="provider" class="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">Proveedor</label>
                    <input
                      id="provider"
                      ref="providerInput"
                      v-model="provider"
                      type="text"
                      required
                      placeholder="GitHub, Netflix, Banco..."
                      class="field-surface w-full rounded-[18px] px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500"
                    >
                  </div>

                  <div class="space-y-2">
                    <label for="password" class="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">Contraseña</label>
                    <input
                      id="password"
                      v-model="password"
                      type="text"
                      required
                      placeholder="Escribe o pega la contraseña"
                      class="field-surface w-full rounded-[18px] px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500"
                    >
                  </div>

                  <div class="space-y-2">
                    <label for="link" class="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">Enlace</label>
                    <input
                      id="link"
                      v-model="link"
                      type="text"
                      placeholder="https://ejemplo.com"
                      class="field-surface w-full rounded-[18px] px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500"
                    >
                  </div>

                  <p v-if="errorMessage" class="rounded-2xl border border-red-400/15 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {{ errorMessage }}
                  </p>

                  <button
                    type="submit"
                    :disabled="savingEntry"
                    class="button-primary flex w-full items-center justify-center gap-3 rounded-[18px] px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <svg viewBox="0 0 24 24" class="h-4.5 w-4.5" fill="none" stroke="currentColor" stroke-width="1.8">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 5.25v13.5M18.75 12H5.25" />
                    </svg>
                    {{ savingEntry ? 'Guardando...' : 'Guardar registro' }}
                  </button>
                </form>
              </div>
            </section>
          </template>
        </div>
      </main>
    </div>
  </div>
</template>
