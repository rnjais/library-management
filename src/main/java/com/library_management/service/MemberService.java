package com.library_management.service;

import com.library_management.dto.request.MemberRequestDto;
import com.library_management.dto.response.MemberResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service interface defining member management business operations.
 */
public interface MemberService {

    /**
     * Registers a new library member after validating email uniqueness.
     *
     * @param request Validated registration payload.
     * @return The created MemberResponseDto.
     */
    MemberResponseDto registerMember(MemberRequestDto request);

    /**
     * Retrieves member details by member ID.
     *
     * @param id The ID of the member.
     * @return The MemberResponseDto.
     * @throws com.library_management.exception.ResourceNotFoundException if member is not found.
     */
    MemberResponseDto getMemberById(Long id);

    /**
     * Retrieves all members with pagination and sorting.
     *
     * @param pageable Pagination and sorting criteria.
     * @return A page of MemberResponseDto objects.
     */
    Page<MemberResponseDto> getAllMembers(Pageable pageable);

    /**
     * Searches members matching first name or last name keyword.
     *
     * @param name The name substring to search for.
     * @param pageable Pagination and sorting criteria.
     * @return A page of matching MemberResponseDto objects.
     */
    Page<MemberResponseDto> searchMembersByName(String name, Pageable pageable);

    /**
     * Retrieves all active members with pagination.
     *
     * @param pageable Pagination and sorting criteria.
     * @return A page of active MemberResponseDto objects.
     */
    Page<MemberResponseDto> getActiveMembers(Pageable pageable);

    /**
     * Updates an existing member's information while preventing email collisions.
     *
     * @param id The ID of the member to update.
     * @param request Validated update payload.
     * @return The updated MemberResponseDto.
     */
    MemberResponseDto updateMember(Long id, MemberRequestDto request);

    /**
     * Deactivates a member's membership (soft deactivation).
     *
     * @param id The ID of the member to deactivate.
     * @return The updated MemberResponseDto with active = false.
     */
    MemberResponseDto deactivateMember(Long id);
}
