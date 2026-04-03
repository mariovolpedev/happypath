package com.happypath.exception;

import org.springframework.http.HttpStatus;

public class HappyPathException extends RuntimeException {
    private final HttpStatus status;
    public HappyPathException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }
    public HttpStatus getStatus() { return status; }
}
