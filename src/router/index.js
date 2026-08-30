import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/login.vue'
import Register from '../views/Register.vue'
import Dashboard from '../views/Dashboard.vue'
import CharacterCreateView from '../views/CharacterCreateView.vue'
import CharacterSelectView from '../views/CharacterSelectView.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/dashboard', component: Dashboard },
  { path: '/exploration', component: () => import('../views/ChoiceExplorationView.vue') },
  { path: '/characterCreateView', component: CharacterCreateView },
  { path: '/characterSelectView', component: CharacterSelectView },
  { path: '/machine-world', redirect: '/machine-adventure' },
  { path: '/machine-adventure', component: () => import('../views/MachineAdventureView.vue') },
  { path: '/machine-shop', component: () => import('../views/MachineShopView.vue') },
  { path: '/guest', component: () => import('../views/GuestView.vue')},
  { path: '/character-library', component: () => import('../views/CharacterLibraryView.vue')},
  { path: '/dialogue-events', component: () => import('../views/DialogueEventEditorView.vue')},
  { path: '/electronic-life', component: () => import('../views/ElectronicLifeView.vue') },
  { path: '/area-exploration', component: () => import('../views/AreaExplorationView.vue') },
  {
    path: '/area-map/:areaId',
    name: 'area-map',
    component: () => import('../views/AreaMapView.vue')
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})
