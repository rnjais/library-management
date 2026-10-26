package com.library_management.repository;

import com.library_management.entity.Member;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for Member entities.
 * Provides derived queries, email conflict checks, and name-based search queries.
 */
@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {

    /**
     * Finds a member by their unique email.
     *
     * @param email The email to search.
     * @return Optional containing the Member if found.
     */
    Optional<Member> findByEmail(String email);

    /**
     * Checks if a member exists with the specified email.
     * Fast existence check avoiding entity loading.
     *
     * @param email The email to check.
     * @return true if an email exists.
     */
    boolean existsByEmail(String email);

    /**
     * Checks if another member has the specified email, excluding the given member ID.
     * Used during update operations to prevent false uniqueness conflicts.
     *
     * @param email The email to check.
     * @param id The ID of the member being updated.
     * @return true if another member already has this email.
     */
    boolean existsByEmailAndIdNot(String email, Long id);

    /**
     * Retrieves all active members.
     *
     * @return List of currently active members.
     */
    List<Member> findByActiveTrue();

    /**
     * Retrieves active members with pagination and sorting.
     *
     * @param pageable Pagination and sorting criteria.
     * @return A page of active members.
     */
    Page<Member> findByActiveTrue(Pageable pageable);

    /**
     * Retrieves members by active status with pagination.
     *
     * @param active The status boolean.
     * @param pageable Pagination and sorting parameters.
     * @return A page of members with the specified active status.
     */
    Page<Member> findByActive(Boolean active, Pageable pageable);

    /**
     * Searches members matching first name or last name (case-insensitive contains).
     *
     * @param name Name search keyword.
     * @param pageable Pagination and sorting parameters.
     * @return A page of matching members.
     */
    @Query("SELECT m FROM Member m WHERE " +
           "(:name IS NULL OR :name = '' OR " +
           "LOWER(m.firstName) LIKE LOWER(CONCAT('%', :name, '%')) OR " +
           "LOWER(m.lastName) LIKE LOWER(CONCAT('%', :name, '%')))")
    Page<Member> searchByName(@Param("name") String name, Pageable pageable);

    /**
     * Counts currently active library members.
     */
    long countByActiveTrue();

    /**
     * Counts inactive library members.
     */
    long countByActiveFalse();

    /**
     * Finds members registered within a specific date range with pagination.
     */
    Page<Member> findByMembershipDateBetween(LocalDate startDate, LocalDate endDate, Pageable pageable);

    /**
     * Counts members registered within a specific date range.
     */
    long countByMembershipDateBetween(LocalDate startDate, LocalDate endDate);

    /**
     * Unified search query for member reports supporting optional active status and registration date range.
     */
    @Query("SELECT m FROM Member m WHERE " +
           "(:active IS NULL OR m.active = :active) AND " +
           "(:startDate IS NULL OR m.membershipDate >= :startDate) AND " +
           "(:endDate IS NULL OR m.membershipDate <= :endDate)")
    Page<Member> searchMembersReport(@Param("active") Boolean active,
                                    @Param("startDate") LocalDate startDate,
                                    @Param("endDate") LocalDate endDate,
                                    Pageable pageable);
}
