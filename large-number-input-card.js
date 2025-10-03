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
      _timeDraft: { state: true },
      _isTimeEditing: { state: true },
    };

    static styles = css`
      ha-card {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        align-items: center;
        text-align: center;
      }

      .header {
        font-weight: 600;
        font-size: 1.2rem;
        text-align: center;
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
        font-size: 2rem;
        display: grid;
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

      .time-grid {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .time-column {
        display: grid;
        grid-template-rows: auto auto auto;
        align-items: center;
        justify-items: center;
        gap: 8px;
      }

      .time-button {
        width: var(--lnic-time-button-size, 48px);
        height: var(--lnic-time-button-size, 48px);
        border-radius: var(--lnic-time-button-radius, 12px);
        font-size: var(--lnic-time-button-font-size, 1.3rem);
      }

      .time-input {
        width: var(--lnic-time-input-width, 5.5rem);
        padding: var(--lnic-time-input-padding, 0.65rem 0.75rem);
        font-size: var(--lnic-time-input-font-size, 2.5rem);
        font-weight: 600;
        border-radius: var(--lnic-border-radius, 14px);
        border: 2px solid var(--lnic-border-color, var(--primary-color));
        background: var(--lnic-background, var(--card-background-color));
        color: var(--lnic-text-color, var(--primary-text-color));
        text-align: center;
        box-shadow: var(--lnic-box-shadow, 0 8px 18px rgba(0, 0, 0, 0.15));
      }

      .time-input:focus {
        outline: none;
        border-color: var(--lnic-focus-border-color, var(--accent-color));
        box-shadow: var(--lnic-focus-box-shadow, 0 0 0 4px rgba(21, 156, 228, 0.2));
      }

      .time-separator {
        font-size: var(--lnic-time-separator-size, 2.5rem);
        font-weight: 600;
        color: var(--lnic-text-color, var(--primary-text-color));
        padding: 0 0.5rem;
      }

      .meta {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        justify-content: center;
        font-size: 0.95rem;
        color: var(--secondary-text-color);
        width: 100%;
      }
    `;

    constructor() {
      super();
      this._config = {};
      this._value = null;
      this._isSyncing = false;
      this._timeDraft = null;
      this._isTimeEditing = false;
      this._timeFocusOriginal = null;
    }

    setConfig(config) {
      if (!config?.entity) {
        throw new Error("You need to define an entity");
      }

      const mode = config.mode ?? "number";
      if (!["number", "time"].includes(mode)) {
        throw new Error("mode must be either 'number' or 'time'");
      }

      this._config = {
        name: config.name,
        show_buttons: config.show_buttons ?? true,
        step: config.step,
        min: config.min,
        max: config.max,
        unit: config.unit,
        mode,
        hour_step: config.hour_step,
        minute_step: config.minute_step,
        time_separator: config.time_separator ?? ":",
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
      const rawValue = this._value ?? stateObj.state;
      const numericValue = this._toNumber(rawValue);
      const isTimeMode = this._config.mode === "time";

      const controls = isTimeMode
        ? this._renderTimeControls({
            stateObj,
            disabled,
            value: numericValue ?? this._currentNumericValue(stateObj),
          })
        : this._renderNumberControls({
            value: this._formatValue(rawValue),
            step,
            disabled,
          });

      const minDisplay = min !== undefined && isTimeMode ? this._formatTimeLabel(min) : min;
      const maxDisplay = max !== undefined && isTimeMode ? this._formatTimeLabel(max) : max;

      return html`
        <ha-card
          @action=${this._handleAction}
          .actionHandler=${this._createActionHandler()}
          actionHandler
        >
          ${name ? html`<div class="header">${name}</div>` : null}
          ${controls}
          ${(minDisplay !== undefined || maxDisplay !== undefined || unit)
            ? html`<div class="meta">
                ${minDisplay !== undefined ? html`<span>Min: ${minDisplay}</span>` : null}
                ${maxDisplay !== undefined ? html`<span>Max: ${maxDisplay}</span>` : null}
                ${unit ? html`<span>${unit}</span>` : null}
              </div>`
            : null}
        </ha-card>
      `;
    }

    _renderNumberControls({ value, step, disabled }) {
      return html`
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
      `;
    }

    _renderTimeControls({ stateObj, disabled, value }) {
      const parts = this._getTimeDisplayParts(value, stateObj);
      const separator = this._config.time_separator ?? ":";
      return html`
        <div class="time-grid">
          ${this._renderTimeColumn({ part: "hours", value: parts.hours, disabled, stateObj })}
          <div class="time-separator" aria-hidden="true">${separator}</div>
          ${this._renderTimeColumn({ part: "minutes", value: parts.minutes, disabled, stateObj })}
        </div>
      `;
    }

    _renderTimeColumn({ part, value, disabled, stateObj }) {
      const showButtons = this._config.show_buttons ?? true;
      const isHours = part === "hours";
      const increaseLabel = isHours ? "Increase hours" : "Increase minutes";
      const decreaseLabel = isHours ? "Decrease hours" : "Decrease minutes";
      const displayValue = this._formatTimePart(value);

      return html`
        <div class="time-column">
          ${showButtons
            ? html`<button
                class="time-button time-button--up"
                @click=${(event) => {
                  event.preventDefault();
                  this._adjustTimeValue(part, 1, stateObj);
                }}
                ?disabled=${disabled}
                aria-label=${increaseLabel}
              >
                &#9650;
              </button>`
            : null}
          <input
            class="time-input"
            type="text"
            inputmode="numeric"
            pattern="\\d*"
            .value=${displayValue}
            ?disabled=${disabled}
            aria-label=${isHours ? "Hours" : "Minutes"}
            @focus=${(event) => this._handleTimeFocus(part, event, stateObj)}
            @input=${(event) => this._handleTimeInput(part, event, stateObj)}
            @change=${(event) => this._commitTimeInput(part, event, stateObj)}
            @blur=${(event) => this._commitTimeInput(part, event, stateObj)}
          />
          ${showButtons
            ? html`<button
                class="time-button time-button--down"
                @click=${(event) => {
                  event.preventDefault();
                  this._adjustTimeValue(part, -1, stateObj);
                }}
                ?disabled=${disabled}
                aria-label=${decreaseLabel}
              >
                &#9660;
              </button>`
            : null}
        </div>
      `;
    }

    _handleTimeFocus(part, event, stateObj) {
      if (!stateObj) {
        return;
      }

      const current = this._timeDraft ? { ...this._timeDraft } : this._splitTime(this._currentNumericValue(stateObj));
      this._timeFocusOriginal = { ...current };
      const draft = { ...current };
      draft[part] = 0;
      this._timeDraft = draft;
      this._isTimeEditing = true;

      if (event?.target) {
        event.target.value = '';
        event.target.select?.();
      }
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

      const current = this._currentNumericValue(stateObj);
      const target = current + delta;
      const bounded = this._applyBounds(target, stateObj);
      this._commitNumeric(bounded, stateObj);
    }

    _handleTimeInput(part, event, stateObj) {`r`n      this._isTimeEditing = true;`r`n`r`n      if (!stateObj) {`r`n        return;`r`n      }`r`n`r`n      const raw = `${event?.target?.value ?? ''}`;
      let digits = raw.replace(/[^0-9]/g, '');
      if (part === 'minutes' && digits.length > 2) {
        digits = digits.slice(-2);
      } else if (part === 'hours' && digits.length > 3) {
        digits = digits.slice(-3);
      }

      if (event?.target) {
        event.target.value = digits;
      }

      const source = this._timeDraft ? { ...this._timeDraft } : this._splitTime(this._currentNumericValue(stateObj));
      const draft = { ...source };
      let numeric = digits === '' ? 0 : Number(digits);
      if (part === 'minutes') {
        numeric = Math.min(Math.max(numeric, 0), 59);
      } else {
        numeric = Math.max(numeric, 0);
      }
      draft[part] = numeric;
      this._timeDraft = draft;
    }

    _commitTimeInput(part, event, stateObj) {
      const rawDigits = `${event?.target?.value ?? ''}`.replace(/[^0-9]/g, '');
      if (rawDigits === '' && this._timeFocusOriginal) {
        this._timeDraft = { ...this._timeFocusOriginal };
        if (event?.target) {
          event.target.value = this._formatTimePart(this._timeDraft[part]);
        }
        this._isTimeEditing = false;
        this._timeFocusOriginal = null;
        return;
      }

      this._handleTimeInput(part, event, stateObj);
      this._applyTimeDraft(stateObj);

      if (event?.target && this._timeDraft) {
        event.target.value = this._formatTimePart(this._timeDraft[part]);
      }
    }

    _applyTimeDraft(stateObj) {
      if (!stateObj) {
        return;
      }

      const draft = this._timeDraft ? { ...this._timeDraft } : this._splitTime(this._currentNumericValue(stateObj));
      const total = Math.max(0, draft.hours) * 60 + draft.minutes;
      const bounded = this._applyBounds(total, stateObj);
      const parts = this._splitTime(bounded);
      this._timeDraft = parts;
      this._commitNumeric(bounded, stateObj);
      this._isTimeEditing = false;
      this._timeFocusOriginal = null;
    }

    _getTimeDisplayParts(value, stateObj) {
      if (this._timeDraft) {
        return { hours: this._timeDraft.hours, minutes: this._timeDraft.minutes };
      }
      return this._splitTime(value ?? this._currentNumericValue(stateObj));
    }

    _getTimeSteps() {
      const rawHour = Number(this._config.hour_step ?? 1);
      const rawMinute = Number(this._config.minute_step ?? 1);
      const hours = Number.isFinite(rawHour) && rawHour > 0 ? Math.floor(rawHour) : 1;
      let minutes = Number.isFinite(rawMinute) && rawMinute > 0 ? Math.floor(rawMinute) : 1;
      minutes = Math.min(minutes, 59);
      return { hours, minutes };
    }

    _adjustTimeValue(part, direction, stateObj) {
      this._isTimeEditing = false;
      this._timeFocusOriginal = null;
      const state = stateObj ?? this.hass?.states?.[this._config.entity];
      if (!state) {
        return;
      }

      const steps = this._getTimeSteps();
      const draft = this._timeDraft ? { ...this._timeDraft } : this._splitTime(this._currentNumericValue(state));
      const baseTotal = Math.max(0, draft.hours) * 60 + draft.minutes;
      const deltaMinutes = part === "hours"
        ? direction * steps.hours * 60
        : direction * steps.minutes;
      const target = baseTotal + deltaMinutes;
      const bounded = this._applyBounds(target < 0 ? 0 : target, state);
      const parts = this._splitTime(bounded);
      this._timeDraft = parts;
      this._commitNumeric(bounded, state);
    }

    _sanitizeTimePart(part, rawValue) {
      const digits = `${rawValue ?? ""}`.replace(/[^0-9]/g, "");
      if (digits === "") {
        return 0;
      }
      let numeric = Number(digits);
      if (!Number.isFinite(numeric)) {
        return 0;
      }
      numeric = Math.floor(numeric);
      if (part === "minutes") {
        numeric = Math.min(Math.max(numeric, 0), 59);
      }
      if (part === "hours") {
        numeric = Math.max(numeric, 0);
      }
      return numeric;
    }

    _splitTime(total) {
      const numeric = Number(total);
      const safe = Number.isFinite(numeric) ? Math.max(0, Math.round(numeric)) : 0;
      const hours = Math.floor(safe / 60);
      const minutes = safe % 60;
      return { hours, minutes };
    }

    _formatTimePart(value) {
      const numeric = Number(value);
      const safe = Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : 0;
      return safe.toString().padStart(2, "0");
    }

    _formatTimeLabel(value) {
      const parts = this._splitTime(value);
      return `${this._formatTimePart(parts.hours)}:${this._formatTimePart(parts.minutes)}`;
    }

    _currentNumericValue(stateObj) {
      if (!stateObj) {
        return 0;
      }

      const domain = this._entityDomain(stateObj);
      if (domain === "input_datetime") {
        const minutes = this._minutesFromInputDatetime(stateObj);
        return minutes ?? 0;
      }

      const raw = this._value ?? stateObj.state;
      const numeric = this._toNumber(raw);
      return numeric ?? 0;
    }

    _submitValue(rawValue) {
      const stateObj = this.hass?.states?.[this._config.entity];
      if (!stateObj) {
        return;
      }

      const target = this._toNumber(rawValue);
      if (target === null) {
        this._value = this._formatValue(stateObj.state);
        return;
      }

      this._commitNumeric(target, stateObj);
    }

    _commitNumeric(target, stateObj = this.hass?.states?.[this._config.entity]) {
      if (!stateObj) {
        return;
      }

      const bounded = this._applyBounds(target, stateObj);
      const current = this._currentNumericValue(stateObj);
      const step = this._config.mode === "time" ? 1 : this._resolveNumber("step", stateObj) ?? 1;

      if (Math.abs(current - bounded) < step / 1e6) {
        this._value = this._formatValue(bounded);
        return;
      }

      this._value = this._formatValue(bounded);
      this._isSyncing = true;

      const domain = this._entityDomain(stateObj);
      let servicePromise;

      if (domain === "input_datetime") {
        const payload = this._buildInputDatetimePayload(bounded, stateObj);
        if (!payload) {
          this._isSyncing = false;
          return;
        }
        servicePromise = this.hass.callService("input_datetime", "set_datetime", payload);
      } else {
        servicePromise = this.hass.callService(domain, "set_value", {
          entity_id: stateObj.entity_id,
          value: bounded,
        });
      }

      Promise.resolve(servicePromise)
        .catch(() => {})
        .finally(() => {
          this._isSyncing = false;
        });
    }

    _applyBounds(value, stateObj) {
      let numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        numeric = 0;
      }

      const domain = this._entityDomain(stateObj);
      if (domain === "input_datetime") {
        const attributes = stateObj?.attributes ?? {};
        if (attributes.has_time) {
          const maxMinutes = attributes.has_date ? 24 * 60 - 1 : 24 * 60 - 1;
          numeric = Math.min(Math.max(numeric, 0), maxMinutes);
        }
      }

      const min = this._resolveNumber("min", stateObj);
      const max = this._resolveNumber("max", stateObj);
      if (min !== undefined && numeric < min) {
        numeric = min;
      }
      if (max !== undefined && numeric > max) {
        numeric = max;
      }
      return numeric;
    }

    _minutesFromInputDatetime(stateObj) {
      const attributes = stateObj?.attributes ?? {};
      if (!attributes.has_time) {
        return null;
      }

      let value = stateObj.state;
      if (!value) {
        return null;
      }

      if (attributes.has_date && value.includes(" ")) {
        value = value.split(" ")[1];
      }

      const [hourStr, minuteStr] = value.split(":");
      const hours = Number(hourStr);
      const minutes = Number(minuteStr);
      if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
        return null;
      }
      return hours * 60 + minutes;
    }

    _buildInputDatetimePayload(minutes, stateObj) {
      const attributes = stateObj?.attributes ?? {};
      if (!attributes.has_time) {
        console.warn("large-number-input-card: input_datetime entity must have time enabled");
        return null;
      }

      const safe = Math.min(Math.max(Math.round(minutes), 0), 24 * 60 - 1);
      const parts = this._splitTime(safe);
      const time = `${this._formatTimePart(parts.hours)}:${this._formatTimePart(parts.minutes)}:00`;

      const payload = {
        entity_id: stateObj.entity_id,
        time,
      };

      if (attributes.has_date) {
        if (stateObj.state && stateObj.state.includes(" ")) {
          payload.date = stateObj.state.split(" ")[0];
        } else if (attributes.year && attributes.month && attributes.day) {
          const year = String(attributes.year).padStart(4, "0");
          const month = String(attributes.month).padStart(2, "0");
          const day = String(attributes.day).padStart(2, "0");
          payload.date = `${year}-${month}-${day}`;
        }
      }

      return payload;
    }

    _entityDomain(stateObj) {
      return stateObj?.entity_id?.split(".")?.[0] ?? "";
    }

    _synchroniseState() {
      if (!this._config?.entity || !this.hass || this._isSyncing || this._isTimeEditing) {
        return;
      }

      const stateObj = this.hass.states?.[this._config.entity];
      if (!stateObj) {
        return;
      }

      const numeric = this._toNumber(stateObj.state);
      const domain = this._entityDomain(stateObj);
      const coerced = domain === "input_datetime" ? this._minutesFromInputDatetime(stateObj) : numeric;
      this._value = this._formatValue(coerced ?? stateObj.state);
      this._timeDraft = null;
      this._isTimeEditing = false;
      this._timeFocusOriginal = null;
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

export const version = "0.2.4";
