package xyz.atom7.ddcoc.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

/**
 * Service for retrieving messages from application.yml
 */
@Service
class MessageService(
    @Value("\${messages.welcome-back}")
    val welcomeBack: String,
    
    @Value("\${messages.use-help-command}")
    val useHelpCommand: String,
    
    @Value("\${messages.registration-welcome}")
    val registrationWelcome: String,
    
    @Value("\${messages.provide-coc-username-name}")
    val provideCocUsernameName: String,
    
    @Value("\${messages.provide-coc-username-tag}")
    val provideCocUsernameTag: String,
    
    @Value("\${messages.provide-api-token}")
    val provideApiToken: String,
    
    @Value("\${messages.registration-success-heart}")
    val registrationSuccessHeart: String,
    
    @Value("\${messages.registration-complete}")
    val registrationComplete: String,
    
    @Value("\${messages.join-group}")
    val joinGroup: String,
    
    @Value("\${messages.player-not-found-in-clan}")
    val playerNotFoundInClan: String,
    
    @Value("\${messages.player-not-in-clan-by-tag}")
    val playerNotInClanByTag: String,
    
    @Value("\${messages.player-not-found-by-tag}")
    val playerNotFoundByTag: String,
    
    @Value("\${messages.clan-info-error}")
    val clanInfoError: String,
    
    @Value("\${messages.user-info-error}")
    val userInfoError: String,
    
    @Value("\${messages.not-registered}")
    val notRegistered: String,
    
    @Value("\${messages.not-registered-button}")
    val notRegisteredButton: String,
    
    @Value("\${messages.invalid-api-token}")
    val invalidApiToken: String,
    
    @Value("\${messages.group-chat-error}")
    val groupChatError: String,
    
    @Value("\${messages.private-chat-button}")
    val privateChatButton: String,
    
    @Value("\${messages.register-by-name-button}")
    val registerByNameButton: String,
    
    @Value("\${messages.register-by-id-button}")
    val registerByIdButton: String,
    
    @Value("\${messages.unexpected-error}")
    val unexpectedError: String,
    
    @Value("\${messages.verification-error}")
    val verificationError: String,
    
    @Value("\${messages.incomplete-user-info}")
    val incompleteUserInfo: String,
    
    @Value("\${messages.player-info-error}")
    val playerInfoError: String,
    
    @Value("\${messages.player-tag-required}")
    val playerTagRequired: String,
    
    @Value("\${messages.player-not-found}")
    val playerNotFound: String,
    
    @Value("\${messages.not-authorized}")
    val notAuthorized: String,
    
    @Value("\${messages.refresh-started}")
    val refreshStarted: String,
    
    @Value("\${messages.refresh-completed}")
    val refreshCompleted: String,
    
    @Value("\${messages.user-not-in-clan}")
    val userNotInClan: String,
    
    @Value("\${messages.kick-usage}")
    val kickUsage: String,
    
    @Value("\${messages.user-not-found}")
    val userNotFound: String,
    
    @Value("\${messages.user-kicked}")
    val userKicked: String,
    
    @Value("\${messages.kick-failed}")
    val kickFailed: String,
    
    @Value("\${messages.users-header}")
    val usersHeader: String,
    
    @Value("\${messages.user-list-item}")
    val userListItem: String,
    
    @Value("\${messages.no-registered-users}")
    val noRegisteredUsers: String,
    
    @Value("\${messages.command-group-only}")
    val commandGroupOnly: String,
    
    @Value("\${messages.player-info-template}")
    val playerInfoTemplate: String,
    
    @Value("\${messages.clan-not-found}")
    val clanNotFound: String,
    
    @Value("\${messages.clan-no-members}")
    val clanNoMembers: String,
    
    @Value("\${messages.clan-info-template}")
    val clanInfoTemplate: String,
    
    @Value("\${messages.clan-members-header}")
    val clanMembersHeader: String,
    
    @Value("\${messages.clan-members-continued}")
    val clanMembersContinued: String,
    
    @Value("\${messages.help-not-registered-warning}")
    val helpNotRegisteredWarning: String,
    
    @Value("\${messages.help-text}")
    val helpText: String
) 