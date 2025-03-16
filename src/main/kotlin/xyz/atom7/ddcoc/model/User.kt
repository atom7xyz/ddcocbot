package xyz.atom7.ddcoc.model

import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "users")
data class User(
    @Id
    val telegramId: Long,
    var username: String? = null,
    var firstName: String? = null,
    var lastName: String? = null,
    var cocPlayerName: String? = null,
    var cocPlayerTag: String? = null,
    var cocApiToken: String? = null,
    var registrationDate: LocalDateTime = LocalDateTime.now(),
    var isRegistered: Boolean = false
) 