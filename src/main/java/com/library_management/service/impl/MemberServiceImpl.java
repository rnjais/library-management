package com.library_management.service.impl;

import com.library_management.dto.request.MemberRequestDto;
import com.library_management.dto.response.MemberResponseDto;
import com.library_management.entity.Member;
import com.library_management.exception.DuplicateResourceException;
import com.library_management.exception.ResourceNotFoundException;
import com.library_management.repository.MemberRepository;
import com.library_management.service.MemberService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Production implementation of MemberService.
 * Enforces email uniqueness, handles entity-DTO transformations, and provides transaction management.
 */
@Slf4j
@Service
public class MemberServiceImpl implements MemberService {

    private final MemberRepository memberRepository;

    // Constructor Injection
    public MemberServiceImpl(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    @Override
    @Transactional
    public MemberResponseDto registerMember(MemberRequestDto request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email must not be null or blank");
        }
        if (request.getFirstName() == null || request.getFirstName().isBlank()) {
            throw new IllegalArgumentException("First name must not be null or blank");
        }
        if (request.getLastName() == null || request.getLastName().isBlank()) {
            throw new IllegalArgumentException("Last name must not be null or blank");
        }
        if (request.getPhoneNumber() == null || request.getPhoneNumber().isBlank()) {
            throw new IllegalArgumentException("Phone number must not be null or blank");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        log.info("Registering new member with email: {}", normalizedEmail);

        // 1. Verify email uniqueness
        if (memberRepository.existsByEmail(normalizedEmail)) {
            throw new DuplicateResourceException("Member", "email", normalizedEmail);
        }

        // 2. Map DTO to Member entity
        Member member = Member.builder()
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .email(normalizedEmail)
                .phoneNumber(request.getPhoneNumber().trim())
                .address(request.getAddress() != null ? request.getAddress().trim() : null)
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        // 3. Persist and return response DTO
        Member savedMember = memberRepository.save(member);
        log.info("Successfully registered member with ID: {}", savedMember.getId());
        return MemberResponseDto.fromEntity(savedMember);
    }

    @Override
    @Transactional(readOnly = true)
    public MemberResponseDto getMemberById(Long id) {
        log.debug("Fetching member with ID: {}", id);
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member", "id", id));
        return MemberResponseDto.fromEntity(member);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MemberResponseDto> getAllMembers(Pageable pageable) {
        log.debug("Fetching all members with pageable: {}", pageable);
        return memberRepository.findAll(pageable)
                .map(MemberResponseDto::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MemberResponseDto> searchMembersByName(String name, Pageable pageable) {
        log.debug("Searching members with name keyword: '{}'", name);
        String cleanName = (name != null && !name.isBlank()) ? name.trim() : null;
        return memberRepository.searchByName(cleanName, pageable)
                .map(MemberResponseDto::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MemberResponseDto> getActiveMembers(Pageable pageable) {
        log.debug("Fetching active members with pageable: {}", pageable);
        return memberRepository.findByActiveTrue(pageable)
                .map(MemberResponseDto::fromEntity);
    }

    @Override
    @Transactional
    public MemberResponseDto updateMember(Long id, MemberRequestDto request) {
        log.info("Updating member with ID: {}", id);

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email must not be null or blank");
        }
        if (request.getFirstName() == null || request.getFirstName().isBlank()) {
            throw new IllegalArgumentException("First name must not be null or blank");
        }
        if (request.getLastName() == null || request.getLastName().isBlank()) {
            throw new IllegalArgumentException("Last name must not be null or blank");
        }
        if (request.getPhoneNumber() == null || request.getPhoneNumber().isBlank()) {
            throw new IllegalArgumentException("Phone number must not be null or blank");
        }

        // 1. Verify existence
        Member existingMember = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member", "id", id));

        // 2. Verify email uniqueness (excluding current member's ID)
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (memberRepository.existsByEmailAndIdNot(normalizedEmail, id)) {
            throw new DuplicateResourceException("Member", "email", normalizedEmail);
        }

        // 3. Update fields
        existingMember.setFirstName(request.getFirstName().trim());
        existingMember.setLastName(request.getLastName().trim());
        existingMember.setEmail(normalizedEmail);
        existingMember.setPhoneNumber(request.getPhoneNumber().trim());

        if (request.getAddress() != null) {
            existingMember.setAddress(request.getAddress().trim());
        }
        if (request.getActive() != null) {
            existingMember.setActive(request.getActive());
        }

        Member updatedMember = memberRepository.save(existingMember);
        log.info("Successfully updated member with ID: {}", updatedMember.getId());
        return MemberResponseDto.fromEntity(updatedMember);
    }

    @Override
    @Transactional
    public MemberResponseDto deactivateMember(Long id) {
        log.info("Deactivating member with ID: {}", id);

        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member", "id", id));

        member.setActive(false);
        Member updatedMember = memberRepository.save(member);
        log.info("Successfully deactivated member with ID: {}", id);
        return MemberResponseDto.fromEntity(updatedMember);
    }
}
