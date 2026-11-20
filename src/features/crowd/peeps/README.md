# Crowd figures

Hand-drawn people from **Open Peeps** by Pablo Stanley ([openpeeps.com](https://www.openpeeps.com)), released under **CC0** (public domain). Rendered once with the MIT-licensed `react-peeps@0.1.10` (standing poses), then optimised with SVGO 4, so the site ships static files and no illustration library.

To regenerate, in a scratch folder: `npm i react-peeps@0.1.10 react@18.3.1 react-dom@18.3.1 svgo@4`, run the generator below with an output folder, then `npx svgo --config svgo.config.cjs -f <out> -o <opt>` and add `xmlns="http://www.w3.org/2000/svg"` to each root `<svg>` (needed for `<img>`).

## Generator

```js
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const Peep = require('react-peeps').default
const fs = require('fs')
const out = process.argv[2]
fs.mkdirSync(out, { recursive: true })
const people = [
  ['WalkingBW', 'ShortMessy', 'Smile', 'GlassRoundThick', 'None'],
  ['ShirtPantsWB', 'Bun', 'Calm', 'None', 'None'],
  ['BlazerPantsWB', 'Short', 'Serious', 'None', 'Goatee'],
  ['WalkingWB', 'LongCurly', 'Cute', 'None', 'None'],
  ['CrossedArmsBW', 'Afro', 'SmileBig', 'None', 'Full'],
  ['EasingWB', 'Hijab', 'Smile', 'GlassRound', 'None'],
  ['PointingFingerBW', 'FlatTop', 'Explaining', 'None', 'MoustacheThin'],
  ['RestingWB', 'MediumBangs', 'Calm', 'None', 'None'],
  ['ShirtBW', 'Beanie', 'Suspicious', 'SunglassWayfarer', 'None'],
  ['WalkingFilled', 'Bald', 'Solemn', 'GlassClubmaster', 'GrayFull'],
  ['PolkaDots', 'Twists', 'LoveGrin', 'None', 'None'],
  ['BlazerBW', 'Pomp', 'Driven', 'None', 'Chin'],
  ['EasingBW', 'GrayBun', 'OldAged', 'GlassButterfly', 'None'],
  ['ShirtPantsBW', 'Mohawk', 'Cheeky', 'None', 'None'],
  ['RestingBW', 'MediumStraight', 'Tired', 'GlassAviator', 'None'],
  ['CrossedArmsWB', 'HatHip', 'Contempt', 'None', 'Dali'],
  ['ShirtWB', 'ShortCurly', 'Awe', 'None', 'None'],
  ['BlazerWB', 'Long', 'SmileTeeth', 'None', 'None'],
]
people.forEach(([body, hair, face, accessory, facialHair], i) => {
  const svg = renderToStaticMarkup(
    React.createElement(Peep, {
      body,
      hair,
      face,
      accessory,
      facialHair,
      strokeColor: '#111',
      backgroundColor: '#fff',
      style: { width: 300, height: 300 },
    }),
  )
  fs.writeFileSync(`${out}/peep-${String(i).padStart(2, '0')}.svg`, svg)
})
console.log('ok', people.length)
```

## SVGO config

```js
module.exports = {
  multipass: true,
  floatPrecision: 1,
  plugins: [
    { name: 'preset-default', params: { overrides: { removeViewBox: false } } },
    'removeStyleElement',
    { name: 'removeAttrs', params: { attrs: ['style'] } },
  ],
}
```
