<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [yup-by-example](#yup-by-example)
    - [Example](#example)
    - [Custom generators](#custom-generators)
    - [Caveats](#caveats)
    - [Supported types and validations](#supported-types-and-validations)
      - [string](#string)
      - [number](#number)
      - [array](#array)
      - [object](#object)
    - [Todo](#todo)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# yup-by-example
yup-by-example is a random data generator driven from [Yup](https://github.com/jquense/yup) schemas.
Yup is a JavaScript schema builder for value parsing and validation, heavily inspired by [Joi](https://github.com/hapijs/joi), but with far less baggage, making it suitable for both server and client side validation.

For those practicing TDD, a rich and potentially shared schema increases the burden of managing test data. Hence the need for test data to automatically driven from the schema. This is where yup-by-example comes in.

One of the best features of Yup, is the ability to add custom validators / transformers, through use of [yup.addMethod](https://github.com/jquense/yup/blob/master/README.md#yupaddmethodschematype-schema-name-string-method--schema-void). A second great feature is the ability to [describe](https://github.com/jquense/yup/blob/master/README.md#mixeddescribe-schemadescription) schemas. yup-by-example makes use of both features, by providing a transformation that interrorgates the schema and automatically generates compatible test data, with some [caveats](#caveats).

### Example
```js
// api.test.js
const { TestDataFactory } = require('yup-by-example');
const initSchemas = require('../src/schemas');

describe('API', () => {

  let factory;
  let schemas;

  before() {
    /*
    The yup schemas must be initialised after `addMethod` has been called,
    otherwise they will be built using the `noop` example implmentation
    (see schemas.js)
    */
    factory = new TestDataFactory().addMethod('mixed', 'example');
    schemas = initSchemas();
  }

  it('should create users', async () => {
    const users = factory.generate(schemas.users);
    const res = await request.post('/api-under-test/users', users);
    expect(res.status).to.equal(200);
  })
})
```

```js
// schemas.js
const { TestDataFactory } = require('yup-by-example');
const { mixed, array, object, string, number } = require('yup');

// Prevents yup from erroring when `example()` is called.
new TestDataFactory().addNoopMethod(mixed, 'example');

/*
Yup schemas must be "hidden" behind an init method, so they are not
built before the real `example()` method has been added in the test
code (see api.test.js).
*/

default export function init() {

  const user = object().shape({
    name: string().max(255).required().example(),
    age: number().positive().integer().max(200).required().example(),
    email: string().email().required().example(),
    username: string().min(8).max(32).required().example(),
    password: string().min(12).max(32).required().example(),
  }).example();

  const users = array(user).min(10).max(50).example();

  return {
    user,
    users
  }
}
```

### Custom generators
It will not be possible to reliably generate test data purely from base types like `array`, `object`, `string`, `number` and `date`, however by writing a custom generator, selected either explicitly, by passing an `id` parameter to the `example()` function or through schema metadata, you can fine tune the results. e.g.

```js
// Updated user schema in schemas.js
const user = object().shape({
  name: string().max(255).required().example(),
  age: number().positive().integer().max(200).required().example(),
  email: string().email().required().example(),
  username: string().min(8).max(32).required().example(),
  password: string().min(12).max(32).required().example(),
  niNumber: string().matches(/^[A-Z]{2}\d{6}[A-Z]$/).required().example('ni-number'),
  // or niNumber: string().matches(/^[A-Z]{2}\d{6}[A-Z]$/).meta({ type: 'ni-number' }).required().example(),
}).example();
```

```js
// NiNumberGenerator.js
const { BaseGenerator } = require('yup-by-example');

class NiNumberGenerator extends BaseGenerator {

  generate(schema, value, originalValue) {
    const start = this.chance.string({ length: 2 });
    const middle = this.chance.integer({ min: 100000, max 999999 });
    const end = this.chance.string({ length: 1 });
    return `${start}${middle}${end}`.toUpperCase();
  }
}

```

```js
// Updated code in api.test.js
before() {
  factory = new TestDataFactory()
    .addMethod('mixed', 'example')
    .addGenerator('ni-number', NiNumberGenerator);
  schemas = initSchemas();
}
```
All generators are passed an instance of [Chance](https://chancejs.com/basics/integer.html) to assist with random data generation. You can also initialise the TestDataFactory with a seed, e.g. `new TestDataFactory({ seed: 100 })` to consistently generate the same random data.

### Sample data
The following data was generated by the code in the example folder, based on the above configuration.
```json
[
  {
    "niNumber": "J)378911E",
    "password": "kEMLQKeVkgZVeGkDGQov",
    "username": "jESBZUCfCzKTnMjdhOjqPIvTHQmbH",
    "email": "vohu@kenli.gt",
    "age": 175,
    "name": "oNIzPIkoCjqkPSRvYIZZAeWGWntCRZGYEzUyTtJysMPEXuXFiupkxIANZtpufxjgkRKBhybAHQeKKisVndwLVVkqpLQjyTjGWZhylwnGeOiRFBlFhgNsUiWBijvTIJPKeFYtKBEACycvhbcWDaOFhyvmCWhIPQZnmBFzJxqKMAniRDWZkusunTFOPGvqoxazjtZNFckeXHxrRxZYRhEPuYcLsnuWGafOauSVEVONcZLYKLZcTnAls"
  },
  {
    "niNumber": "ZY100887G",
    "password": "VnzYUAJsEphxWvJitMQegYidrNRZQBkm",
    "username": "jbzFwXZFzopWIOswwjNFEoftx",
    "email": "rigjucnib@kabaj.su",
    "age": 16,
    "name": "NZqbvpiwTBUBZhrRIsefnyKqqYRikjWAaoINVjddkyBIVVCNsuYsSJUZXmqJvEjSjmUewRcXuaUkXVJatiWXQFDHtvwQhhuXaoOkwlgkSaDkXzTumyWjOfXNJQNsMyeRayTyrKNhStSdhBLnJsMCbkogRuycDWFaXIIHmFpviZxaljzFDbWLSdlwqNPUGsuTEbkjIpLuYZLZdNPyHMPcPYfVHjPCvSrFxwYQWHtRlSSIjoiEzDWloyjOYqL"
  },
  {
    "niNumber": "JI452320Z",
    "password": "ziTxvbIRQJpoZv",
    "username": "JZllCMtVv",
    "email": "iz@mure.cm",
    "age": 165,
    "name": "ViuSXmGspXYEbCHPIJnwlfPaLyEvbVABaBUYCdeOSaiAPFPUtILwAhitFgWRADhJyHEebVTGiYmkWopTQLfqLxRbqnUxkFYogxyhbkTXxaXxECFupiyTSwLqydxWtqSdtKgnExjJeMvBgtRgPkwxyTmtnZKIlUXIYIGjYWnXAWxSakCrFEYpCUGAFiFudkcyeZiWzWjoXRtRSqADuWBoNEBCifGbSyOYRjNYTCNyONfjbyFYWzYxa"
  },
  {
    "niNumber": "D23634594",
    "password": "XmCuTGtZzLgGyaUfLFoOYzxWTN",
    "username": "tDaFUsOdewhRXlH",
    "email": "ucimej@opedi.ba",
    "age": 189,
    "name": "iIqDpnzOqDxZUhPuvMbRZYodbDxQmundGWFuTReOhCzhNBybgWPkZjjhtzdFYJpBIvKAujZhVwbybFqHkgKWDWXipHNBvGcyKtEFafevRaPEmahcyUpIelthDRrDjHWTFsVzOINZByrVuDpCIEjZLqyMLumqPZnUlazfuqvYFjyFRQzFDGdmPjFMuEznElNaRHfTzQHUonrjLncAdMHAbCLePSbqLjNlcblkGcAvCIKescDOFOdTWE"
  },
  {
    "niNumber": "U&827969N",
    "password": "mEWcZkdAsEmerJsTiklYIybhoah",
    "username": "LgfyZdsa",
    "email": "jazfe@piza.sa",
    "age": 114,
    "name": "PlgNtFCcTVrvEPaPhOsNKEaYYqDzALzkWLOyQrUzwaBlOtzdSSSLWRgDIeMSKtCSLcFoFvTEqynySFBxHpjeXtkySPIMgFKuoMLfVWgKquJmPNqmrFXGfoXxHelrKYMRmrKMnyddNhxvLVmQmCtnRtidOPpoXNqdLPbqolFXuGBBehgYtqwmtoXMPanDcjThxcJyCkZtcBCZzxtXTLdzDPZUkRprwrfnSFersHiMWdGnGjPZLwQmILBw"
  }
]
```

### Caveats
Not all Yup validations can be reliably generated. For example there is nothing in the described schema that can be used to determine if `lowercase` or `uppercase` is required. With `strict` validation, this could cause problems. It's likely there there may also be issues with references and conditional validation. You may be able to work around many of these problems with [Custom generators](#customgenerators).

### Supported types and validations
#### string
* length
* min
* max
* email
* url

#### number
* min
* max
* lessThan
* moreThan
* positive
* negative
* integer

#### array
* min
* max

#### object

### Todo
* boolean
* date

