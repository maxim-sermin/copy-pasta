package com.mnm.copypastabackend.security;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Optional;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;

public class JWTAuthorizationFilter extends BasicAuthenticationFilter {

    private final JwtTokenUtil jwtTokenUtil;

    public JWTAuthorizationFilter(AuthenticationManager authManager, JwtTokenUtil jwtTokenUtil) {
        super(authManager);
        this.jwtTokenUtil = jwtTokenUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req,
            HttpServletResponse res,
            FilterChain chain) throws IOException, ServletException {
        Cookie[] cookies = req.getCookies();
        if (cookies == null || cookies.length < 1) {
            chain.doFilter(req, res);
            return;
        }

        UsernamePasswordAuthenticationToken authentication = getAuthentication(cookies);

        SecurityContextHolder.getContext().setAuthentication(authentication);
        chain.doFilter(req, res);
    }

    private UsernamePasswordAuthenticationToken getAuthentication(Cookie[] cookies) {
        for (Cookie cookie : cookies) {
            if ("SESSIONID".equalsIgnoreCase(cookie.getName())) {
                String token = cookie.getValue();

                if (token != null && !token.isEmpty() && !jwtTokenUtil.isTokenExpired(token)) {
                    Optional<String> user = jwtTokenUtil.getSubjectFromToken(token);

                    if (user.isPresent()) {
                        return new UsernamePasswordAuthenticationToken(user.get(), null, new ArrayList<>());
                    }
                }
            }
        }

        return null;
    }
}
