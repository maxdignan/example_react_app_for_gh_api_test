export default `<div
  style="
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
  "
>
  {{#each buttonClasses}}
  <div style="padding: 1em;">
    <button class="{{this}}">Button</button>
  </div>
  {{/each}}
</div>`;
