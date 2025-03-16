package xyz.atom7.ddcoc.api.model

import com.fasterxml.jackson.annotation.JsonIgnoreProperties

@JsonIgnoreProperties(ignoreUnknown = true)
data class Player(
    val tag: String,
    val name: String,
    val expLevel: Int,
    val trophies: Int,
    val bestTrophies: Int,
    val townHallLevel: Int,
    val clan: PlayerClan? = null,
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class PlayerClan(
    val tag: String,
    val name: String,
    val clanLevel: Int,
    val badgeUrls: Map<String, String>? = null
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class Clan(
    val tag: String,
    val name: String,
    val type: String,
    val description: String? = null,
    val clanLevel: Int,
    val clanPoints: Int,
    val clanCapitalPoints: Int? = null,
    val warFrequency: String? = null,
    val warWinStreak: Int,
    val warWins: Int,
    val warTies: Int? = null,
    val warLosses: Int? = null,
    val isWarLogPublic: Boolean,
    val memberList: List<ClanMember> = emptyList(),
    val badgeUrls: Map<String, String>? = null
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class ClanMember(
    val tag: String,
    val name: String,
    val role: String,
    val expLevel: Int,
    val league: League? = null,
    val trophies: Int,
    val versusTrophies: Int? = null,
    val clanRank: Int,
    val previousClanRank: Int,
    val donations: Int,
    val donationsReceived: Int
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class League(
    val id: Int,
    val name: String,
    val iconUrls: Map<String, String>? = null
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class GoldPassSeason(
    val startTime: String,
    val endTime: String
) 