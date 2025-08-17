import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/login.vue'
import Register from '../views/Register.vue'
import Dashboard from '../views/Dashboard.vue'
import CharacterCreateView from '../views/CharacterCreateView.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/dashboard', component: Dashboard },
  { path: '/characterCreateView', component: CharacterCreateView }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})
