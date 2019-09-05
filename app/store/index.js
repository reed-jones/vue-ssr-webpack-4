import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'

Vue.use(Vuex)

export const createStore = () => {
  return new Vuex.Store({
    actions: {
      async queryFact({ commit }, { number }) {
        const { data: fact } = await axios.get(`http://numbersapi.com/${number}/math`)

        commit('SET_FACT', { fact, number })

        return fact
      }
    },
    mutations: {
      SET_FACT(state, { fact, number }) {
        Vue.set(state.facts, number, fact)
      }
    },
    state: {
      facts: {}
    }
  })
}
