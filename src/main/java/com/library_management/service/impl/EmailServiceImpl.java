package com.library_management.service.impl;

import com.library_management.config.FineProperties;
import com.library_management.config.MailProperties;
import com.library_management.entity.Book;
import com.library_management.entity.Borrowing;
import com.library_management.entity.Fine;
import com.library_management.entity.Member;
import com.library_management.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;
import java.time.format.DateTimeFormatter;

/**
 * Service implementation for formatting and dispatching email notifications.
 * Uses JavaMailSender with HTML templates and safe error handling.
 */
@Slf4j
@Service
public class EmailServiceImpl implements EmailService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    private final JavaMailSender mailSender;
    private final MailProperties mailProperties;
    private final FineProperties fineProperties;

    // Constructor Injection
    public EmailServiceImpl(
            JavaMailSender mailSender,
            MailProperties mailProperties,
            FineProperties fineProperties) {
        this.mailSender = mailSender;
        this.mailProperties = mailProperties;
        this.fineProperties = fineProperties;
    }

    @Override
    public void sendBorrowingConfirmation(Borrowing borrowing) {
        if (!validateBorrowing(borrowing)) return;

        Member member = borrowing.getMember();
        Book book = borrowing.getBook();
        String subject = "Book Borrowed Successfully: " + book.getTitle();

        String htmlContent = buildHtmlTemplate(
                "Book Borrowing Confirmation",
                "Dear " + member.getFullName() + ",",
                "You have successfully borrowed the following book from our library:",
                new String[][]{
                        {"Book Title", book.getTitle()},
                        {"Author", book.getAuthor()},
                        {"ISBN", book.getIsbn()},
                        {"Borrow Date", borrowing.getBorrowDate().format(DATE_FORMATTER)},
                        {"Due Date", borrowing.getDueDate().format(DATE_FORMATTER)}
                },
                "Please ensure the book is returned on or before the due date to avoid overdue fines of "
                        + fineProperties.getCurrency() + " " + fineProperties.getDailyRate() + " per day."
        );

        sendEmail(member.getEmail(), subject, htmlContent);
    }

    @Override
    public void sendReturnConfirmation(Borrowing borrowing) {
        if (!validateBorrowing(borrowing)) return;

        Member member = borrowing.getMember();
        Book book = borrowing.getBook();
        String subject = "Book Return Confirmation: " + book.getTitle();

        String returnDateStr = borrowing.getReturnDate() != null
                ? borrowing.getReturnDate().format(DATE_FORMATTER)
                : "Today";

        String htmlContent = buildHtmlTemplate(
                "Book Return Confirmation",
                "Dear " + member.getFullName() + ",",
                "This email confirms that you have safely returned the following book to our library:",
                new String[][]{
                        {"Book Title", book.getTitle()},
                        {"Author", book.getAuthor()},
                        {"Borrowed On", borrowing.getBorrowDate().format(DATE_FORMATTER)},
                        {"Returned On", returnDateStr}
                },
                "Thank you for returning the book. We hope you enjoyed reading it!"
        );

        sendEmail(member.getEmail(), subject, htmlContent);
    }

    @Override
    public void sendUpcomingDueDateReminder(Borrowing borrowing, int daysRemaining) {
        if (!validateBorrowing(borrowing)) return;

        Member member = borrowing.getMember();
        Book book = borrowing.getBook();
        String subject = "Reminder: Your Book Loan is Due in " + daysRemaining + " Days";

        String htmlContent = buildHtmlTemplate(
                "Upcoming Due Date Reminder",
                "Dear " + member.getFullName() + ",",
                "This is a friendly reminder that your book loan is due in <strong>" + daysRemaining + " day(s)</strong>:",
                new String[][]{
                        {"Book Title", book.getTitle()},
                        {"Author", book.getAuthor()},
                        {"Due Date", borrowing.getDueDate().format(DATE_FORMATTER)},
                        {"Days Remaining", String.valueOf(daysRemaining)}
                },
                "Please plan to return the book by the due date to avoid daily late fines."
        );

        sendEmail(member.getEmail(), subject, htmlContent);
    }

    @Override
    public void sendOverdueReminder(Borrowing borrowing, int overdueDays) {
        if (!validateBorrowing(borrowing)) return;

        Member member = borrowing.getMember();
        Book book = borrowing.getBook();
        String subject = "URGENT: Your Book Loan is " + overdueDays + " Days Overdue";

        String htmlContent = buildHtmlTemplate(
                "Overdue Book Notice",
                "Dear " + member.getFullName() + ",",
                "<span style='color: #d9534f; font-weight: bold;'>Attention:</span> The following book is overdue and has not been returned:",
                new String[][]{
                        {"Book Title", book.getTitle()},
                        {"Author", book.getAuthor()},
                        {"Due Date", borrowing.getDueDate().format(DATE_FORMATTER)},
                        {"Days Overdue", String.valueOf(overdueDays)},
                        {"Daily Fine Rate", fineProperties.getCurrency() + " " + fineProperties.getDailyRate() + "/day"}
                },
                "Please return this book immediately to stop further fine accumulation."
        );

        sendEmail(member.getEmail(), subject, htmlContent);
    }

    @Override
    public void sendFineCreatedNotification(Fine fine) {
        if (!validateFine(fine)) return;

        Member member = fine.getBorrowing().getMember();
        Book book = fine.getBorrowing().getBook();
        String subject = "Library Fine Notice: " + fineProperties.getCurrency() + " " + fine.getAmount();

        String htmlContent = buildHtmlTemplate(
                "Overdue Fine Levied",
                "Dear " + member.getFullName() + ",",
                "An overdue fine has been calculated for your recent book return:",
                new String[][]{
                        {"Book Title", book.getTitle()},
                        {"Overdue Days", String.valueOf(fine.getOverdueDays())},
                        {"Fine Amount", fineProperties.getCurrency() + " " + fine.getAmount()},
                        {"Fine Status", fine.getStatus().name()},
                        {"Calculated At", fine.getCalculatedAt().format(DATE_TIME_FORMATTER)}
                },
                "Please settle this fine at the library reception or contact library support."
        );

        sendEmail(member.getEmail(), subject, htmlContent);
    }

    @Override
    public void sendFinePaidNotification(Fine fine) {
        if (!validateFine(fine)) return;

        Member member = fine.getBorrowing().getMember();
        Book book = fine.getBorrowing().getBook();
        String subject = "Fine Payment Receipt: " + fineProperties.getCurrency() + " " + fine.getAmount();

        String paidAtStr = fine.getPaidAt() != null
                ? fine.getPaidAt().format(DATE_TIME_FORMATTER)
                : "Just now";

        String htmlContent = buildHtmlTemplate(
                "Fine Payment Receipt",
                "Dear " + member.getFullName() + ",",
                "We have received and verified your fine payment. Your account is clear for this loan:",
                new String[][]{
                        {"Fine ID", "#" + fine.getId()},
                        {"Book Title", book.getTitle()},
                        {"Amount Paid", fineProperties.getCurrency() + " " + fine.getAmount()},
                        {"Payment Status", fine.getStatus().name()},
                        {"Paid On", paidAtStr}
                },
                "Thank you for clearing your outstanding dues. You are free to borrow more books!"
        );

        sendEmail(member.getEmail(), subject, htmlContent);
    }

    /**
     * Internal helper to create and dispatch an HTML email message via JavaMailSender.
     * Traps all transport exceptions so email failures never bubble up to crash business workflows.
     */
    private void sendEmail(String to, String subject, String bodyHtml) {
        if (!mailProperties.isEnabled()) {
            log.info("Email dispatching is disabled via 'app.mail.enabled=false'. Skipping email to=[{}] subject=[{}]",
                    to, subject);
            return;
        }

        if (to == null || to.trim().isEmpty()) {
            log.warn("Cannot send email: recipient address is null or empty. Subject: [{}]", subject);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");

            helper.setFrom(mailProperties.getFrom(), mailProperties.getSenderName());
            helper.setTo(to.trim());
            helper.setSubject(subject);
            helper.setText(bodyHtml, true); // true = HTML content

            mailSender.send(message);
            log.info("Email successfully dispatched to=[{}] subject=[{}]", to, subject);

        } catch (UnsupportedEncodingException e) {
            log.error("Failed to set email sender address/name for to=[{}]: {}", to, e.getMessage(), e);
        } catch (Exception e) {
            log.error("Failed to send email to=[{}] with subject=[{}]: {}", to, subject, e.getMessage(), e);
        }
    }

    /**
     * Builds a clean, responsive HTML email layout with a styled details table.
     */
    private String buildHtmlTemplate(String headerTitle, String greeting, String introMessage,
                                     String[][] details, String footerNote) {
        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html><html><head><meta charset='UTF-8'></head>");
        sb.append("<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f7f9fa; margin: 0; padding: 20px;'>");
        sb.append("<div style='max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 1px solid #e1e4e8;'>");

        // Header
        sb.append("<div style='background-color: #2c3e50; color: #ffffff; padding: 20px; text-align: center;'>");
        sb.append("<h2 style='margin: 0; font-size: 20px;'>").append(headerTitle).append("</h2>");
        sb.append("</div>");

        // Body Content
        sb.append("<div style='padding: 24px;'>");
        sb.append("<p style='font-size: 16px; margin-top: 0;'>").append(greeting).append("</p>");
        sb.append("<p style='font-size: 14px; color: #555;'>").append(introMessage).append("</p>");

        // Details Table
        if (details != null && details.length > 0) {
            sb.append("<table style='width: 100%; border-collapse: collapse; margin: 20px 0;'>");
            for (String[] row : details) {
                if (row.length >= 2) {
                    sb.append("<tr style='border-bottom: 1px solid #eee;'>");
                    sb.append("<td style='padding: 8px 12px; font-weight: bold; color: #666; width: 35%;'>")
                            .append(row[0]).append("</td>");
                    sb.append("<td style='padding: 8px 12px; color: #222;'>")
                            .append(row[1]).append("</td>");
                    sb.append("</tr>");
                }
            }
            sb.append("</table>");
        }

        // Footer Note
        sb.append("<p style='font-size: 13px; color: #777; background-color: #f8f9fa; padding: 12px; border-radius: 4px; border-left: 4px solid #3498db;'>")
                .append(footerNote).append("</p>");
        sb.append("</div>");

        // System Footer
        sb.append("<div style='background-color: #ecf0f1; color: #7f8c8d; font-size: 12px; text-align: center; padding: 12px;'>");
        sb.append("This is an automated notification from ").append(mailProperties.getSenderName()).append(". Please do not reply directly to this email.");
        sb.append("</div>");

        sb.append("</div></body></html>");
        return sb.toString();
    }

    private boolean validateBorrowing(Borrowing borrowing) {
        if (borrowing == null) {
            log.warn("Cannot send email: borrowing object is null");
            return false;
        }
        if (borrowing.getMember() == null || borrowing.getMember().getEmail() == null) {
            log.warn("Cannot send email: borrowing has no valid member email for borrowingId={}", borrowing.getId());
            return false;
        }
        if (borrowing.getBook() == null) {
            log.warn("Cannot send email: borrowing has no book details for borrowingId={}", borrowing.getId());
            return false;
        }
        return true;
    }

    private boolean validateFine(Fine fine) {
        if (fine == null) {
            log.warn("Cannot send fine email: fine object is null");
            return false;
        }
        if (fine.getBorrowing() == null) {
            log.warn("Cannot send fine email: fine has no associated borrowing for fineId={}", fine.getId());
            return false;
        }
        return validateBorrowing(fine.getBorrowing());
    }
}
