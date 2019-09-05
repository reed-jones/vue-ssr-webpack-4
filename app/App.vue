<template lang="pug">
  #app
    RouterView
</template>

<style lang="scss" module>
:global {

  h1, p, a {
    color: palevioletred;
  }


  h1 {
    margin-bottom: 20px;
  }

  .container {
    position: absolute;
    top: 0;
    right: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: papayawhip;
    text-align: center;
  }
}
</style>
