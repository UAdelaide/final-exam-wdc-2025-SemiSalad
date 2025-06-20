console.log('Loaded: dog.js');

document.addEventListener('DOMContentLoaded', function () {
    const { createApp } = Vue;

    const app = createApp({
        data() {
            return {
                dogName:'A Dog',
                dogImage: ''
            };
        },
        mounted()
    })
})