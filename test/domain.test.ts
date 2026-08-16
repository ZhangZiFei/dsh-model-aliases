import assert from 'node:assert/strict'
import test from 'node:test'
import {
  aliasAvailability,
  aliasForSelection,
  decodeModelAliasSettings,
  normalizeModelAliases,
  validateModelAliasSettings,
  type ModelAliasSettings,
} from '../src/domain.js'

const valid: ModelAliasSettings = {
  aliases: [
    { name: '日常', provider: 'deepseek', model: 'deepseek-chat' },
    { name: '深度', provider: 'openai', model: 'o3', reasoningEffort: 'high' },
  ],
}

test('接受名称和完整选择都唯一的别名', () => {
  assert.doesNotThrow(() => validateModelAliasSettings(valid))
})

test('拒绝重复名称', () => {
  assert.throws(
    () => validateModelAliasSettings({
      aliases: [valid.aliases[0]!, { ...valid.aliases[1]!, name: '日常' }],
    }),
    /名称.*重复/,
  )
})

test('拒绝绑定同一完整选择的两个别名', () => {
  assert.throws(
    () => validateModelAliasSettings({
      aliases: [valid.aliases[0]!, { ...valid.aliases[0]!, name: '另一个名称' }],
    }),
    /重复的模型配置/,
  )
})

test('拒绝空白或首尾带空白的字段', () => {
  assert.throws(
    () => validateModelAliasSettings({ aliases: [{ name: '  ', provider: 'p', model: 'm' }] }),
    /首尾不能包含空白字符/,
  )
  assert.throws(
    () => validateModelAliasSettings({ aliases: [{ name: 'a', provider: ' p', model: 'm' }] }),
    /首尾不能包含空白字符/,
  )
})

test('wire decoder 只接受完整合法的别名设置', () => {
  assert.deepEqual(decodeModelAliasSettings(valid), valid)
  assert.equal(decodeModelAliasSettings({ aliases: [{ name: 'a', provider: 'p' }] }), undefined)
  assert.equal(decodeModelAliasSettings({ aliases: [{ name: 'a', provider: 'p', model: 'm' }, { name: 'a', provider: 'q', model: 'n' }] }), undefined)
})

test('表单标准化保留缺省推理等级语义', () => {
  assert.deepEqual(
    normalizeModelAliases([
      { name: ' 日常 ', provider: ' deepseek ', model: ' chat ', reasoningEffort: ' ' },
    ]),
    [{ name: '日常', provider: 'deepseek', model: 'chat' }],
  )
})

test('仅在完整选择一致时映射当前别名', () => {
  assert.equal(aliasForSelection(valid.aliases, {
    provider: 'openai',
    model: 'o3',
    reasoningEffort: 'high',
  })?.name, '深度')
  assert.equal(aliasForSelection(valid.aliases, {
    provider: 'openai',
    model: 'o3',
  }), undefined)
})

test('目录可用性分别识别提供商、模型和推理等级失效', () => {
  const groups = [{
    id: 'openai',
    models: [{
      id: 'o3',
      reasoning: {
        defaultEffort: 'medium',
        efforts: [{ id: 'low' }, { id: 'medium' }, { id: 'high' }],
      },
    }],
  }]

  assert.deepEqual(aliasAvailability({ name: 'a', provider: 'missing', model: 'o3' }, groups), {
    available: false,
    reason: 'provider',
  })
  assert.deepEqual(aliasAvailability({ name: 'a', provider: 'openai', model: 'missing' }, groups), {
    available: false,
    reason: 'model',
  })
  assert.deepEqual(aliasAvailability({
    name: 'a',
    provider: 'openai',
    model: 'o3',
    reasoningEffort: 'extreme',
  }, groups), {
    available: false,
    reason: 'effort',
  })
  assert.deepEqual(aliasAvailability({
    name: 'a',
    provider: 'openai',
    model: 'o3',
    reasoningEffort: 'high',
  }, groups), { available: true })
})
