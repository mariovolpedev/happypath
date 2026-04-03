package com.happypath.repository;

import com.happypath.model.AlterEgo;
import com.happypath.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AlterEgoRepository extends JpaRepository<AlterEgo, Long> {
    List<AlterEgo> findByOwnerAndActiveTrue(User owner);
}
