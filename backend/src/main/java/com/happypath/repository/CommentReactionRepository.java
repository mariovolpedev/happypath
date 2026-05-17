package com.happypath.repository;

import com.happypath.model.Comment;
import com.happypath.model.CommentReaction;
import com.happypath.model.ReactionType;
import com.happypath.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

public interface CommentReactionRepository extends JpaRepository<CommentReaction, Long> {

    Optional<CommentReaction> findByUserAndComment(User user, Comment comment);

    List<CommentReaction> findByComment(Comment comment);

    boolean existsByCommentAndUser(Comment comment, User user);

    void deleteByCommentAndUser(Comment comment, User user);

    long countByComment(Comment comment);

    /** Conta per tipo su un singolo commento */
    @Query("SELECT r.type, COUNT(r) FROM CommentReaction r WHERE r.comment = :comment GROUP BY r.type")
    List<Object[]> countByTypeForComment(@Param("comment") Comment comment);

    /** Reazione corrente dell'utente sul commento */
    @Query("SELECT r.type FROM CommentReaction r WHERE r.comment.id = :commentId AND r.user = :user")
    Optional<ReactionType> findTypeByCommentIdAndUser(@Param("commentId") Long commentId,
                                                       @Param("user") User user);

    /** Fetch bulk per una lista di comment ID */
    @Query("SELECT r FROM CommentReaction r " +
           "JOIN FETCH r.user " +
           "LEFT JOIN FETCH r.alterEgo " +
           "WHERE r.comment.id IN :commentIds")
    List<CommentReaction> findByCommentIdIn(@Param("commentIds") List<Long> commentIds);
}
