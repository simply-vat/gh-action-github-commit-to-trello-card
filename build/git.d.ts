import { Commit } from "./types";
declare function getRecentCommits(count: number, urlPrefix: string): Promise<Commit[]>;
export { getRecentCommits };
