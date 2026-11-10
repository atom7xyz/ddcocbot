/** Roles as stored in the database `role` enum. */
export const DB_ROLES = ["leader", "coleader", "elder", "member", "none"] as const;
export type DbRole = (typeof DB_ROLES)[number];

/**
 * Roles as returned by the Clash of Clans API. The API calls elders "admin".
 */
export type ClanRole = "leader" | "coLeader" | "admin" | "member" | "notMember";

const CLAN_TO_DB_ROLE: Record<string, DbRole> = {
	leader: "leader",
	coleader: "coleader",
	admin: "elder",
	elder: "elder",
	member: "member",
};

/** Maps an API role to the database enum. Unknown or missing roles map to "none". */
export function toDbRole(role: string | null | undefined): DbRole {
	if (!role) {
		return "none";
	}
	return CLAN_TO_DB_ROLE[role.toLowerCase()] ?? "none";
}

/** True for the API roles that may run admin commands (leader and co-leader). */
export function isClanAdminRole(role: string | null | undefined): boolean {
	const dbRole = toDbRole(role);
	return dbRole === "leader" || dbRole === "coleader";
}

const ROLE_LABELS: Record<DbRole, string> = {
	leader: "capo",
	coleader: "co-capo",
	elder: "anziano",
	member: "membro",
	none: "?",
};

const ROLE_ORDER: Record<DbRole, number> = {
	leader: 0,
	coleader: 1,
	elder: 2,
	member: 3,
	none: 4,
};

/** Italian label for an API or database role. */
export function roleLabel(role: string | null | undefined): string {
	return ROLE_LABELS[toDbRole(role)];
}

/** Sort key for an API or database role. Lower values rank higher. */
export function roleRank(role: string | null | undefined): number {
	return ROLE_ORDER[toDbRole(role)];
}
