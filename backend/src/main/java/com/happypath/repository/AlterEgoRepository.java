package com.happypath.repository;

import com.happypath.model.AlterEgo;
import com.happypath.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AlterEgoRepository extends JpaRepository<AlterEgo, Long> {

    List<AlterEgo> findByOwnerAndActiveTrue(User owner);

    @Query("SELECT a FROM AlterEgo a WHERE a.active = true " +
           "AND (LOWER(a.name) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "     OR LOWER(a.description) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<AlterEgo> searchAlterEgos(@Param("q") String q, Pageable pageable);
}
