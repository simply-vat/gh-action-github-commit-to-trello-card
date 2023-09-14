import { Commit } from "./types"
import simpleGit from "simple-git"

const git = simpleGit()

async function getRecentCommits(count: number, urlPrefix: string): Promise<Commit[]> {
    const commits = await git.log({
        maxCount: count,
    })

    return commits.all.map((commit) => ({
        author: {
            name: commit.author_name
        },
        message: commit.message,
        url: `${urlPrefix}/${commit.hash}`
    }))
}

export {
    getRecentCommits
}