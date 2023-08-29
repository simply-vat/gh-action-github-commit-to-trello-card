type Card = {
    id: string;
}

type List = {
    id: string;
    name: string;
    closed: boolean;
}

type TrelloCardAttachment = {
    "id": string
    "bytes": string
    "date": string
    "edgeColor": string
    "idMember": string
    "isUpload": boolean
    "mimeType": string
    "name": string
    "previews": string[]
    "url": string
    "pos": number
}

type TrelloCardComment = {
    "id": string
    "idMemberCreator": string
    "data": {
        "text": string
    }
    "type": "commentCard" | "updateCard"
    "date": string
    "memberCreator": {
        "id": string
        "avatarHash": string
        "fullName": string
        "initials": string
        "username": string
    }
}

type Author = {
    name: string;
}

type Commit = {
    message: string;
    author: Author;
    url: string;
}

type PullRequest = {
    html_url: string;
    url: string;
    title: string;
    number: number
    user: {
        name: string;
    };
    head: {
        ref: string;
    };
    state: 'open' | 'closed'
}

type CardAction = 'attachment' | 'comment' | 'moveCardToBoard'

type Options = {
    regexPullRequest: RegExp;
    trelloCardIdPattern: string;
    trelloApiKey: string;
    trelloAuthToken: string;
    trelloBoardId: string;
    trelloCardAction: CardAction
    trelloListNameCommit: string;
    trelloListNamePullRequestOpen: string;
    trelloListNamePullRequestClosed: string;
}

type Issue = {
    number: number
    title: string
    url: string;
    html_url: string
    user: {
        name: string;
    };
    state: 'open' | 'closed'
}

type ActionData = {
    pullRequest?: PullRequest
    commits?: Commit[]
    issue?: Issue
}

export {
    Card,
    List,
    Author,
    Commit,
    TrelloCardAttachment,
    TrelloCardComment,
    PullRequest,
    CardAction,
    Options,
    Issue,
    ActionData
}