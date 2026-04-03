package com.happypath.exception;
import org.springframework.http.HttpStatus;
public class ConflictException extends HappyPathException {
    public ConflictException(String message) {
        super(message, HttpStatus.CONFLICT);
    }
}
