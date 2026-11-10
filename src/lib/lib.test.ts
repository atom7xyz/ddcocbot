import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { splitArgs } from "./args.ts";
import { isClanAdminRole, roleLabel, roleRank, toDbRole } from "./roles.ts";
import { isValidTag, normalizeTag, parseTag } from "./tags.ts";
import { TtlCache } from "./ttlCache.ts";

describe("tags", () => {
	it("normalizes case, prefix, whitespace and the letter O", () => {
		assert.equal(normalizeTag(" 2p0r98uyj "), "#2P0R98UYJ");
		assert.equal(normalizeTag("#2PoR98UYJ"), "#2P0R98UYJ");
		assert.equal(normalizeTag("#2P0R 98UYJ"), "#2P0R98UYJ");
	});

	it("rejects characters outside the tag alphabet", () => {
		assert.equal(isValidTag("#2P0R98UYJ"), true);
		assert.equal(isValidTag("#ABCDEF"), false);
		assert.equal(isValidTag("2P0R98UYJ"), false);
		assert.equal(isValidTag("#"), false);
	});

	it("parses or returns null", () => {
		assert.equal(parseTag("2p0r98uyj"), "#2P0R98UYJ");
		assert.equal(parseTag("hello world"), null);
		assert.equal(parseTag(undefined), null);
		assert.equal(parseTag(""), null);
	});
});

describe("roles", () => {
	it("maps API roles to database roles", () => {
		assert.equal(toDbRole("coLeader"), "coleader");
		assert.equal(toDbRole("admin"), "elder");
		assert.equal(toDbRole("leader"), "leader");
		assert.equal(toDbRole("member"), "member");
		assert.equal(toDbRole("notMember"), "none");
		assert.equal(toDbRole(undefined), "none");
	});

	it("treats only leader and co-leader as admins", () => {
		assert.equal(isClanAdminRole("leader"), true);
		assert.equal(isClanAdminRole("coLeader"), true);
		assert.equal(isClanAdminRole("admin"), false);
		assert.equal(isClanAdminRole("member"), false);
	});

	it("labels and ranks roles", () => {
		assert.equal(roleLabel("admin"), "anziano");
		assert.ok(roleRank("leader") < roleRank("coLeader"));
		assert.ok(roleRank("coLeader") < roleRank("admin"));
		assert.ok(roleRank("admin") < roleRank("member"));
	});
});

describe("splitArgs", () => {
	it("splits on any whitespace and drops empties", () => {
		assert.deepEqual(splitArgs("  #ABC   all\n"), ["#ABC", "all"]);
		assert.deepEqual(splitArgs(null), []);
		assert.deepEqual(splitArgs("   "), []);
	});
});

describe("TtlCache", () => {
	it("caches until the TTL expires", async () => {
		let now = 0;
		let calls = 0;
		const cache = new TtlCache<number>(1000, () => now);
		const load = async () => ++calls;

		assert.equal(await cache.getOrLoad("k", load), 1);
		assert.equal(await cache.getOrLoad("k", load), 1);
		now = 1000;
		assert.equal(await cache.getOrLoad("k", load), 2);
	});

	it("shares one in-flight load between concurrent callers", async () => {
		let calls = 0;
		const cache = new TtlCache<number>(1000);
		const load = async () => ++calls;

		const [a, b] = await Promise.all([cache.getOrLoad("k", load), cache.getOrLoad("k", load)]);
		assert.equal(a, 1);
		assert.equal(b, 1);
		assert.equal(calls, 1);
	});

	it("does not cache failures", async () => {
		const cache = new TtlCache<number>(1000);
		await assert.rejects(cache.getOrLoad("k", () => Promise.reject(new Error("boom"))));
		assert.equal(await cache.getOrLoad("k", async () => 7), 7);
	});

	it("reloads when fresh is requested", async () => {
		let calls = 0;
		const cache = new TtlCache<number>(1000);
		const load = async () => ++calls;

		await cache.getOrLoad("k", load);
		assert.equal(await cache.getOrLoad("k", load, true), 2);
	});
});
