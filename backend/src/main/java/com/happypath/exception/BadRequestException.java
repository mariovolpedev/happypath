package com.happypath.exception;
import org.springframework.http.HttpStatus;
public class BadRequestException extends HappyPathException {
    public BadRequestException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}
