<template lang="pug">
.container
  h1 {{ message }}
  img(src="~@/assets/reindeer-power.gif" width="200")
  div
    RouterLink(:to="{name: 'Name', params: { name: 'foo' }}") Go to Name Page
  div
    RouterLink(:to="{ name: 'Number', params: { number: 1 } }")
      | Learn about the number 1!
</template>

<script>
export default {
  data() {
    return {
      message: 'Hello world!'
    }
  }
}
</script>
