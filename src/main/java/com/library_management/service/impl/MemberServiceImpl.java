package com.library_management.service.impl;

import com.library_management.dto.request.MemberRequestDto;
import com.library_management.dto.response.MemberResponseDto;
import com.library_management.entity.FineStatus;
import com.library_management.entity.Member;
import com.library_management.entity.ReservationStatus;
import com.library_management.entity.Role;
import com.library_management.entity.User;
import com.library_management.exception.DuplicateResourceException;
import com.library_management.exception.ResourceNotFoundException;
import com.library_management.repository.BorrowingReminderRepository;
import com.library_management.repository.BorrowingRepository;
import com.library_management.repository.FineRepository;
import com.library_management.repository.MemberRepository;
import com.library_management.repository.ReservationRepository;
import com.library_management.repository.UserRepository;
import com.library_management.service.MemberService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Production implementation of MemberService.
 * Enforces email uniqueness, handles entity-DTO transformations, and provides transaction management.
 */
@Slf4j
@Service
public class MemberServiceImpl implements MemberService {

    private final MemberRepository memberRepository;
    private final BorrowingRepository borrowingRepository;
    private final FineRepository fineRepository;
    private final BorrowingReminderRepository borrowingReminderRepository;
    private final UserRepository userRepository;
    private final ReservationRepository reservationRepository;

    // Constructor Injection
    public MemberServiceImpl(
            MemberRepository memberRepository,
            BorrowingRepository borrowingRepository,
            FineRepository fineRepository,
            BorrowingReminderRepository borrowingReminderRepository,
            UserRepository userRepository,
            ReservationRepository reservationRepository) {
        this.memberRepository = memberRepository;
        this.borrowingRepository = borrowingRepository;
        this.fineRepository = fineRepository;
        this.borrowingReminderRepository = borrowingReminderRepository;
        this.userRepository = userRepository;
        this.reservationRepository = reservationRepository;
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

        // 1. Verify email uniqueness across members and prevent colliding with an ADMIN account
        if (memberRepository.existsByEmail(normalizedEmail)) {
            throw new DuplicateResourceException("Member", "email", normalizedEmail);
        }
        userRepository.findByEmail(normalizedEmail).ifPresent(existingUser -> {
            if (existingUser.getRole() == Role.ADMIN) {
                throw new DuplicateResourceException("User", "email", normalizedEmail);
            }
        });

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

        String previousEmail = existingMember.getEmail();
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        boolean emailChanged = !normalizedEmail.equalsIgnoreCase(previousEmail);

        // 2. Verify email uniqueness across members and users (prevent profile hijacking)
        if (memberRepository.existsByEmailAndIdNot(normalizedEmail, id)) {
            throw new DuplicateResourceException("Member", "email", normalizedEmail);
        }

        Optional<User> linkedUserOpt = userRepository.findByEmail(previousEmail);
        if (emailChanged) {
            Optional<User> conflictingUser = userRepository.findByEmail(normalizedEmail);
            if (conflictingUser.isPresent()) {
                throw new DuplicateResourceException("User", "email", normalizedEmail);
            }
        }

        // 3. Update Member fields
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

        // 4. Atomically sync linked non-ADMIN User account (email, name, enabled status)
        linkedUserOpt.ifPresent(user -> {
            if (user.getRole() != Role.ADMIN) {
                user.setEmail(normalizedEmail);
                user.setName(updatedMember.getFullName());
                if (request.getActive() != null) {
                    user.setEnabled(request.getActive());
                }
                userRepository.save(user);
                log.info("Synced linked user id={} with updated member id={}", user.getId(), updatedMember.getId());
            }
        });

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

        // Disable linked non-ADMIN user account so active JWTs are rejected immediately
        userRepository.findByEmail(member.getEmail()).ifPresent(user -> {
            if (user.getRole() != Role.ADMIN) {
                user.setEnabled(false);
                userRepository.save(user);
                log.info("Disabled linked user account id={} for deactivated member id={}", user.getId(), id);
            }
        });

        log.info("Successfully deactivated member with ID: {}", id);
        return MemberResponseDto.fromEntity(updatedMember);
    }

    @Override
    @Transactional
    public MemberResponseDto activateMember(Long id) {
        log.info("Reactivating member with ID: {}", id);

        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member", "id", id));

        member.setActive(true);
        Member updatedMember = memberRepository.save(member);

        // Re-enable linked non-ADMIN user account
        userRepository.findByEmail(member.getEmail()).ifPresent(user -> {
            if (user.getRole() != Role.ADMIN) {
                user.setEnabled(true);
                userRepository.save(user);
                log.info("Re-enabled linked user account id={} for reactivated member id={}", user.getId(), id);
            }
        });

        log.info("Successfully reactivated member with ID: {}", id);
        return MemberResponseDto.fromEntity(updatedMember);
    }

    @Override
    @Transactional
    public void deleteMember(Long id) {
        log.info("Attempting to delete member with ID: {}", id);

        // 1. Verify member existence
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member", "id", id));

        // 2. Business Rule: Disallow deletion if member currently has unreturned books
        long activeBorrowings = borrowingRepository.countByMemberIdAndReturnDateIsNull(id);
        if (activeBorrowings > 0) {
            log.warn("Cannot delete member id={}: {} active borrowings remain unreturned", id, activeBorrowings);
            throw new IllegalStateException("Cannot delete member: Patron currently has " + activeBorrowings
                    + " unreturned borrowed book(s). Please ensure all books are returned before deleting.");
        }

        // 3. Business Rule: Disallow deletion if member has unpaid fines
        long unpaidFines = fineRepository.countByMemberIdAndStatus(id, FineStatus.UNPAID);
        if (unpaidFines > 0) {
            log.warn("Cannot delete member id={}: {} unpaid fines remain outstanding", id, unpaidFines);
            throw new IllegalStateException("Cannot delete member: Patron has " + unpaidFines
                    + " unpaid fine(s). All outstanding fines must be settled before deleting the member.");
        }

        // 4. Business Rule: Disallow deletion if member has active reservations
        long activeReservations = reservationRepository.countByMemberIdAndStatusIn(
                id, List.of(ReservationStatus.PENDING, ReservationStatus.READY_FOR_PICKUP)
        );
        if (activeReservations > 0) {
            log.warn("Cannot delete member id={}: {} active reservation(s) exist", id, activeReservations);
            throw new IllegalStateException("Cannot delete member: Patron currently has " + activeReservations
                    + " active waitlist reservation(s). Please cancel active reservations before deleting the member.");
        }

        // 5. Clean up historical reminder notifications, fines, borrowing logs, and past reservations for this member
        borrowingReminderRepository.deleteByMemberId(id);
        fineRepository.deleteByMemberId(id);
        borrowingRepository.deleteByMemberId(id);
        reservationRepository.deleteByMemberId(id);

        // 6. Delete member entity
        memberRepository.delete(member);
        log.info("Member entity with ID: {} deleted from database", id);

        // 6. Delete linked user account if exists (and ensure we never delete ADMIN accounts)
        userRepository.findByEmail(member.getEmail()).ifPresent(user -> {
            if (user.getRole() != Role.ADMIN) {
                userRepository.delete(user);
                log.info("Associated user credentials account deleted for email: {}", member.getEmail());
            }
        });
    }
}
