package com.library_management.repository;

import com.library_management.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for the User entity.
 * Provides query methods for credential lookup and email uniqueness validation.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Finds an application user by their unique email.
     * Used by UserDetailsService during login authentication.
     *
     * @param email The user's email address.
     * @return Optional containing the User if found.
     */
    Optional<User> findByEmail(String email);

    /**
     * Checks whether an account already exists with the given email.
     *
     * @param email The email address to check.
     * @return true if the email is already registered.
     */
    boolean existsByEmail(String email);
}
