/**
 * Represents a Clash of Clans player
 */
export interface Player {
	tag: string;
	name: string;
	expLevel: number;
	trophies: number;
	bestTrophies: number;
	townHallLevel: number;
	clan?: PlayerClan;
}

/**
 * Represents a player's clan information
 */
export interface PlayerClan {
	tag: string;
	name: string;
	clanLevel: number;
	badgeUrls?: Record<string, string>;
}

/**
 * Represents a Clash of Clans clan
 */
export interface Clan {
	tag: string;
	name: string;
	type: string;
	description?: string;
	clanLevel: number;
	clanPoints: number;
	clanCapitalPoints?: number;
	warFrequency?: string;
	warWinStreak: number;
	warWins: number;
	warTies?: number;
	warLosses?: number;
	isWarLogPublic: boolean;
	memberList: ClanMember[];
	badgeUrls?: Record<string, string>;
}

/**
 * Represents a member of a clan
 */
export interface ClanMember {
	tag: string;
	name: string;
	role: string;
	expLevel: number;
	league?: League;
	trophies: number;
	versusTrophies?: number;
	clanRank: number;
	previousClanRank: number;
	donations: number;
	donationsReceived: number;
}

/**
 * Represents a player's league information
 */
export interface League {
	id: number;
	name: string;
	iconUrls?: Record<string, string>;
}

/**
 * Represents the current Gold Pass season dates
 */
export interface GoldPassSeason {
	startTime: string;
	endTime: string;
}

/**
 * Represents the response from a token verification request
 */
export interface TokenVerificationResponse {
	status: string;
	tag?: string;
	token?: unknown;
}
