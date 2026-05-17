package com.happypath.security;

import com.happypath.model.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class HappyPathUserDetails implements UserDetails {

    @Getter
    private final User user;

    public HappyPathUserDetails(User user) {
        this.user = user;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
    }

    @Override public String getPassword()  { return user.getPasswordHash(); }
    @Override public String getUsername()  { return user.getUsername(); }

    @Override public boolean isAccountNonExpired()  { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }

    /** L'account è non-locked se è attivo (non bannato). */
    @Override public boolean isAccountNonLocked() { return user.isActive(); }

    /** L'account è abilitato se è attivo. */
    @Override public boolean isEnabled() { return user.isActive(); }
}
