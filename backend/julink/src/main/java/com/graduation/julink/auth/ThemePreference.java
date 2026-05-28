package com.graduation.julink.auth;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ThemePreference {
    LIGHT,
    DARK,
    SYSTEM;

    @JsonCreator
    public static ThemePreference fromValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return ThemePreference.valueOf(value.trim().toUpperCase());
    }

    @JsonValue
    public String toValue() {
        return name().toLowerCase();
    }
}
