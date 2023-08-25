import processCommitOrPr from "./commitOrPr";
import * as core from '@actions/core';
import * as github from '@actions/github';
import { CardAction } from "./types";

const regexPullRequest = /Merge pull request \#\d+ from/g;
const trelloCardIdPattern = core.getInput('trello-card-id-pattern', { required: false }) || '#';
const trelloApiKey = core.getInput('trello-api-key', { required: true });
const trelloAuthToken = core.getInput('trello-auth-token', { required: true });
const trelloBoardId = core.getInput('trello-board-id', { required: true });
const trelloCardAction = core.getInput('trello-card-action', { required: true }) as CardAction
const trelloListNameCommit = core.getInput('trello-list-name-commit', { required: true });
const trelloListNamePullRequestOpen = core.getInput('trello-list-name-pr-open', { required: false });
const trelloListNamePullRequestClosed = core.getInput('trello-list-name-pr-closed', { required: false });

const process = processCommitOrPr({
    regexPullRequest,
    trelloCardIdPattern,
    trelloApiKey,
    trelloAuthToken,
    trelloBoardId,
    trelloCardAction,
    trelloListNameCommit,
    trelloListNamePullRequestOpen,
    trelloListNamePullRequestClosed
});

process({
    commits: github.context.payload.head_commit ? [github.context.payload.head_commit] : undefined,
    pullRequest: {
        head: github.context.payload.pull_request?.head,
        html_url: github.context.payload.pull_request?.html_url,
        number: github.context.payload.pull_request?.number,
        state: github.context.payload.pull_request?.state,
        title: github.context.payload.pull_request?.title,
        url: github.context.payload.pull_request?.url,
        user: github.context.payload.pull_request?.user
    }
})