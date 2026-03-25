<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import SidebarNav from '@/components/dashboard/SidebarNav.vue'

const router = useRouter()
const authStore = useAuthStore()

const provider = ref('')
const password = ref('')
const link = ref('')
const masterPassword = ref('')
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const displayName = computed(() => {
  if (!authStore.user) return 'Operador'
  return authStore.user.username || authStore.user.email?.split('@')[0] || 'Operador'
})

const displayEmail = computed(() => authStore.user?.email || 'vault@local')

const normalizeLink = (value) => {
  if (!value) return ''
  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

const logout = () => {
  authStore.logout()
  router.push('/login')
}

const saveEntry = async () => {
  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

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
    masterPassword.value = ''
    successMessage.value = 'Registro guardado correctamente.'
  } catch (error) {
    console.error('Error adding password:', error)
    errorMessage.value = 'No se pudo guardar el registro. Revisa la contraseña maestra e inténtalo otra vez.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="app-shell text-slate-100">
    <div class="mx-auto grid min-h-screen max-w-[1560px] gap-4 px-4 py-4 xl:grid-cols-[260px_minmax(0,1fr)] xl:gap-5">
      <SidebarNav
        active-view="new"
        :display-name="displayName"
        :display-email="displayEmail"
        :unlocked="false"
        @logout="logout"
      />

      <main class="min-w-0">
        <div class="panel-surface min-h-full rounded-[26px] p-5 md:p-6">
          <header class="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p class="text-[11px] uppercase tracking-[0.28em] text-cyan-300/70">Nuevo registro</p>
              <h2 class="mt-2 text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl xl:text-[2.8rem]">
                Añade una credencial sin abrir toda la bóveda
              </h2>
              <p class="mt-3 max-w-3xl text-base text-slate-400 md:text-lg">
                Esta vista te permite guardar un nuevo registro directamente usando la contraseña maestra dentro del formulario.
              </p>
            </div>

            <button
              class="icon-button h-11 w-11 shrink-0"
              title="Volver al dashboard"
              @click="router.push('/dashboard')"
            >
              <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </button>
          </header>

          <section class="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_320px]">
            <div class="soft-surface rounded-[24px] p-6 md:p-7">
              <form class="space-y-5" @submit.prevent="saveEntry">
                <div class="grid gap-4 lg:grid-cols-2">
                  <div class="space-y-2">
                    <label for="provider" class="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">Proveedor</label>
                    <input
                      id="provider"
                      v-model="provider"
                      type="text"
                      required
                      placeholder="GitHub, Stripe, Banco..."
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
                  <label for="masterPassword" class="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">Contraseña maestra</label>
                  <input
                    id="masterPassword"
                    v-model="masterPassword"
                    type="password"
                    required
                    placeholder="Necesaria para cifrar y guardar el nuevo registro"
                    class="field-surface w-full rounded-[18px] px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500"
                  >
                </div>

                <p v-if="errorMessage" class="rounded-2xl border border-red-400/15 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {{ errorMessage }}
                </p>

                <p v-if="successMessage" class="rounded-2xl border border-emerald-400/15 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {{ successMessage }}
                </p>

                <div class="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    :disabled="saving"
                    class="button-primary flex items-center justify-center gap-3 rounded-[18px] px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <svg viewBox="0 0 24 24" class="h-4.5 w-4.5" fill="none" stroke="currentColor" stroke-width="1.8">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 5.25v13.5M18.75 12H5.25" />
                    </svg>
                    {{ saving ? 'Guardando...' : 'Guardar registro' }}
                  </button>

                  <button
                    type="button"
                    class="icon-button rounded-[18px] px-5 py-3 text-sm font-semibold"
                    @click="router.push('/dashboard')"
                  >
                    Volver al dashboard
                  </button>
                </div>
              </form>
            </div>

            <div class="soft-surface rounded-[24px] p-5">
              <p class="text-[11px] uppercase tracking-[0.25em] text-slate-500">Flujo</p>
              <h3 class="mt-4 text-2xl font-semibold text-slate-50">Alta rápida y directa</h3>
              <div class="mt-5 grid gap-3">
                <div class="rounded-[16px] border border-white/6 bg-white/[0.02] p-4">
                  <p class="text-sm font-medium text-slate-100">Sin desbloquear el panel completo</p>
                  <p class="mt-2 text-sm leading-6 text-slate-400">Solo introduces la contraseña maestra para este guardado concreto.</p>
                </div>
                <div class="rounded-[16px] border border-white/6 bg-white/[0.02] p-4">
                  <p class="text-sm font-medium text-slate-100">Diseño más compacto</p>
                  <p class="mt-2 text-sm leading-6 text-slate-400">La composición está ajustada para ventanas más estrechas y vistas no maximized.</p>
                </div>
                <div class="rounded-[16px] border border-white/6 bg-white/[0.02] p-4">
                  <p class="text-sm font-medium text-slate-100">Mismo backend</p>
                  <p class="mt-2 text-sm leading-6 text-slate-400">Se usa el mismo flujo de cifrado y guardado que ya tiene la bóveda.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  </div>
</template>
