export default `<div
  style="
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
  "
>
  <div style="padding: 1em;">
    {{#if customInputHTML}} {{{customInputHTML}}} {{else}}
    <input type="text" />
    {{/if}}
  </div>

  <div style="padding: 1em;">
    <textarea></textarea>
  </div>

  <div style="padding: 1em;">
    <select>
      <option value="">Option</option>
    </select>
  </div>

  <div style="padding: 1em;">
    <input type="radio" />
  </div>

  <div style="padding: 1em;">
    <input type="checkbox" />
  </div>
</div>`;
