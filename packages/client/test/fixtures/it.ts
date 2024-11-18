/* eslint-env mocha */

import { isBrowser } from 'wherearewe'

export const itBrowser = (isBrowser ? it : it.skip)
