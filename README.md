# Large Number Input Card

A Home Assistant Lovelace card that turns any `number` or `input_number` entity into an oversized numeric keypad with clear, easily-tappable controls.

## Features

- Big, high-contrast number entry tailored for wall tablets and touch screens
- Optional +/- buttons that respect min/max/step constraints
- Automatic clamping to entity limits with optional overrides
- Customisable width, font size and colours via CSS variables
- Supports both `number` and `input_number` domains

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

```yaml
type: custom:large-number-input-card
entity: input_number.living_room_volume
name: Living Room Volume
show_buttons: true
precision: 1
```

### Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `entity` | string | - | Required. `number.*` or `input_number.*` entity ID. |
| `name` | string | friendly name | Card title. |
| `show_buttons` | boolean | `true` | Show +/- controls alongside the input. |
| `min` | number | entity min | Override entity minimum. |
| `max` | number | entity max | Override entity maximum. |
| `step` | number | entity step | Override entity step size. |
| `unit` | string | entity unit | Displayed next to the limits row. |
| `precision` | number | entity step aware | Force decimal precision for display. |

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
    }
```

## Development

1. Install dependencies (optional, for linting/build scripts): `npm install`
2. Start a dev server or use `es-dev-server` to serve the card during development.
3. Bump the version in the JS file before tagging releases for HACS.

## License

MIT (c) 2025
