export class LeaderboardEntryDto {
    rank: number;
    clientId: string;
    firstName: string;
    lastName: string;
    score: number;
    avatarUrl?: string;
    isCurrentUser: boolean;
}
