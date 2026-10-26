package com.library_management.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;
import java.util.Objects;

/**
 * JPA Entity representing a Member/patron in the Library Management System.
 * Maps to the 'members' table in MySQL.
 */
@Entity
@Table(
    name = "members",
    indexes = {
        @Index(name = "idx_member_email", columnList = "email", unique = true),
        @Index(name = "idx_member_names", columnList = "first_name, last_name")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "First name is required and must not be blank")
    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @NotBlank(message = "Last name is required and must not be blank")
    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @NotBlank(message = "Email is required and must not be blank")
    @Email(message = "Email must be a valid email address")
    @Column(name = "email", nullable = false, unique = true, length = 150)
    private String email;

    @NotBlank(message = "Phone number is required and must not be blank")
    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "membership_date", nullable = false, updatable = false)
    private LocalDate membershipDate;

    @Column(name = "active", nullable = false)
    private Boolean active;

    /**
     * Entity lifecycle callback executed prior to persistence.
     * Sets automatic defaults for registration date and active status.
     */
    @PrePersist
    private void prePersistDefaults() {
        if (this.membershipDate == null) {
            this.membershipDate = LocalDate.now();
        }
        if (this.active == null) {
            this.active = true;
        }
    }

    /**
     * Convenience method to get the full name of the member.
     */
    public String getFullName() {
        return (firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "");
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Member member = (Member) o;
        return Objects.equals(email, member.email);
    }

    @Override
    public int hashCode() {
        return Objects.hash(email);
    }

    @Override
    public String toString() {
        return "Member{" +
                "id=" + id +
                ", firstName='" + firstName + '\'' +
                ", lastName='" + lastName + '\'' +
                ", email='" + email + '\'' +
                ", phoneNumber='" + phoneNumber + '\'' +
                ", address='" + address + '\'' +
                ", membershipDate=" + membershipDate +
                ", active=" + active +
                '}';
    }
}
