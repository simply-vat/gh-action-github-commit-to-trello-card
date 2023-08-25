import assert from 'assert'
import processCommitOrPr from '../../src/commitOrPr'
import { ActionData, Commit, PullRequest } from '../../src/types'
import { randomUUID } from 'crypto'

process.env.VERBOSE = 'false'

describe('Github Commit/PR to Trello card', function () {
    this.timeout(10000)

    const testRandomCommitRequest: ActionData = {
        commits: [{
            author: {
                name: 'John Doe'
            },
            message: 'This is a commit message #1',
            url: `https://www.github.com/${randomUUID()}`
        }]
    }

    const testCommitRequest: ActionData = {
        commits: [{
            author: {
                name: 'John Doe'
            },
            message: 'This is a commit message #1',
            url: `https://www.github.com`
        }]
    }

    it('should add an attachment to a Trello card containing a URL', async () => {
        const process = processCommitOrPr({
            regexPullRequest: /Merge pull request \#\d+ from/g,
            trelloCardIdPattern: '#',
            trelloApiKey: '7140db0e0326f7c5139aea636663f4fb',
            trelloAuthToken: 'ATTAeb01295f3fe4b6c01e670f352df3ee7d1ac4906d23aa9e3fde0ce8e94fe55cba1FF09F83',
            trelloBoardId: '64e8b990946f9feaa58658ea',
            trelloCardAction: 'attachment',
            trelloListNameCommit: 'Doing',
            trelloListNamePullRequestOpen: 'Doing',
            trelloListNamePullRequestClosed: 'Done'
        })

        const count = await process.getCardAttachments('1')

        if (!count)
            throw new Error('Count is undefined')

        await process(testRandomCommitRequest)
    
        assert.equal((await process.getCardAttachments('1'))?.length, count.length + 1)
    })

    it('should not add an attachment to a Trello card if the attachment already exists', async () => {
        const process = processCommitOrPr({
            regexPullRequest: /Merge pull request \#\d+ from/g,
            trelloCardIdPattern: '#',
            trelloApiKey: '7140db0e0326f7c5139aea636663f4fb',
            trelloAuthToken: 'ATTAeb01295f3fe4b6c01e670f352df3ee7d1ac4906d23aa9e3fde0ce8e94fe55cba1FF09F83',
            trelloBoardId: '64e8b990946f9feaa58658ea',
            trelloCardAction: 'attachment',
            trelloListNameCommit: 'Doing',
            trelloListNamePullRequestOpen: 'Doing',
            trelloListNamePullRequestClosed: 'Done'
        })

        const count = await process.getCardAttachments('1')

        if (!count)
            throw new Error('Count is undefined')

        await process(testCommitRequest)
    
        assert.equal((await process.getCardAttachments('1'))?.length, count.length)
    })

    it('should not add a comment to a Trello card if the comment already exists', async () => {
        const process = processCommitOrPr({
            regexPullRequest: /Merge pull request \#\d+ from/g,
            trelloCardIdPattern: '#',
            trelloApiKey: '7140db0e0326f7c5139aea636663f4fb',
            trelloAuthToken: 'ATTAeb01295f3fe4b6c01e670f352df3ee7d1ac4906d23aa9e3fde0ce8e94fe55cba1FF09F83',
            trelloBoardId: '64e8b990946f9feaa58658ea',
            trelloCardAction: 'comment',
            trelloListNameCommit: 'Doing',
            trelloListNamePullRequestOpen: 'Doing',
            trelloListNamePullRequestClosed: 'Done'
        })

        const count = await process.getCardComments('1')

        if (!count)
            throw new Error('Count is undefined')

        await process(testCommitRequest)
    
        assert.equal((await process.getCardComments('1'))?.length, count.length)
    })

    it('should be able to add multiple commits to a card', async () => {
        const process = processCommitOrPr({
            regexPullRequest: /Merge pull request \#\d+ from/g,
            trelloCardIdPattern: '#',
            trelloApiKey: '7140db0e0326f7c5139aea636663f4fb',
            trelloAuthToken: 'ATTAeb01295f3fe4b6c01e670f352df3ee7d1ac4906d23aa9e3fde0ce8e94fe55cba1FF09F83',
            trelloBoardId: '64e8b990946f9feaa58658ea',
            trelloCardAction: 'attachment',
            trelloListNameCommit: 'Doing',
            trelloListNamePullRequestOpen: 'Doing',
            trelloListNamePullRequestClosed: 'Done'
        })

        await process({
            commits: [
                {
                    author: {
                        name: 'John Doe'
                    },
                    message: 'This is a commit message #1',
                    url: `https://www.github.com/${randomUUID()}`
                },
                {
                    author: {
                        name: 'John Doe'
                    },
                    message: 'This is a commit message #1',
                    url: `https://www.github.com/${randomUUID()}`
                }
            ]
        })
    })
})