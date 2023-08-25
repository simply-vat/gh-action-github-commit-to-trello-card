import { getRecentCommits } from '../../src/git'
import assert from 'assert'

describe('Git functions', () => {
    it('should get recent commit history', async () => {
        const commits = await getRecentCommits(2, `https://simply-vat/svat-api/commit`)

        assert.strictEqual(commits.length, 2)
        assert.equal(typeof commits[0].author.name === 'string', true)
        assert.equal(typeof commits[0].message === 'string', true)
        assert.equal(commits[0].url.startsWith('https://simply-vat/svat-api/commit/'), true)
    })
})