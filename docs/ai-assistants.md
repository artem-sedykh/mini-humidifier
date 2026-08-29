# AI assistants

[Home](../README.md) | [Getting started](getting-started.md) | [Configuration](configuration.md) | [Models](models.md) | [Custom device](custom-device.md) | [Controls](controls.md) | [Indicators](indicators.md) | [Buttons](buttons.md) | [Examples](examples.md) | [AI assistants](ai-assistants.md) | [Development](development.md)

> Writing a card with Claude, Cursor, ChatGPT or anything else of the kind.

This card is configured rather than coded, which makes it a good fit for an
assistant - and it is a small project, which makes it a bad one. None of them
know the options here, so what comes back looks right and names things the card
does not have.

Two steps fix most of that: give the assistant this documentation, and know how
this card behaves when a configuration is wrong.

## Give it the documentation

The whole site is published in a form made for reading in one go:

| | |
|---|---|
| [llms.txt](https://artem-sedykh.github.io/mini-humidifier/llms.txt) | the index - every page with a line saying what is on it |
| [llms-full.txt](https://artem-sedykh.github.io/mini-humidifier/llms-full.txt) | every page, concatenated |

Both are generated from the pages themselves at build time, so they are never a
stale copy of the documentation.

There are three ways in, and which one you have depends on the tool rather than
on the card.

**An assistant that can fetch a URL** - Claude, ChatGPT with browsing, most
editor agents - only needs to be told which one:

```text
Read https://artem-sedykh.github.io/mini-humidifier/llms-full.txt - it is the
full documentation of the mini-humidifier Lovelace card.

Write me a card for humidifier.bedroom that shows the room temperature from
sensor.bedroom_temperature and the water tank level from sensor.bedroom_tank,
and turns the tank indicator red below 20%.

Only use options that appear in the Configuration table of that documentation.
Templates are arrow functions written as strings. Answer with the YAML only.
```

The last paragraph is the part that does the work. Without it an assistant
tends to write the card first and consult the documentation afterwards, if at
all.

**An assistant working in your files** - Cursor, Claude Code, anything with a
terminal - is better off with the file beside the configuration it is editing,
where it stays for the next question:

```bash
curl -o mini-humidifier-docs.md \
  https://artem-sedykh.github.io/mini-humidifier/llms-full.txt
```

Then: `read mini-humidifier-docs.md, then add a water tank indicator to the
card in ui-lovelace.yaml`.

**An assistant that cannot reach the network** takes the file pasted into the
conversation. It is the documentation and nothing else - no code, no history -
and every current assistant holds it without trouble.

If the device is one the card has never heard of, the page to point at is [A
device with no preset](custom-device.md): it is written for this, and the
contract at the bottom of it is the language the card speaks.

## Make it show its work

One follow-up catches most of what goes wrong, and it costs one line:

```text
For every option in the YAML you just wrote, quote the line of the documentation
that defines it. Delete any option you cannot quote.
```

An invented option has nothing to quote, and this is the point where that
becomes visible - rather than on the dashboard, where a wrong option is silent
(see below). It works because the documentation is in the conversation: ask the
same thing of an assistant that never read it and you get invented quotes to go
with the invented options.

When something does not work, the console message is the thing to paste back:

```text
Home Assistant logged this for the card: <the message from the browser console>.
Which option is wrong, and what does the documentation say it should be?
```

## Then check what comes back

Four things about this card that an assistant tends to get wrong. Each one was
a real question in the tracker, which is why they are worth checking first:

- **A `model:` the card does not know is not refused.** It warns to the browser
  console and starts from the default set, which is a Xiaomi one - so a
  plausible-looking model id produces a card whose buttons call `xiaomi_miio`
  services on a device that has never heard of them. The bundled ids are all in
  [Models](models.md), and for a device that is not among them the answer is
  `model: humidifier` (or `model: none`) plus [A device with no
  preset](custom-device.md), never a guessed id.
- **A template has to be an arrow function, written as a string.** `state => ...`,
  not `function (state) { ... }`, and not a bare expression. The card compiles
  the text and calls it with a context bound to `this`; a `function` expression
  gets its own `this` and sees none of it. Every example in these pages is an
  arrow.
- **An unknown key warns, and only at the top level.** `entity`, `model`,
  `buttons` and the rest of the card's own options are checked, and a typo
  among them is named in the console - `indicator` for `indicators` by name.
  Below that the configuration is open at the leaves: anything written beside a
  template is handed to that template as `this.<key>`, which is how options of
  your own are passed in. So a misspelled option inside an indicator or a
  button is not rejected and says nothing, it just never does anything.
- **A broken configuration is a red square.** Home Assistant draws
  `hui-error-card`, 56px high, and shows no message on it - the text goes to
  the browser console. If a card renders as a red bar, open the console before
  anything else.

And the rule that catches most of the rest: **every option this card has is a
row in the tables in [Configuration](configuration.md)** and on the pages it
points at. If an assistant names one that is in none of them, it does not
exist, however plausible it looks.

## What is worth asking for

An assistant is at its best here on the parts that are tedious rather than
uncertain: a set of indicators reading half a dozen sensors, a row of buttons
that all call the same service with a different value, a `source` list renamed
into another language, or a template that maps a value onto an icon.

It is at its worst on what the card actually does with all that. When something
does not work, the fastest way through is usually not another round with the
assistant: check the option against the tables, look at the console, and compare
against the card closest to what you want in [Examples](examples.md).

Not everything has to be YAML, either: `entity`, `model`, `name`, `icon`,
`scale` and `group` are in the visual editor, and it cannot invent a name.

## If it still does not work

Open an issue with the configuration exactly as you are running it, the card
version from the console banner, and the Home Assistant version. A
configuration written by an assistant is welcome here - say so if it was, and
what you asked for. That is useful rather than embarrassing: it tells us which
part of these pages an assistant misread, and that is a documentation bug on
our side.
