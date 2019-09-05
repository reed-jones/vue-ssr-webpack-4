<template lang="pug">
.container
    h1 Fact about the number: {{ $route.params.number }}
    p(v-if="fact") {{ fact }}
    p(v-else) Loading fact...
    RouterLink(:to="{ name: 'Number', params: { number: Math.floor(Math.random() * 100) } }")
      | How about another?
    div
      RouterLink(:to="{ name: 'Home' }") Go home...
</template>

<script>
import { mapState } from 'vuex'

export default {
  async serverPrefetch() {
    return await this.retrieveFact(this.$route.params)
  },

  computed: mapState({
    fact(state) {
      return state.facts[this.$route.params.number]
    }
  }),

  async beforeRouteEnter(to, from, next) {
    next(async vm => {
      if (!vm.fact) {
        await vm.retrieveFact(to.params)
      }
    })
  },

  async beforeRouteUpdate(to, from, next) {
    await this.retrieveFact(to.params)
    next()
  },

  methods: {
    async retrieveFact({ number }) {
      await this.$store.dispatch('queryFact', { number })
    }
  }
}
</script>
