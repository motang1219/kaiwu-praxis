import assert from 'node:assert/strict'
import { materializedDocFileName } from '../lib/admin.mjs'

assert.equal(materializedDocFileName('company-handbook'), 'company-handbook.md')
assert.equal(materializedDocFileName('company-handbook.md'), 'company-handbook.md')
assert.equal(materializedDocFileName('company-handbook.MD'), 'company-handbook.MD')
assert.equal(materializedDocFileName(' report.md '), 'report.md')
assert.equal(materializedDocFileName('folder/report.md'), 'folder_report.md')
assert.equal(materializedDocFileName(''), 'untitled.md')

console.log(JSON.stringify({ ok: true, cases: 6 }))
