// A preset that brings nothing.
//
// Every other file here describes a device. This one describes the absence of
// one, for a card whose YAML writes out its own controls - see docs/models.md.
// Without it such a card starts from `zhimi.humidifier.cb1` and has to hide
// nine controls it never asked for before adding its own.
const NONE = () => ({
  power: { hide: true },
  target_humidity: { hide: true },
  indicators: {},
  buttons: {},
});

export default NONE;
