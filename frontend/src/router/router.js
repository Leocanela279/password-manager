import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import Login from '../pages/auth/Login.vue'
import Register from '../pages/auth/Register.vue'
import Dashboard from '../pages/dashboard/Dashboard.vue'
import NewEntry from '../pages/dashboard/NewEntry.vue'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard/new',
    name: 'NewEntry',
    component: NewEntry,
    meta: { requiresAuth: true }
  }
]

const isDesktopBuild = window.location.protocol === 'file:'

const router = createRouter({
  history: isDesktopBuild ? createWebHashHistory() : createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.user) {
    next('/login')
  } else {
    next()
  }
})

export default router
