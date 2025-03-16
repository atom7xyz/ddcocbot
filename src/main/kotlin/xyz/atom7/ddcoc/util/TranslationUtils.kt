package xyz.atom7.ddcoc.util

/**
 * Utility class for translations
 */
object TranslationUtils 
{
    /**
     * Translates the clan roles.
     * 
     * @param role The role to translate
     * @return The translated role
     */
    fun translateRole(role: String): String
    {
        return when (role.lowercase()) {
            "leader" -> "Capo"
            "coleader" -> "Co-Capo"
            "admin" -> "Anziano"
            "member" -> "Membro"
            else -> role
        }
    }
    
    /**
     * Translates the clan type.
     * 
     * @param type The type to translate
     * @return The translated type
     */
    fun translateClanType(type: String): String
    {
        val normalizedType = type.lowercase().replace(" ", "").replace("_", "")
        return when (normalizedType) {
            "open" -> "Aperto"
            "inviteonly" -> "Solo su Invito"
            "closed" -> "Chiuso"
            else -> type
        }
    }
    
    /**
     * Translates the war frequency.
     * 
     * @param frequency The frequency to translate
     * @return The translated frequency
     */
    fun translateWarFrequency(frequency: String?): String
    {
        if (frequency == null)
            return "Sconosciuto"
        
        return when (frequency.lowercase()) {
            "always" -> "Sempre"
            "more than once per week" -> "Più di una volta a settimana"
            "once per week" -> "Una volta a settimana"
            "less than once per week" -> "Meno di una volta a settimana"
            "never" -> "Mai"
            "unknown" -> "Sconosciuto"
            else -> frequency
        }
    }
} 