package com.jaelson.backend.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RateLimitFilterTest {

    private RateLimitFilter filter;

    @BeforeEach
    void setUp() {
        filter = new RateLimitFilter(new RateLimitProperties(true, 2, 2, 100));
    }

    @Test
    void shouldAllowRequestsWithinLimit() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        request.setRemoteAddr("10.0.0.1");

        MockHttpServletResponse first = new MockHttpServletResponse();
        filter.doFilter(request, first, new MockFilterChain());
        assertEquals(200, first.getStatus());

        MockHttpServletResponse second = new MockHttpServletResponse();
        filter.doFilter(request, second, new MockFilterChain());
        assertEquals(200, second.getStatus());
    }

    @Test
    void shouldBlockWhenAuthLimitExceeded() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        request.setRemoteAddr("10.0.0.2");

        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());
        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        MockHttpServletResponse blocked = new MockHttpServletResponse();
        filter.doFilter(request, blocked, new MockFilterChain());

        assertEquals(429, blocked.getStatus());
        assertEquals("60", blocked.getHeader("Retry-After"));
    }
}
