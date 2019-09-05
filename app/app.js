import Vue from 'vue'
import { createRouter } from './router'
import { createStore } from './store'

import App from "@/App.vue";

export const createApp = () => {
  const router = createRouter()
  const store = createStore()

  const app = new Vue({
    router,
    store,
    render: h => h(App)
  })

  return { app, router, store }
}
