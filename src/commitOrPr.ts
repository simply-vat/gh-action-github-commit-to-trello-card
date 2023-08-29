import axios from 'axios';
import type { context } from '@actions/github'
import { Options, Card, Commit, List, PullRequest, TrelloCardAttachment, TrelloCardComment, ActionData, Issue } from './types';

process.env.VERBOSE ||= 'true'

function log(...any: any[]) {
    process.env.VERBOSE === 'true' && console.log(...any);
}

export default function processCommitOrPr(options: Options) {
    const {
        regexPullRequest,
        trelloCardIdPattern,
        trelloApiKey,
        trelloAuthToken,
        trelloBoardId,
        trelloCardAction,
        trelloListNameCommit,
        trelloListNamePullRequestOpen,
        trelloListNamePullRequestClosed
    } = options;

    function getCardNumbers(message?: string): string[] {
        const ids = message && message.length > 0 ? message.replace(regexPullRequest, "").match(new RegExp(`${trelloCardIdPattern}\\d+`, 'g')) : [];
        return ids && ids.length > 0 ? ids.map(x => x.replace(trelloCardIdPattern, '')) : [];
    }

    function getAllCardNumbers(message: string, branch?: string): Set<string> {
        const cardBranch = getCardNumbers(message);
        const cardMessage = getCardNumbers(branch);
        if (!cardBranch || !cardMessage) {
            throw new Error("PR title or branch name does not meet the guidelines");
        }
        return new Set([...cardBranch, ...cardMessage]);
    }

    async function getCardOnBoard(board: string, card: string): Promise<string | null> {
        if (card && card.length > 0) {
            const url = `https://trello.com/1/boards/${board}/cards/${card}`;
            try {
                const response = await axios.get<Card>(url, {
                    params: {
                        key: trelloApiKey,
                        token: trelloAuthToken
                    }
                });
                return response.data.id;
            } catch (error) {
                console.error(url, `Error ${error.response.status} ${error.response.statusText}`);
                return null;
            }
        }

        return null;
    }

    async function getListOnBoard(board: string, list: string): Promise<string | null> {
        const url = `https://trello.com/1/boards/${board}/lists`;
        try {
            const response = await axios.get<List[]>(url, {
                params: {
                    key: trelloApiKey,
                    token: trelloAuthToken
                }
            });
            const result = response.data.find(l => !l.closed && l.name === list);
            return result ? result.id : null;
        } catch (error) {
            console.error(url, `Error ${error.response.status} ${error.response.statusText}`);
            return null;
        }
    }

    async function getCardAttachments(card: string){
        log(`getCardAttachments(${card})`);
        const cardId = await getCardOnBoard(trelloBoardId, card);
        const url = `https://api.trello.com/1/cards/${cardId}/attachments`;
        try {
            const response = await axios.get<TrelloCardAttachment[]>(url, {
                params: {
                    key: trelloApiKey,
                    token: trelloAuthToken,
                },
                headers: {
                    'Accept': 'application/json'
                }
            });
            return response.data
        } catch (error) {
            console.error(url, `Error ${error.response.status} ${error.response.statusText}`);
            log(error.response.data)
            return null;
        }
    }

    async function addAttachmentToCard(card: string, link: string): Promise<boolean | null> {
        log(`addAttachmentToCard(${card}, ${link})`);

        const attachments = await getCardAttachments(card)

        if (attachments && attachments.length > 0) {
            const existingAttachment = attachments.find(a => a.url === link)
            if (existingAttachment) {
                log(`Attachment already exists ${existingAttachment.url}`)
                return true
            }
        }

        const url = `https://api.trello.com/1/cards/${card}/attachments`;
        try {
            const response = await axios.post(url, {
                key: trelloApiKey,
                token: trelloAuthToken,
                url: link
            });
            return response.status === 200;
        } catch (error) {
            console.error(url, `Error ${error.response.status} ${error.response.statusText}`);
            return null;
        }
    }

    async function getCardComments(card: string){
        log(`getCardComments(${card})`);
        const cardId = await getCardOnBoard(trelloBoardId, card);
        const url = `https://api.trello.com/1/cards/${cardId}/actions?filter=commentCard`;
        try {
            const response = await axios.get<TrelloCardComment[]>(url, {
                params: {
                    key: trelloApiKey,
                    token: trelloAuthToken,
                },
                headers: {
                    'Accept': 'application/json'
                }
            });
            return response.data
        } catch (error) {
            console.error(url, `Error ${error.response.status} ${error.response.statusText}`);
            log(error.response.data)
            return null;
        }
    }

    async function addCommentToCard(card: string, user: string, message: string, link: string): Promise<boolean | null> {
        log(`addCommentToCard(${card}, ${user}, ${message}, ${link})`);

        const comments = await getCardComments(card)
        const foundComment = comments?.find(c => c.data.text === `${user}: ${message} ${link}`)
        if (foundComment) {
            log(`Comment already exists ${foundComment.data.text}`)
            return true
        }

        const url = `https://api.trello.com/1/cards/${card}/actions/comments`;
        try {
            const response = await axios.post(url, {
                key: trelloApiKey,
                token: trelloAuthToken,
                text: `${user}: ${message} ${link}`
            });
            return response.status === 200;
        } catch (error) {
            console.error(url, `Error ${error.response.status} ${error.response.statusText}`);
            return null;
        }
    }


    async function moveCardToList(board: string, card: string, list: string): Promise<boolean | null> {
        log(`moveCardToList(${board}, ${card}, ${list})`);
        const listId = await getListOnBoard(board, list);
        if (listId && listId.length > 0) {
            const url = `https://api.trello.com/1/cards/${card}`;
            try {
                const response = await axios.put(url, {
                    key: trelloApiKey,
                    token: trelloAuthToken,
                    idList: listId
                });
                return response && response.status === 200;
            } catch (error) {
                console.error(url, `Error ${error.response.status} ${error.response.statusText}`);
                return null;
            }
        }
        return null;
    }

    async function handleCommit(data: Commit): Promise<void> {
        const url = data.url;
        const message = data.message;
        const user = data.author.name;
        const cardsNumbers = getCardNumbers(message);

        for (const cardNumber of cardsNumbers) {
            const card = await getCardOnBoard(trelloBoardId, cardNumber);
            if (card && card.length > 0) {
                if (trelloCardAction && trelloCardAction.toLowerCase() === 'attachment') {
                    await addAttachmentToCard(card, url);
                } else if (trelloCardAction && trelloCardAction.toLowerCase() === 'comment') {
                    await addCommentToCard(card, user, message, url);
                }

                if (message.match(regexPullRequest) && trelloListNamePullRequestClosed && trelloListNamePullRequestClosed.length > 0) {
                    await moveCardToList(trelloBoardId, card, trelloListNamePullRequestClosed);
                } else if (trelloListNameCommit && trelloListNameCommit.length > 0) {
                    await moveCardToList(trelloBoardId, card, trelloListNameCommit);
                }
            }
        }
    }

    async function handleCommits(commit: Commit[]) {
        for (const data of commit) {
            await handleCommit(data);
        }
    }

    async function handlePullRequest(data: PullRequest): Promise<void> {
        const url = data.html_url || data.url;
        const message = data.title;
        const user = data.user.name;
        const branch = data.head.ref;
        const cardsNumbers = getAllCardNumbers(message, branch);

        for (const cardNumber of cardsNumbers) {
            const card = await getCardOnBoard(trelloBoardId, cardNumber);
            if (card && card.length > 0) {
                if (trelloCardAction && trelloCardAction.toLowerCase() === 'attachment') {
                    await addAttachmentToCard(card, url);
                } else if (trelloCardAction && trelloCardAction.toLowerCase() === 'comment') {
                    await addCommentToCard(card, user, message, url);
                }

                if (data.state === "open" && trelloListNamePullRequestOpen && trelloListNamePullRequestOpen.length > 0) {
                    await moveCardToList(trelloBoardId, card, trelloListNamePullRequestOpen);
                } else if (data.state === "closed" && trelloListNamePullRequestClosed && trelloListNamePullRequestClosed.length > 0) {
                    await moveCardToList(trelloBoardId, card, trelloListNamePullRequestClosed);
                }
            }
        }
    }

    async function handleIssue(data: Issue): Promise<void> {
        const url = data.html_url || data.url;
        const message = data.title;
        const user = data.user.name;
        const cardsNumbers = getAllCardNumbers(message);

        for (const cardNumber of cardsNumbers) {
            const card = await getCardOnBoard(trelloBoardId, cardNumber);
            if (card && card.length > 0) {
                if (trelloCardAction && trelloCardAction.toLowerCase() === 'attachment') {
                    await addAttachmentToCard(card, url);
                } else if (trelloCardAction && trelloCardAction.toLowerCase() === 'comment') {
                    await addCommentToCard(card, user, message, url);
                }

                if (data.state === "open" && trelloListNamePullRequestOpen && trelloListNamePullRequestOpen.length > 0) {
                    await moveCardToList(trelloBoardId, card, trelloListNamePullRequestOpen);
                } else if (data.state === "closed" && trelloListNamePullRequestClosed && trelloListNamePullRequestClosed.length > 0) {
                    await moveCardToList(trelloBoardId, card, trelloListNamePullRequestClosed);
                }
            }
        }
    }

    const func = async (actionData: ActionData) => {
        const { pullRequest, commits, issue } = actionData

        if (commits?.length) {
            await handleCommits(commits);
        } else if (pullRequest?.title) {
            await handlePullRequest(pullRequest);
        } else if (issue?.title) {
            await handleIssue(issue)
        }
    }

    func.getCardAttachments = getCardAttachments;
    func.getCardComments = getCardComments

    return func
}
