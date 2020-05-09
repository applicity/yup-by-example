const { mixed, date } = require('yup');
const TestDataFactory = require('../src/TestDataFactory');

describe('relative date generator', () => {

  const testDataFactory = new TestDataFactory({ now: new Date('2020-01-01T00:00:00') }).addMethod(mixed, 'example');

  it('should generate relative dates', async function() {
    const schema = date().example('rel-date', { days: 1 });
    const value = await testDataFactory.generateValid(schema);
    expect(value.toISOString()).to.equal(new Date('2020-01-02T00:00:00').toISOString())
  })
});