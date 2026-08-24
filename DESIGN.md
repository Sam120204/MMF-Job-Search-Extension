---
name: Job Sheet
description: A precise application filing slip for reviewing and recording job postings.
colors:
  paper: "#f7f8f5"
  surface: "#ffffff"
  ink: "#17201c"
  muted: "#52605a"
  line: "#cbd2cd"
  line-strong: "#8b9891"
  forest: "#123a2d"
  forest-hover: "#0b2c21"
  mint: "#dcebe3"
  signal: "#c84b31"
  signal-soft: "#f8e8e3"
  focus: "#146c94"
typography:
  headline:
    fontFamily: '"Aptos", "Segoe UI Variable", "Segoe UI", Arial, sans-serif'
    fontSize: "25px"
    fontWeight: 700
    lineHeight: 1.18
    letterSpacing: "0"
  title:
    fontFamily: '"Aptos", "Segoe UI Variable", "Segoe UI", Arial, sans-serif'
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.18
    letterSpacing: "0"
  body:
    fontFamily: '"Aptos", "Segoe UI Variable", "Segoe UI", Arial, sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "0"
  label:
    fontFamily: '"Arial Narrow", "Aptos Narrow", "Roboto Condensed", Arial, sans-serif'
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0"
rounded:
  slip: "3px"
  control: "4px"
  action: "5px"
  panel: "6px"
  round: "50%"
spacing:
  xs: "4px"
  sm: "9px"
  md: "13px"
  lg: "16px"
  xl: "24px"
  section: "34px"
components:
  button-primary:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.surface}"
    typography: "{typography.body}"
    rounded: "{rounded.action}"
    padding: "0 15px"
    height: "42px"
  button-primary-hover:
    backgroundColor: "{colors.forest-hover}"
    textColor: "{colors.surface}"
    rounded: "{rounded.action}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.action}"
    padding: "0 15px"
    height: "42px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "9px 10px"
    height: "39px"
  status-stamp:
    textColor: "{colors.signal}"
    typography: "{typography.label}"
    rounded: "{rounded.slip}"
    padding: "5px 7px 4px"
  notice-success:
    backgroundColor: "{colors.mint}"
    textColor: "#174a37"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "10px 11px"
  notice-error:
    backgroundColor: "{colors.signal-soft}"
    textColor: "#7a2818"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "10px 11px"
---

# Design System: Job Sheet

## Overview

**Creative North Star: "The Application Filing Slip"**

Job Sheet turns a live job posting into a compact, inspectable paper record. Its visual world is administrative without feeling bureaucratic: paper-white surfaces, ledger-green chrome, fine horizontal rules, and narrow record labels make each field feel ready to verify and file.

The system is quiet, dense, and work-focused. Hierarchy comes from alignment, rules, type roles, and small shifts in tone rather than decorative containers. A restrained vermilion stamp marks provisional or exceptional states, while the workflow remains legible as a three-part sequence: inspect, correct, file.

**Key Characteristics:**

- Paper-white surfaces with compact filing-ledger density.
- Ledger green for mastheads, primary actions, and trusted destinations.
- Fine rules and condensed uppercase labels for record structure.
- Vermilion status-stamp accents for draft and error states.
- Explicit review, destination, loading, success, and recovery states.

## Colors

The palette reads like a clean office record: warm-cool paper neutrals, dark botanical filing ink, restrained mint confirmation, and a rare vermilion annotation.

### Primary

- **Ledger Forest** (#123a2d): The dominant filing color for mastheads, primary actions, link-like commands, and confident success iconography.
- **Deep Ledger Forest** (#0b2c21): The pressed, higher-contrast hover state for primary actions.

### Secondary

- **Confirmation Mint** (#dcebe3): The quiet positive ground for success notices and the circular completion mark.
- **Status Vermilion** (#c84b31): A deliberately scarce accent for draft stamps and the semantic error family, never a decorative fill.
- **Soft Correction Wash** (#f8e8e3): The pale error-notice ground that makes corrective copy visible without overpowering the form.

### Tertiary

- **Focus Blue** (#146c94): The keyboard and field-focus signal, intentionally distinct from both status and action colors.

### Neutral

- **Archive Paper** (#f7f8f5): The page ground behind settings content and other full-page surfaces.
- **Fresh Sheet** (#ffffff): The white working surface used by forms, panels, controls, and secondary actions.
- **Filing Ink** (#17201c): The default high-contrast text color.
- **Record Graphite** (#52605a): Secondary copy, labels, indexes, and destination metadata.
- **Fine Rule** (#cbd2cd): The default field and ledger divider.
- **Firm Rule** (#8b9891): Hovered field borders and secondary-action outlines.

### Named Rules

**The One Stamp Rule.** Status Vermilion is reserved for the small stamp and error family; it does not compete with Ledger Forest for primary action.

**The Paper-and-Ink Rule.** Build hierarchy with Fresh Sheet, Archive Paper, Filing Ink, and rules before introducing another color.

## Typography

**Display Font:** Aptos, with Segoe UI Variable, Segoe UI, Arial, and sans-serif fallbacks

**Body Font:** Aptos, with Segoe UI Variable, Segoe UI, Arial, and sans-serif fallbacks

**Label/Mono Font:** Arial Narrow, with Aptos Narrow, Roboto Condensed, Arial, and sans-serif fallbacks

**Character:** The broad sans-serif stack keeps editable content familiar and highly legible. A narrow companion gives metadata the compact cadence of a numbered paper record without imitating a terminal or spreadsheet grid.

### Hierarchy

- **Headline** (700, 25px, 1.18): Settings-page section introductions and the strongest full-page task headings.
- **Title** (700, 20px, 1.18): Filing-slip headings, success headings, and compact state titles; nearby contexts may tighten to 17-19px.
- **Body** (400, 14px, 1.45): Instructions, field values, supporting copy, and action labels; explanatory blocks stay near 68 characters per line.
- **Label** (700, 11px, 1.2, uppercase): Field labels, record numbers, masthead descriptors, step marks, and stamps; the embedded capture panel tightens this role to 10px.

### Named Rules

**The Record Label Rule.** Use condensed uppercase type only for metadata and field structure; keep values, instructions, and actions in the body face and natural case.

**The Zero Tracking Rule.** Letter spacing remains zero even in uppercase labels; hierarchy comes from width, weight, case, and placement.

## Layout

The popup is a fixed 390px-wide filing surface with a 70px masthead and a scrollable record body. Editable fields use a 13px vertical rhythm; related dates and select controls share two equal columns with a 10px gutter. The destination and filing action stay visible in a sticky footer so the record always ends with a named target and an explicit commit.

The settings surface uses a centered container capped at 900px with 20px side gutters, 34px section padding, and full-width horizontal rules instead of card stacks. Long descriptions are constrained to about 68 characters. The connection form places its action beside the URL field, while worksheet tabs and required headers become ruled ledger rows with narrow numeric indexes.

The injected page panel is fixed to the lower-right corner at 370px maximum width, with an 18px desktop inset and viewport-aware height. At 460px it reduces the inset to 14px and stacks paired fields. At 640px the settings page reduces its gutters, stacks the connection form and destination actions, moves worksheet actions below their titles, and hides the nonessential connection count.

## Elevation & Depth

The system is flat by default. Popup and settings surfaces use tonal contrast and fine rules, not card shadows. The injected capture panel is the sole truly elevated surface because it must separate itself from an arbitrary employer page; the popup's sticky action area uses a white upward fade only to protect legibility over scrolling content.

### Shadow Vocabulary

- **Host-Page Lift** (`0 12px 34px rgba(17,38,29,.2), 0 3px 8px rgba(17,38,29,.1)`): Used only by the injected capture panel over third-party page content.
- **Sticky Paper Fade** (`0 -10px 18px rgba(255,255,255,.94)`): Used only above the popup's sticky destination and filing action.

### Named Rules

**The Host-Layer Rule.** Apply substantial elevation only when Job Sheet must sit above a host website; native extension surfaces remain flat and ruled.

## Shapes

The form language is almost square, with just enough softening to keep dense controls approachable. Stamps and paper marks use tight 3px corners, inputs and icon controls use 4px corners, actions use 5px corners, and the floating capture panel uses the largest 6px corner. Circular geometry is reserved for the success mark. Borders are one-pixel rules; the slight two-degree stamp rotation is the only deliberately irregular silhouette.

## Components

### Buttons

Buttons feel direct and procedural rather than promotional.

- **Shape:** Compact rectangular actions with gently softened 5px corners and a 42px minimum height.
- **Primary:** Ledger Forest fill, Fresh Sheet text, firm weight, and 15px horizontal padding; full width at the final filing step.
- **Hover / Focus:** Deepen the green on hover. Keyboard focus uses a three-pixel translucent Focus Blue outline with a small offset; disabled filing actions retain their shape and drop to roughly 62-65% opacity.
- **Secondary / Ghost:** Secondary actions are white with a Firm Rule border and Filing Ink text, gaining a pale neutral wash on hover. Icon and text actions remain borderless, using background tint or color change for hover feedback.

### Chips

The status stamp is the system's signature chip: an outlined, minimally padded Vermilion label with tight corners, heavy condensed type, and a subtle two-degree counterclockwise rotation. It communicates record state, not a selectable filter.

### Cards / Containers

Working areas are sheets, bands, and ruled rows rather than nested cards. The popup and settings sections are flat; only the 6px-corner injected panel behaves as an elevated container. Internal padding is compact at 14-16px in capture surfaces and expands to 34px vertically between settings sections.

### Inputs / Fields

Fields use Fresh Sheet backgrounds, Fine Rule borders, 4px corners, and 9px by 10px internal padding. Labels sit five pixels above fields in condensed uppercase type. Hover strengthens the border; focus shifts the stroke to Focus Blue and adds a restrained two-pixel halo. Textareas are vertically resizable, and paired fields collapse to one column in the narrow injected panel.

### Navigation

Navigation is reduced to a Ledger Forest masthead containing the paper-mark symbol, product name, narrow uppercase surface descriptor, and at most one utility control or status count. Utility icons use familiar inline line icons with tooltips and visible focus states. The masthead remains a quiet orientation band, not a link-heavy app header.

### Notices

Notices are compact four-pixel-corner bands with 12px copy. Neutral notices use a subdued gray-green wash, successful notices use Confirmation Mint, and errors pair Soft Correction Wash with dark correction text. Every notice carries explicit text and a live-region role; color never communicates status alone.

### Ledger Rows

Worksheet choices and required tracker headers use border-separated rows, narrow two-digit indexes, bold titles, and actions aligned at the row end. They preserve scanning speed without enclosing each record in a card.

## Do's and Don'ts

### Do:

- **Do** make the current record, its status, its destination, and its final filing action visible in one clear reading order.
- **Do** use fine one-pixel rules, compact spacing, and aligned labels to create structure before adding containers.
- **Do** preserve explicit hover, focus, loading, success, error, disabled, and reduced-motion behavior.
- **Do** collapse paired fields and side-by-side actions when the available width no longer supports comfortable labels and values.
- **Do** keep Vermilion status cues paired with words such as DRAFT or an actionable error message.

### Don't:

- **Don't** turn settings sections or individual fields into rounded card stacks.
- **Don't** use Status Vermilion as a competing primary action color or as ambient decoration.
- **Don't** add large display typography, excessive whitespace, gradients, or illustrative ornament to operational surfaces.
- **Don't** apply floating-panel shadows to popup or settings content that already owns its page surface.
- **Don't** use condensed uppercase type for editable values, instructions, or long-form copy.
