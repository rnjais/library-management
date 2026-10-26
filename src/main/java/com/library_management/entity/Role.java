package com.library_management.entity;

/**
 * Enumeration representing security roles in the Library Management System.
 */
public enum Role {
    ADMIN,
    MEMBER;

    /**
     * Returns the role name prefixed with 'ROLE_' as required by Spring Security authority checks.
     */
    public String getAuthority() {
        return "ROLE_" + this.name();
    }
}
