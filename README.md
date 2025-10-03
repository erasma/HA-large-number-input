# Large Number Input Card

A Home Assistant Lovelace card that turns any `number` or `input_number` entity into an oversized numeric or time input with clear, easily-tappable controls.

<img width="541" height="281" alt="image" src="https://github.com/user-attachments/assets/d283229c-c190-4a1a-b5c0-1ec4c8912549" />


## Features

- Big, high-contrast inputs tailored for wall tablets and touch screens
- Optional step buttons that respect entity min/max/step constraints
- Time mode that splits a total-minute value into hour and minute columns with wrap-aware buttons
- Automatic clamping to entity-provided bounds with optional overrides
- Customisable width, font size and colours via CSS variables
- Supports both `number` and `input_number` domains (time mode also works with `input_datetime` entities that have time enabled)

## Installation

### Via HACS (recommended)
1. In Home Assistant, open **HACS > Integrations > ... > Custom repositories**.
2. Add this repository URL and select **Frontend** as the category.
3. Locate **Large Number Input Card** in the HACS store and press **Download**.
4. Restart the Home Assistant frontend if asked.

### Manual
1. Copy `large-number-input-card.js` into your Home Assistant `www/community/large-number-input-card/` folder.
2. Add the resource to Lovelace: `Configuration > Dashboards > Resources > +`
   - URL: `/hacsfiles/large-number-input-card/large-number-input-card.js`
   - Resource type: **Module**
3. Reload the resources or restart the frontend.

## Usage

### Single value

```yaml
type: custom:large-number-input-card
entity: input_number.living_room_volume
name: Living Room Volume
show_buttons: true
precision: 1
```

### Time value (hours + minutes)

```yaml
type: custom:large-number-input-card
entity: input_number.irrigation_duration
mode: time
name: Watering Duration
hour_step: 1
minute_step: 5
show_buttons: true
```

When `mode: time` is enabled the card expects the entity to expose a numeric value measured in minutes. You can back this with an `input_number` storing minutes or an `input_datetime` that has time enabled (the card will call `input_datetime.set_datetime` for you). The card handles the hour/minute split, wraps minute increments across hour boundaries, and honours the entity min/max limits.

### Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `entity` | string | - | Required. `number.*` or `input_number.*` entity ID. |
| `name` | string | friendly name | Card title. |
| `mode` | string | `number` | `number` for a single numeric field, `time` to use hour/minute columns. |
| `show_buttons` | boolean | `true` | Show the step buttons next to the inputs. |
| `min` | number | entity min | Override entity minimum. Applied to the underlying numeric value (minutes in time mode). |
| `max` | number | entity max | Override entity maximum. Applied to the underlying numeric value. |
| `step` | number | entity step | Override numeric step size (number mode only). |
| `hour_step` | number | `1` | Hour increment size when `mode: time`. |
| `minute_step` | number | `1` | Minute increment size when `mode: time` (capped at 59). |
| `time_separator` | string | `:` | Separator rendered between the hour and minute columns. |
| `unit` | string | entity unit | Displayed next to the limits row. |
| `precision` | number | entity step aware | Force decimal precision for display (number mode only). |

> **Note:** When using `mode: time` with an `input_datetime`, Home Assistant limits values to 23:59. For longer durations, back the card with an `input_number` that stores the total minutes.

### Styling Hooks

Adjust the card appearance with Lovelace theme variables or card-mod. Available CSS vars:

- `--lnic-input-width`
- `--lnic-input-padding`
- `--lnic-input-font-size`
- `--lnic-border-radius`
- `--lnic-border-color`
- `--lnic-background`
- `--lnic-text-color`
- `--lnic-focus-border-color`
- `--lnic-focus-box-shadow`
- `--lnic-button-background`
- `--lnic-button-color`
- `--lnic-box-shadow`
- `--lnic-time-button-size`
- `--lnic-time-button-radius`
- `--lnic-time-button-font-size`
- `--lnic-time-input-width`
- `--lnic-time-input-padding`
- `--lnic-time-input-font-size`
- `--lnic-time-separator-size`

Example card-mod snippet:

```yaml
type: custom:large-number-input-card
entity: number.pool_temperature_setpoint
card_mod:
  style: |
    :host {
      --lnic-input-width: 18rem;
      --lnic-input-font-size: 3rem;
      --lnic-button-background: var(--primary-color);
      --lnic-time-input-width: 6rem;
      --lnic-time-button-size: 40px;
    }
```

## Development

1. Install dependencies (optional, for linting/build scripts): `npm install`
2. Start a dev server or use `es-dev-server` to serve the card during development.
3. Bump the version in the JS file before tagging releases for HACS.

## License

MIT (c) 2025
