package com.happypath.controller;

import com.happypath.dto.request.AlterEgoRequest;
import com.happypath.dto.response.AlterEgoResponse;
import com.happypath.security.HappyPathUserDetails;
import com.happypath.service.AlterEgoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/alter-egos")
@RequiredArgsConstructor
public class AlterEgoController {

    private final AlterEgoService alterEgoService;

    @GetMapping
    public ResponseEntity<List<AlterEgoResponse>> getMine(@AuthenticationPrincipal HappyPathUserDetails details) {
        return ResponseEntity.ok(alterEgoService.getMyAlterEgos(details.getUser()));
    }

    @PostMapping
    public ResponseEntity<AlterEgoResponse> create(
            @Valid @RequestBody AlterEgoRequest req,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        return ResponseEntity.status(HttpStatus.CREATED).body(alterEgoService.create(req, details.getUser()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @AuthenticationPrincipal HappyPathUserDetails details) {
        alterEgoService.delete(id, details.getUser());
        return ResponseEntity.noContent().build();
    }
}
