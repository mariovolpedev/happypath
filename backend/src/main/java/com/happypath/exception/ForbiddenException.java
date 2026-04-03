package com.happypath.exception;
import org.springframework.http.HttpStatus;
public class ForbiddenException extends HappyPathException {
    public ForbiddenException(String message) {
        super(message, HttpStatus.FORBIDDEN);
    }
}
