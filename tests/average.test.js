const { test, describe } = require('node:test')
const assert = require('node:assert')
const average  = require('../utils/for_testing').average

describe('average', () => {
  test('of one value is the value itself', () => {
    assert.strictEqual(average([1]), 1)
  })
  test('of many is calculated right', () => {
    const result = average([1, 2, 3, 4, 5, 6])
    assert.strictEqual(result, 3.5)
  })
  test('of empty array is zero', () => {
    const result = average([])
    assert.strictEqual(result, 0)
  })
})
