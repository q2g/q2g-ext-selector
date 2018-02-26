# Selector Extension
[![Greenkeeper badge](https://badges.greenkeeper.io/q2g/q2g-ext-selector.svg)](https://greenkeeper.io/)
[![TravisCI](https://travis-ci.org/q2g/q2g-ext-selector.svg?branch=master)](https://travis-ci.org/q2g/q2g-ext-selector)
[![Downloads](https://m.sense2go.net/downloads.svg?q2g-ext-selector)](https://m.sense2go.net/extension-package)

This extensions developed for blind users to make selections with full
keyboard control and full [JAWS](http://www.freedomscientific.com/Products/Blindness/JAWS) support.

## Intro

![teaser](./docs/teaser.gif "Short teaser")

## Settings


### Dimensions

In the dimension section you can choose the fields and dimension you want to display in the extensin.

### Options

In the accessibillity options you can switch the use of shortcuts from the default values to customise shortcuts. The recommendation ist to use the combination of "strg + alt + {any keycode}", so that you do not get in truble with screenreaders shortcuts. Second you can switch the accessibillity option on, so that the screenreader gets triggered with any action made in this extension.

![settings](./docs/screenshot_2.PNG?raw=true "Settings")

## Install

### binary

1. [Download the ZIP](https://m.sense2go.net/extension-package) and unzip
2. Qlik Sense Desktop
   Copy it to: %homeptah%\Documents\Qlik\Sense\Extensions and unzip
3. Qlik Sense Entripse
   Import in the QMC

### source

1. Clone the Github Repo into extension directory
2. Install [nodejs](https://nodejs.org/)
3. Open Node.js command prompt
4. npm install
5. npm run build
