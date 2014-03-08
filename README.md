Eye of Agamotto
===============

[![Build Status](https://travis-ci.org/tleen/eye-of-agamotto.png?branch=master)](https://travis-ci.org/tleen/eye-of-agamotto)

**Very early in dev, can't do much yet! Docs are null, and tests are weak.** I will be building out functionality as needed for other projects or **as requested**.

Node module, caching, throttling interface to the [Marvel API](http://developer.marvel.com/). This aims to be a low level interface to the MAPI. 

For now, this is just a way to familiarize myself with the API. Caching is needed as you are only allowed 3000 calls a day. Throttling is also enabled to keep from hitting frequency limits.

Given the rate limits there is not a lot you can do with a real-time app. Therefore this module is prioritizing caching and throttling over speed. Generally I imagine you will use this to generate your own JSON files for local use and not for real-time access.

## Full Result Sets
One of the useful things it does is pull full data sets, it will continue to pull on results using the limit (100) till the total number of available results are fetched. This may be very slow as requests are throttled, however once the api calls in the cache this is very fast.

## Examples
Take a look at the [examples](examples/) to see how you can use this module.

Of course, the data is provided by [Marvel](http://marvel.com).
