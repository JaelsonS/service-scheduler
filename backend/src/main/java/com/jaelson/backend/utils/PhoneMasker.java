package com.jaelson.backend.utils;

/**
 * Mascara telefone em respostas públicas (confirmação sem login).
 */
public final class PhoneMasker {

    private PhoneMasker() {
    }

    public static String mask(String phone) {
        if (phone == null || phone.isBlank()) {
            return "****";
        }
        String trimmed = phone.trim();
        if (trimmed.length() <= 4) {
            return "****";
        }
        int visible = 4;
        int hidden = trimmed.length() - visible;
        return "*".repeat(hidden) + trimmed.substring(hidden);
    }
}
