import { execSync } from "child_process"
import { Commit } from "./types"
import simpleGit from "simple-git"

const git = simpleGit()

const gitLogCmd = (count: number): string => `git log -${count} --pretty=format:'{%n  "commit": "%H",%n  "abbreviated_commit": "%h",%n  "tree": "%T",%n  "abbreviated_tree": "%t",%n  "parent": "%P",%n  "abbreviated_parent": "%p",%n  "refs": "%D",%n  "encoding": "%e",%n  "subject": "%s",%n  "sanitized_subject_line": "%f",%n  "commit_notes": "%N",%n  "verification_flag": "%G?",%n  "signer": "%GS",%n  "signer_key": "%GK",%n  "author": {%n    "name": "%aN",%n    "email": "%aE",%n    "date": "%aD"%n  },%n  "commiter": {%n    "name": "%cN",%n    "email": "%cE",%n    "date": "%cD"%n  }%n},'`

async function getRecentCommits(count: number, urlPrefix: string): Promise<Commit[]> {
    /*const str = `[${execSync(gitLogCmd(count)).toString().slice(0, -1)}]`

    const commits = JSON.parse(str) as {
        commit: string
        abbreviated_commit: string
        tree: string
        abbreviated_tree: string
        parent: string
        abbreviated_parent: string
        refs: string
        encoding: string
        subject: string
        sanitized_subject_line: string
        body: string
        commit_notes: string
        verification_flag: string
        signer: string
        signer_key: string
        author: {
            name: string
            email: string
            date: string
        }
    }[]*/

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