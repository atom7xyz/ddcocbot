package xyz.atom7.ddcoc.api.model

import com.fasterxml.jackson.annotation.JsonIgnoreProperties

@JsonIgnoreProperties(ignoreUnknown = true)
data class TokenVerificationResponse(
    val status: String,
    val tag: String? = null,
    val token: Any? = null
)
