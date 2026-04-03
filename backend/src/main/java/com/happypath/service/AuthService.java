package com.happypath.service;

import com.happypath.dto.request.LoginRequest;
import com.happypath.dto.request.RegisterRequest;
import com.happypath.dto.response.AuthResponse;
import com.happypath.dto.response.UserSummary;
import com.happypath.exception.HappyPathException;
import com.happypath.model.User;
import com.happypath.repository.UserRepository;
import com.happypath.security.HappyPathUserDetails;
import com.happypath.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByUsername(req.username()))
            throw new HappyPathException("Username già in uso", HttpStatus.CONFLICT);
        if (userRepository.existsByEmail(req.email()))
            throw new HappyPathException("Email già in uso", HttpStatus.CONFLICT);
        if (req.birthDate() != null && Period.between(req.birthDate(), LocalDate.now()).getYears() < 13)
            throw new HappyPathException("Devi avere almeno 13 anni per registrarti", HttpStatus.BAD_REQUEST);

        User user = User.builder()
                .username(req.username())
                .email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .displayName(req.displayName() != null ? req.displayName() : req.username())
                .birthDate(req.birthDate())
                .build();

        user = userRepository.save(user);
        String token = jwtUtil.generateToken(new HappyPathUserDetails(user));
        return new AuthResponse(token, toSummary(user));
    }

    public AuthResponse login(LoginRequest req) {
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.username(), req.password()));
            HappyPathUserDetails details = (HappyPathUserDetails) auth.getPrincipal();
            String token = jwtUtil.generateToken(details);
            return new AuthResponse(token, toSummary(details.getUser()));
        } catch (BadCredentialsException e) {
            throw new HappyPathException("Credenziali non valide", HttpStatus.UNAUTHORIZED);
        }
    }

    private UserSummary toSummary(User u) {
        return new UserSummary(u.getId(), u.getUsername(), u.getDisplayName(), u.getAvatarUrl(), u.getRole(), u.isVerified());
    }
}
