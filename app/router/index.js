import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

export const createRouter = () => {
  return new VueRouter({
    mode: 'history',
    routes: [{
      path: '/',
      name: 'Home',
      component: () => import('@/components/pages/HomePage'),
    }, {
      path: '/name/:name',
      name: 'Name',
      component: () => import('@/components/pages/NamePage')
    }, {
      path: '/number/:number',
      name: 'Number',
      component: () => import('@/components/pages/NumberPage')
    }]
  })
}
