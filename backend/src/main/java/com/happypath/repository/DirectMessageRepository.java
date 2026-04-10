package com.happypath.repository;

import com.happypath.model.DirectMessage;
import com.happypath.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DirectMessageRepository extends JpaRepository<DirectMessage, Long> {

    @Query("SELECT m FROM DirectMessage m WHERE " +
           "(m.sender.id = :userId AND m.recipient.id = :otherId) OR " +
           "(m.sender.id = :otherId AND m.recipient.id = :userId) " +
           "ORDER BY m.sentAt ASC")
    Page<DirectMessage> findConversation(
            @Param("userId") Long userId,
            @Param("otherId") Long otherId,
            Pageable pageable);

    long countBySenderIdAndRecipientIdAndReadByRecipientFalse(Long senderId, Long recipientId);

    /**
     * Returns the most recent message for each conversation partner of the given user.
     * Used to build the conversation list / inbox.
     */
    @Query(value = """
            SELECT m.* FROM direct_messages m
            INNER JOIN (
                SELECT
                    CASE WHEN sender_id = :userId THEN recipient_id ELSE sender_id END AS partner_id,
                    MAX(sent_at) AS max_sent
                FROM direct_messages
                WHERE sender_id = :userId OR recipient_id = :userId
                GROUP BY partner_id
            ) latest
            ON (
                (m.sender_id = :userId AND m.recipient_id = latest.partner_id) OR
                (m.recipient_id = :userId AND m.sender_id = latest.partner_id)
            )
            AND m.sent_at = latest.max_sent
            ORDER BY m.sent_at DESC
            """,
           nativeQuery = true)
    List<DirectMessage> findLatestMessagePerConversation(@Param("userId") Long userId);

    /**
     * Count unread messages sent to the given user by a specific sender.
     */
    @Query("SELECT COUNT(m) FROM DirectMessage m WHERE m.recipient.id = :recipientId AND m.readByRecipient = false")
    long countUnreadForUser(@Param("recipientId") Long recipientId);
}
