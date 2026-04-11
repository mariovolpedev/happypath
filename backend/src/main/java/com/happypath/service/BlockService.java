package com.happypath.service;

import com.happypath.dto.response.UserSummary;
import com.happypath.exception.HappyPathException;
import com.happypath.model.Block;
import com.happypath.model.User;
import com.happypath.repository.BlockRepository;
import com.happypath.repository.FollowRepository;
import com.happypath.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BlockService {

    private final BlockRepository blockRepository;
    private final UserRepository userRepository;
    private final FollowRepository followRepository;

    /**
     * Blocca un utente: rimuove i follow reciproci e impedisce futuri follow.
     */
    @Transactional
    public void block(User blocker, Long targetId) {
        if (blocker.getId().equals(targetId))
            throw new HappyPathException("Non puoi bloccare te stesso", HttpStatus.BAD_REQUEST);

        User blocked = userRepository.findById(targetId)
                .orElseThrow(() -> new HappyPathException("Utente non trovato", HttpStatus.NOT_FOUND));

        if (blockRepository.existsByBlockerAndBlocked(blocker, blocked))
            return; // già bloccato — idempotente

        // Rimuove i follow reciproci
        followRepository.findByFollowerAndFollowed(blocker, blocked).ifPresent(followRepository::delete);
        followRepository.findByFollowerAndFollowed(blocked, blocker).ifPresent(followRepository::delete);

        blockRepository.save(Block.builder().blocker(blocker).blocked(blocked).build());
    }

    @Transactional
    public void unblock(User blocker, Long targetId) {
        User blocked = userRepository.findById(targetId)
                .orElseThrow(() -> new HappyPathException("Utente non trovato", HttpStatus.NOT_FOUND));
        blockRepository.findByBlockerAndBlocked(blocker, blocked).ifPresent(blockRepository::delete);
    }

    /** True se blockerId ha bloccato blockedId */
    public boolean isBlocked(Long blockerId, Long blockedId) {
        return blockRepository.existsByBlockerIdAndBlockedId(blockerId, blockedId);
    }

    /** True se esiste un blocco in qualsiasi direzione tra i due utenti */
    public boolean isBlockedInAnyDirection(Long userId1, Long userId2) {
        return blockRepository.existsByBlockerIdAndBlockedId(userId1, userId2)
                || blockRepository.existsByBlockerIdAndBlockedId(userId2, userId1);
    }

    public List<UserSummary> getBlockedUsers(User blocker) {
        return blockRepository.findByBlocker(blocker).stream()
                .map(b -> {
                    User u = b.getBlocked();
                    return new UserSummary(u.getId(), u.getUsername(), u.getDisplayName(),
                            u.getAvatarUrl(), u.getRole(), u.isVerified());
                })
                .toList();
    }
}
