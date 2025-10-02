const getLitDependencies = () => {
  const resolveFromWindow = () => {
    const LitElementRef = window.LitElement || undefined;
    const htmlRef = window.html || window.litHtml?.html || undefined;
    const cssRef = window.css || window.litHtml?.css || undefined;

    if (LitElementRef && htmlRef && cssRef) {
      return { LitElement: LitElementRef, html: htmlRef, css: cssRef };
    }

    const panelProto = customElements.get("ha-panel-lovelace")
      ? Object.getPrototypeOf(customElements.get("ha-panel-lovelace"))
      : undefined;

    if (panelProto && panelProto.prototype) {
      const LitElementFromPanel = panelProto;
      const htmlFromPanel = panelProto.prototype?.html;
      const cssFromPanel = panelProto.prototype?.css;
      if (LitElementFromPanel && htmlFromPanel && cssFromPanel) {
        return {
          LitElement: LitElementFromPanel,
          html: htmlFromPanel,
          css: cssFromPanel,
        };
      }
    }

    return undefined;
  };

  const immediate = resolveFromWindow();
  if (immediate) {
    return Promise.resolve(immediate);
  }

  return new Promise((resolve) => {
    const maybeResolve = () => {
      const resolved = resolveFromWindow();
      if (resolved) {
        resolve(resolved);
      }
    };

    if (window.loadCardHelpers) {
      window
        .loadCardHelpers()
        .then((helpers) => {
          if (helpers?.LitElement && helpers?.html && helpers?.css) {
            resolve({
              LitElement: helpers.LitElement,
              html: helpers.html,
              css: helpers.css,
            });
          } else {
            maybeResolve();
          }
        })
        .catch(() => maybeResolve());
    }

    customElements.whenDefined("ha-panel-lovelace").then(maybeResolve);
    setTimeout(maybeResolve, 0);
  });
};

const registerLargeNumberInputCard = async () => {
  if (customElements.get("large-number-input-card")) {
    return;
  }

  const { LitElement, html, css } = await getLitDependencies();

  class LargeNumberInputCard extends LitElement {
    static properties = {
      hass: {},
      _config: {},
      _value: { state: true },
      _isSyncing: { state: true },
    };

    static styles = css`
      ha-card {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .header {
        font-weight: 600;
        font-size: 1.2rem;
      }

      .state-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .value-input {
        flex: 1;
        display: flex;
        justify-content: center;
      }

      input[type="number"] {
        appearance: textfield;
        width: var(--lnic-input-width, 14rem);
        padding: var(--lnic-input-padding, 1rem 1.25rem);
        font-size: var(--lnic-input-font-size, 2.5rem);
        font-weight: 600;
        border-radius: var(--lnic-border-radius, 14px);
        border: 2px solid var(--lnic-border-color, var(--primary-color));
        background: var(--lnic-background, var(--card-background-color));
        color: var(--lnic-text-color, var(--primary-text-color));
        text-align: center;
        box-shadow: var(--lnic-box-shadow, 0 8px 18px rgba(0, 0, 0, 0.15));
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }

      input[type="number"]:focus {
        outline: none;
        border-color: var(--lnic-focus-border-color, var(--accent-color));
        box-shadow: var(--lnic-focus-box-shadow, 0 0 0 4px rgba(21, 156, 228, 0.2));
      }

      input::-webkit-outer-spin-button,
      input::-webkit-inner-spin-button {
        appearance: none;
        margin: 0;
      }

      button {
        border: none;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        font-size: 2rem;\n        display: grid;
        place-items: center;
        cursor: pointer;
        background: var(--lnic-button-background, var(--primary-color));
        color: var(--lnic-button-color, #fff);
        transition: transform 0.12s ease, filter 0.12s ease;
      }

      button:hover {
        filter: brightness(1.1);
      }

      button:active {
        transform: scale(0.94);
      }

      button:disabled {
        opacity: 0.4;
        cursor: default;
        filter: none;
      }

      .meta {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        justify-content: center;
        font-size: 0.95rem;
        color: var(--secondary-text-color);
      }
    `;

    constructor() {
      super();
      this._config = {};
      this._value = null;
      this._isSyncing = false;
    }

    setConfig(config) {
      if (!config?.entity) {
        throw new Error("You need to define an entity");
      }

      this._config = {
        name: config.name,
        show_buttons: config.show_buttons ?? true,
        step: config.step,
        min: config.min,
        max: config.max,
        unit: config.unit,
        precision: config.precision,
        tap_action: config.tap_action,
        hold_action: config.hold_action,
        double_tap_action: config.double_tap_action,
        ...config,
      };
    }

    set hass(hass) {
      this._hass = hass;
      this._synchroniseState();
    }

    get hass() {
      return this._hass;
    }

    getCardSize() {
      return 3;
    }

    render() {
      const hass = this.hass;
      if (!hass || !this._config?.entity) {
        return html``;
      }

      const stateObj = hass.states?.[this._config.entity];
      if (!stateObj) {
        return html`
          <ha-card>
            <div class="header">${this._config.name ?? this._config.entity}</div>
            <p>Entity not found.</p>
          </ha-card>
        `;
      }

      const name = this._config.name ?? stateObj.attributes.friendly_name ?? stateObj.entity_id;
      const unit = this._config.unit ?? stateObj.attributes.unit_of_measurement ?? "";
      const min = this._resolveNumber("min", stateObj);
      const max = this._resolveNumber("max", stateObj);
      const step = this._resolveNumber("step", stateObj) ?? 1;
      const disabled = stateObj.state === "unavailable" || stateObj.state === "unknown";
      const value = this._formatValue(this._value ?? stateObj.state);

      return html`
        <ha-card
          @action=${this._handleAction}
          .actionHandler=${this._createActionHandler()}
          actionHandler
        >
          ${name ? html`<div class="header">${name}</div>` : null}
          <div class="state-row">
            ${this._config.show_buttons
              ? html`<button @click=${() => this._adjustValue(-step)} ?disabled=${disabled} title="Decrease">-</button>`
              : null}
            <div class="value-input">
              <input
                type="number"
                .value=${value}
                step=${step}
                ?disabled=${disabled}
                @input=${this._handleInput}
                @change=${this._handleChange}
              />
            </div>
            ${this._config.show_buttons
              ? html`<button @click=${() => this._adjustValue(step)} ?disabled=${disabled} title="Increase">+</button>`
              : null}
          </div>
          ${(min !== undefined || max !== undefined || unit)
            ? html`<div class="meta">
                ${min !== undefined ? html`<span>Min: ${min}</span>` : null}
                ${max !== undefined ? html`<span>Max: ${max}</span>` : null}
                ${unit ? html`<span>${unit}</span>` : null}
              </div>`
            : null}
        </ha-card>
      `;
    }

    _handleInput(event) {
      this._value = event.target?.value;
    }

    _handleChange(event) {
      const raw = event.target?.value;
      this._submitValue(raw);
    }

    _adjustValue(delta) {
      const stateObj = this.hass?.states?.[this._config.entity];
      if (!stateObj) {
        return;
      }

      const current = this._toNumber(this._value ?? stateObj.state) ?? 0;
      const next = current + delta;
      this._submitValue(next);
    }

    _submitValue(rawValue) {
      const stateObj = this.hass?.states?.[this._config.entity];
      if (!stateObj) {
        return;
      }

      let target = this._toNumber(rawValue);
      if (target === null) {
        this._value = this._formatValue(stateObj.state);
        return;
      }

      const min = this._resolveNumber("min", stateObj);
      const max = this._resolveNumber("max", stateObj);

      if (min !== undefined && target < min) {
        target = min;
      }
      if (max !== undefined && target > max) {
        target = max;
      }

      const current = this._toNumber(stateObj.state);
      if (current !== null && Math.abs(current - target) < (this._resolveNumber("step", stateObj) ?? 1) / 1e6) {
        this._value = this._formatValue(target);
        return;
      }

      this._value = this._formatValue(target);
      this._isSyncing = true;
      const domain = stateObj.entity_id.split(".")[0];

      this.hass
        .callService(domain, "set_value", {
          entity_id: stateObj.entity_id,
          value: target,
        })
        .finally(() => {
          this._isSyncing = false;
        });
    }

    _synchroniseState() {
      if (!this._config?.entity || !this.hass || this._isSyncing) {
        return;
      }

      const stateObj = this.hass.states?.[this._config.entity];
      if (!stateObj) {
        return;
      }

      const numeric = this._toNumber(stateObj.state);
      this._value = this._formatValue(numeric ?? stateObj.state);
    }

    _resolveNumber(key, stateObj) {
      if (this._config[key] !== undefined) {
        const fromConfig = this._toNumber(this._config[key]);
        return fromConfig !== null ? fromConfig : undefined;
      }

      const attr = this._toNumber(stateObj?.attributes?.[key]);
      return attr !== null ? attr : undefined;
    }

    _toNumber(value) {
      if (value === null || value === undefined || value === "") {
        return null;
      }
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : null;
    }

    _formatValue(value) {
      if (value === null || value === undefined) {
        return "";
      }
      const numeric = this._toNumber(value);
      if (numeric === null) {
        return String(value);
      }

      if (this._config.precision !== undefined) {
        const precision = Number(this._config.precision);
        if (Number.isInteger(precision) && precision >= 0) {
          return numeric.toFixed(precision);
        }
      }

      const step = this._resolveNumber("step", this.hass?.states?.[this._config.entity]);
      if (step !== undefined && step >= 1) {
        return Math.round(numeric).toString();
      }

      return numeric.toString();
    }

    _createActionHandler() {
      const hasAction = Boolean(
        this._config.tap_action || this._config.hold_action || this._config.double_tap_action,
      );

      if (!hasAction) {
        return undefined;
      }

      return window.actionHandler
        ? window.actionHandler({
            hasHold: Boolean(this._config.hold_action),
            hasDoubleTap: Boolean(this._config.double_tap_action),
          })
        : undefined;
    }

    _handleAction(event) {
      const action = event.detail?.action;
      if (!action) {
        return;
      }

      const actionConfig =
        action === "tap"
          ? this._config.tap_action
          : action === "hold"
          ? this._config.hold_action
          : this._config.double_tap_action;

      if (!actionConfig) {
        return;
      }

      this.fireEvent(this, "hass-action", {
        config: this._config,
        action,
      });
    }

    fireEvent(node, type, detail, options) {
      options = options || {};
      detail = detail === null || detail === undefined ? {} : detail;
      const event = new Event(type, {
        bubbles: options.bubbles ?? true,
        cancelable: Boolean(options.cancelable),
        composed: options.composed ?? true,
      });
      event.detail = detail;
      node.dispatchEvent(event);
      return event;
    }
  }

  customElements.define("large-number-input-card", LargeNumberInputCard);

  if (!window.customCards) {
    window.customCards = [];
  }

  if (!window.customCards.some((card) => card.type === "large-number-input-card")) {
    window.customCards.push({
      type: "large-number-input-card",
      name: "Large Number Input Card",
      description: "Large numeric input with optional step buttons.",
    });
  }
};

registerLargeNumberInputCard();

export const version = "0.1.1";
