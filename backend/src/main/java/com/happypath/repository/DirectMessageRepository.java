package com.happypath.repository;

import com.happypath.model.DirectMessage;
import com.happypath.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DirectMessageRepository extends JpaRepository<DirectMessage, Long> {
    @Query("SELECT m FROM DirectMessage m WHERE " +
           "(m.sender.id = :userId AND m.recipient.id = :otherId) OR " +
           "(m.sender.id = :otherId AND m.recipient.id = :userId) " +
           "ORDER BY m.sentAt ASC")
    Page<DirectMessage> findConversation(@Param("userId") Long userId, @Param("otherId") Long otherId, Pageable pageable);

    long countBySenderIdAndRecipientIdAndReadByRecipientFalse(Long senderId, Long recipientId);
}
