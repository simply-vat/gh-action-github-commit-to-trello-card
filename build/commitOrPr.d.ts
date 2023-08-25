import { Options, TrelloCardAttachment, TrelloCardComment, ActionData } from './types';
export default function processCommitOrPr(options: Options): {
    (actionData: ActionData): Promise<void>;
    getCardAttachments: (card: string) => Promise<TrelloCardAttachment[]>;
    getCardComments: (card: string) => Promise<TrelloCardComment[]>;
};
