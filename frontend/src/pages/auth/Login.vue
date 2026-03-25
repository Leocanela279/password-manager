<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')

const login = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const user = await window.cinnamon.login({
      email: email.value,
      password: password.value
    })

    authStore.login(user)
    router.push('/dashboard')
  } catch (error) {
    console.error('Error logging in:', error)
    errorMessage.value = 'No se pudo desbloquear tu cuenta. Revisa el correo y la contraseña.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="app-shell">
    <div class="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-5 py-8">
      <div class="grid w-full max-w-5xl overflow-hidden rounded-[30px] border border-white/8 bg-slate-950/40 shadow-[0_24px_90px_rgba(2,8,20,0.52)] lg:grid-cols-[1fr_0.92fr]">
        <section class="hidden border-r border-white/8 px-10 py-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div class="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-[22px] border border-cyan-400/20 bg-cyan-500/10 text-cyan-300 shadow-[0_18px_50px_rgba(7,156,193,0.18)]">
              <svg viewBox="0 0 24 24" class="h-8 w-8" fill="none" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.7 2.1 5.6 3 8 3v4.9c0 4.8-3.2 9.1-8 10.8-4.8-1.7-8-6-8-10.8V6c2.4 0 5.3-.9 8-3Z" />
              </svg>
            </div>

            <p class="mb-4 text-sm uppercase tracking-[0.35em] text-cyan-300/70">Cinnamon Key</p>
            <h1 class="max-w-md text-4xl font-semibold leading-tight text-slate-50">
              Desbloquea tu bóveda sin ruido ni distracciones.
            </h1>
            <p class="mt-5 max-w-md text-base leading-7 text-slate-400">
              Un acceso sobrio, local y pensado para administrar credenciales con claridad.
            </p>
          </div>

          <div class="grid gap-4">
            <div class="panel-surface rounded-[22px] p-5">
              <p class="text-sm uppercase tracking-[0.24em] text-slate-500">Seguridad</p>
              <p class="mt-3 text-lg font-semibold text-slate-100">Cifrado local y acceso con contraseña maestra</p>
              <p class="mt-2 text-sm leading-6 text-slate-400">
                Tu información se mantiene en la app y el flujo de acceso prioriza foco y privacidad.
              </p>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="soft-surface rounded-[20px] p-4">
                <p class="text-2xl font-semibold text-slate-50">24/7</p>
                <p class="mt-2 text-sm text-slate-400">Disponibilidad de tu bóveda</p>
              </div>
              <div class="soft-surface rounded-[20px] p-4">
                <p class="text-2xl font-semibold text-cyan-300">Local</p>
                <p class="mt-2 text-sm text-slate-400">Sin depender de un navegador</p>
              </div>
            </div>
          </div>
        </section>

        <section class="relative flex items-center justify-center px-5 py-6 md:px-8 md:py-8">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(39,193,237,0.12),transparent_34%)]"></div>

          <div class="panel-surface relative w-full max-w-lg rounded-[26px] p-6 md:p-8">
            <div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[22px] border border-cyan-400/20 bg-cyan-500/10 text-cyan-300 shadow-[0_18px_50px_rgba(7,156,193,0.18)]">
              <svg viewBox="0 0 24 24" class="h-8 w-8" fill="none" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.7 2.1 5.6 3 8 3v4.9c0 4.8-3.2 9.1-8 10.8-4.8-1.7-8-6-8-10.8V6c2.4 0 5.3-.9 8-3Z" />
              </svg>
            </div>

            <div class="text-center">
              <h2 class="text-4xl font-semibold tracking-tight text-slate-50">Cinnamon Key</h2>
              <p class="mt-3 text-lg text-slate-400">Desbloquea tu bóveda de contraseñas</p>
            </div>

            <form class="mt-8 space-y-5" @submit.prevent="login">
              <div class="space-y-2.5">
                <label for="email" class="text-base font-medium text-slate-200">Correo electrónico</label>
                <div class="field-surface flex items-center gap-3 rounded-[18px] px-4 py-3.5 transition focus-within:border-cyan-300/35">
                  <svg viewBox="0 0 24 24" class="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 6.75A2.25 2.25 0 0 1 5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75v10.5A2.25 2.25 0 0 1 18.75 19.5H5.25A2.25 2.25 0 0 1 3 17.25V6.75Z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="m3.75 6.75 8.25 6 8.25-6" />
                  </svg>
                  <input
                    id="email"
                    v-model="email"
                    name="email"
                    type="email"
                    autocomplete="email"
                    required
                    placeholder="tu@email.com"
                    class="w-full bg-transparent text-base text-slate-100 outline-none placeholder:text-slate-500"
                  >
                </div>
              </div>

              <div class="space-y-2.5">
                <div class="flex items-center justify-between gap-4">
                  <label for="password" class="text-base font-medium text-slate-200">Contraseña maestra</label>
                  <span class="text-sm text-cyan-300">Acceso cifrado local</span>
                </div>

                <div class="field-surface flex items-center gap-3 rounded-[18px] px-4 py-3.5 transition focus-within:border-cyan-300/35">
                  <svg viewBox="0 0 24 24" class="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V7.875a4.5 4.5 0 1 0-9 0V10.5" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 10.5h12A1.5 1.5 0 0 1 19.5 12v6A1.5 1.5 0 0 1 18 19.5H6A1.5 1.5 0 0 1 4.5 18v-6A1.5 1.5 0 0 1 6 10.5Z" />
                  </svg>
                  <input
                    id="password"
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    name="password"
                    autocomplete="current-password"
                    required
                    placeholder="Introduce tu contraseña"
                    class="w-full bg-transparent text-base text-slate-100 outline-none placeholder:text-slate-500"
                  >
                  <button
                    type="button"
                    class="icon-button h-10 w-10 shrink-0"
                    :title="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                    @click="showPassword = !showPassword"
                  >
                    <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12Z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
                    </svg>
                  </button>
                </div>
              </div>

              <p v-if="errorMessage" class="rounded-2xl border border-red-400/15 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {{ errorMessage }}
              </p>

              <button
                type="submit"
                :disabled="loading"
                class="button-primary flex w-full items-center justify-center gap-3 rounded-[18px] px-5 py-3.5 text-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-70"
              >
                <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V7.875a4.5 4.5 0 1 0-9 0V10.5" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 10.5h12A1.5 1.5 0 0 1 19.5 12v6A1.5 1.5 0 0 1 18 19.5H6A1.5 1.5 0 0 1 4.5 18v-6A1.5 1.5 0 0 1 6 10.5Z" />
                </svg>
                {{ loading ? 'Desbloqueando...' : 'Desbloquear Bóveda' }}
              </button>
            </form>

            <p class="mt-6 text-center text-base text-slate-400">
              ¿No tienes cuenta?
              <router-link to="/register" class="font-medium text-cyan-300 transition hover:text-cyan-200">
                Crear cuenta
              </router-link>
            </p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
